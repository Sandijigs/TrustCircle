import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-viem";
import "@openzeppelin/hardhat-upgrades";
import "solidity-coverage";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables with explicit path
const envPath = path.resolve(__dirname, ".env");
console.log("Loading .env from:", envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("Error loading .env:", result.error);
} else {
  console.log("✅ .env loaded successfully");
  console.log("PRIVATE_KEY found:", !!process.env.PRIVATE_KEY);
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR-based code generation for better optimization
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    // Celo Sepolia Testnet (NEW - Replaces Alfajores)
    celoSepolia: {
      url: "https://forno.celo-sepolia.celo-testnet.org",
      accounts: ["0xacc64cd4bc583eb8b61522b036693c0567064b4a00c1b69e2a88bdc50f915807"],
      chainId: 11142220,
    },
    // Legacy: Celo Alfajores Testnet (Being phased out)
    alfajores: {
      url: process.env.NEXT_PUBLIC_ALFAJORES_RPC_URL || "https://alfajores-forno.celo-testnet.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 44787,
      gasPrice: 20000000000, // 20 gwei
      timeout: 60000,
    },
    // Celo Mainnet
    celo: {
      url: "https://forno.celo.org",
      accounts: {
        mnemonic: process.env.MNEMONIC || "",
        path: "m/44'/52752'/0'/0", // Celo derivation path
        initialIndex: 0,
        count: 10,
      },
      chainId: 42220,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: "gas-report.txt",
    noColors: true,
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  etherscan: {
    apiKey: {
      celoSepolia: "42NYCTAP9AVGT2J5QAKKX4BE2AMK7ZMY11",
      alfajores: "42NYCTAP9AVGT2J5QAKKX4BE2AMK7ZMY11",
      celo: "42NYCTAP9AVGT2J5QAKKX4BE2AMK7ZMY11",
    },
    customChains: [
      {
        network: "celoSepolia",
        chainId: 11142220,
        urls: {
          apiURL: "https://celo-sepolia.blockscout.com/api",
          browserURL: "https://celo-sepolia.blockscout.com",
        },
      },
      {
        network: "alfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io",
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
    ],
  },
};

export default config;
