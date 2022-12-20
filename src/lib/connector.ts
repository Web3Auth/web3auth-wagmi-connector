import { Chain, Connector, ConnectorData, normalizeChainId, UserRejectedRequestError } from "@wagmi/core";
import { ADAPTER_EVENTS, IWeb3Auth, SafeEventEmitterProvider, WALLET_ADAPTERS } from "@web3auth/base";
import { IWeb3AuthModal } from "@web3auth/modal";
import { OpenloginLoginParams } from "@web3auth/openlogin-adapter";
import { LOGIN_MODAL_EVENTS } from "@web3auth/ui";
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

  web3AuthInstance: IWeb3Auth | IWeb3AuthModal;

  initialChainId: number;

  loginParams: OpenloginLoginParams | null;

  constructor(config: { chains?: Chain[]; options: Options }) {
    super(config);
    this.web3AuthInstance = config.options.web3AuthInstance;
    this.loginParams = config.options.loginParams || null;
    this.initialChainId = config.chains[0].id;
  }

  async connect(): Promise<Required<ConnectorData>> {
    function isIWeb3AuthModal(obj: IWeb3Auth | IWeb3AuthModal): obj is IWeb3AuthModal {
      return typeof (obj as IWeb3AuthModal).initModal !== "undefined";
    }

    try {
      this.emit("message", {
        type: "connecting",
      });
      // eslint-disable-next-line no-console
      console.log(this.web3AuthInstance);
      if (isIWeb3AuthModal(this.web3AuthInstance)) {
        await this.web3AuthInstance.initModal();
      } else if (this.loginParams) {
        await this.web3AuthInstance.init();
      } else {
        log.error("please provide a valid loginParams when not using @web3auth/modal");
        throw new UserRejectedRequestError("please provide a valid loginParams when not using @web3auth/modal");
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

      if (isIWeb3AuthModal(this.web3AuthInstance)) {
        this.web3AuthInstance.connect();
        const elem = document.getElementById("w3a-container");
        elem.style.zIndex = "10000000000";
      } else if (this.loginParams) {
        this.web3AuthInstance.connectTo(WALLET_ADAPTERS.OPENLOGIN, this.loginParams);
      } else {
        log.error("please provide a valid loginParams when not using @web3auth/modal");
        throw new UserRejectedRequestError("please provide a valid loginParams when not using @web3auth/modal");
      }
      return await new Promise((resolve, reject) => {
        this.web3AuthInstance.once(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, (isVisible: boolean) => {
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
      if (this.provider) {
        const chainId = await this.provider.request({ method: "eth_chainId" });
        if (chainId) {
          return normalizeChainId(chainId as string);
        }
      }
      if (this.initialChainId) {
        return this.initialChainId;
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
}
