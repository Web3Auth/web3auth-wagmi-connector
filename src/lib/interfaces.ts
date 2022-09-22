import type { OpenLoginOptions } from "@toruslabs/openlogin";
import { OpenloginLoginParams } from "@web3auth/openlogin-adapter";

export type LoginMethodConfig = Record<
  string,
  {
    /**
     * Display Name. If not provided, we use the default for openlogin app
     */
    name: string;
    /**
     * Description for button. If provided, it renders as a full length button. else, icon button
     */
    description?: string;
    /**
     * Logo to be shown on mouse hover. If not provided, we use the default for openlogin app
     */
    logoHover?: string;
    /**
     * Logo to be shown on dark background (dark theme). If not provided, we use the default for openlogin app
     */
    logoLight?: string;
    /**
     * Logo to be shown on light background (light theme). If not provided, we use the default for openlogin app
     */
    logoDark?: string;
    /**
     * Show login button on the main list
     */
    mainOption?: boolean;
    /**
     * Whether to show the login button on modal or not
     */
    showOnModal?: boolean;
    /**
     * Whether to show the login button on desktop
     */
    showOnDesktop?: boolean;
    /**
     * Whether to show the login button on mobile
     */
    showOnMobile?: boolean;
  }
>;
export interface UIConfig {
  /**
   * Logo for your app.
   */
  appLogo?: string;

  /**
   * theme for the modal
   *
   * @defaultValue `light`
   */
  theme?: "light" | "dark";

  /**
   * order of how login methods are shown
   *
   * @defaultValue `["google", "facebook", "twitter", "reddit", "discord", "twitch", "apple", "line", "github", "kakao", "linkedin", "weibo", "wechat", "email_passwordless"]`
   */
  loginMethodsOrder?: string[];

  loginMethodConfig?: LoginMethodConfig;
}
export interface Options extends OpenLoginOptions {
  /**
   * Web3Auth Client Id, you can obtain this from the web3auth developer dashboard by visiting
   * https://dashboard.web3auth.io
   */
  clientId: string;

  /**
   * ChainId in hex/number that you want to connect with.
   */
  chainId?: string;
  /**
   * setting to true will enable logs
   *
   * @defaultValue false
   */
  enableLogging?: boolean;
  /**
   * setting to "local" will persist social login session accross browser tabs.
   *
   * @defaultValue "local"
   */
  storageKey?: "session" | "local";

  /**
   * Config for configuring modal ui display properties
   */
  uiConfig?: UIConfig;

  /**
   * Whether to show errors on Web3Auth modal.
   *
   * @defaultValue `true`
   */
  displayErrorsOnModal?: boolean;

  socialLoginConfig: Pick<OpenloginLoginParams, "dappShare" | "appState" | "mfaLevel" | "sessionTime">;
}
