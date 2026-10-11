import { describe, expect, it } from 'vitest';
import { photoRecipeToDraft } from './importPhoto';
import type { PhotoRecipe } from '../../worker/photoRecipe';

const base: PhotoRecipe = {
  found: true,
  source: 'handwritten',
  translatedFrom: null,
  title: ' Mormors kladdkaka ',
  description: null,
  author: 'Mormor',
  servings: 8,
  prepMinutes: null,
  cookMinutes: 0,
  ingredients: [
    { group: null, amount: '2', unit: 'st', name: 'ägg', note: null },
    { group: 'Glasyr', amount: '1 ½', unit: 'dl', name: 'florsocker', note: 'siktat' },
    { group: null, amount: null, unit: null, name: ' ', note: null },
  ],
  steps: ['Sätt ugnen på 175°.', ' ', 'Grädda 25 min.'],
  tags: ['#Bakning', 'bakning', 'choklad'],
  uncertain: ['175° (kan vara 165°)'],
};

describe('photoRecipeToDraft', () => {
  it('gör om Claudes svar till ett utkast', () => {
    expect(photoRecipeToDraft(base)).toEqual({
      title: 'Mormors kladdkaka',
      description: 'Recept från Mormor\n\nSvårläst, kontrollera: 175° (kan vara 165°)',
      servings: 8,
      prepMinutes: undefined,
      cookMinutes: undefined,
      ingredients: [
        { amount: '2', unit: 'st', name: 'ägg' },
        { amount: '1 ½', unit: 'dl', name: 'florsocker', note: 'siktat', group: 'Glasyr' },
      ],
      steps: [{ text: 'Sätt ugnen på 175°.' }, { text: 'Grädda 25 min.' }],
      tags: ['bakning', 'choklad'],
      source: { kind: 'image' },
    });
  });

  it('noterar när receptet är översatt', () => {
    const draft = photoRecipeToDraft({ ...base, author: null, uncertain: [], translatedFrom: 'engelska' });
    expect(draft.description).toBe('Översatt från engelska.');
  });

  it('markerar Instagram som källa', () => {
    expect(photoRecipeToDraft({ ...base, source: 'instagram' }).source).toEqual({ kind: 'instagram' });
  });

  it('ger fel när bilderna saknar recept eller titel', () => {
    expect(() => photoRecipeToDraft({ ...base, found: false })).toThrow('no-recipe');
    expect(() => photoRecipeToDraft({ ...base, title: '' })).toThrow('missing-title');
  });
});
