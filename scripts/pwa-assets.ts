// Ikoner och startskärmar för "Lägg till på hemskärmen".
// Kör `npm run pwa-assets` efter att logotypen eller standardfärgerna ändrats.
// Startskärmarnas <link>-taggar läggs in i index.html av vite.config.ts (se SPLASH_DEVICES).
import { mkdir, rm } from 'node:fs/promises';
import { logoSvg } from '../src/theme/logo.ts';

// Standardpaletten (salvia) i styles/theme.css. Ikoner kan inte följa användarens palett.
export const COLORS = {
  linen: '#aebfa6',
  linenDark: '#212b20',
  ink: '#22311f',
  inkDark: '#ece5d8',
  logo: { cover: '#4f6b4a', spine: '#3d5439', band: '#b8462f' },
};

/**
 * Skärmar som får en iOS-startskärm: CSS-bredd, CSS-höjd (stående) och pixeltäthet.
 * Telefoner bara stående, plattor åt båda håll.
 */
interface Device {
  w: number;
  h: number;
  dpr: number;
  tablet?: boolean;
}

export interface SplashScreen {
  href: string;
  width: number;
  height: number;
  scheme: 'light' | 'dark';
  media: string;
}

export const SPLASH_DEVICES: Device[] = [
  // iPhone
  { w: 440, h: 956, dpr: 3 }, // 16/17 Pro Max
  { w: 402, h: 874, dpr: 3 }, // 16/17 Pro, 17
  { w: 420, h: 912, dpr: 3 }, // Air
  { w: 430, h: 932, dpr: 3 }, // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  { w: 393, h: 852, dpr: 3 }, // 14 Pro, 15, 15 Pro, 16, 16e
  { w: 428, h: 926, dpr: 3 }, // 12/13 Pro Max, 14 Plus
  { w: 390, h: 844, dpr: 3 }, // 12, 13, 14
  { w: 375, h: 812, dpr: 3 }, // X, XS, 11 Pro, 12/13 mini
  { w: 414, h: 896, dpr: 3 }, // XS Max, 11 Pro Max
  { w: 414, h: 896, dpr: 2 }, // XR, 11
  { w: 414, h: 736, dpr: 3 }, // 6/7/8 Plus
  { w: 375, h: 667, dpr: 2 }, // 6/7/8, SE 2/3
  // iPad
  { w: 1032, h: 1376, dpr: 2, tablet: true }, // Pro 13" (M4)
  { w: 1024, h: 1366, dpr: 2, tablet: true }, // Pro 12,9", Air 13"
  { w: 834, h: 1210, dpr: 2, tablet: true }, // Pro 11" (M4)
  { w: 834, h: 1194, dpr: 2, tablet: true }, // Pro 11"
  { w: 820, h: 1180, dpr: 2, tablet: true }, // Air 10,9"/11", iPad 10:e gen
  { w: 810, h: 1080, dpr: 2, tablet: true }, // iPad 10,2"
  { w: 768, h: 1024, dpr: 2, tablet: true }, // iPad 9,7", mini 5
  { w: 744, h: 1133, dpr: 2, tablet: true }, // mini 6/7
];

/** Alla startskärmar som ska finnas, med filnamn och media query. */
export function splashScreens(): SplashScreen[] {
  const screens: SplashScreen[] = [];
  for (const d of SPLASH_DEVICES) {
    const orientations = d.tablet ? ['portrait', 'landscape'] : ['portrait'];
    for (const orientation of orientations) {
      for (const scheme of ['light', 'dark'] as const) {
        const [pw, ph] = orientation === 'portrait' ? [d.w * d.dpr, d.h * d.dpr] : [d.h * d.dpr, d.w * d.dpr];
        screens.push({
          href: `/splash/${pw}x${ph}-${scheme}.png`,
          width: pw,
          height: ph,
          scheme,
          media:
            `(device-width: ${d.w}px) and (device-height: ${d.h}px) and (-webkit-device-pixel-ratio: ${d.dpr}) ` +
            `and (orientation: ${orientation}) and (prefers-color-scheme: ${scheme})`,
        });
      }
    }
  }
  return screens;
}

/** Logotypen som inre <svg>, placerad i en kvadrat med sidan size och mitten i (cx, cy). */
function placedLogo(cx: number, cy: number, size: number) {
  return logoSvg(COLORS.logo).replace('<svg ', `<svg x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" `);
}

// Diskret linnestruktur, samma idé som --mk-weave i theme.css
const weave = (w: number, h: number) => `
  <filter id="v"><feTurbulence type="fractalNoise" baseFrequency=".85 .012" numOctaves="2" seed="2"/><feColorMatrix type="saturate" values="0"/></filter>
  <filter id="h"><feTurbulence type="fractalNoise" baseFrequency=".012 .85" numOctaves="2" seed="7"/><feColorMatrix type="saturate" values="0"/></filter>
  <rect width="${w}" height="${h}" filter="url(#v)" opacity=".07"/>
  <rect width="${w}" height="${h}" filter="url(#h)" opacity=".06"/>`;

/** Fyrkantig ikon på linnebakgrund. logoScale är logotypens andel av sidan. */
function filledIcon(size: number, logoScale: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="${COLORS.linen}"/>
  ${weave(size, size)}
  ${placedLogo(size / 2, size / 2, size * logoScale)}
</svg>`;
}

function transparentIcon(size: number) {
  return logoSvg(COLORS.logo).replace('<svg ', `<svg width="${size}" height="${size}" `);
}

function splash({ width, height, scheme }: SplashScreen) {
  const dark = scheme === 'dark';
  const short = Math.min(width, height);
  const logo = short * 0.32;
  const cy = height / 2 - short * 0.06;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${dark ? COLORS.linenDark : COLORS.linen}"/>
  ${placedLogo(width / 2, cy, logo)}
  <text x="${width / 2}" y="${cy + logo / 2 + short * 0.1}" text-anchor="middle"
    font-family="Georgia, serif" font-weight="bold" font-size="${short * 0.075}" fill="${dark ? COLORS.inkDark : COLORS.ink}">Min Kokbok</text>
</svg>`;
}

async function main() {
  // Laddas bara här, så att vite.config.ts kan importera listan utan sharp
  const { default: sharp } = await import('sharp');
  const png = (svg: string, file: string) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file);
  const out = new URL('../public/', import.meta.url).pathname;
  await mkdir(`${out}icons`, { recursive: true });
  await rm(`${out}splash`, { recursive: true, force: true });
  await mkdir(`${out}splash`, { recursive: true });

  await Promise.all([
    png(transparentIcon(192), `${out}icons/icon-192.png`),
    png(transparentIcon(512), `${out}icons/icon-512.png`),
    // Maskable: Android beskär till cirkel e.d., logotypen måste ligga inom de mittersta 80 %.
    png(filledIcon(512, 0.62), `${out}icons/icon-maskable-512.png`),
    // iOS rundar hörnen själv och vill ha en ogenomskinlig ikon.
    png(filledIcon(180, 0.78), `${out}apple-touch-icon.png`),
  ]);

  const screens = splashScreens();
  for (const s of screens) await png(splash(s), `${out}${s.href.slice(1)}`);
  console.log(`4 ikoner och ${screens.length} startskärmar skrivna till public/`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
