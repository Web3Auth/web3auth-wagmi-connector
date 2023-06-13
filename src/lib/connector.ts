/* eslint-disable import/no-extraneous-dependencies */
import { Address, Connector, ConnectorData, WalletClient } from "@wagmi/core";
import type { Chain } from "@wagmi/core/chains";
import type { IWeb3Auth, SafeEventEmitterProvider, WALLET_ADAPTER_TYPE } from "@web3auth/base";
import * as pkg from "@web3auth/base";
import type { IWeb3AuthModal, ModalConfig } from "@web3auth/modal";
import type { OpenloginLoginParams } from "@web3auth/openlogin-adapter";
import log from "loglevel";
import { createWalletClient, custom, UserRejectedRequestError } from "viem";

import type { Options } from "./interfaces";

const IS_SERVER = typeof window === "undefined";
const { ADAPTER_STATUS, CHAIN_NAMESPACES, WALLET_ADAPTERS } = pkg;

function isIWeb3AuthModal(obj: IWeb3Auth | IWeb3AuthModal): obj is IWeb3AuthModal {
  return typeof (obj as IWeb3AuthModal).initModal !== "undefined";
}

function normalizeChainId(chainId: string | number | bigint) {
  if (typeof chainId === "string") return Number.parseInt(chainId, chainId.trim().substring(0, 2) === "0x" ? 16 : 10);
  if (typeof chainId === "bigint") return Number(chainId);
  return chainId;
}

export class Web3AuthConnector extends Connector<SafeEventEmitterProvider, Options> {
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
    try {
      this.emit("message", {
        type: "connecting",
      });

      await this.getProvider();

      if (!this.web3AuthInstance.connected) {
        if (isIWeb3AuthModal(this.web3AuthInstance)) {
          this.provider = await this.web3AuthInstance.connect();
        } else if (this.loginParams) {
          this.provider = await this.web3AuthInstance.connectTo(WALLET_ADAPTERS.OPENLOGIN, this.loginParams);
        } else {
          log.error("please provide valid loginParams when using @web3auth/no-modal");
          throw new UserRejectedRequestError("please provide valid loginParams when using @web3auth/no-modal" as unknown as Error);
        }
      }

      const account = await this.getAccount();
      this.provider.on("accountsChanged", this.onAccountsChanged.bind(this));
      this.provider.on("chainChanged", this.onChainChanged.bind(this));
      const chainId = await this.getChainId();
      const unsupported = this.isChainUnsupported(chainId);
      return {
        account,
        chain: {
          id: chainId,
          unsupported,
        },
      };
    } catch (error) {
      log.error("error while connecting", error);
      this.emit("disconnect");
      throw new UserRejectedRequestError("Something went wrong" as unknown as Error);
    }
  }

  async getWalletClient({ chainId }: { chainId?: number } = {}): Promise<WalletClient> {
    const [provider, account] = await Promise.all([this.getProvider(), this.getAccount()]);
    const chain = this.chains.find((x) => x.id === chainId);
    if (!provider) throw new Error("provider is required.");
    return createWalletClient({
      account,
      chain,
      transport: custom(provider),
    });
  }

  async getAccount(): Promise<Address> {
    const provider = await this.getProvider();
    const accounts = await provider.request<Address[]>({
      method: "eth_accounts",
    });
    return accounts[0] as Address;
  }

  async getProvider() {
    if (this.provider) {
      return this.provider;
    }
    if (this.web3AuthInstance.status === ADAPTER_STATUS.NOT_READY) {
      if (isIWeb3AuthModal(this.web3AuthInstance)) {
        await this.web3AuthInstance.initModal({
          modalConfig: this.modalConfig,
        });
      } else if (this.loginParams) {
        await this.web3AuthInstance.init();
      } else {
        log.error("please provide valid loginParams when using @web3auth/no-modal");
        throw new UserRejectedRequestError("please provide valid loginParams when using @web3auth/no-modal" as unknown as Error);
      }
    }

    this.provider = this.web3AuthInstance.provider;
    return this.provider;
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
      await this.web3AuthInstance.addChain({
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: `0x${chain.id.toString(16)}`,
        rpcTarget: chain.rpcUrls.default.http[0],
        displayName: chain.name,
        blockExplorer: chain.blockExplorers?.default?.url,
        ticker: chain.nativeCurrency?.symbol || "ETH",
        tickerName: chain.nativeCurrency?.name || "Ethereum",
        decimals: chain.nativeCurrency.decimals || 18,
      });
      await this.web3AuthInstance.switchChain({ chainId: `0x${chain.id.toString(16)}` });
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
    else this.emit("change", { account: accounts[0] as `0x${string}` });
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
