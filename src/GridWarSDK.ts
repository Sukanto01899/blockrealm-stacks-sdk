import pkg from '../../package.json'
import { ReadClient } from './client/ReadClient'
import { WriteClient } from './client/WriteClient'
import { TileModule } from './modules/TileModule'
import { PlayerModule } from './modules/PlayerModule'
import { LeaderboardModule } from './modules/LeaderboardModule'
import type {
  GridWarConfig,
  GameEvent,
  GameEventType,
  GameEventHandler,
  TxConfirmation,
  TxConfirmationStatus,
} from './core/types'
import { DEFAULT_CONTRACT_NAMES, HIRO_API_URLS } from './core/constants'
import { GridWarError, GridWarErrorCode } from './core/errors'

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

  static readonly version: string = pkg.version

  // Shortcuts for `new GridWarSDK({ network: 'testnet'/'mainnet', contractAddress, ...rest })`.
  static testnet(
    contractAddress: string,
    rest?: Omit<GridWarConfig, 'network' | 'contractAddress'>
  ): GridWarSDK {
    return new GridWarSDK({ network: 'testnet', contractAddress, ...rest })
  }

  static mainnet(
    contractAddress: string,
    rest?: Omit<GridWarConfig, 'network' | 'contractAddress'>
  ): GridWarSDK {
    return new GridWarSDK({ network: 'mainnet', contractAddress, ...rest })
  }

  // Whether a raw Stacks tx_status (from your own polling/websocket) is
  // terminal — i.e. anything other than 'pending'. Covers 'success',
  // 'abort_by_response', 'abort_by_post_condition', and the 'dropped_*'
  // statuses, without consumers needing to enumerate them all.
  static isTxFinal(status: string): boolean {
    return status !== 'pending'
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

  // Polls the Stacks API until `txId` confirms (success or abort) or the
  // timeout elapses. Saves callers from writing their own confirmation loop
  // after `capture()` / `attack()` / `harvest()` / `upgrade()`.
  async waitForTx(
    txId: string,
    options: { intervalMs?: number; timeoutMs?: number } = {}
  ): Promise<TxConfirmation> {
    const intervalMs = options.intervalMs ?? 3000
    const timeoutMs = options.timeoutMs ?? 60_000
    const baseUrl = HIRO_API_URLS[this.config.network]
    const deadline = Date.now() + timeoutMs

    while (true) {
      const res = await fetch(`${baseUrl}/extended/v1/tx/${txId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.tx_status && GridWarSDK.isTxFinal(data.tx_status)) {
          return {
            txId,
            status: data.tx_status as TxConfirmationStatus,
            blockHeight: data.block_height,
          }
        }
      }

      if (Date.now() >= deadline) {
        throw new GridWarError(
          GridWarErrorCode.TX_TIMEOUT,
          `Timed out waiting for tx ${txId} to confirm after ${timeoutMs}ms`
        )
      }
      await new Promise((r) => setTimeout(r, intervalMs))
    }
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
