# Changelog

## [Unreleased]

- Event system: `sdk.once()` — auto-unsubscribing one-shot listener
- `sdk.tiles.getMany(coords)` — batch-fetch an arbitrary list of tiles
- `sdk.waitForTx(txId)` — poll the Stacks API until a tx confirms or times out
- `sdk.player.getManyStats(addresses)` — batch-fetch stats for multiple players
- `sdk.tiles.calculateCaptureCost()` — for symmetry with calculateAttackCost/calculateUpgradeCost
- `GridWarSDK.testnet(contractAddress)` / `GridWarSDK.mainnet(contractAddress)` — static factory shortcuts
- `GridWarSDK.isTxFinal(status)` — static helper for checking a raw tx_status outside of waitForTx
- `sdk.tiles.getNeighbors(x, y)` — fetch up to 4 adjacent tiles; map edges silently omitted

## [0.1.0] - Initial Release

- TileModule: capture, attack, harvest, upgrade
- PlayerModule: stats, score calculation
- LeaderboardModule: epoch system, rewards
- Event system: `sdk.on()` / `sdk.emit()`
- GridWarError with typed error codes
