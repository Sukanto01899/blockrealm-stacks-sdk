import {
  callReadOnlyFunction,
  cvToValue,
  ClarityValue,
} from '@stacks/transactions'
import { StacksTestnet, StacksMainnet } from '@stacks/network'
import type { StacksNetwork } from '../core/types'
import { GridWarError, GridWarErrorCode } from '../core/errors'

export class ReadClient {
  private network: any

  constructor(network: StacksNetwork) {
    this.network = network === 'testnet' ? new StacksTestnet() : new StacksMainnet()
  }

  async call(
    contractAddress: string,
    contractName: string,
    functionName: string,
    functionArgs: ClarityValue[],
    senderAddress?: string
  ): Promise<any> {
    try {
      const result = await callReadOnlyFunction({
        network: this.network,
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        senderAddress: senderAddress ?? contractAddress,
      })
      const value = cvToValue(result)

      // Check for contract error response
      if (value && typeof value === 'object' && 'err' in value) {
        const errCode = Number(value.err)
        throw GridWarError.fromContractCode(errCode)
      }

      // Unwrap ok value
      if (value && typeof value === 'object' && 'ok' in value) {
        return value.ok
      }

      return value
    } catch (err) {
      if (err instanceof GridWarError) throw err
      throw new GridWarError(
        GridWarErrorCode.NETWORK_ERROR,
        `Read call failed: ${functionName} — ${(err as Error).message}`
      )
    }
  }
}
