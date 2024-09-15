// Web3Auth Libraries
import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { AuthAdapter } from "@web3auth/auth-adapter";
import { CHAIN_NAMESPACES, UX_MODE, WEB3AUTH_NETWORK } from "@web3auth/base";
import { Chain } from "wagmi/chains";

const name = "My App Name";
const iconUrl = "https://web3auth.io/docs/contents/logo-ethereum.png";

export default function Web3AuthConnectorInstance(chains: Chain[]) {
  // Create Web3Auth Instance
  const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"; // get from https://dashboard.web3auth.io

  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x" + chains[0].id.toString(16),
    rpcTarget: chains[0].rpcUrls.default.http[0], // This is the public RPC we have added, please pass on your own endpoint while creating an app
    displayName: chains[0].name,
    tickerName: chains[0].nativeCurrency?.name,
    ticker: chains[0].nativeCurrency?.symbol,
    blockExplorerUrl: chains[0].blockExplorers?.default.url[0] as string,
  }

  const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

  const web3AuthInstance = new Web3AuthNoModal({
    clientId,
    privateKeyProvider,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  });


  // Add openlogin adapter for customisations
  const authAdapterInstance = new AuthAdapter({
    adapterSettings: {
      uxMode: UX_MODE.REDIRECT,
    },
  });
  web3AuthInstance.configureAdapter(authAdapterInstance);

  return Web3AuthConnector({
      web3AuthInstance,
      loginParams: {
        loginProvider: "google",
      },
  });
}
