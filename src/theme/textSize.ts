import { ref } from 'vue';

/**
 * "Större text" för den som läser recepten på håll, t.ex. vid spisen. Gäller ingredienser,
 * steg och receptkorten. Sätts som data-text-size på <html>, storlekarna finns i styles/theme.css.
 */
export type TextSize = 'normal' | 'large';

// Läses även av skriptet i index.html, så att rätt storlek syns innan appen startat.
const STORAGE_KEY = 'mk-text-size';

function storedTextSize(): TextSize {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'large' ? 'large' : 'normal';
  } catch {
    return 'normal';
  }
}

export const textSize = ref<TextSize>(storedTextSize());

export function setTextSize(value: TextSize) {
  textSize.value = value;
  try {
    if (value === 'large') localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Privat läge eller blockerad lagring: valet gäller bara den här sessionen.
  }
  applyTextSize();
}

export function applyTextSize() {
  if (textSize.value === 'large') document.documentElement.dataset.textSize = 'large';
  else delete document.documentElement.dataset.textSize;
}
