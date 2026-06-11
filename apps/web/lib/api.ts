import { SalinApiClient } from "@salin/shared";

const publicBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const internalBaseUrl =
  process.env.SALIN_API_INTERNAL_BASE_URL ?? publicBaseUrl;

export function createBrowserClient() {
  return new SalinApiClient(publicBaseUrl);
}

export function createServerClient() {
  return new SalinApiClient(internalBaseUrl);
}
