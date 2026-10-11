import { describe, expect, it } from 'vitest';
import { jsonLdBlocks } from './import';

describe('jsonLdBlocks', () => {
  it('hittar JSON-LD-block, även med plustecknet som entitet', () => {
    const html = `<head>
      <script>var x = 1;</script>
      <script type="application/ld+json">{"@type":"WebSite"}</script>
      <script type='application/ld&#x2B;json' nonce="abc">
        {"@type":"Recipe"}
      </script>
      <script type="application/ld+json"></script>
    </head>`;
    expect(jsonLdBlocks(html)).toEqual(['{"@type":"WebSite"}', '{"@type":"Recipe"}']);
  });
});
