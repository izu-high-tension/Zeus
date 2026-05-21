# PI ANIMALS Clone

A production-ready scaffold for a PI ANIMALS-style NFT pet-cultivation game on the Pi Network ecosystem, with ERC-721 collectibles deployed to Polygon.

> **Status: MVP-α.** Scaffold + critical paths (Pi auth, payment FSM, ERC-721 contracts, base UI) are wired up with passing tests. Marketplace, mining workers, lottery, dividends, indexer, and mainnet deployment land in subsequent phases. See `/root/.claude/plans/mighty-discovering-wadler.md` for the full plan.

## Stack

- Next.js 14 (App Router, TypeScript strict)
- Tailwind + shadcn-style components
- Prisma + Postgres
- Pi SDK (`@pinetwork-js/sdk`) + Pi Platform API server-side
- iron-session
- Hardhat + OpenZeppelin upgradeable contracts (Polygon)
- Vitest, Hardhat/Chai, Playwright (planned)
- pnpm workspaces

## Layout

```
apps/web                  Next.js app
packages/shared           zod schemas shared FE/BE
packages/contracts        Hardhat contracts
ops/workers               BullMQ workers (planned)
```

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm --filter web prisma migrate dev
pnpm --filter web dev
```

## Tests

```bash
pnpm test:web
pnpm test:contracts
```

## Human-only steps (cannot be agent-executed)

To take this to a real launch you must:

1. Register an app at [Pi Developer Portal](https://developers.minepi.com) and obtain a server-side API key for sandbox **and** mainnet (mainnet requires Pi Core Team review).
2. Fund a Polygon deployer wallet with MATIC; deploy `PiAnimalsDog721` and `PiAnimalsCat721` (see `packages/contracts/scripts`).
3. Set up a Gnosis Safe multisig as the contract admin; transfer roles to it.
4. Subscribe to Chainlink VRF v2 on Polygon and fund with LINK.
5. Create accounts on Supabase/Neon (Postgres), Upstash (Redis), Vercel (web), Railway (worker), Pinata (IPFS).
6. Buy a domain, point Cloudflare → Vercel.
7. Submit your Pi Browser app listing.
8. Commission a third-party smart-contract audit (CertiK, Trail of Bits, etc.).

## License

MIT
