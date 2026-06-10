export type StacksNetwork = 'testnet' | 'mainnet'

export interface GridWarConfig {
  network: StacksNetwork
  contractAddress: string // deployer address (ST1ABC...)
  tileRegistryName?: string // default: 'tile-registry'
  gameEngineName?: string // default: 'game-engine'
}

export interface Tile {
  owner: string // principal as string, '' if unowned
  level: number // 1-5
  resources: bigint
  lastHarvest: number // block height
  capturedAt: number // block height
  isOwned: boolean // convenience: owner !== ''
}

export interface RegionTile extends Tile {
  x: number
  y: number
}

export interface PlayerStats {
  tileCount: number
  totalResources: bigint
  address: string
}

export interface TxResult {
  txId: string
  explorerUrl: string // full explorer link
  broadcasted: boolean
}

export interface EpochWinner {
  first: string
  second: string
  third: string
  epoch: number
}

export interface PlayerEpochScore {
  tileCount: number
  resources: bigint
  score: number
  epoch: number
}

export interface TileCoords {
  x: number
  y: number
}

export interface AttackResult extends TxResult {
  // tx is submitted — result known after confirmation
}

export type GameEvent =
  | { type: 'tile:captured'; tileId: number; owner: string; x: number; y: number }
  | { type: 'tile:attacked'; tileId: number; attacker: string; defender: string; success: boolean }
  | { type: 'tile:harvested'; tileId: number; player: string; amount: bigint }
  | { type: 'tile:upgraded'; tileId: number; player: string; newLevel: number }
  | { type: 'player:registered'; player: string }
  | { type: 'score:submitted'; player: string; score: number; epoch: number }
  | { type: 'epoch:ended'; epoch: number; winners: EpochWinner }

export type GameEventType = GameEvent['type']
export type GameEventHandler<T extends GameEvent> = (event: T) => void
