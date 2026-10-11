import { describe, expect, it } from 'vitest';
import { parseRecipeJsonLd } from './importJsonLd';
import { jsonLdScript, recipeJsonLd } from '../../worker/jsonLd';
import { jsonLdBlocks } from '../../worker/import';

const PAGE = 'https://example.com/recept/kottbullar';

const kottbullar = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: 'Exempelsajten' },
    {
      '@type': ['Recipe'],
      name: 'Mormors k&ouml;ttbullar',
      description: '<p>Klassiska k&ouml;ttbullar.</p>',
      author: [{ '@type': 'Person', name: 'Anna' }, 'Bo'],
      image: [{ '@type': 'ImageObject', url: '/bilder/kottbullar.jpg' }],
      recipeYield: ['4', '4 portioner'],
      prepTime: 'PT20M',
      cookTime: 'PT1H5M',
      recipeIngredient: ['500 g blandfärs', '1 st gul lök, finhackad', 'salt'],
      recipeInstructions: [
        {
          '@type': 'HowToSection',
          name: 'Smet',
          itemListElement: [
            { '@type': 'HowToStep', text: 'Blanda färsen&nbsp;med löken.' },
            { '@type': 'HowToStep', name: 'Rulla bullar' },
          ],
        },
        { '@type': 'HowToStep', text: 'Stek i smör.' },
      ],
      keywords: 'vardag, Kött',
      recipeCategory: 'Middag',
      recipeCuisine: ['Svensk'],
    },
  ],
});

describe('parseRecipeJsonLd', () => {
  it('läser receptet ur @graph', () => {
    const { draft, imageUrl } = parseRecipeJsonLd(['{"@type":"Organization"}', kottbullar], PAGE);
    expect(draft).toEqual({
      title: 'Mormors köttbullar',
      description: 'Klassiska köttbullar.\n\nRecept från Anna och Bo',
      servings: 4,
      prepMinutes: 20,
      cookMinutes: 65,
      ingredients: [
        { amount: '500', unit: 'g', name: 'blandfärs' },
        { amount: '1', unit: 'st', name: 'gul lök', note: 'finhackad' },
        { name: 'salt' },
      ],
      steps: [{ text: 'Blanda färsen med löken.' }, { text: 'Rulla bullar' }, { text: 'Stek i smör.' }],
      tags: ['vardag', 'kött', 'middag', 'svensk'],
      source: { kind: 'url', url: PAGE },
    });
    expect(imageUrl).toBe('https://example.com/bilder/kottbullar.jpg');
  });

  it('klarar instruktioner som text och totalTime utan andra tider', () => {
    const block = JSON.stringify({
      '@type': 'http://schema.org/Recipe',
      name: 'Gröt',
      totalTime: 'PT10M',
      recipeYield: 2,
      recipeInstructions: '1. Koka vatten.<br>2. Rör ner havregryn.',
      image: ' https://cdn.example.com/grot.jpg?w=800&amp;q=75',
    });
    const { draft, imageUrl } = parseRecipeJsonLd([block], PAGE);
    expect(draft.prepMinutes).toBeUndefined();
    expect(draft.cookMinutes).toBe(10);
    expect(draft.servings).toBe(2);
    expect(draft.steps).toEqual([{ text: 'Koka vatten.' }, { text: 'Rör ner havregryn.' }]);
    expect(imageUrl).toBe('https://cdn.example.com/grot.jpg?w=800&q=75');
  });

  it('tål råa radbrytningar i JSON-strängar', () => {
    const block = '{"@type":"Recipe","name":"Pannkakor","recipeIngredient":["3 dl mjölk\n"]}';
    expect(parseRecipeJsonLd([block], PAGE).draft.ingredients).toEqual([{ amount: '3', unit: 'dl', name: 'mjölk' }]);
  });

  it('ger fel när sidan saknar recept', () => {
    expect(() => parseRecipeJsonLd(['{"@type":"Article"}', 'inte json'], PAGE)).toThrow('no-recipe');
    expect(() => parseRecipeJsonLd([], PAGE)).toThrow('no-recipe');
  });

  it('ger fel när receptet saknar titel', () => {
    expect(() => parseRecipeJsonLd(['{"@type":"Recipe"}'], PAGE)).toThrow('missing-title');
  });

  it('läser det som Min Kokboks publika sidor publicerar', () => {
    const recipe = {
      title: 'Köttbullar & mos',
      description: 'Som hos mormor.',
      servings: 4,
      prepMinutes: 15,
      cookMinutes: 75,
      ingredients: [
        { amount: '500', unit: 'g', name: 'blandfärs' },
        { amount: '1', unit: 'st', name: 'gul lök', note: 'finhackad' },
        { name: 'salt' },
      ],
      steps: [{ text: 'Blanda <allt>.' }, { text: 'Stek.' }],
      tags: ['vardag', 'kött'],
      updatedAt: 0,
    };
    const url = 'https://minkokbok.se/anna/kottbullar-mos';
    const html = jsonLdScript(
      recipeJsonLd(recipe, {
        url,
        imageUrl: 'https://minkokbok.se/og/1.jpg',
        author: { name: 'Anna', url: 'https://minkokbok.se/anna' },
      }),
    );
    const { draft, imageUrl } = parseRecipeJsonLd(jsonLdBlocks(`<head>${html}</head>`), url);
    expect(draft).toEqual({
      title: recipe.title,
      description: 'Som hos mormor.\n\nRecept från Anna',
      servings: 4,
      prepMinutes: 15,
      cookMinutes: 75,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tags: recipe.tags,
      source: { kind: 'url', url },
    });
    expect(imageUrl).toBe('https://minkokbok.se/og/1.jpg');
  });
});
