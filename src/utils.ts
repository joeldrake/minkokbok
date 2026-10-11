/** Läser värdet från en Web Awesome-formulärkontroll i en input-händelse. */
export function inputValue(event: Event): string {
  return (event.target as HTMLInputElement).value;
}

export function totalMinutes(recipe: { prepMinutes?: number; cookMinutes?: number }): number {
  return (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
}
