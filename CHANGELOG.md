# Changelog

Versions follow `MAJOR.MINOR.PATCH-<edition>.<build>.<client-revision>` (see README "Versioning").

## 4.3.1-pe.1.5

### Changed

- **The root entry no longer re-exports the Zod schemas.** `zod.gen.d.ts` is
  17.1 MB of the package's 18.8 MB of declarations, and the root's
  `export * from './generated/zod.gen'` made every importer's typecheck and
  type-aware lint parse it, even one importing only `login`: about 390 MB of
  memory per TypeScript program in the enerlab-hub monorepo. The SDK still
  validates requests and responses with the same schemas, so runtime behaviour
  is unchanged.

  **Breaking for anyone importing a `z…` schema from the package root.** Import
  it from `@enerlab/thingsboard-client/zod`, as the README already shows.

## 4.3.1-pe.1.4

### Fixed

- **Customer `email` response validation.** The spec marked `email` as `required`
  on the `Customer` schema, so the generated `zCustomer` emitted
  `email: z.string()` (required, non-nullable). ThingsBoard returns `email: null`
  for customers without one (e.g. site-customers), which made the
  `getCustomerById` response validator reject **every** such customer. `email` is
  now `z.string().nullable().optional()`. Fixed at the spec layer via
  `patchCustomerNullableEmail` in `scripts/patch-spec.ts` (drops `email` from
  `Customer`/`CustomerInfo` `required`); `title` stays required as TB always
  returns it. See thingsboard/thingsboard#15673.

  **Consumers must bump to `4.3.1-pe.1.4`** to pick up the fix (the enerlab-hub
  monorepo pins this package and needs a follow-up bump PR).
