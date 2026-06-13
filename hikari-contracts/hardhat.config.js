require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    baseSepolia: {
      url: process.env.BASE_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.BACKEND_PRIVATE_KEY ? [process.env.BACKEND_PRIVATE_KEY] : []
    }
  }
};
