import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DEFAULT_URL = 'https://demo.thingsboard.io/v3/api-docs?group=thingsboard'

async function fetchSpec() {
  const url = process.env.THINGSBOARD_SPEC_URL ?? DEFAULT_URL

  console.log(`Fetching ThingsBoard OpenAPI spec from: ${url}`)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch spec: ${response.status} ${response.statusText}`)
  }

  const spec = await response.text()
  const outputDir = resolve(import.meta.dirname, '..', 'spec')
  const outputPath = resolve(outputDir, 'thingsboard-openapi.json')

  mkdirSync(outputDir, { recursive: true })
  writeFileSync(outputPath, spec, 'utf8')

  console.log(`OpenAPI spec saved to: ${outputPath}`)

  const parsed = JSON.parse(spec)
  const { info } = parsed
  console.log(`API: ${info?.title ?? 'unknown'} v${info?.version ?? 'unknown'}`)
}

fetchSpec().catch((error: unknown) => {
  console.error('Error fetching spec:', error)
  process.exit(1)
})
