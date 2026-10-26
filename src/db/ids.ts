/**
 * ID generation for new rows. Uses expo-crypto's randomUUID, which works on
 * Hermes out of the box (unlike the `uuid` npm package's v4(), which needs
 * `crypto.getRandomValues` and a polyfill loaded before any other import —
 * see ecomoney/index.js for a case where that bug shipped silently).
 */
import { randomUUID } from 'expo-crypto';

export function newId(): string {
  return randomUUID();
}
