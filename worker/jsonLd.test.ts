import { describe, expect, it } from 'vitest';
import { jsonLdScript, recipeJsonLd } from './jsonLd';

const context = {
  url: 'https://minkokbok.se/anna/kottbullar',
  imageUrl: 'https://minkokbok.se/og/abc.jpg?v=1',
  author: { name: 'Anna', url: 'https://minkokbok.se/anna' },
};

describe('recipeJsonLd', () => {
  it('beskriver receptet enligt schema.org', () => {
    const data = recipeJsonLd(
      {
        title: 'Köttbullar',
        servings: 4,
        prepMinutes: 15,
        cookMinutes: 60,
        ingredients: [{ amount: '1', unit: 'st', name: 'gul lök', note: 'finhackad' }, { name: 'salt' }],
        steps: [{ text: 'Blanda.' }],
        tags: ['vardag', 'kött'],
        createdAt: Date.UTC(2026, 0, 1),
        updatedAt: Date.UTC(2026, 0, 2),
      },
      context,
    );
    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      name: 'Köttbullar',
      url: context.url,
      mainEntityOfPage: context.url,
      inLanguage: 'sv',
      image: [context.imageUrl],
      author: { '@type': 'Person', name: 'Anna', url: 'https://minkokbok.se/anna' },
      datePublished: '2026-01-01T00:00:00.000Z',
      dateModified: '2026-01-02T00:00:00.000Z',
      recipeYield: '4',
      prepTime: 'PT15M',
      cookTime: 'PT1H',
      totalTime: 'PT1H15M',
      keywords: 'vardag, kött',
      recipeIngredient: ['1 st gul lök, finhackad', 'salt'],
      recipeInstructions: [{ '@type': 'HowToStep', text: 'Blanda.' }],
    });
  });

  it('utelämnar fält som saknas', () => {
    const data = recipeJsonLd({ title: 'Vatten', updatedAt: 0 }, { ...context, imageUrl: undefined });
    expect(Object.keys(data)).not.toContain('image');
    expect(Object.keys(data)).not.toContain('totalTime');
    expect(Object.keys(data)).not.toContain('recipeYield');
  });
});

describe('jsonLdScript', () => {
  it('kan inte brytas ut ur script-taggen', () => {
    const script = jsonLdScript({ name: '</script><script>alert(1)</script>' });
    expect(script.match(/<\/script>/g)).toHaveLength(1);
    expect(JSON.parse(script.replace(/^<script[^>]*>|<\/script>$/g, ''))).toEqual({
      name: '</script><script>alert(1)</script>',
    });
  });
});
