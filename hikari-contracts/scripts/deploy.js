const hre = require("hardhat");

async function main() {
  console.log("Deploying HikariSBT...");

  const HikariSBT = await hre.ethers.getContractFactory("HikariSBT");
  const sbt = await HikariSBT.deploy();
  await sbt.waitForDeployment();
  console.log(`HikariSBT deployed to: ${await sbt.getAddress()}`);

  console.log("Deploying MockZkVerifier...");
  const MockZkVerifier = await hre.ethers.getContractFactory("MockZkVerifier");
  const verifier = await MockZkVerifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log(`MockZkVerifier deployed to: ${verifierAddress}`);

  console.log("Deploying HikariPrivateSBT...");
  const HikariPrivateSBT = await hre.ethers.getContractFactory("HikariPrivateSBT");
  const privateSbt = await HikariPrivateSBT.deploy(verifierAddress);
  await privateSbt.waitForDeployment();
  console.log(`HikariPrivateSBT deployed to: ${await privateSbt.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
