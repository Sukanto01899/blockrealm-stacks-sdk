import { principalCV, uintCV } from '@stacks/transactions'
import type { ReadClient } from '../client/ReadClient'
import type { WriteClient } from '../client/WriteClient'
import type { EpochWinner, PlayerEpochScore, TxResult, GridWarConfig } from '../core/types'
import { DEFAULT_CONTRACT_NAMES, STACKS_BLOCK_TIME_MS } from '../core/constants'

export class LeaderboardModule {
  private contractAddress: string
  private registryName: string

  constructor(
    private read: ReadClient,
    private write: WriteClient,
    config: GridWarConfig
  ) {
    this.contractAddress = config.contractAddress
    this.registryName = config.tileRegistryName ?? DEFAULT_CONTRACT_NAMES.tileRegistry
  }

  // Write: register current wallet as player
  async register(): Promise<TxResult> {
    return this.write.call(this.contractAddress, this.registryName, 'register-player', [])
  }

  // Write: submit current score for active epoch
  async submitScore(): Promise<TxResult> {
    return this.write.call(this.contractAddress, this.registryName, 'submit-score', [])
  }

  // Write: end epoch with top 3 winners (anyone can call after epoch ends)
  async endEpoch(first: string, second: string, third: string): Promise<TxResult> {
    return this.write.call(this.contractAddress, this.registryName, 'end-epoch', [
      principalCV(first),
      principalCV(second),
      principalCV(third),
    ])
  }

  // Write: fund reward pool
  async fundRewards(amountMicroStx: bigint): Promise<TxResult> {
    return this.write.call(this.contractAddress, this.registryName, 'fund-rewards', [
      uintCV(amountMicroStx),
    ])
  }

  // Read: get current epoch number
  async getCurrentEpoch(): Promise<number> {
    const result = await this.read.call(
      this.contractAddress,
      this.registryName,
      'get-current-epoch',
      []
    )
    return Number(result ?? 0)
  }

  // Read: get winners for a specific epoch
  async getEpochWinner(epoch: number): Promise<EpochWinner | null> {
    const result = await this.read.call(
      this.contractAddress,
      this.registryName,
      'get-epoch-winner',
      [uintCV(epoch)]
    )
    if (!result) return null
    return {
      first: result.first ?? '',
      second: result.second ?? '',
      third: result.third ?? '',
      epoch,
    }
  }

  // Read: get a player's score for a specific epoch
  async getPlayerScore(address: string, epoch: number): Promise<PlayerEpochScore | null> {
    const result = await this.read.call(
      this.contractAddress,
      this.registryName,
      'get-player-epoch-score',
      [principalCV(address), uintCV(epoch)]
    )
    if (!result) return null
    return {
      tileCount: Number(result['tile-count'] ?? 0),
      resources: BigInt(result.resources ?? 0),
      score: Number(result.score ?? 0),
      epoch: Number(result.epoch ?? epoch),
    }
  }

  // Read: blocks remaining until epoch ends
  async getEpochBlocksRemaining(): Promise<number> {
    const result = await this.read.call(
      this.contractAddress,
      this.registryName,
      'get-epoch-blocks-remaining',
      []
    )
    return Number(result ?? 0)
  }

  // Read: estimated wall-clock time until the epoch ends, based on
  // getEpochBlocksRemaining() × STACKS_BLOCK_TIME_MS (~10 min/block).
  // Returns both raw blocks and estimatedMs so callers can display either.
  async getEpochTimeRemaining(): Promise<{ blocks: number; estimatedMs: number }> {
    const blocks = await this.getEpochBlocksRemaining()
    return { blocks, estimatedMs: blocks * STACKS_BLOCK_TIME_MS }
  }

  // Read: whether the current epoch has ended (blocks remaining === 0).
  // Saves callers from fetching the raw count just to compare against zero.
  async isEpochEnded(): Promise<boolean> {
    return (await this.getEpochBlocksRemaining()) === 0
  }

  // Read: check if player is registered
  async isRegistered(address: string): Promise<boolean> {
    const result = await this.read.call(
      this.contractAddress,
      this.registryName,
      'is-registered',
      [principalCV(address)]
    )
    return Boolean(result)
  }
}
