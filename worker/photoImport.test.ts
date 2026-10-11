import { describe, expect, it } from 'vitest';
import { importPhoto } from './photoImport';
import { HttpError } from './http';

const post = (body: unknown) =>
  new Request('https://minkokbok.se/api/import/photo', { method: 'POST', body: JSON.stringify(body) });

async function status(promise: Promise<Response>): Promise<number> {
  try {
    return (await promise).status;
  } catch (error) {
    return error instanceof HttpError ? error.status : -1;
  }
}

describe('importPhoto', () => {
  const env = { ANTHROPIC_API_KEY: 'test' };

  it('svarar 503 utan API-nyckel', async () => {
    expect(await status(importPhoto(post({ images: [] }), {}))).toBe(503);
  });

  it('nekar felaktiga bilder innan Claude anropas', async () => {
    expect(await status(importPhoto(post({}), env))).toBe(400);
    expect(await status(importPhoto(post({ images: [] }), env))).toBe(400);
    const image = { mediaType: 'image/jpeg', data: 'abc' };
    expect(await status(importPhoto(post({ images: Array(6).fill(image) }), env))).toBe(400);
    expect(await status(importPhoto(post({ images: [{ mediaType: 'image/svg+xml', data: 'abc' }] }), env))).toBe(400);
    expect(await status(importPhoto(post({ images: [{ ...image, data: 'a'.repeat(6_000_000) }] }), env))).toBe(413);
  });
});
