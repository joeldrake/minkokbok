export interface Ingredient {
  amount?: string;
  unit?: string;
  name: string;
  note?: string;
  /** Rubrik att gruppera under, t.ex. "Sås" */
  group?: string;
}

export interface Step {
  text: string;
}

export type RecipeSourceKind = 'manual' | 'url' | 'image' | 'instagram';

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  ingredients: Ingredient[];
  steps: Step[];
  tags: string[];
  source?: { kind: RecipeSourceKind; url?: string };
  createdAt: number;
  updatedAt: number;
}

/** Publik profil. Ligger i den publika realmen och visas på /[username]. */
export interface Profile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
}
