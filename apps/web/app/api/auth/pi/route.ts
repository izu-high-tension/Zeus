import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { piVerifyAccessToken } from "@/lib/pi/server";
import { prisma } from "@/lib/prisma";
import { generateCsrf, getSession } from "@/lib/session";
import { limiters } from "@/lib/ratelimit";

const BodySchema = z.object({
  accessToken: z.string().min(1),
  referredBy: z.string().optional(), // optional referrer Pi UID
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const rl = await limiters.auth.limit(`auth:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  let me: { uid: string; username: string };
  try {
    me = await piVerifyAccessToken(body.accessToken);
  } catch {
    return NextResponse.json({ error: "invalid_pi_token" }, { status: 401 });
  }

  const referrer = body.referredBy
    ? await prisma.user.findUnique({ where: { piUid: body.referredBy } })
    : null;

  const user = await prisma.user.upsert({
    where: { piUid: me.uid },
    update: { username: me.username },
    create: {
      piUid: me.uid,
      username: me.username,
      referredById: referrer?.id ?? null,
    },
  });

  if (referrer && user.referredById === referrer.id) {
    await prisma.referral.upsert({
      where: { refereeId: user.id },
      update: {},
      create: { referrerId: referrer.id, refereeId: user.id },
    });
  }

  const session = await getSession();
  session.userId = user.id;
  session.piUid = user.piUid;
  session.csrf = generateCsrf();
  await session.save();

  return NextResponse.json({
    user: { id: user.id, username: user.username, vitality: user.vitality },
    csrf: session.csrf,
  });
}

export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
