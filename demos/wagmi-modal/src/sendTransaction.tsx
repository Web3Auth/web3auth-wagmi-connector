import {ethers} from 'ethers'
import { useSendTransaction } from "wagmi";

export const SendTransaction = () => {
    const { data, isIdle, isLoading, isSuccess, isError, sendTransaction } =
      useSendTransaction({
        mode: 'recklesslyUnprepared',
        chainId: 5,
        request: {
          to: '0x2E464670992574A613f10F7682D5057fB507Cc21',
          value: ethers.utils.parseEther("0.00073"), // 0.001 ETH
        },
      })
  
    if (isLoading) return <div>Check Wallet</div>
  
    if (isIdle)
      return (
        <button className="card" disabled={isLoading} onClick={() => sendTransaction()}>
          Send Transaction
        </button>
      )
  
    return (
      <div>
        {isSuccess && <div>Transaction: {JSON.stringify(data)}</div>}
        {isError && <div>Error sending transaction</div>}
      </div>
    )
  }