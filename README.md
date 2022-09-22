
<p align="center">
 <img src="https://web3auth.io/images/w3a-L-Favicon-1.svg" align="center" alt="Ledger" />
 <h2 align="center">Web3Auth Wagmi Connector</h2>
 <p align="center"><a href="https://github.com/tmm/wagmi">Wagmi</a> Connector for Web3Auth</p>
</p>



# About

`@web3auth/web3auth-wagmi-connector` is a connector for the popular [wagmi](https://github.com/tmm/wagmi) library built on top of the [@web3auth/web3auth
](https://github.com/web3auth/web3auth).

It can be used to initialize a [wagmi client](https://wagmi.sh/docs/client) that will seemlessly manage the interaction of your DApp with Web3Auth.

## How to use

Here is an example of a wagmi client using both the `Web3AuthConnector` and the default `InjectedConnector` respectively.

```js
import { Web3AuthConnector } from '@web3auth/web3auth-wagmi-connector';
import { chain, configureChains, createClient } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { publicProvider } from 'wagmi/providers/public';

const { chains, provider } = configureChains(
  [chain.mainnet, chain.polygon],
  [publicProvider()]
);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: [
    new Web3AuthConnector({ 
      chains,
      options: {
        enableLogging: true,
        clientId: "YOUR_CLIENT_ID", // Get your own client id from https://dashboard.web3auth.io
        network: "testnet", // web3auth network
        chainId: "0x1" // chainId that you want to connect with
      },
    }),
    new InjectedConnector({ chains }),
  ],
  provider,
});
```

# Documentation

Have a look at [the wagmi repo](https://github.com/tmm/wagmi) and [the wagmi doc](https://wagmi.sh/) to learn more on connectors and wagmi.