import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPosterBitmap } from './texture';

test('loadPosterBitmap rejects when imageUrl is empty', async () => {
  await assert.rejects(
    async () => {
      await loadPosterBitmap('');
    },
    { message: 'Image URL is empty' }
  );
});

test('loadPosterBitmap decodes off-thread with { premultiplyAlpha: "none" }', async () => {
  let passedOptions: ImageBitmapOptions | undefined;
  let fetchCalledWith: string | null = null;

  const originalFetch = globalThis.fetch;
  const originalCreateImageBitmap = globalThis.createImageBitmap;

  // Mock fetch & createImageBitmap to verify contract
  globalThis.fetch = (async (url: string) => {
    fetchCalledWith = url;
    return {
      ok: true,
      status: 200,
      blob: async () => new Blob(['fake_poster_binary'], { type: 'image/jpeg' }),
    } as any;
  }) as any;

  globalThis.createImageBitmap = (async (source: any, options?: ImageBitmapOptions) => {
    passedOptions = options;
    return {
      width: 500,
      height: 750,
      close: () => {},
    } as unknown as ImageBitmap;
  }) as any;

  try {
    const testUrl = 'https://image.tmdb.org/t/p/w500/poster_test.jpg';
    const bitmap = await loadPosterBitmap(testUrl);

    assert.equal(fetchCalledWith, testUrl, 'Direct fetch called with URL');
    assert.ok(passedOptions, 'createImageBitmap options passed');
    assert.equal(
      passedOptions?.premultiplyAlpha,
      'none',
      'createImageBitmap must use { premultiplyAlpha: "none" } to preserve poster quality'
    );
    assert.equal(bitmap.width, 500);
    assert.equal(bitmap.height, 750);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.createImageBitmap = originalCreateImageBitmap;
  }
});
