import { Address, Connector, ConnectorData, normalizeChainId, UserRejectedRequestError } from "@wagmi/core";
import { Chain } from "@wagmi/core/chains";
import { ADAPTER_STATUS, IWeb3Auth, SafeEventEmitterProvider, WALLET_ADAPTER_TYPE, WALLET_ADAPTERS } from "@web3auth/base";
import type { IWeb3AuthModal, ModalConfig } from "@web3auth/modal";
import type { OpenloginLoginParams } from "@web3auth/openlogin-adapter";
import { providers, Signer } from "ethers";
import { getAddress } from "ethers/lib/utils";
import log from "loglevel";

import type { Options } from "./interfaces";

const IS_SERVER = typeof window === "undefined";

export class Web3AuthConnector extends Connector<SafeEventEmitterProvider, Options, Signer> {
  ready = !IS_SERVER;

  readonly id = "web3auth";

  readonly name = "Web3Auth";

  provider: SafeEventEmitterProvider | null = null;

  web3AuthInstance: IWeb3Auth | IWeb3AuthModal;

  initialChainId: number;

  loginParams: OpenloginLoginParams | null;

  modalConfig: Record<WALLET_ADAPTER_TYPE, ModalConfig> | null;

  constructor({ chains, options }: { chains?: Chain[]; options: Options }) {
    super({ chains, options });
    this.web3AuthInstance = options.web3AuthInstance;
    this.loginParams = options.loginParams || null;
    this.modalConfig = options.modalConfig || null;
    this.initialChainId = chains[0].id;
  }

  async connect(): Promise<Required<ConnectorData>> {
    function isIWeb3AuthModal(obj: IWeb3Auth | IWeb3AuthModal): obj is IWeb3AuthModal {
      return typeof (obj as IWeb3AuthModal).initModal !== "undefined";
    }

    try {
      this.emit("message", {
        type: "connecting",
      });

      if (this.web3AuthInstance.status === ADAPTER_STATUS.NOT_READY) {
        if (isIWeb3AuthModal(this.web3AuthInstance)) {
          await this.web3AuthInstance.initModal({
            modalConfig: this.modalConfig,
          });
        } else if (this.loginParams) {
          await this.web3AuthInstance.init();
        } else {
          log.error("please provide a valid loginParams when not using @web3auth/modal");
          throw new UserRejectedRequestError("please provide a valid loginParams when not using @web3auth/modal");
        }
      }

      let { provider } = this.web3AuthInstance;

      if (!provider) {
        if (isIWeb3AuthModal(this.web3AuthInstance)) {
          provider = await this.web3AuthInstance.connect();
        } else if (this.loginParams) {
          provider = await this.web3AuthInstance.connectTo(WALLET_ADAPTERS.OPENLOGIN, this.loginParams);
        } else {
          log.error("please provide a valid loginParams when not using @web3auth/modal");
          throw new UserRejectedRequestError("please provide a valid loginParams when not using @web3auth/modal");
        }
      }

      const signer = await this.getSigner();
      const account = (await signer.getAddress()) as Address;
      provider.on("accountsChanged", this.onAccountsChanged.bind(this));
      provider.on("chainChanged", this.onChainChanged.bind(this));
      const chainId = await this.getChainId();
      const unsupported = this.isChainUnsupported(chainId);
      return {
        account,
        chain: {
          id: chainId,
          unsupported,
        },
        provider,
      };
    } catch (error) {
      log.error("error while connecting", error);
      throw new UserRejectedRequestError("Something went wrong");
    }
  }

  async getAccount(): Promise<Address> {
    const provider = new providers.Web3Provider(await this.getProvider());
    const signer = provider.getSigner();
    const account = await signer.getAddress();
    return account as Address;
  }

  async getProvider() {
    if (this.provider) {
      return this.provider;
    }
    this.provider = this.web3AuthInstance.provider;
    return this.provider;
  }

  async getSigner(): Promise<Signer> {
    const provider = new providers.Web3Provider(await this.getProvider());
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
      const provider = await this.getProvider();
      if (!provider) throw new Error("Please login first");
      await this.provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${chain.id.toString(16)}`,
            chainName: chain.name,
            rpcUrls: [chain.rpcUrls.default.http],
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
