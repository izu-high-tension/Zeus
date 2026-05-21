import { ethers, upgrades, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying on ${network.name} from ${deployer.address}`);

  const royaltyReceiver = deployer.address; // swap for multisig in production
  const royaltyBps = 500; // 5%
  const maxSupply = 10_000;

  const Dog = await ethers.getContractFactory("PiAnimalsDog721");
  const dog = await upgrades.deployProxy(
    Dog,
    [deployer.address, royaltyReceiver, royaltyBps, maxSupply],
    { kind: "uups", initializer: "initialize" },
  );
  await dog.waitForDeployment();
  console.log(`PiAnimalsDog721 proxy: ${await dog.getAddress()}`);

  const Cat = await ethers.getContractFactory("PiAnimalsCat721");
  const cat = await upgrades.deployProxy(
    Cat,
    [deployer.address, royaltyReceiver, royaltyBps, maxSupply],
    { kind: "uups", initializer: "initialize" },
  );
  await cat.waitForDeployment();
  console.log(`PiAnimalsCat721 proxy: ${await cat.getAddress()}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
