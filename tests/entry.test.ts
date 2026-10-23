import { describe, it, expect } from 'vitest'
import * as root from '@/index'
import * as schemas from '@/generated/zod.gen'

describe('package root', () => {
  it('leaves the Zod schemas to the ./zod subpath', () => {
    expect(Object.keys(root).filter((name) => name in schemas)).toEqual([])
  })

  it('still exports the SDK', () => {
    expect(typeof root.login).toBe('function')
    expect(typeof root.client).toBe('object')
  })
})
