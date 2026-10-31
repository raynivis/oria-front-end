/**
 * Usado tanto por `cliente.ts` (server-only) quanto pelos Route Handlers de
 * autenticação e pelos mocks do MSW — por isso vive num módulo sem a guarda
 * `server-only`, livre para ser importado de qualquer contexto de servidor.
 */
export const API_BASE_URL = process.env.API_URL ?? 'http://localhost:3000/api/v1';
