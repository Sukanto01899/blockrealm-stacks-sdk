export enum GridWarErrorCode {
  // Tile errors (mirrors contract u100-u107)
  OUT_OF_BOUNDS = 'OUT_OF_BOUNDS',
  TILE_ALREADY_OWNED = 'TILE_ALREADY_OWNED',
  NOT_TILE_OWNER = 'NOT_TILE_OWNER',
  UNAUTHORIZED = 'UNAUTHORIZED',
  TILE_NOT_OWNED = 'TILE_NOT_OWNED',
  EPOCH_NOT_ENDED = 'EPOCH_NOT_ENDED',
  ALREADY_REGISTERED = 'ALREADY_REGISTERED',
  NOT_REGISTERED = 'NOT_REGISTERED',

  // Game engine errors (mirrors contract u200-u207)
  SELF_ATTACK = 'SELF_ATTACK',
  INSUFFICIENT_ATTACK_FUNDS = 'INSUFFICIENT_ATTACK_FUNDS',
  TOO_EARLY_TO_HARVEST = 'TOO_EARLY_TO_HARVEST',
  MAX_LEVEL_REACHED = 'MAX_LEVEL_REACHED',
  INSUFFICIENT_UPGRADE_FUNDS = 'INSUFFICIENT_UPGRADE_FUNDS',

  // SDK errors
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  INVALID_COORDINATES = 'INVALID_COORDINATES',
  CONTRACT_CALL_FAILED = 'CONTRACT_CALL_FAILED',
  USER_CANCELLED = 'USER_CANCELLED',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

// Map contract error codes (uint) to GridWarErrorCode
export const CONTRACT_ERROR_MAP: Record<number, GridWarErrorCode> = {
  100: GridWarErrorCode.OUT_OF_BOUNDS,
  101: GridWarErrorCode.TILE_ALREADY_OWNED,
  102: GridWarErrorCode.NOT_TILE_OWNER,
  103: GridWarErrorCode.UNAUTHORIZED,
  104: GridWarErrorCode.TILE_NOT_OWNED,
  105: GridWarErrorCode.EPOCH_NOT_ENDED,
  106: GridWarErrorCode.ALREADY_REGISTERED,
  107: GridWarErrorCode.NOT_REGISTERED,
  200: GridWarErrorCode.SELF_ATTACK,
  201: GridWarErrorCode.SELF_ATTACK,
  202: GridWarErrorCode.INSUFFICIENT_ATTACK_FUNDS,
  204: GridWarErrorCode.NOT_TILE_OWNER,
  205: GridWarErrorCode.TOO_EARLY_TO_HARVEST,
  206: GridWarErrorCode.MAX_LEVEL_REACHED,
  207: GridWarErrorCode.INSUFFICIENT_UPGRADE_FUNDS,
}

export class GridWarError extends Error {
  constructor(
    public code: GridWarErrorCode,
    message: string,
    public contractErrorCode?: number
  ) {
    super(message)
    this.name = 'GridWarError'
  }

  static fromContractCode(code: number): GridWarError {
    const errorCode = CONTRACT_ERROR_MAP[code] ?? GridWarErrorCode.CONTRACT_CALL_FAILED
    return new GridWarError(errorCode, `Contract error: ${errorCode}`, code)
  }
}
