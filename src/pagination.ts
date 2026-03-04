export interface PageData<T> {
  data?: T[]
  hasNext?: boolean
  totalPages?: number
  totalElements?: number
}

export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<{ data?: PageData<T> }>,
): Promise<T[]> {
  const all: T[] = []
  let page = 0
  let hasNext = true

  while (hasNext) {
    const result = await fetchPage(page)
    const pageData = result.data
    if (pageData?.data) {
      all.push(...pageData.data)
      hasNext = pageData.hasNext ?? false
    } else {
      hasNext = false
    }
    page++
  }

  return all
}
