import createClient from 'openapi-fetch';
import type { paths } from '../../types/openapi';

/**
 * Returns a type-safe OpenAPI client for the FreestyleFiend backend API.
 * Usage:
 *   const api = getApiClient();
 *   const { data, error } = await api.GET('/beats');
 *
 * All endpoints and payloads are fully typed from openapi.yaml.
 * See: /types/openapi.d.ts
 */
export function getApiClient(baseUrl: string = 'https://yq51xd1d5a.execute-api.us-east-1.amazonaws.com/prod') {
  return createClient<paths>({ baseUrl });
}

// Example usage (uncomment to use):
// const api = getApiClient();
// api.GET('/beats').then(({ data, error }) => {
//   if (error) { console.error(error); return; }
//   console.log(data);
// });
