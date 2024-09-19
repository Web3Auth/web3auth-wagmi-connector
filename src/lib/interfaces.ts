import type { AuthLoginParams } from "@web3auth/auth-adapter";
import type { IProvider, IWeb3Auth, WALLET_ADAPTER_TYPE } from "@web3auth/base";
import type { IWeb3AuthModal, ModalConfig } from "@web3auth/modal";

export interface Web3AuthConnectorParams {
  web3AuthInstance: IWeb3Auth | IWeb3AuthModal;
  loginParams?: AuthLoginParams;
  modalConfig?: Record<WALLET_ADAPTER_TYPE, ModalConfig>;
  id?: string;
  name?: string;
  type?: string;
}

export type Provider = IProvider;
