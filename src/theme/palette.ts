import { ref } from 'vue';
import { logoSvg } from './logo';

/** Omslagsfärger. Själva färgerna finns i styles/theme.css under [data-palette]. */
export const PALETTES = ['salvia', 'naturlinne', 'duvbla', 'marin', 'vinrod'] as const;
export type Palette = (typeof PALETTES)[number];

// Läses även av skriptet i index.html, så att rätt färg syns innan appen startat.
const STORAGE_KEY = 'mk-palette';

function storedPalette(): Palette {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return PALETTES.includes(value as Palette) ? (value as Palette) : 'salvia';
  } catch {
    return 'salvia';
  }
}

export const palette = ref<Palette>(storedPalette());

export function setPalette(value: Palette) {
  palette.value = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Privat läge eller blockerad lagring: valet gäller bara den här sessionen.
  }
  applyPalette();
}

/** Sätter paletten på <html> och uppdaterar favicon och webbläsarens temafärg. */
export function applyPalette() {
  const root = document.documentElement;
  root.dataset.palette = palette.value;
  const style = getComputedStyle(root);
  const read = (name: string) => style.getPropertyValue(name).trim();

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', read('--mk-linen'));
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (icon) {
    const svg = logoSvg({ cover: read('--mk-logo-cover'), spine: read('--mk-logo-spine'), band: read('--mk-logo-band') });
    icon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
}
