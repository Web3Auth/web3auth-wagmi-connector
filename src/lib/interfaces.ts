import { IWeb3Auth } from "@web3auth/base";
import { IWeb3AuthModal } from "@web3auth/modal";
import { OpenloginLoginParams } from "@web3auth/openlogin-adapter";
export interface Options {
  web3AuthInstance: IWeb3Auth | IWeb3AuthModal;
  loginParams?: OpenloginLoginParams;
}
