# @blockrealm/stacks-sdk

> Build on-chain territory games on Stacks (Bitcoin L2)

A TypeScript SDK for building **GridWar**-style on-chain territory war games on the
Stacks blockchain. Capture tiles, attack rivals, harvest resources, upgrade your
territory, and compete on an epoch-based leaderboard — all backed by Clarity smart
contracts.

## Install

```bash
npm install @blockrealm/stacks-sdk
```

Peer dependency: `@stacks/connect` (`>=7.0.0`) for wallet transactions.

## Quick Start

```ts
import { GridWarSDK } from '@blockrealm/stacks-sdk'

const sdk = new GridWarSDK({
  network: 'testnet',
  contractAddress: 'ST1ABC...XYZ', // your deployer address
  // optional overrides:
  // tileRegistryName: 'tile-registry',
  // gameEngineName: 'game-engine',
})

// --- Reads (no wallet needed) ---
const tile = await sdk.tiles.get(5, 10)
console.log(tile.owner, tile.level, tile.resources, tile.isOwned)

// Batch-read a viewport for rendering the board:
const region = await sdk.tiles.getRegion(0, 0, 9, 9) // 10x10, each tile has x/y
region.forEach((t) => console.log(t.x, t.y, t.isOwned))

const stats = await sdk.player.getStats('ST2PLAYER...')
console.log(stats.tileCount, stats.totalResources)

// --- Writes (opens the connected wallet) ---
const cap = await sdk.tiles.capture(5, 10)
console.log('Captured! Track:', cap.explorerUrl)

await sdk.tiles.attack(3, 7)
await sdk.leaderboard.register()

// --- Events ---
const unsubscribe = sdk.on('tile:captured', (e) => {
  console.log(`Tile ${e.tileId} captured by ${e.owner} at (${e.x}, ${e.y})`)
})
// later: unsubscribe()
```

## API Reference

### `sdk.tiles`

| Method | Returns | Description |
| --- | --- | --- |
| `get(x, y)` | `Promise<Tile>` | Full tile data at `(x, y)` |
| `getRegion(x1, y1, x2, y2)` | `Promise<RegionTile[]>` | Every tile in the rectangle, each tagged with `x`/`y` |
| `getOwner(x, y)` | `Promise<string>` | Owner principal (`''` if unowned) |
| `isOwned(x, y)` | `Promise<boolean>` | Whether the tile is owned |
| `canCapture(x, y)` | `Promise<boolean>` | Whether the tile is capturable (unowned) |
| `canAttack(x, y, self?)` | `Promise<boolean>` | Whether the tile is attackable (owned by another); pass `self` to exclude your own |
| `capture(x, y)` | `Promise<TxResult>` | Capture an unowned tile |
| `attack(x, y)` | `Promise<TxResult>` | Attack an enemy tile |
| `harvest(x, y)` | `Promise<TxResult>` | Harvest resources from your tile |
| `upgrade(x, y)` | `Promise<TxResult>` | Upgrade your tile (max level 5) |
| `calculateAttackCost(level)` | `bigint` | Attack cost in microSTX |
| `calculateUpgradeCost(level)` | `bigint` | Upgrade cost in microSTX |
| `calculateHarvestAmount(level, blocks)` | `bigint` | Harvestable amount for elapsed blocks |

### `sdk.player`

| Method | Returns | Description |
| --- | --- | --- |
| `getStats(address)` | `Promise<PlayerStats>` | Tile count + total resources |
| `getTileCount(address)` | `Promise<number>` | Number of tiles owned |
| `getTotalResources(address)` | `Promise<bigint>` | Total resources harvested |
| `getScore(address)` | `Promise<number>` | Fetch stats + compute score in one call |
| `calculateScore(stats)` | `number` | `tileCount * 100 + resources` |

### `sdk.leaderboard`

| Method | Returns | Description |
| --- | --- | --- |
| `register()` | `Promise<TxResult>` | Register the connected wallet |
| `submitScore()` | `Promise<TxResult>` | Submit score for the active epoch |
| `endEpoch(first, second, third)` | `Promise<TxResult>` | End epoch with top 3 (anyone, after it ends) |
| `fundRewards(amount)` | `Promise<TxResult>` | Add microSTX to the reward pool |
| `getCurrentEpoch()` | `Promise<number>` | Current epoch number |
| `getEpochWinner(epoch)` | `Promise<EpochWinner \| null>` | Winners of a past epoch |
| `getPlayerScore(address, epoch)` | `Promise<PlayerEpochScore \| null>` | A player's score for an epoch |
| `getEpochBlocksRemaining()` | `Promise<number>` | Blocks left until the epoch ends |
| `isRegistered(address)` | `Promise<boolean>` | Whether an address is registered |

### Events

```ts
sdk.on(type, handler) // returns an unsubscribe function
sdk.emit(event)
sdk.off(type)
```

Event types: `tile:captured`, `tile:attacked`, `tile:harvested`, `tile:upgraded`,
`player:registered`, `score:submitted`, `epoch:ended`.

## Error Handling

All failures throw a typed `GridWarError` with a `code` from `GridWarErrorCode`.
Contract revert codes (`u100`–`u207`) are mapped automatically.

```ts
import { GridWarError, GridWarErrorCode } from '@blockrealm/stacks-sdk'

try {
  await sdk.tiles.capture(5, 10)
} catch (err) {
  if (err instanceof GridWarError) {
    switch (err.code) {
      case GridWarErrorCode.TILE_ALREADY_OWNED:
        console.warn('That tile is already taken.')
        break
      case GridWarErrorCode.USER_CANCELLED:
        console.warn('You cancelled the transaction.')
        break
      default:
        console.error(err.code, err.message, err.contractErrorCode)
    }
  }
}
```

## Deploy Your Own Contracts

The SDK talks to two Clarity contracts: `tile-registry` (core data + leaderboard)
and `game-engine` (attack / harvest / upgrade). Deploy your own with
[Clarinet](https://docs.hiro.so/stacks/clarinet):

```bash
# scaffold + add tile-registry.clar and game-engine.clar
clarinet check

# testnet
clarinet deployments generate --testnet --medium-cost
clarinet deployments apply --testnet

# after deploy, authorize the engine to write tile state:
#   tile-registry.authorize-contract(<deployer>.game-engine)
```

Then point the SDK at your deployer address:

```ts
const sdk = new GridWarSDK({ network: 'testnet', contractAddress: 'ST_YOUR_DEPLOYER' })
```

If you use custom contract names, pass `tileRegistryName` / `gameEngineName`.

## License

MIT
