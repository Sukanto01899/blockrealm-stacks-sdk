# Changelog

## [Unreleased]

- Event system: `sdk.once()` — auto-unsubscribing one-shot listener
- `sdk.tiles.getMany(coords)` — batch-fetch an arbitrary list of tiles
- `sdk.waitForTx(txId)` — poll the Stacks API until a tx confirms or times out
- `sdk.player.getManyStats(addresses)` — batch-fetch stats for multiple players

## [0.1.0] - Initial Release

- TileModule: capture, attack, harvest, upgrade
- PlayerModule: stats, score calculation
- LeaderboardModule: epoch system, rewards
- Event system: `sdk.on()` / `sdk.emit()`
- GridWarError with typed error codes
