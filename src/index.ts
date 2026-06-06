// Main class
export { GridWarSDK } from './GridWarSDK'

// Modules (for advanced users who want direct access)
export { TileModule } from './modules/TileModule'
export { PlayerModule } from './modules/PlayerModule'
export { LeaderboardModule } from './modules/LeaderboardModule'

// Clients
export { ReadClient } from './client/ReadClient'
export { WriteClient } from './client/WriteClient'

// Types
export type {
  GridWarConfig,
  StacksNetwork,
  Tile,
  TileCoords,
  PlayerStats,
  TxResult,
  EpochWinner,
  PlayerEpochScore,
  GameEvent,
  GameEventType,
  GameEventHandler,
  AttackResult,
} from './core/types'

// Errors
export { GridWarError, GridWarErrorCode, CONTRACT_ERROR_MAP } from './core/errors'

// Constants + helpers
export {
  MAP_SIZE,
  MAX_LEVEL,
  CAPTURE_COST_MICROSTX,
  HARVEST_INTERVAL_BLOCKS,
  RESOURCE_PER_PERIOD,
  UPGRADE_BASE_COST_MICROSTX,
  DEFAULT_CONTRACT_NAMES,
  getTileId,
  getExplorerTxUrl,
} from './core/constants'
