/**
 * Det Claude ska svara med när ett recept tolkas från bilder. Schemat skickas som structured
 * output, så svaret följer det alltid. Klienten importerar bara typen (src/db/importPhoto.ts).
 */

import { z } from 'zod';

export const PhotoRecipeSchema = z.object({
  found: z.boolean().describe('false om bilderna inte innehåller något recept'),
  source: z
    .enum(['instagram', 'handwritten', 'other'])
    .describe('instagram för skärmdumpar från Instagram, handwritten för handskrivna lappar'),
  translatedFrom: z
    .string()
    .nullable()
    .describe('Originalspråket på svenska, t.ex. "engelska", om receptet översattes. Annars null'),
  title: z.string(),
  description: z.string().nullable(),
  author: z.string().nullable().describe('Instagramkontot, eller namnet på lappen, t.ex. "Mormor"'),
  servings: z.number().int().nullable(),
  prepMinutes: z.number().int().nullable(),
  cookMinutes: z.number().int().nullable(),
  ingredients: z.array(
    z.object({
      group: z.string().nullable().describe('Rubrik som ingrediensen står under, t.ex. "Sås"'),
      amount: z.string().nullable(),
      unit: z.string().nullable(),
      name: z.string(),
      note: z.string().nullable().describe('T.ex. "finhackad"'),
    }),
  ),
  steps: z.array(z.string()),
  tags: z.array(z.string()),
  uncertain: z.array(z.string()).describe('Ord eller mängder som var svåra att läsa, med din bästa gissning'),
});

export type PhotoRecipe = z.infer<typeof PhotoRecipeSchema>;
