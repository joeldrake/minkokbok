# Min Kokbok

En webbapp för att spara och dela egna recept. Local-first: recepten lagras i webbläsaren och synkas mellan enheter vid inloggning. Recept kan importeras från webbadresser eller foton och visas på en publik profilsida.

Live: https://minkokbok.joeldrak3.workers.dev

## Tech-stack

- **Front end:** Vue, Web Awesome, TypeScript, Vite, Dexie (IndexedDB)
- **Back end:** Cloudflare Workers, Dexie Cloud för synk och inloggning
- **Validering:** Zod
- **Verktyg:** Vitest, oxlint, vue-tsc, Wrangler

## Utveckling

```bash
npm install
npm run dev       # frontend
npm run dev:api   # worker lokalt
npm test
npm run deploy
```

Mer om arkitektur och tekniska val: [docs/beslutsunderlag.md](docs/beslutsunderlag.md).
