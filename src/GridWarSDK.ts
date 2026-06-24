import { ReadClient } from './client/ReadClient'
import { WriteClient } from './client/WriteClient'
import { TileModule } from './modules/TileModule'
import { PlayerModule } from './modules/PlayerModule'
import { LeaderboardModule } from './modules/LeaderboardModule'
import type { GridWarConfig, GameEvent, GameEventType, GameEventHandler } from './core/types'
import { DEFAULT_CONTRACT_NAMES } from './core/constants'

export class GridWarSDK {
  public readonly tiles: TileModule
  public readonly player: PlayerModule
  public readonly leaderboard: LeaderboardModule
  public readonly config: GridWarConfig

  private readClient: ReadClient
  private writeClient: WriteClient
  private eventListeners: Map<GameEventType, Set<GameEventHandler<any>>>

  constructor(config: GridWarConfig) {
    // Apply defaults
    this.config = {
      tileRegistryName: DEFAULT_CONTRACT_NAMES.tileRegistry,
      gameEngineName: DEFAULT_CONTRACT_NAMES.gameEngine,
      ...config,
    }

    this.readClient = new ReadClient(this.config.network)
    this.writeClient = new WriteClient(this.config.network)
    this.eventListeners = new Map()

    this.tiles = new TileModule(this.readClient, this.writeClient, this.config)
    this.player = new PlayerModule(this.readClient, this.config)
    this.leaderboard = new LeaderboardModule(this.readClient, this.writeClient, this.config)
  }

  // Event system
  on<T extends GameEvent>(eventType: T['type'], handler: GameEventHandler<T>): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set())
    }
    this.eventListeners.get(eventType)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(eventType)?.delete(handler)
    }
  }

  // Like `on`, but auto-unsubscribes after the first matching event.
  once<T extends GameEvent>(eventType: T['type'], handler: GameEventHandler<T>): () => void {
    const unsubscribe = this.on(eventType, (event: T) => {
      unsubscribe()
      handler(event)
    })
    return unsubscribe
  }

  emit<T extends GameEvent>(event: T): void {
    this.eventListeners.get(event.type)?.forEach((handler) => handler(event))
  }

  off(eventType: GameEventType): void {
    this.eventListeners.delete(eventType)
  }

  // Utility
  getExplorerUrl(txId: string): string {
    const chain = this.config.network === 'testnet' ? '?chain=testnet' : ''
    return `https://explorer.hiro.so/txid/${txId}${chain}`
  }

  getNetwork(): string {
    return this.config.network
  }

  getContractAddress(): string {
    return this.config.contractAddress
  }
}
