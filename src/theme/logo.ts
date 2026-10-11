export interface LogoColors {
  cover: string;
  spine: string;
  band: string;
}

/**
 * Logotypen: en inbunden kokbok med etikett, sked och gaffel.
 * Färgerna sätts med style-attribut så att de kan vara både hex och var(--…).
 */
export function logoSvg({ cover, spine, band }: LogoColors): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><pattern id="mk-weave" width="2" height="2" patternUnits="userSpaceOnUse"><path d="M0 .5h2M1.5 0v2" stroke="#fff" stroke-width=".5" stroke-opacity=".08"/></pattern></defs>
  <rect x="12" y="7" width="44" height="52" rx="3" fill="#f7f1e3" stroke="#c8b796"/>
  <path d="M15 56.5h38M53.5 10v44" stroke="#d9cbb0"/>
  <path d="M40 52h5.5v11l-2.75-2.4L40 63z" style="fill:${band}"/>
  <rect x="8" y="4" width="44" height="52" rx="3" style="fill:${cover}"/>
  <rect x="8" y="4" width="44" height="52" rx="3" fill="url(#mk-weave)"/>
  <path d="M11 4h6v52h-6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" style="fill:${spine}"/>
  <path d="M8 11h9M8 49h9" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/>
  <rect x="22" y="13" width="24" height="31" rx="2" fill="#f7f1e3"/>
  <rect x="24" y="15" width="20" height="27" rx="1" fill="none" stroke="#c49a52" stroke-width=".9"/>
  <ellipse cx="30" cy="22.5" rx="2.6" ry="3.6" style="fill:${cover}"/>
  <g fill="none" stroke-linecap="round" style="stroke:${cover}">
    <path d="M30 25v12M38 25v12" stroke-width="2"/>
    <path d="M36.3 19v4M38 19v4M39.7 19v4M36.3 22.5c0 2.6 3.4 2.6 3.4 0" stroke-width="1.1"/>
  </g>
</svg>`;
}
