<p align="center">
 <img src="https://web3auth.io/images/w3a-L-Favicon-1.svg" align="center" alt="Ledger" />
 <h2 align="center">Web3Auth Wagmi Connector</h2>
 <p align="center"><a href="https://github.com/tmm/wagmi">Wagmi</a> Connector for Web3Auth</p>
</p>

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
![npm](https://img.shields.io/npm/dw/@web3auth/web3auth-wagmi-connector)

Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

`@web3auth/web3auth-wagmi-connector` is a connector for the popular [wagmi](https://github.com/tmm/wagmi) library and Web3Auth Web SDKs. 

You can utilise this connector package alongside the Web3Auth Web SDKs to  initialize a [wagmi client](https://wagmi.sh/docs/client) that will seemlessly manage the interaction of your DApp with Web3Auth.

## 📖 Documentation

Checkout the official [Web3Auth Documentation](https://web3auth.io/docs) and [SDK Reference](https://web3auth.io/docs/sdk/web/) to get started!

## 💡 Features

- Plug and Play, OAuth based Web3 Authentication Service
- Fully decentralized, non-custodial key infrastructure
- End to end Whitelabelable solution
- Threshold Cryptography based Key Reconstruction
- Multi Factor Authentication Setup & Recovery (Includes password, backup phrase, device factor editing/deletion etc)
- Support for WebAuthn & Passwordless Login
- Support for connecting to multiple wallets
- DApp Active Session Management

...and a lot more

## 💭 Choosing Between SDKs

For using Web3Auth in the web, you have two choices of SDKs to get started with.

[Web3Auth Plug and Play Modal SDK `@web3auth/modal`](https://web3auth.io/docs/sdk/web/web3auth/): A simple and easy to use SDK that will give you a simple modular way of implementing Web3Auth directly within your application. You can use the pre-configured Web3Auth Modal UI and whitelabel it according to your needs.

[Web3Auth Plug and Play Core SDK `@web3auth/core`](https://web3auth.io/docs/sdk/web/core/): The core module implemeting all the Web3Auth features you need and giving you the flexibilty of using your own UI with the Web3Auth SDK working in the backend.

## ⚡ Quick Start

### Installation (Web3Auth Plug and Play Modal)

```shell
npm install --save @web3auth/modal
npm install --save @web3auth/web3auth-wagmi-connector
```

### Get your Client ID from Web3Auth Dashboard

Hop on to the [Web3Auth Dashboard](https://dashboard.web3auth.io/) and create a new project. Use the Client ID of the project to start your integration.

![Web3Auth Dashboard](https://web3auth.io/docs/assets/images/project_plug_n_play-89c39ec42ad993107bb2485b1ce64b89.png)

### Instantiate Web3Auth and pass it to the Connector

Here is an example of a wagmi client using both the `Web3AuthConnector` and the default `InjectedConnector` respectively.

```js
import { Web3AuthConnector } from '@web3auth/web3auth-wagmi-connector';
import { Web3Auth } from "@web3auth/modal";
import { createClient, WagmiConfig, configureChains } from "wagmi";
import { InjectedConnector } from 'wagmi/connectors/injected'
import { publicProvider } from 'wagmi/providers/public'

// Configure chains & providers with the Alchemy provider.
// Popular providers are Alchemy (alchemy.com), Infura (infura.io), Quicknode (quicknode.com) etc.
const { chains, provider, webSocketProvider } = configureChains(
  [mainnet],
  [alchemyProvider({ apiKey: 'yourAlchemyApiKey' }), publicProvider()],
)
// Instantiating Web3Auth
const web3AuthInstance = new Web3Auth({
    clientId: "YOUR_CLIENT_ID",
    chainConfig: {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: "0x"+chains[0].id.toString(16),
      rpcTarget: chains[0].rpcUrls.default, // This is the public RPC we have added, please pass on your own endpoint while creating an app
      displayName: chains[0].name,
      tickerName: chains[0].nativeCurrency?.name,
      ticker: chains[0].nativeCurrency?.symbol,
      blockExplorer: chains[0]?.blockExplorers.default?.url,
    },
  });

const wagmiClient = createClient({
  autoConnect: true,
  connectors: [
    new Web3AuthConnector({ 
      chains,
      options: { 
        web3AuthInstance,
      },
    }),
    new InjectedConnector({
      chains,
      options: {
        name: 'Injected',
        shimDisconnect: true,
      },
    }),
  ],
  provider,
  webSocketProvider,
});
```

## 🩹 Examples

Checkout the examples for your preferred blockchain and platform in our [examples repository](https://github.com/Web3Auth/examples/)

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo-app.web3auth.io/) to see how Web3Auth can be used in your application.

Further checkout the [demos folder](https://github.com/Web3Auth/web3auth-wagmi-connecto/tree/master/demos) within this repository, which contains other hosted demos for different usecases.

## 💬 Troubleshooting and Discussions

- Have a look at our [GitHub Discussions](https://github.com/Web3Auth/Web3Auth/discussions?discussions_q=sort%3Atop) to see if anyone has any questions or issues you might be having.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions
- Join our [Discord](https://discord.gg/web3auth) to join our community and get private integration support or help with your integration.
