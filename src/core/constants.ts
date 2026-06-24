export const MAP_SIZE = 100
export const MAX_LEVEL = 5
export const CAPTURE_COST_MICROSTX = 1_000_000n // 1 STX
export const HARVEST_INTERVAL_BLOCKS = 10
export const RESOURCE_PER_PERIOD = 10
export const UPGRADE_BASE_COST_MICROSTX = 2_000_000n // 2 STX

export const DEFAULT_CONTRACT_NAMES = {
  tileRegistry: 'tile-registry',
  gameEngine: 'game-engine',
} as const

export const EXPLORER_URLS = {
  testnet: 'https://explorer.hiro.so',
  mainnet: 'https://explorer.hiro.so',
} as const

export const HIRO_API_URLS = {
  testnet: 'https://api.testnet.hiro.so',
  mainnet: 'https://api.hiro.so',
} as const

export function getExplorerTxUrl(txId: string, network: 'testnet' | 'mainnet'): string {
  const chain = network === 'testnet' ? '?chain=testnet' : ''
  return `${EXPLORER_URLS[network]}/txid/${txId}${chain}`
}

export function getTileId(x: number, y: number): number {
  if (x >= MAP_SIZE || y >= MAP_SIZE || x < 0 || y < 0) {
    throw new Error(`Out of bounds: (${x}, ${y})`)
  }
  return x * MAP_SIZE + y
}
