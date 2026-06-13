const hre = require("hardhat");

async function main() {
  console.log("Deploying HikariSBT...");

  const HikariSBT = await hre.ethers.getContractFactory("HikariSBT");
  const sbt = await HikariSBT.deploy();

  await sbt.waitForDeployment();

  console.log(`HikariSBT deployed to: ${await sbt.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
