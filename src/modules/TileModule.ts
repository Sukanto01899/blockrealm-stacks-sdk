import { uintCV } from '@stacks/transactions'
import type { ReadClient } from '../client/ReadClient'
import type { WriteClient } from '../client/WriteClient'
import type { Tile, RegionTile, TxResult, GridWarConfig } from '../core/types'
import { GridWarError, GridWarErrorCode } from '../core/errors'
import { MAP_SIZE, CAPTURE_COST_MICROSTX, DEFAULT_CONTRACT_NAMES } from '../core/constants'

export class TileModule {
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

  // Read: get tile data at (x, y)
  async get(x: number, y: number): Promise<Tile> {
    this.validateCoords(x, y)
    const result = await this.read.call(
      this.contractAddress,
      this.registryName,
      'get-tile',
      [uintCV(x), uintCV(y)]
    )
    return this.parseTile(result)
  }

  // Read: get every tile in the rectangle (x1,y1)-(x2,y2), inclusive.
  // Corners may be given in any order. Each result carries its (x, y).
  async getRegion(x1: number, y1: number, x2: number, y2: number): Promise<RegionTile[]> {
    const minX = Math.min(x1, x2)
    const maxX = Math.max(x1, x2)
    const minY = Math.min(y1, y2)
    const maxY = Math.max(y1, y2)
    this.validateCoords(minX, minY)
    this.validateCoords(maxX, maxY)

    const coords: { x: number; y: number }[] = []
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        coords.push({ x, y })
      }
    }

    return Promise.all(
      coords.map(async ({ x, y }) => ({ ...(await this.get(x, y)), x, y }))
    )
  }

  // Read: scan a rectangle and return only unowned (capturable) tiles.
  // Useful for "show me everything I can capture in this area" UIs.
  async findCapturable(x1: number, y1: number, x2: number, y2: number): Promise<RegionTile[]> {
    const region = await this.getRegion(x1, y1, x2, y2)
    return region.filter((tile) => !tile.isOwned)
  }

  // Read: fetch the (up to 4) tiles directly adjacent to (x, y).
  // Out-of-bounds neighbors (map edges) are silently omitted rather than
  // throwing, so callers never need to special-case corner/edge tiles.
  async getNeighbors(x: number, y: number): Promise<RegionTile[]> {
    this.validateCoords(x, y)
    const candidates = [
      { x, y: y - 1 },
      { x, y: y + 1 },
      { x: x - 1, y },
      { x: x + 1, y },
    ]
    const valid = candidates.filter(
      (c) => c.x >= 0 && c.y >= 0 && c.x < MAP_SIZE && c.y < MAP_SIZE
    )
    return this.getMany(valid)
  }

  // Read: fetch an arbitrary list of tiles (not necessarily a rectangle).
  // Each result carries its (x, y). Use this over `getRegion` when you
  // already know exactly which tiles you need, to avoid over-fetching.
  async getMany(coords: { x: number; y: number }[]): Promise<RegionTile[]> {
    coords.forEach(({ x, y }) => this.validateCoords(x, y))
    return Promise.all(
      coords.map(async ({ x, y }) => ({ ...(await this.get(x, y)), x, y }))
    )
  }

  // Read: get tile owner address
  async getOwner(x: number, y: number): Promise<string> {
    const tile = await this.get(x, y)
    return tile.owner
  }

  // Read: check if tile is owned
  async isOwned(x: number, y: number): Promise<boolean> {
    const tile = await this.get(x, y)
    return tile.isOwned
  }

  // Read: a tile can be captured only if it is currently unowned.
  async canCapture(x: number, y: number): Promise<boolean> {
    const tile = await this.get(x, y)
    return !tile.isOwned
  }

  // Read: a tile can be attacked if it is owned by someone else.
  // Pass `self` (your address) to exclude tiles you already own.
  async canAttack(x: number, y: number, self?: string): Promise<boolean> {
    const tile = await this.get(x, y)
    if (!tile.isOwned) return false
    return self ? tile.owner !== self : true
  }

  // Write: capture an unowned tile
  async capture(x: number, y: number): Promise<TxResult> {
    this.validateCoords(x, y)
    return this.write.call(
      this.contractAddress,
      this.registryName,
      'capture-tile',
      [uintCV(x), uintCV(y)]
    )
  }

  // Write: attack enemy tile
  async attack(x: number, y: number): Promise<TxResult> {
    this.validateCoords(x, y)
    const engineName = this.registryName.replace('tile-registry', 'game-engine')
    return this.write.call(
      this.contractAddress,
      engineName,
      'attack-tile',
      [uintCV(x), uintCV(y)]
    )
  }

  // Write: harvest resources from owned tile
  async harvest(x: number, y: number): Promise<TxResult> {
    this.validateCoords(x, y)
    const engineName = this.registryName.replace('tile-registry', 'game-engine')
    return this.write.call(
      this.contractAddress,
      engineName,
      'harvest-resource',
      [uintCV(x), uintCV(y)]
    )
  }

  // Write: upgrade owned tile
  async upgrade(x: number, y: number): Promise<TxResult> {
    this.validateCoords(x, y)
    const engineName = this.registryName.replace('tile-registry', 'game-engine')
    return this.write.call(
      this.contractAddress,
      engineName,
      'upgrade-tile',
      [uintCV(x), uintCV(y)]
    )
  }

  // Calculate costs
  // For symmetry with calculateAttackCost/calculateUpgradeCost — capturing an
  // unowned tile is a flat cost, but this saves consumers from importing
  // CAPTURE_COST_MICROSTX separately.
  calculateCaptureCost(): bigint {
    return CAPTURE_COST_MICROSTX
  }

  calculateAttackCost(level: number): bigint {
    return CAPTURE_COST_MICROSTX * BigInt(level)
  }

  calculateUpgradeCost(level: number): bigint {
    return CAPTURE_COST_MICROSTX * BigInt(level) * 2n
  }

  calculateHarvestAmount(level: number, elapsedBlocks: number): bigint {
    const periods = Math.floor(elapsedBlocks / 10)
    return BigInt(periods * level * 10)
  }

  private validateCoords(x: number, y: number) {
    if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) {
      throw new GridWarError(
        GridWarErrorCode.INVALID_COORDINATES,
        `Coordinates (${x}, ${y}) are out of bounds. Max is ${MAP_SIZE - 1}.`
      )
    }
  }

  private parseTile(raw: any): Tile {
    if (!raw) {
      return {
        owner: '',
        level: 0,
        resources: 0n,
        lastHarvest: 0,
        capturedAt: 0,
        isOwned: false,
      }
    }
    const owner = raw?.owner ?? ''
    return {
      owner,
      level: Number(raw?.level ?? 0),
      resources: BigInt(raw?.resources ?? 0),
      lastHarvest: Number(raw?.['last-harvest'] ?? 0),
      capturedAt: Number(raw?.['captured-at'] ?? 0),
      isOwned: owner !== '' && owner !== 'none',
    }
  }
}
