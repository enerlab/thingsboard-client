export { login, logout, setupAuth } from './auth'
export type { AuthConfig, LoginResponse } from './auth'

export { fetchAllPages } from './pagination'
export type { PageData } from './pagination'

export { client } from './generated/client.gen'
export type { CreateClientConfig } from './generated/client.gen'
export type { AttributeEntry } from './generated/types.gen'
// The Zod schemas are reached through the `./zod` subpath only: their declarations are the largest
// file the package ships, and re-exported here every consumer's typecheck would parse them.
export * from './generated/index'

// Install auth interceptor on the default client at import time
import { setupAuth } from './auth'
import { client } from './generated/client.gen'
setupAuth(client)
