import { HardhatUserConfig } from "hardhat/config";

// PLUGINS
import "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-verify";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-deploy";

// ================================= TASKS =========================================

// Process Env Variables
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

// Libraries
import assert from "assert";

// Process Env Variables
const ALCHEMY_ID = process.env.ALCHEMY_ID;
assert.ok(ALCHEMY_ID, "no Alchemy ID in process.env");

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;

// ================================= CONFIG =========================================
const config: HardhatUserConfig = {
  w3f: {
    rootDir: "./web3-functions",
    debug: false,
    networks: ["sepolia"], //(multiChainProvider) injects provider for these networks
  },

  namedAccounts: {
    deployer: {
      default: 0,
    },
  },

  paths: {
    artifacts: "build/artifacts",
    cache: "build/cache",
    deploy: "src/deploy",
    sources: "contracts",
  },

  defaultNetwork: "hardhat",

  networks: {
    anvil: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // Prod
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 42161,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    astarzkevm: {
      url: "https://rpc.astar-zkevm.gelato.digital",
      chainId: 3776,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    base: {
      url: `https://mainnet.base.org`,
      chainId: 8453,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    blast: {
      url: `https://blastl2-mainnet.public.blastapi.io`,
      chainId: 81457,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    fantom: {
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 250,
      url: `https://rpcapi.fantom.network/`,
    },
    gnosis: {
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 100,
      url: `https://gnosis-mainnet.public.blastapi.io`,
    },
    linea: {
      url: `https://linea.blockpi.network/v1/rpc/public`,
      chainId: 59144,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    mainnet: {
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
    },
    metis: {
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 1088,
      url: "https://metis-mainnet.public.blastapi.io",
    },
    mode: {
      url: `https://mainnet.mode.network`,
      chainId: 34443,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 10,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    playblock: {
      url: `https://rpc.playblock.io`,
      chainId: 1829,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 137,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    polygonzk: {
      url: "https://zkevm-rpc.com",
      chainId: 1101,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    real: {
      url: "https://rpc.realforreal.gelato.digital/",
      chainId: 111188,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    reyanetwork: {
      url: "https://rpc.reya.network",
      chainId: 1729,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    zksync: {
      zksync: true,
      url: "https://mainnet.era.zksync.io",
      chainId: 324,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      verifyURL:
        "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
    },

    // Staging
    amoy: {
      url: `https://rpc-amoy.polygon.technology`,
      chainId: 80002,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    arbsepolia: {
      url: `https://sepolia-rollup.arbitrum.io/rpc`,
      chainId: 421614,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    astarzkyoto: {
      url: `https://rpc.zkyoto.gelato.digital`,
      chainId: 6038361,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    basesepolia: {
      url: `https://sepolia.base.org`,
      chainId: 84532,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    blackberry: {
      url: `https://rpc.polygon-blackberry.gelato.digital`,
      chainId: 94204209,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    blastsepolia: {
      url: `https://sepolia.blast.io`,
      chainId: 168587773,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    raspberry: {
      url: `https://rpc.op-celestia-testnet.gelato.digital`,
      chainId: 123420111,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    blueberry: {
      url: `https://rpc.arb-blueberry.gelato.digital`,
      chainId: 88153591557,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    lisksepolia: {
      url: `https://rpc.lisk-sepolia-testnet.gelato.digital`,
      chainId: 4202,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 80001,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    osepolia: {
      url: `https://sepolia.optimism.io`,
      chainId: 11155420,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    reyacronos: {
      url: `https://rpc.reya-cronos.gelato.digital`,
      chainId: 89346161,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_ID}`,
      chainId: 11155111,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    unrealorbit: {
      url: `https://rpc.unreal-orbit.gelato.digital`,
      chainId: 18233,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    zkatana: {
      url: "https://rpc.zkatana.gelato.digital",
      chainId: 1261120,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },

  verify: {
    etherscan: {
      apiKey: ETHERSCAN_KEY ? ETHERSCAN_KEY : "",
    },
  },

  solidity: {
    compilers: [
      {
        version: "0.8.18",
        settings: {
          optimizer: { enabled: true },
        },
      },
    ],
  },

  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;
