# @enerlab/thingsboard-client

Type-safe TypeScript client for the [ThingsBoard](https://thingsboard.io/) REST API with [Zod](https://zod.dev/) v4 runtime validation.

Generated from the official ThingsBoard OpenAPI 3.1 spec using [@hey-api/openapi-ts](https://heyapi.dev/).

## Features

- Full ThingsBoard REST API coverage, generated from a TB Professional Edition spec (PE is a superset of CE — CE-only consumers will see SDK functions for PE-only endpoints that 404 on their server)
- `login()` / `logout()` helpers (not in the OpenAPI spec, provided manually)
- TypeScript types for all endpoints, request bodies, and responses
- Zod schemas for runtime validation at API boundaries
- Native `fetch` — works in Node.js 20+, Bun, Deno, and browsers
- Tree-shakeable — import only the endpoints you use for minimal bundle size

## Versioning

The package version mirrors the targeted ThingsBoard server version, plus a prerelease tag that pins the exact upstream spec build:

```
MAJOR.MINOR.PATCH-<edition>.<build>.<client-revision>
```

- **`MAJOR.MINOR.PATCH`** matches the TB server version exactly (e.g. `4.3.1`).
- **`<edition>`** is the TB edition the spec was sourced from: `pe` or `ce`.
- **`<build>`** is TB's build counter — the trailing segment in TB's `info.version` (e.g. `4.3.1.1PE` → `1`).
- **`<client-revision>`** increments for client-only changes (codegen tweaks, patch-script updates, helper additions) against the same upstream spec build. Starts at `0` per new spec fetch.

Bare versions like `4.3.1` are **never published** — every release carries the full prerelease tag, so the upstream source is always visible. Consumers using `^4.3.1` will not pick up our prereleases by accident; pin explicitly, e.g.:

```jsonc
"@enerlab/thingsboard-client": "4.3.1-pe.1.0"
```

| Event | Version |
|---|---|
| First client built from TB `4.3.1.1PE` | `4.3.1-pe.1.0` |
| Client-only fix; same spec build | `4.3.1-pe.1.1` |
| Re-fetched against TB `4.3.1.2PE` | `4.3.1-pe.2.0` |
| TB ships 4.3.2 (build 0, PE) | `4.3.2-pe.0.0` |

### Supported TB versions / branch layout

`main` tracks the latest TB minor the package targets. When the package moves to a new TB minor, a `release/<MAJOR>.<MINOR>.x` branch is cut off `main` first; client-only fixes can then be backported onto that branch and published as new `-N` revisions for the older line. Currently only `main` exists — it targets TB 4.3.x.

## Installation

```bash
pnpm add @enerlab/thingsboard-client
```

## Quick Start

```ts
import { client, login, getDeviceByIdUsingGet } from '@enerlab/thingsboard-client'

// Configure the base URL
client.setConfig({
  baseUrl: 'https://your-thingsboard.com',
})

// Login — auto-stores the JWT token on the client
await login('tenant@thingsboard.org', 'tenant')

// Make type-safe API calls
const { data, error } = await getDeviceByIdUsingGet({
  path: { deviceId: 'your-device-id' },
})

if (error) {
  console.error('Failed to fetch device:', error)
} else {
  console.log('Device:', data.name)
}
```

### Using an Existing Token

If you already have a JWT (e.g. from a previous session), set it directly:

```ts
import { client, getDeviceByIdUsingGet } from '@enerlab/thingsboard-client'

client.setConfig({
  baseUrl: 'https://your-thingsboard.com',
  auth: 'eyJ...',
})

const { data } = await getDeviceByIdUsingGet({
  path: { deviceId: 'your-device-id' },
})
```

### Using a Separate Client Instance

For multiple ThingsBoard instances or isolated auth contexts, create a dedicated client:

```ts
import { createClient, createConfig, login, getDeviceByIdUsingGet } from '@enerlab/thingsboard-client'

const myClient = createClient(createConfig({
  baseUrl: 'https://other-thingsboard.com',
}))

await login('admin@thingsboard.org', 'admin', { client: myClient })

const { data } = await getDeviceByIdUsingGet({
  path: { deviceId: 'device-id' },
  client: myClient,
})
```

## Tree-Shaking

All SDK functions are exported as standalone, tree-shakeable functions. Your bundler will only include the endpoints you actually import, keeping your bundle small — especially important for frontend and mobile apps.

```ts
// Only getDeviceByIdUsingGet and its Zod validator end up in your bundle
import { getDeviceByIdUsingGet } from '@enerlab/thingsboard-client'
```

## Zod Schemas

Import Zod schemas for runtime validation:

```ts
import { zDevice } from '@enerlab/thingsboard-client/zod'

// Validate external data
const result = zDevice.safeParse(unknownData)
if (result.success) {
  console.log('Valid device:', result.data.name)
}
```

## Development

### Prerequisites

- Node.js 20+
- pnpm 8+

### Setup

```bash
# Install dependencies
pnpm install

# Download the ThingsBoard OpenAPI spec
# Default URL is https://demo.thingsboard.io (Community Edition).
# Override with THINGSBOARD_SPEC_URL to target a PE instance or a specific TB version.
pnpm fetch-spec

# Generate the TypeScript client
pnpm generate

# Type-check
pnpm typecheck

# Run tests
pnpm test

# Lint
pnpm lint

# Build
pnpm build
```

### Updating the Spec

To update to a newer ThingsBoard API version:

```bash
# From demo.thingsboard.io (latest Community Edition)
pnpm fetch-spec

# Or from your own instance
THINGSBOARD_SPEC_URL=https://my-tb.example.com/v3/api-docs?group=thingsboard pnpm fetch-spec

# Regenerate the client
pnpm generate
```

### Project Structure

```
thingsboard-client/
├── src/
│   ├── index.ts              # Package entry — re-exports everything
│   ├── auth.ts               # login() / logout() helpers
│   └── generated/            # Auto-generated by @hey-api/openapi-ts (gitignored)
│       ├── client.gen.ts     # Fetch client instance
│       ├── sdk.gen.ts        # SDK functions for every endpoint
│       ├── types.gen.ts      # TypeScript types
│       └── zod.gen.ts        # Zod schemas
├── tests/
│   ├── auth.test.ts          # login/logout tests
│   └── zod-contracts.test.ts # Zod schema contract tests
├── spec/
│   └── thingsboard-openapi.json  # Downloaded OpenAPI spec (committed)
├── scripts/
│   └── fetch-spec.ts         # Script to download the spec
├── vitest.config.ts
├── openapi-ts.config.ts      # @hey-api/openapi-ts configuration
├── tsconfig.json
└── package.json
```

## ThingsBoard API Reference

The full API documentation is available at:

- [ThingsBoard REST API Docs](https://thingsboard.io/docs/reference/rest-api/)
- [Interactive Swagger UI](https://demo.thingsboard.io/swagger-ui/index.html) (demo instance)

## License

MIT
