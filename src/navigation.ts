import { shallowRef } from 'vue';
import type { RouteLocationNormalized, Router, RouterScrollBehavior } from 'vue-router';

/** Sidor med receptkort som man kan klicka sig in på ett recept ifrån. */
const ORIGIN_ROUTES = ['list', 'public'];
/** Receptet och dess redigering: så länge man håller sig här minns vi varifrån man kom. */
const RECIPE_ROUTES = ['recipe', 'publicRecipe', 'edit'];

export interface RecipeOrigin {
  name: 'list' | 'public';
  fullPath: string;
  username?: string;
  scrollY: number;
}

/** Listan eller profilsidan man klickade in på receptet från, och hur långt ner man var. */
export const recipeOrigin = shallowRef<RecipeOrigin>();
/** Scrollposition att återställa vid nästa navigering, satt när man går tillbaka till ursprunget. */
let restoreScrollY: number | undefined;

function isRecipeRoute(route: RouteLocationNormalized) {
  return RECIPE_ROUTES.includes(route.name as string);
}

/** Glömmer varifrån man kom, t.ex. när man klickar på logotypen och ska börja om överst. */
export function forgetRecipeOrigin() {
  recipeOrigin.value = undefined;
}

export function trackRecipeOrigin(router: Router) {
  router.beforeEach((to, from) => {
    restoreScrollY = undefined;
    if (isRecipeRoute(to)) {
      // Före navigeringen, så scrollY fortfarande gäller sidan vi lämnar.
      if (ORIGIN_ROUTES.includes(from.name as string)) {
        recipeOrigin.value = {
          name: from.name as RecipeOrigin['name'],
          fullPath: from.fullPath,
          username: from.params.username as string | undefined,
          scrollY: window.scrollY,
        };
      }
      return;
    }
    if (recipeOrigin.value && isRecipeRoute(from) && to.fullPath === recipeOrigin.value.fullPath) {
      restoreScrollY = recipeOrigin.value.scrollY;
    }
    recipeOrigin.value = undefined;
  });
}

/**
 * Väntar tills sidan är tillräckligt hög för att kunna scrollas till `top`. Listorna laddas
 * asynkront, så direkt efter navigeringen visas bara en spinner och scrollen skulle klippas.
 */
function whenScrollable(top: number, timeout = 1500): Promise<void> {
  const start = performance.now();
  return new Promise((resolve) => {
    const check = () => {
      const fits = document.documentElement.scrollHeight - window.innerHeight >= top;
      if (fits || performance.now() - start > timeout) resolve();
      else requestAnimationFrame(check);
    };
    check();
  });
}

export const scrollBehavior: RouterScrollBehavior = async (to, _from, saved) => {
  if (isRecipeRoute(to)) return { top: 0, behavior: 'instant' };
  if (ORIGIN_ROUTES.includes(to.name as string)) {
    // Bara tillbaka från receptet man klickade in på; annars börjar listan överst.
    const top = restoreScrollY;
    if (top === undefined) return { top: 0, behavior: 'instant' };
    await whenScrollable(top);
    return { top, behavior: 'instant' };
  }
  return saved ?? { top: 0 };
};
