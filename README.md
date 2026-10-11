# Receptlådan

Dina recept, alltid nära till hands. En local-first webbapp där du sparar recept, synkar mellan mobil och dator och delar utvalda recept på din egen publika sida.

Bakgrund och tekniska val: [docs/beslutsunderlag.md](docs/beslutsunderlag.md).

## Stack

- **Vue 3** + TypeScript, **Vue Router**, **vue-i18n** (svenska)
- **Vite** (byts till Vite+ senare)
- **Web Awesome 3** som designsystem
- **Dexie** (IndexedDB) + **Dexie Cloud** för inloggning, synk och publika recept
- **Cloudflare Workers** (static assets) för hosting

## Kom igång

```bash
npm install
npm run dev
```

Utan Dexie Cloud körs appen i lokalt läge: allt sparas bara i webbläsaren.

### Koppla på Dexie Cloud (inloggning och synk)

```bash
npx dexie-cloud create          # skapar en databas (verifieras via e-post)
npx dexie-cloud whitelist http://localhost:5173
cp .env.example .env.local      # fyll i VITE_DEXIE_CLOUD_URL från dexie-cloud.json
```

`dexie-cloud.json` och `dexie-cloud.key` innehåller hemligheter och är ignorerade av git.

## Skript

| Kommando | Gör |
|---|---|
| `npm run dev` | Startar utvecklingsservern |
| `npm run build` | Typkontroll + produktionsbygge till `dist/` |
| `npm test` | Kör tester (Vitest) |
| `npm run lint` | Lintar med Oxlint |
| `npm run deploy` | Bygger och deployar till Cloudflare (kräver `npx wrangler login`) |

## Struktur

```
src/
  db/           Dexie-databas, typer, receptfunktioner och tolkning av ingredienser/steg
  composables/  useLiveQuery (reaktiva Dexie-frågor) och useCurrentUser
  components/   Återanvändbara Vue-komponenter
  views/        Sidor: lista, recept, redigera, profil, publik sida (/[användarnamn])
  i18n/         Översättningar (all UI-text ligger här)
  styles/       Temat ovanpå Web Awesome (--wa-*-tokens)
```

## Konventioner

- **All UI-text** går via `vue-i18n` (`src/i18n/sv.ts`), aldrig hårdkodad i mallar.
- **Web Awesome:** använd komponenter, layoutklasser (`wa-stack`, `wa-cluster`, `wa-grid`) och `--wa-*`-tokens i stället för egna färger och px-värden. `v-model` fungerar inte på `wa-*`. Använd `:value` + `@input="x = inputValue($event)"`.
- **Data** läses med `useLiveQuery` så att vyerna uppdateras automatiskt när synken tar in ändringar från andra enheter.
