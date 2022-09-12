import { Web3AuthConnector } from "wagmi-web3auth-connector";

export const rainbowWeb3AuthConnector = ({ chains }) => ({
  id: "web3auth",
  name: "Web3Auth",
  iconUrl: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
  iconBackground: "#fff",
  createConnector: () => {
    const connector = new Web3AuthConnector({
      chains: chains,
      options: {
        enableLogging: true,
        clientId: "local",
        network: "testnet",
        chainId: "0x1"
      },
    });
    return {
      connector,
    };
  },
});
