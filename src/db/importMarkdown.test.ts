import { describe, expect, it } from 'vitest';
import { parseMarkdownRecipe } from './importMarkdown';

const silltarta = `---
title: 'Silltårta'
image:
  url: '/assets/blog/silltarta.jpg'
  width: 1200,
excerpt: 'Görs gärna en dag i förväg.'
tags: recept,sill
lang: sv
---

Bör räcka till ca 8-10 personer.

## Ingredienser

#### Botten

|       |                |
| ----- | -------------- |
| 200 g | Kavring (mörk) |

#### Fyllning

|                     |                 |
| ------------------- | --------------- |
| 2 burkar (ca 200 g) | Matjesillfileér |
|                     | Svartpeppar     |

## Steg

1. Finhacka **kavringen**.

2. Häll i en form
   med löstagbar kant.

<br />

_Recept från Pia_

https://example.com/silltarta
`;

describe('parseMarkdownRecipe', () => {
  it('läser titel, beskrivning, taggar, portioner och källa', () => {
    const recipe = parseMarkdownRecipe(silltarta);
    expect(recipe.title).toBe('Silltårta');
    expect(recipe.description).toBe('Bör räcka till ca 8-10 personer.\n\nRecept från Pia');
    expect(recipe.servings).toBe(8);
    expect(recipe.tags).toEqual(['sill']);
    expect(recipe.source).toEqual({ kind: 'url', url: 'https://example.com/silltarta' });
  });

  it('läser ingredienstabeller med grupper', () => {
    expect(parseMarkdownRecipe(silltarta).ingredients).toEqual([
      { amount: '200', unit: 'g', name: 'Kavring (mörk)', group: 'Botten' },
      { amount: '2', unit: 'burkar (ca 200 g)', name: 'Matjesillfileér', group: 'Fyllning' },
      { name: 'Svartpeppar', group: 'Fyllning' },
    ]);
  });

  it('läser numrerade steg utan markdown-formatering', () => {
    expect(parseMarkdownRecipe(silltarta).steps).toEqual([
      { text: 'Finhacka kavringen.' },
      { text: 'Häll i en form med löstagbar kant.' },
    ]);
  });

  it('klarar omvända kolumner, rader med en cell och html-entiteter', () => {
    const recipe = parseMarkdownRecipe(`---
title: 'Pasta med portabello&shy;svamp'
---

## Ingredienser

| | |
| - | - |
| Gul lök | 1st |
| Salt och peppar | |
| Rapsolja |

## Steg

1. Koka.
`);
    expect(recipe.title).toBe('Pasta med portabellosvamp');
    expect(recipe.description).toBeUndefined();
    expect(recipe.source).toEqual({ kind: 'manual' });
    expect(recipe.ingredients).toEqual([
      { amount: '1', unit: 'st', name: 'Gul lök' },
      { name: 'Salt och peppar' },
      { name: 'Rapsolja' },
    ]);
  });

  it('använder excerpt när det saknas inledande text', () => {
    const recipe = parseMarkdownRecipe(`---\ntitle: Hummerpasta\nexcerpt: 'Räknat för 4 personer'\n---\n\n## Steg\n\n1. Koka.\n`);
    expect(recipe.description).toBe('Räknat för 4 personer');
    expect(recipe.servings).toBe(4);
  });

  it('avvisar filer som inte är recept', () => {
    expect(() => parseMarkdownRecipe(`---\ntitle: 'How to build a REPL'\n---\n\n## What is a REPL?\n\nText.`)).toThrow(
      'not-a-recipe',
    );
  });
});
