import { describe, expect, it } from 'vitest';
import { formatIngredients, parseIngredients, parseSteps } from './parse';

describe('parseIngredients', () => {
  it('delar upp mängd, enhet och namn', () => {
    expect(parseIngredients('2 dl mjölk')).toEqual([{ amount: '2', unit: 'dl', name: 'mjölk' }]);
  });

  it('hanterar bråk, anteckningar och grupper', () => {
    const parsed = parseIngredients('Sås:\n½ dl grädde\n1 st gul lök, finhackad\nsalt');
    expect(parsed).toEqual([
      { amount: '½', unit: 'dl', name: 'grädde', group: 'Sås' },
      { amount: '1', unit: 'st', name: 'gul lök', note: 'finhackad', group: 'Sås' },
      { name: 'salt', group: 'Sås' },
    ]);
  });

  it('går att formatera tillbaka till text', () => {
    const text = 'Sås:\n½ dl grädde\n1 st gul lök, finhackad';
    expect(formatIngredients(parseIngredients(text))).toBe(text);
  });
});

describe('parseSteps', () => {
  it('tar ett steg per rad och tar bort numrering', () => {
    expect(parseSteps('1. Hacka löken\n2) Stek')).toEqual([{ text: 'Hacka löken' }, { text: 'Stek' }]);
  });

  it('tar ett steg per stycke när det finns tomma rader', () => {
    expect(parseSteps('Hacka löken\nfint.\n\nStek')).toEqual([{ text: 'Hacka löken\nfint.' }, { text: 'Stek' }]);
  });
});
