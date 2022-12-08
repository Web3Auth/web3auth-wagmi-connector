import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector";

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
        // optional - custom authentication
        socialLoginConfig: {
          loginConfig: {
            google: {
              name: "Custom Google Auth Login",
              verifier: "web3auth-core-google",
              typeOfLogin: "google",
              clientId:
                "774338308167-q463s7kpvja16l4l0kko3nb925ikds2p.apps.googleusercontent.com", //use your app client id you got from google
            },
            facebook: {
              name: "Custom Facebook Auth Login",
              verifier: "web3auth-core-facebook",
              typeOfLogin: "facebook",
              clientId: "1222658941886084", //use your app client id you got from facebook
            },
          }
        }
      },
    });
    return {
      connector,
    };
  },
});
