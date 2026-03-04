import { describe, it, expect } from 'vitest'
import { fetchAllPages, type PageData } from '../src/pagination'

interface Device {
  id: string
  name: string
}

function mockFetchPage(pages: PageData<Device>[]) {
  return (page: number) =>
    Promise.resolve({ data: pages[page] as PageData<Device> | undefined })
}

describe('fetchAllPages', () => {
  it('collects items across multiple pages', async () => {
    const pages: PageData<Device>[] = [
      { data: [{ id: '1', name: 'A' }], hasNext: true },
      { data: [{ id: '2', name: 'B' }], hasNext: true },
      { data: [{ id: '3', name: 'C' }], hasNext: false },
    ]

    const result = await fetchAllPages(mockFetchPage(pages))

    expect(result).toEqual([
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
    ])
  })

  it('handles a single page', async () => {
    const pages: PageData<Device>[] = [
      { data: [{ id: '1', name: 'A' }], hasNext: false },
    ]

    const result = await fetchAllPages(mockFetchPage(pages))

    expect(result).toEqual([{ id: '1', name: 'A' }])
  })

  it('returns empty array for empty first page', async () => {
    const pages: PageData<Device>[] = [{ data: [], hasNext: false }]

    const result = await fetchAllPages(mockFetchPage(pages))

    expect(result).toEqual([])
  })

  it('returns empty array when data field is missing', async () => {
    const result = await fetchAllPages(
      () => Promise.resolve({ data: undefined }),
    )

    expect(result).toEqual([])
  })

  it('infers T from an SDK-shaped function without explicit generic', async () => {
    // Simulates an SDK endpoint like getTenantDevices
    const sdkCall = (_opts: { query: { page: number; pageSize: number } }) =>
      Promise.resolve({
        data: {
          data: [{ id: '1', name: 'Device1' }],
          hasNext: false,
          totalPages: 1,
          totalElements: 1,
        } as PageData<Device>,
      })

    // No explicit generic — T should be inferred as Device
    const devices = await fetchAllPages((page) =>
      sdkCall({ query: { page, pageSize: 100 } }),
    )

    expect(devices).toEqual([{ id: '1', name: 'Device1' }])
    // Type-level assertion: devices is Device[]
    const first: Device = devices[0]
    expect(first.name).toBe('Device1')
  })
})
