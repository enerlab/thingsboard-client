// Compile-time only check — not a runtime test.
// Verifies fetchAllPages infers T correctly from SDK union types.
import type { Device, PageDataDevice } from '../src/generated/types.gen'
import { fetchAllPages } from '../src/pagination'

declare function getTenantDevices(opts: {
  query: { page: number; pageSize: number }
}): Promise<{
  data?: Device | PageDataDevice
  error: unknown
  request: Request
  response: Response
}>

async function _check() {
  const devices = await fetchAllPages((page) =>
    getTenantDevices({ query: { page, pageSize: 100 } })
  )
  // If T is inferred correctly, this assignment compiles
  const _: Device[] = devices
  void _
}

void _check
