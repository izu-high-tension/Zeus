import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("PI ANIMALS721 (Dog & Cat)", () => {
  async function deployDog() {
    const [admin, minter, alice, bob, royalty] = await ethers.getSigners();
    const F = await ethers.getContractFactory("PiAnimalsDog721");
    const c = await upgrades.deployProxy(
      F,
      [admin.address, royalty.address, 500, 10_000],
      { kind: "uups", initializer: "initialize" },
    );
    await c.waitForDeployment();
    const MINTER_ROLE = await c.MINTER_ROLE();
    await (await c.grantRole(MINTER_ROLE, minter.address)).wait();
    return { c, admin, minter, alice, bob, royalty };
  }

  it("sets metadata correctly", async () => {
    const { c } = await deployDog();
    expect(await c.name()).to.eq("PI ANIMALS Dog");
    expect(await c.symbol()).to.eq("PADOG");
    expect(await c.maxSupply()).to.eq(10_000);
  });

  it("only MINTER_ROLE can mint", async () => {
    const { c, alice, bob, minter } = await deployDog();
    await expect(
      c.connect(alice).mint(bob.address, 1n, "ipfs://x"),
    ).to.be.revertedWithCustomError(c, "AccessControlUnauthorizedAccount");
    await expect(c.connect(minter).mint(bob.address, 1n, "ipfs://x")).to.not.be.reverted;
    expect(await c.ownerOf(1n)).to.eq(bob.address);
    expect(await c.tokenURI(1n)).to.eq("ipfs://x");
  });

  it("enforces supply cap", async () => {
    const [admin, royalty, recipient] = await ethers.getSigners();
    const F = await ethers.getContractFactory("PiAnimalsDog721");
    const c = await upgrades.deployProxy(
      F,
      [admin.address, royalty.address, 500, 2],
      { kind: "uups", initializer: "initialize" },
    );
    await c.mint(recipient.address, 1n, "ipfs://a");
    await c.mint(recipient.address, 2n, "ipfs://b");
    await expect(c.mint(recipient.address, 3n, "ipfs://c")).to.be.revertedWithCustomError(
      c,
      "SupplyCapReached",
    );
  });

  it("pauses transfers", async () => {
    const { c, minter, alice, bob } = await deployDog();
    await c.connect(minter).mint(alice.address, 7n, "ipfs://x");
    await c.pause();
    await expect(
      c.connect(alice).transferFrom(alice.address, bob.address, 7n),
    ).to.be.revertedWithCustomError(c, "EnforcedPause");
    await c.unpause();
    await expect(
      c.connect(alice).transferFrom(alice.address, bob.address, 7n),
    ).to.not.be.reverted;
  });

  it("returns ERC2981 royalty info", async () => {
    const { c, royalty } = await deployDog();
    const [receiver, amount] = await c.royaltyInfo(1n, 10_000n);
    expect(receiver).to.eq(royalty.address);
    expect(amount).to.eq(500n); // 5% of 10_000
  });

  it("supports ERC721, ERC721Enumerable, ERC2981, AccessControl interfaces", async () => {
    const { c } = await deployDog();
    const ids = ["0x80ac58cd", "0x780e9d63", "0x2a55205a", "0x7965db0b"];
    for (const id of ids) {
      expect(await c.supportsInterface(id)).to.eq(true);
    }
  });

  it("setMaxSupply: admin can raise, cannot lower below supply", async () => {
    const { c, minter, alice } = await deployDog();
    await c.connect(minter).mint(alice.address, 1n, "ipfs://x");
    await expect(c.setMaxSupply(0)).to.be.revertedWith("below current supply");
    await c.setMaxSupply(20_000);
    expect(await c.maxSupply()).to.eq(20_000);
  });
});

describe("PiAnimalsCat721", () => {
  it("initializes with cat name/symbol", async () => {
    const [admin, royalty] = await ethers.getSigners();
    const F = await ethers.getContractFactory("PiAnimalsCat721");
    const c = await upgrades.deployProxy(
      F,
      [admin.address, royalty.address, 500, 10_000],
      { kind: "uups", initializer: "initialize" },
    );
    expect(await c.name()).to.eq("PI ANIMALS Cat");
    expect(await c.symbol()).to.eq("PACAT");
  });
});
