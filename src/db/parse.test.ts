import { describe, expect, it } from 'vitest';
import { formatIngredients, formatShoppingList, parseIngredients, parseSteps } from './parse';

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

  it('räknar antal utan enhet', () => {
    expect(parseIngredients('2 vitlöksklyftor, pressade\n3 gula lökar')).toEqual([
      { amount: '2', name: 'vitlöksklyftor', note: 'pressade' },
      { amount: '3', name: 'gula lökar' },
    ]);
  });

  it('hanterar decimaler med punkt och komma', () => {
    expect(parseIngredients('2.5 dl mjölk\n2,5 dl grädde, vispad\n1 ½ msk smör')).toEqual([
      { amount: '2.5', unit: 'dl', name: 'mjölk' },
      { amount: '2,5', unit: 'dl', name: 'grädde', note: 'vispad' },
      { amount: '1 ½', unit: 'msk', name: 'smör' },
    ]);
  });

  it('går att formatera tillbaka till text', () => {
    const text = 'Sås:\n½ dl grädde\n2,5 dl mjölk\n1 st gul lök, finhackad\n2 vitlöksklyftor, pressade';
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

describe('formatShoppingList', () => {
  it('sätter namnet först och mängden inom parentes, utan grupper och anteckningar', () => {
    const ingredients = parseIngredients('Sås:\n½ dl grädde\n1 st gul lök, finhackad\n2 vitlöksklyftor\nsalt');
    expect(formatShoppingList(ingredients)).toBe('Grädde (½ dl)\nGul lök (1 st)\nVitlöksklyftor (2)\nSalt');
  });
});
