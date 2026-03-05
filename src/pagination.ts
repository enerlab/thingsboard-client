export interface PageData<T> {
  data?: T[]
  hasNext?: boolean
  totalPages?: number
  totalElements?: number
}

/**
 * Extracts the item type from a union that contains a PageData member.
 * Given `Device | PageDataDevice`, this resolves to `Device` (the array element type).
 */
type ExtractPageItem<U> = U extends { data?: (infer T)[] } ? T : never

function isPageData(value: unknown): value is PageData<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    Array.isArray((value as Record<string, unknown>).data)
  )
}

export async function fetchAllPages<D>(
  fetchPage: (page: number) => Promise<{ data?: D; [key: string]: unknown }>,
): Promise<ExtractPageItem<NonNullable<D>>[]> {
  const all: ExtractPageItem<NonNullable<D>>[] = []
  let page = 0
  let hasNext = true

  while (hasNext) {
    const result = await fetchPage(page)
    const responseData = result.data
    if (isPageData(responseData)) {
      const items = responseData.data as ExtractPageItem<NonNullable<D>>[]
      if (items) {
        all.push(...items)
      }
      hasNext = responseData.hasNext ?? false
    } else {
      hasNext = false
    }
    page++
  }

  return all
}
