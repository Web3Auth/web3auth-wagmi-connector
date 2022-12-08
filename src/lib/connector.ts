import { Chain, Connector, ConnectorData, normalizeChainId, UserRejectedRequestError } from "@wagmi/core";
import {
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  CHAIN_NAMESPACES,
  CustomChainConfig,
  getChainConfig,
  SafeEventEmitterProvider,
  WALLET_ADAPTER_TYPE,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { Web3AuthCore } from "@web3auth/core";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import LoginModal, { getAdapterSocialLogins, LOGIN_MODAL_EVENTS, OPENLOGIN_PROVIDERS } from "@web3auth/ui";
import { ethers, Signer } from "ethers";
import { getAddress } from "ethers/lib/utils";
import log from "loglevel";

import { Options } from "./interfaces";

const IS_SERVER = typeof window === "undefined";

export class Web3AuthConnector extends Connector {
  ready = !IS_SERVER;

  readonly id = "web3Auth";

  readonly name = "web3Auth";

  provider: SafeEventEmitterProvider;

  web3AuthInstance?: Web3AuthCore;

  isModalOpen = false;

  web3AuthOptions: Options;

  private loginModal: LoginModal;

  private socialLoginAdapter: OpenloginAdapter;

  constructor(config: { chains?: Chain[]; options: Options }) {
    super(config);
    this.web3AuthOptions = config.options;
    const chainId = config.options.chainId ? parseInt(config.options.chainId, 16) : 1;
    const chainConfig = this.chains.filter((x) => x.id === chainId);

    const defaultChainConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, config.options.chainId || "0x1");
    let finalChainConfig: CustomChainConfig = {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      ...defaultChainConfig,
    };
    if (chainConfig.length > 0) {
      let currentChain = chainConfig[0];
      if (config.options.chainId) {
        currentChain = chainConfig.find((chain) => chain.id === normalizeChainId(config.options.chainId));
      }
      finalChainConfig = {
        ...finalChainConfig,
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: `0x${currentChain.id.toString(16)}`,
        rpcTarget: currentChain.rpcUrls.default,
        displayName: currentChain.name,
        tickerName: currentChain.nativeCurrency?.name,
        ticker: currentChain.nativeCurrency?.symbol,
        blockExplorer: currentChain?.blockExplorers.default?.url,
      };
    }
    this.web3AuthInstance = new Web3AuthCore({
      clientId: config.options.clientId,
      enableLogging: config.options.enableLogging,
      storageKey: config.options.storageKey,
      chainConfig: {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        ...finalChainConfig,
      },
    });

    this.socialLoginAdapter = new OpenloginAdapter({
      adapterSettings: {
        ...config.options,
        loginConfig: {
          ...config.options.socialLoginConfig.loginConfig,
        },
      },
      loginSettings: {
        ...(config.options?.socialLoginConfig || {}),
      },
      chainConfig: finalChainConfig,
    });

    this.web3AuthInstance.configureAdapter(this.socialLoginAdapter);

    this.loginModal = new LoginModal({
      theme: this.options.uiConfig?.theme,
      appLogo: this.options.uiConfig?.appLogo || "",
      version: "",
      adapterListener: this.web3AuthInstance,
      displayErrorsOnModal: this.options.displayErrorsOnModal,
    });

    this.subscribeToLoginModalEvents();
  }

  async connect(): Promise<Required<ConnectorData>> {
    try {
      this.emit("message", {
        type: "connecting",
      });

      if (this.options.useModal !== false) {
        await this.loginModal.initModal();

        this.loginModal.addSocialLogins(
          WALLET_ADAPTERS.OPENLOGIN,
          getAdapterSocialLogins(WALLET_ADAPTERS.OPENLOGIN, this.socialLoginAdapter, this.options.uiConfig?.loginMethodConfig),
          this.options.uiConfig?.loginMethodsOrder || OPENLOGIN_PROVIDERS
        );
      }

      if (this.web3AuthInstance.status !== ADAPTER_STATUS.READY) {
        await this.web3AuthInstance.init();
      }

      // Check if there is a user logged in
      const isLoggedIn = await this.isAuthorized();

      // if there is a user logged in, return the user
      if (isLoggedIn) {
        const provider = await this.getProvider();
        const chainId = await this.getChainId();
        if (provider.on) {
          provider.on("accountsChanged", this.onAccountsChanged.bind(this));
          provider.on("chainChanged", this.onChainChanged.bind(this));
        }
        const unsupported = this.isChainUnsupported(chainId);

        return {
          provider,
          chain: {
            id: chainId,
            unsupported,
          },
          account: await this.getAccount(),
        };
      }

      if (this.options.useModal !== false) {
        this.loginModal.open();
        const elem = document.getElementById("w3a-container");
        elem.style.zIndex = "10000000000";
      } else if (this.options.socialLoginConfig?.loginProvider) {
        this.web3AuthInstance.connectTo(WALLET_ADAPTERS.OPENLOGIN, this.options.socialLoginConfig);
      } else {
        log.error("please provide a valid loginProvider within socialLoginConfig when useModal is false");
        throw new UserRejectedRequestError("please provide a loginProvider within socialLoginConfig when useModal is false");
      }
      return await new Promise((resolve, reject) => {
        this.loginModal.once(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, (isVisible: boolean) => {
          if (!isVisible && !this.web3AuthInstance.provider) {
            return reject(new Error("User closed popup"));
          }
        });

        this.web3AuthInstance.once(ADAPTER_EVENTS.CONNECTED, async () => {
          const signer = await this.getSigner();
          const account = await signer.getAddress();
          const provider = await this.getProvider();

          if (provider.on) {
            provider.on("accountsChanged", this.onAccountsChanged.bind(this));
            provider.on("chainChanged", this.onChainChanged.bind(this));
          }
          const chainId = await this.getChainId();
          const unsupported = this.isChainUnsupported(chainId);

          return resolve({
            account,
            chain: {
              id: chainId,
              unsupported,
            },
            provider,
          });
        });
        this.web3AuthInstance.once(ADAPTER_EVENTS.ERRORED, (err: unknown) => {
          log.error("error while connecting", err);
          return reject(err);
        });
      });
    } catch (error) {
      log.error("error while connecting", error);
      throw new UserRejectedRequestError("Something went wrong");
    }
  }

  async getAccount(): Promise<string> {
    const provider = new ethers.providers.Web3Provider(await this.getProvider());
    const signer = provider.getSigner();
    const account = await signer.getAddress();
    return account;
  }

  async getProvider() {
    if (this.provider) {
      return this.provider;
    }
    this.provider = this.web3AuthInstance.provider;
    return this.provider;
  }

  async getSigner(): Promise<Signer> {
    const provider = new ethers.providers.Web3Provider(await this.getProvider());
    const signer = provider.getSigner();
    return signer;
  }

  async isAuthorized() {
    try {
      const account = await this.getAccount();
      return !!(account && this.provider);
    } catch {
      return false;
    }
  }

  async getChainId(): Promise<number> {
    try {
      const provider = await this.getProvider();
      if (!provider) {
        const networkOptions = this.socialLoginAdapter.chainConfigProxy;
        if (typeof networkOptions === "object") {
          const chainID = networkOptions.chainId;
          if (chainID) {
            return normalizeChainId(chainID);
          }
        }
      } else {
        const chainId = await provider.request({ method: "eth_chainId" });
        if (chainId) {
          return normalizeChainId(chainId as string);
        }
      }
      throw new Error("Chain ID is not defined");
    } catch (error) {
      log.error("error", error);
      throw error;
    }
  }

  async switchChain(chainId: number) {
    try {
      const chain = this.chains.find((x) => x.id === chainId);
      if (!chain) throw new Error(`Unsupported chainId: ${chainId}`);
      const provider = this.getProvider();
      if (!provider) throw new Error("Please login first");
      this.provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${chain.id.toString(16)}`,
            chainName: chain.name,
            rpcUrls: [chain.rpcUrls.default],
            blockExplorerUrls: [chain.blockExplorers?.default?.url],
            nativeCurrency: {
              symbol: chain.nativeCurrency?.symbol || "ETH",
            },
          },
        ],
      });
      await this.provider.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: `0x${chain.id.toString(16)}`,
          },
        ],
      });
      return chain;
    } catch (error) {
      log.error("Error: Cannot change chain", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.web3AuthInstance.logout();
    this.provider = null;
  }

  protected onAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) this.emit("disconnect");
    else this.emit("change", { account: getAddress(accounts[0]) });
  }

  protected isChainUnsupported(chainId: number): boolean {
    return !this.chains.some((x) => x.id === chainId);
  }

  protected onChainChanged(chainId: string | number): void {
    const id = normalizeChainId(chainId);
    const unsupported = this.isChainUnsupported(id);
    this.emit("change", { chain: { id, unsupported } });
  }

  protected onDisconnect(): void {
    this.emit("disconnect");
  }

  private subscribeToLoginModalEvents(): void {
    this.loginModal.on(LOGIN_MODAL_EVENTS.LOGIN, async (params: { adapter: WALLET_ADAPTER_TYPE; loginParams: unknown }) => {
      try {
        await this.web3AuthInstance.connectTo<unknown>(params.adapter, params.loginParams);
      } catch (error) {
        log.error(`Error while connecting to adapter: ${params.adapter}`, error);
      }
    });

    this.loginModal.on(LOGIN_MODAL_EVENTS.DISCONNECT, async () => {
      try {
        await this.disconnect();
      } catch (error) {
        log.error(`Error while disconnecting`, error);
      }
    });
  }
}
