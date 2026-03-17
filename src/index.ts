export { login, logout, setupAuth } from './auth'
export type { AuthConfig, LoginResponse } from './auth'

export { fetchAllPages } from './pagination'
export type { PageData } from './pagination'

export { client } from './generated/client.gen'
export type { CreateClientConfig } from './generated/client.gen'
export type { AttributeEntry } from './generated/types.gen'
export * from './generated/index'
export * from './generated/zod.gen'

// Install auth interceptor on the default client at import time
import { setupAuth } from './auth'
import { client } from './generated/client.gen'
setupAuth(client)
