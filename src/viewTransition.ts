import type { RouteLocationNormalized, Router } from 'vue-router';
import { ORIGIN_ROUTES, whenScrolled } from './navigation';

/**
 * Omslag och titel glider mellan receptkortet och receptsidan, åt båda hållen.
 *
 * Namnen (view-transition-name) sätts bara under övergången och bara på ett kort, så att
 * samma recept i två listor på sidan inte krockar. Elementen märks i stället med
 * data-vt-recipe (kortet eller receptets ark) och data-vt="paper"/"cover"/"title"/"description".
 * Receptsidan har också "byline" och "actions", som saknas på kortet och därför bara tonas in eller ut.
 * Pappret kan vara det märkta elementet självt.
 */

const RECIPE_PAGES = ['recipe', 'publicRecipe'];
const PARTS = ['paper', 'cover', 'title', 'description', 'byline', 'actions'] as const;
/** Längsta tid sidan står still medan receptet och bilden laddas. */
const MAX_WAIT = 1000;

/** Kortet man senast klickade på. */
let clickedCard: HTMLElement | undefined;
/** Webbläsarens egen animation, t.ex. svep bakåt i Safari, ska inte få en till ovanpå. */
let browserAnimated = false;
let navigated: (() => void) | undefined;

// Före routerns egen lyssnare, som läggs till när routern skapas
window.addEventListener('popstate', (event) => {
  browserAnimated = Boolean((event as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition);
});

export function rememberClickedCard(event: MouseEvent) {
  clickedCard = event.currentTarget as HTMLElement;
}

function tag(root: Element) {
  return PARTS.flatMap((part) => {
    const selector = `[data-vt="${part}"]`;
    const el = root.matches(selector) ? (root as HTMLElement) : root.querySelector<HTMLElement>(selector);
    if (!el) return [];
    el.style.setProperty('view-transition-name', `recipe-${part}`);
    return [el];
  });
}

function untag(elements: HTMLElement[]) {
  for (const el of elements) el.style.removeProperty('view-transition-name');
}

function findRecipe(id: string) {
  return document.querySelector(`[data-vt-recipe="${CSS.escape(id)}"]`);
}

/** Klart när titeln finns och omslaget, om det finns ett, har laddat sin bild. */
function isReady(root: Element | null) {
  const cover = root?.querySelector<HTMLElement>('[data-vt="cover"]');
  return Boolean(root?.querySelector('[data-vt="title"]')) && (!cover || cover.dataset.ready === 'true');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pollar med setTimeout, eftersom sidan inte ritas om medan övergången väntar. */
async function waitFor(check: () => boolean, deadline: number) {
  while (!check() && performance.now() < deadline) await sleep(16);
}

/** Det som ska glida: kortet man klickade på, eller receptet man lämnar. */
function startElement(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  const name = from.name as string;
  if (ORIGIN_ROUTES.includes(name) && RECIPE_PAGES.includes(to.name as string)) {
    return clickedCard?.isConnected && clickedCard.getAttribute('href') === to.fullPath ? clickedCard : undefined;
  }
  if (RECIPE_PAGES.includes(name) && ORIGIN_ROUTES.includes(to.name as string)) {
    // På receptsidan finns bara receptets eget ark
    return document.querySelector<HTMLElement>('[data-vt-recipe]') ?? undefined;
  }
}

export function animateRecipeTransitions(router: Router) {
  router.beforeResolve((to, from) => {
    const skip = browserAnimated || !document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches;
    browserAnimated = false;
    const start = skip ? undefined : startElement(to, from);
    const id = start?.dataset.vtRecipe;
    if (!start || !id) return;

    const before = tag(start);
    return new Promise<void>((resolve) => {
      const transition = document.startViewTransition(async () => {
        const deadline = performance.now() + MAX_WAIT;
        // Den gamla bilden är tagen. Namnen tas bort så att de inte följer med ett sparat kort.
        untag(before);
        const done = new Promise<void>((r) => (navigated = r));
        resolve();
        await Promise.race([done.then(whenScrolled), sleep(MAX_WAIT)]);
        await waitFor(() => isReady(findRecipe(id)), deadline);
        const target = findRecipe(id);
        if (target) after.push(...tag(target));
      });
      const after: HTMLElement[] = [];
      transition.finished.finally(() => untag(after));
    });
  });

  router.afterEach(() => {
    clickedCard = undefined;
    navigated?.();
    navigated = undefined;
  });
}
