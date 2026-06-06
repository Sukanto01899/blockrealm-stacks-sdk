import { PostConditionMode, ClarityValue } from '@stacks/transactions'
import { StacksTestnet, StacksMainnet } from '@stacks/network'
import type { StacksNetwork, TxResult } from '../core/types'
import { GridWarError, GridWarErrorCode } from '../core/errors'
import { getExplorerTxUrl } from '../core/constants'

export class WriteClient {
  private network: any
  private stacksNetwork: StacksNetwork

  constructor(network: StacksNetwork) {
    this.stacksNetwork = network
    this.network = network === 'testnet' ? new StacksTestnet() : new StacksMainnet()
  }

  async call(
    contractAddress: string,
    contractName: string,
    functionName: string,
    functionArgs: ClarityValue[],
    postConditions: any[] = []
  ): Promise<TxResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const { openContractCall } = await import('@stacks/connect')
        openContractCall({
          network: this.network,
          contractAddress,
          contractName,
          functionName,
          functionArgs,
          postConditions,
          postConditionMode: PostConditionMode.Allow,
          onFinish: (data: any) => {
            resolve({
              txId: data.txId,
              explorerUrl: getExplorerTxUrl(data.txId, this.stacksNetwork),
              broadcasted: true,
            })
          },
          onCancel: () => {
            reject(
              new GridWarError(
                GridWarErrorCode.USER_CANCELLED,
                'User cancelled the transaction'
              )
            )
          },
        })
      } catch (err) {
        reject(
          new GridWarError(
            GridWarErrorCode.CONTRACT_CALL_FAILED,
            `Write call failed: ${functionName}`
          )
        )
      }
    })
  }
}
