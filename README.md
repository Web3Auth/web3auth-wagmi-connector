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

[Web3Auth Plug and Play Modal SDK `@web3auth/modal`](https://web3auth.io/docs/sdk/web/modal/): A simple and easy to use SDK that will give you a simple modular way of implementing Web3Auth directly within your application. You can use the pre-configured Web3Auth Modal UI and whitelabel it according to your needs.

[Web3Auth Plug and Play No Modal SDK `@web3auth/no-modal`](https://web3auth.io/docs/sdk/web/no-modal/): The core module implemeting all the Web3Auth features you need and giving you the flexibilty of using your own UI with the Web3Auth SDK working in the client side.

## ⚡ Quick Start

### Installation (Web3Auth Plug and Play Modal)

```shell
npm install --save @web3auth/modal @web3auth/ethereum-provider @web3auth/web3auth-wagmi-connector
```

### Get your Client ID from Web3Auth Dashboard

Hop on to the [Web3Auth Dashboard](https://dashboard.web3auth.io/) and create a new project. Use the Client ID of the project to start your integration.

![Web3Auth Dashboard](https://web3auth.io/docs/assets/images/project_plug_n_play-89c39ec42ad993107bb2485b1ce64b89.png)

### Instantiate Web3Auth and pass it to the Connector

Here is an example of a wagmi client using both the `Web3AuthConnector` and the default `InjectedConnector` respectively.

```js
import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector";
import { Web3Auth } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { WagmiProvider, createConfig, http, } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query' 

// Configure chains & providers with the Alchemy provider.
// Popular providers are Alchemy (alchemy.com), Infura (infura.io), Quicknode (quicknode.com) etc.
const { chains, publicClient, webSocketPublicClient } = configureChains([mainnet, arbitrum, polygon], [publicProvider()]);

// Instantiating Web3Auth
const name = "My App Name";
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x" + mainnet.id.toString(16),
  rpcTarget: mainnet.rpcUrls.default.http[0], // This is the public RPC we have added, please pass on your own endpoint while creating an app
  displayName: mainnet.name,
  tickerName: mainnet.nativeCurrency?.name,
  ticker: mainnet.nativeCurrency?.symbol,
  blockExplorerUrl: mainnet.blockExplorers?.default.url[0] as string,
};

const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

const web3AuthInstance = new Web3Auth({
  clientId: "YOUR_WEB3AUTH_CLIENT_ID",
  chainConfig,
  privateKeyProvider,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
});

const queryClient = new QueryClient() 

// Set up client
const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [
    {web3AuthInstance},
  ],
});
```

## 🩹 Examples

Checkout the examples for your preferred blockchain and platform in our [examples repository](https://github.com/Web3Auth/web3auth-pnp-examples/)

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo-app.web3auth.io/) to see how Web3Auth can be used in your application.

Further checkout the [demos folder](https://github.com/Web3Auth/web3auth-wagmi-connecto/tree/master/demos) within this repository, which contains other hosted demos for different usecases.

## 💬 Troubleshooting and Support

- Have a look at our [Community Portal](https://community.web3auth.io/) to see if anyone has any questions or issues you might be having. Feel free to reate new topics and we'll help you out as soon as possible.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions.
- For Priority Support, please have a look at our [Pricing Page](https://web3auth.io/pricing.html) for the plan that suits your needs
