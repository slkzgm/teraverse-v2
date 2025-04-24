// path: src/utils/silentLogger.ts
import { CustomLogger } from '@slkzgm/gigaverse-engine' // or wherever CustomLogger is

export const silentLogger: CustomLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
}
