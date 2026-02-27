import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: './spec/thingsboard-openapi.json',
  output: {
    path: 'src/generated',
  },
  plugins: [
    '@hey-api/client-fetch',
    {
      name: '@hey-api/typescript',
      enums: false,
      comments: true,
    },
    {
      name: '@hey-api/sdk',
      validator: 'zod',
    },
    {
      name: 'zod',
      definitions: true,
      responses: true,
    },
  ],
})
