import { describe, expect, it } from 'vitest';
import { emojisInText, parseEmojis, suggestEmojis } from './emoji';

describe('emojisInText', () => {
  it('hittar ord i sammansättningar', () => {
    expect(emojisInText('kycklingfilé')).toEqual(['🍗']);
    expect(emojisInText('rödlök')).toEqual(['🧅']);
    expect(emojisInText('parmesanost')).toEqual(['🧀']);
  });

  it('väljer det längsta ordet', () => {
    expect(emojisInText('vitlöksklyftor')).toEqual(['🧄']);
    expect(emojisInText('ostron')).toEqual(['🦪']);
    expect(emojisInText('mjölk')).toEqual(['🥛']);
  });

  it('ignorerar basvaror', () => {
    expect(emojisInText('olivolja')).toEqual([]);
    expect(emojisInText('salt och peppar')).toEqual([]);
  });

  it('matchar inte korta ord mitt i andra ord', () => {
    expect(emojisInText('grissini')).toEqual([]);
  });
});

describe('suggestEmojis', () => {
  it('tar titeln först och tar bort dubbletter', () => {
    const suggestions = suggestEmojis({
      title: 'Pasta med lax',
      ingredients: [{ name: 'spaghetti' }, { name: 'laxfilé' }, { name: 'citron' }, { name: 'salt' }],
    });
    expect(suggestions).toEqual(['🍝', '🐟', '🍋']);
  });
});

describe('parseEmojis', () => {
  it('behåller sammansatta emojis och hoppar över text', () => {
    expect(parseEmojis('🍋 och 🌶️ 👩‍🍳!')).toEqual(['🍋', '🌶️', '👩‍🍳']);
  });

  it('begränsar antalet', () => {
    expect(parseEmojis('🍋'.repeat(20))).toHaveLength(8);
  });
});
