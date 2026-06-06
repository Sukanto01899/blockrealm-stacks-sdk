import { principalCV } from '@stacks/transactions'
import type { ReadClient } from '../client/ReadClient'
import type { PlayerStats, GridWarConfig } from '../core/types'
import { DEFAULT_CONTRACT_NAMES } from '../core/constants'

export class PlayerModule {
  private contractAddress: string
  private registryName: string

  constructor(
    private read: ReadClient,
    config: GridWarConfig
  ) {
    this.contractAddress = config.contractAddress
    this.registryName = config.tileRegistryName ?? DEFAULT_CONTRACT_NAMES.tileRegistry
  }

  async getStats(address: string): Promise<PlayerStats> {
    const result = await this.read.call(
      this.contractAddress,
      this.registryName,
      'get-player-stats',
      [principalCV(address)]
    )
    return {
      address,
      tileCount: Number(result?.['tile-count'] ?? 0),
      totalResources: BigInt(result?.['total-resources'] ?? 0),
    }
  }

  async getTileCount(address: string): Promise<number> {
    const stats = await this.getStats(address)
    return stats.tileCount
  }

  async getTotalResources(address: string): Promise<bigint> {
    const stats = await this.getStats(address)
    return stats.totalResources
  }

  calculateScore(stats: PlayerStats): number {
    return stats.tileCount * 100 + Number(stats.totalResources)
  }
}
