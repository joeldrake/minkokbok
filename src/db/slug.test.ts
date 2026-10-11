import { describe, expect, it } from 'vitest';
import { slugify, uniqueSlug } from './slug';

describe('slugify', () => {
  it('gör om svenska tecken och mellanslag', () => {
    expect(slugify('Mormors äppelpaj')).toBe('mormors-appelpaj');
    expect(slugify('Ölbräserad högrev')).toBe('olbraserad-hogrev');
  });

  it('tar bort skiljetecken och bindestreck i kanterna', () => {
    expect(slugify('  Pasta (med lax!) & citron… ')).toBe('pasta-med-lax-citron');
  });

  it('ger en reservslug när inget finns kvar', () => {
    expect(slugify('🍝🍝')).toBe('recept');
  });

  it('kortar långa titlar utan att sluta på bindestreck', () => {
    const slug = slugify('a'.repeat(59) + ' bbb');
    expect(slug).toBe('a'.repeat(59));
  });
});

describe('uniqueSlug', () => {
  it('lägger till en siffra när slugen är upptagen', () => {
    expect(uniqueSlug('Kladdkaka', new Set())).toBe('kladdkaka');
    expect(uniqueSlug('Kladdkaka', new Set(['kladdkaka', 'kladdkaka-2']))).toBe('kladdkaka-3');
  });
});
