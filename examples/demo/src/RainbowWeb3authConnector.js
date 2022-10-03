import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector";
import { TorusWalletConnectorPlugin } from "@web3auth/torus-wallet-connector-plugin";

const torusPlugin = new TorusWalletConnectorPlugin({
  torusWalletOpts: {
    buttonPosition: "bottom-left",
  },
  walletInitOptions: {
    whiteLabel: {
      theme: { isDark: true, colors: { primary: "#00a8ff" } },
      logoDark: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
      logoLight: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
    },
    useWalletConnect: true,
    enableLogging: true,
  },
});

const userInfo = {};

const name = "My App Name";
const iconUrl = "https://web3auth.io/docs/contents/logo-ethereum.png";

export const rainbowWeb3AuthConnector = ({ chains }) => ({
  id: "web3auth",
  name,
  iconUrl,
  iconBackground: "#fff",
  createConnector: () => {
    const connector = new Web3AuthConnector({
      chains: chains,
      options: {
        enableLogging: true,
        clientId: "YOUR_CLIENT_ID", // Get your own client id from https://dashboard.web3auth.io
        network: "cyan", // cyan, testnet, mainnet
        chainId: chains[0].chainId,
        uiConfig: {
          theme: "light", // light or dark
          appLogo: iconUrl,
        },
        uxMode: "popup", // popup or redirect
        whiteLabel: {
          name,
          logoLight: iconUrl,
          logoDark: iconUrl,
          defaultLanguage: "en",
          dark: true, // whether to enable dark mode. defaultValue: false
        },
      },
    });
    connector.web3AuthInstance.addPlugin(torusPlugin);
    return {
      connector,
    };
  },
});
