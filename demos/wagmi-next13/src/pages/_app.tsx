import "@/styles/globals.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// WAGMI Libraries
import { createConfig, http, useAccount, useConnect, useDisconnect, WagmiProvider } from "wagmi";
import { mainnet, polygon, sepolia } from "wagmi/chains";
import { coinbaseWallet, walletConnect } from "wagmi/connectors";

import { Balance } from "./_balance";
import { SendTransaction } from "./_sendTransaction";
import { SwitchChain } from "./_switchNetwork";
import Web3AuthConnectorInstance from "./_Web3AuthConnectorInstance";
import { WriteContract } from "./_writeContract";

const queryClient = new QueryClient();

// Set up client
const config = createConfig({
  chains: [mainnet, sepolia, polygon],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
  },
  connectors: [
    walletConnect({
      projectId: "3314f39613059cb687432d249f1658d2",
      showQrModal: true,
    }),
    coinbaseWallet({ appName: "wagmi" }),
    Web3AuthConnectorInstance([mainnet, sepolia, polygon]),
  ],
});

function Profile() {
  const { address, connector, isConnected } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="main">
        <div className="title">Connected to {connector?.name}</div>
        <div>{address}</div>
        <button className="card" onClick={disconnect as any}>
          Disconnect
        </button>
        <SendTransaction />
        <Balance />
        <WriteContract />
        <SwitchChain />
      </div>
    );
  }
  return (
    <div className="main">
      {connectors.map((currentConnector) => {
        return (
          <button className="card" key={currentConnector.id} onClick={() => connect({ connector: currentConnector })}>
            {currentConnector.name}
          </button>
        );
      })}
      {error && <div>{error.message}</div>}
    </div>
  );
}

// Pass client to React Context Provider
function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="container">
          <Profile />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
