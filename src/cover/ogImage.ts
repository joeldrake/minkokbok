import type { Cover } from '../db/types';
import type { Palette } from '../theme/palette';
import { layoutEmojis } from './layout';

/** Storleken som Facebook, LinkedIn, Slack m.fl. rekommenderar för förhandsbilder. */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Bilden är alltid ljus, oavsett om skaparen använder mörkt läge. Samma papper som i theme.css.
const PAPER = '#fbf7ee';
const PAPER_EDGE = '#e6dcc8';
const INK = '#2a2722';
const INK_QUIET = '#6b6255';

const MARGIN = 56;
const PADDING = 40;
const TITLE_SIZE = 64;
const TITLE_LINE = 1.12;
const BRAND_SIZE = 28;

/**
 * Ritar förhandsbilden som visas när en länk till ett publikt recept delas:
 * receptets omslag i hela bilden och titeln på en papperslapp nere till vänster.
 */
export async function renderOgImage(recipe: { title: string; cover?: Cover }, fallbackPalette: Palette): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = OG_WIDTH;
  canvas.height = OG_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas saknas');

  // Typsnitten laddas från Google Fonts och måste vara klara innan de används på en canvas.
  await Promise.all([
    document.fonts.load(`700 ${TITLE_SIZE}px Fraunces`),
    document.fonts.load(`600 ${BRAND_SIZE}px "Source Serif 4"`),
  ]).catch(() => undefined);

  const palette = recipe.cover?.kind === 'emoji' ? recipe.cover.palette : fallbackPalette;
  context.fillStyle = paletteColor(palette);
  context.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  if (recipe.cover?.kind === 'emoji') drawEmojis(context, recipe.cover.emojis, recipe.cover.seed);
  // Saknas bilden, t.ex. för att den inte hunnit synkas hit, blir det bara tygfärgen.
  if (recipe.cover?.kind === 'photo' && recipe.cover.image instanceof Blob) await drawPhoto(context, recipe.cover.image);

  drawLabel(context, recipe.title);
  return toJpeg(canvas);
}

/** Tygfärgen för en palett, läst från theme.css så att färgerna bara finns på ett ställe. */
function paletteColor(palette: Palette): string {
  const probe = document.createElement('div');
  probe.dataset.palette = palette;
  probe.hidden = true;
  document.body.append(probe);
  const color = getComputedStyle(probe).getPropertyValue('--mk-cloth').trim();
  probe.remove();
  return color || '#aebfa6';
}

function drawEmojis(context: CanvasRenderingContext2D, emojis: string[], seed: number) {
  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = 'rgb(0 0 0 / 0.25)';
  context.shadowBlur = 6;
  context.shadowOffsetY = 4;
  for (const { emoji, x, y, size, turn } of layoutEmojis({ emojis, seed })) {
    context.save();
    context.translate(x * OG_WIDTH, y * OG_HEIGHT);
    context.rotate((turn * Math.PI) / 180);
    // Samma storlek som omslaget i appen (8.5 % av bredden)
    context.font = `${Math.round(size * 0.085 * OG_WIDTH)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    context.fillText(emoji, 0, 0);
    context.restore();
  }
  context.restore();
}

/** Ritar bilden så att den fyller hela ytan, som object-fit: cover. */
async function drawPhoto(context: CanvasRenderingContext2D, image: Blob) {
  const bitmap = await createImageBitmap(image);
  const scale = Math.max(OG_WIDTH / bitmap.width, OG_HEIGHT / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  context.drawImage(bitmap, (OG_WIDTH - width) / 2, (OG_HEIGHT - height) / 2, width, height);
  bitmap.close();
}

/** Papperslapp med titeln (max två rader) och appens namn. */
function drawLabel(context: CanvasRenderingContext2D, title: string) {
  const maxTextWidth = OG_WIDTH - 2 * MARGIN - 2 * PADDING;
  context.font = `700 ${TITLE_SIZE}px Fraunces, Georgia, serif`;
  const lines = wrap(context, title, maxTextWidth, 2);
  const textWidth = Math.max(...lines.map((line) => context.measureText(line).width));

  const titleHeight = lines.length * TITLE_SIZE * TITLE_LINE;
  const width = Math.min(OG_WIDTH - 2 * MARGIN, Math.max(textWidth, 360) + 2 * PADDING);
  const height = PADDING + titleHeight + 16 + BRAND_SIZE + PADDING;
  const x = MARGIN;
  const y = OG_HEIGHT - MARGIN - height;

  context.save();
  context.shadowColor = 'rgb(23 45 70 / 0.3)';
  context.shadowBlur = 30;
  context.shadowOffsetY = 10;
  context.fillStyle = PAPER;
  context.beginPath();
  context.roundRect(x, y, width, height, 16);
  context.fill();
  context.restore();
  context.strokeStyle = PAPER_EDGE;
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = INK;
  context.textBaseline = 'top';
  lines.forEach((line, i) => context.fillText(line, x + PADDING, y + PADDING + i * TITLE_SIZE * TITLE_LINE));

  context.fillStyle = INK_QUIET;
  context.font = `600 ${BRAND_SIZE}px "Source Serif 4", Georgia, serif`;
  context.fillText('Min Kokbok', x + PADDING, y + PADDING + titleHeight + 16);
}

/** Radbryter på ord. Får inte allt plats kortas sista raden med en ellips. */
function wrap(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  const overflow = lines.length > maxLines;
  const kept = lines.slice(0, maxLines);
  return kept.map((l, i) => {
    const cut = overflow && i === maxLines - 1;
    if (!cut && context.measureText(l).width <= maxWidth) return l;
    let shortened = l;
    while (shortened && context.measureText(`${shortened}…`).width > maxWidth) shortened = shortened.slice(0, -1);
    return `${shortened.trimEnd()}…`;
  });
}

// JPEG, eftersom alla tjänster som visar förhandsbilder klarar det (WebP stöds inte överallt).
function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Kunde inte skapa förhandsbilden'))), 'image/jpeg', 0.86),
  );
}
