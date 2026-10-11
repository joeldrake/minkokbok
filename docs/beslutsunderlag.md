# Min Kokbok – beslutsunderlag

_Senast uppdaterad: 2026-10-11_

Min Kokbok är en webbapp där man samlar sina recept, når dem snabbt från mobil och dator, och kan visa utvalda recept publikt på sin egen sida. Appen ska kännas varm och enkel att använda och främja matlagningsglädje.

## Sammanfattning av beslut

| Område            | Beslut                                                   | Status                                        |
| ----------------- | -------------------------------------------------------- | --------------------------------------------- |
| Namn              | **Min Kokbok** (tekniskt: `minkokbok`)                   | Beslutat, domän ej vald                       |
| Frontend          | Vue 3 + TypeScript                                       | Beslutat, byggt                               |
| Byggverktyg       | Vite 8 nu, **Vite+** när 1.x har mognat några veckor     | Beslutat                                      |
| Designsystem      | Web Awesome 3                                            | Beslutat, byggt                               |
| Lokal data        | Dexie (IndexedDB), local-first                           | Beslutat, byggt                               |
| Synk + inloggning | Dexie Cloud                                              | Beslutat och byggt, verifieras i spike        |
| Behörighet        | Roller `member` och `admin` i den publika realmen        | Beslutat, byggt                               |
| Användarnamn      | Unikhet kontrolleras i klienten, inte på servern         | Beslutat                                      |
| Bilder            | Omslagsbilder som `Blob` i Dexie Cloud                   | Beslutat och byggt, verifieras i spike        |
| Hosting           | Cloudflare (Workers static assets + Worker för `/api/*`) | Beslutat, ej deployat                         |
| Publika adresser  | `/[användarnamn]/[slug]` med förhandsbild vid delning     | Byggt                                         |
| Installation      | PWA (manifest, ikoner, iOS-startskärmar)                 | Byggt                                         |
| AI-import         | Claude API via Cloudflare Worker                         | Uppskjutet. Markdown-import finns under tiden |
| Språk             | Svenska, men all UI-text via `vue-i18n` från start       | Beslutat, byggt                               |

## MVP-omfång

| #   | Mål                                                                                         | Läge                                                                                          |
| --- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Inloggning                                                                                  | Klart: e-post och engångskod via Dexie Cloud, med egen inloggningsruta och egna e-postmallar. |
| 2   | Spara, visa, redigera och ta bort recept i sitt konto                                       | Klart, inklusive omslag.                                                                      |
| 3   | Fungerar bra på mobil och desktop och synkar snabbt mellan enheter                          | Mobilanpassat och installerbart som PWA. Synk mellan enheter återstår att verifiera i spiken. |
| 4   | Recept är privata som standard. Valda recept kan visas publikt på `minkokbok.<tld>/[konto]` | Klart i appen. Domän ej vald.                                                                 |
| 5   | Import från skärmdump, foto, webbsida eller Instagram-bildtext                              | Uppskjutet, kräver Claude API-konto. Import av Markdown-filer finns under tiden.              |

## Beslut och motiveringar

### Namn: Min Kokbok

Tekniska identifierare (repo, npm, Cloudflare-projekt, Dexie-databas, domän) skrivs `minkokbok`.

**Att göra:** välja domän. `minkokbok.se`, `minkokbok.com` och `min-kokbok.se` är registrerade (kontrollerat 2026-10-11). Överväga annat namn.

### Frontend: Vue 3 + Vite (→ Vite+)

Vue är beprövat och har ett mogent ekosystem (router, i18n). Vite+ (VoidZero) samlar dev-server, build, test (Vitest), lint (Oxlint) och format i ett verktyg. Vite+ 1.0 släpptes 2026-09-28 och är för färskt för att låsa sig vid i dag. Eftersom Vite+ bygger på Vite är det ett litet steg att byta senare. Projektet använder redan Vitest och Oxlint var för sig.

### Designsystem: Web Awesome 3

Rena, temabara webbkomponenter med bra tillgänglighet som fungerar i alla ramverk. Saker att känna till i Vue:

- `wa-*`-taggar registreras som custom elements i Vite-konfigurationen.
- `v-model` fungerar inte direkt på webbkomponenter. Använd `:value` + `@input`, eller tunna wrapper-komponenter för formulärfält.
- En del komponenter och teman ingår bara i Web Awesome Pro (betalt). MVP:n håller sig till gratisdelen.

Appens egen känsla (färger, typsnitt, rundningar) läggs ovanpå via Web Awesomes design tokens (CSS-variabler). Användaren kan välja omslagsfärg (palett). Valet sparas i webbläsaren och styr även favicon och temafärg.

### Data och synk: Dexie + Dexie Cloud

**Local-first:** all data ligger i webbläsarens IndexedDB via Dexie. Appen är snabb och fungerar offline, och gränssnittet läser data reaktivt (`liveQuery`). Utan Dexie Cloud-URL körs appen helt lokalt, utan inloggning och synk.

**Dexie Cloud** ger på köpet:

- **Inloggning** med e-post och engångskod, utan lösenord att hantera. Stöd för social inloggning (OAuth) finns också. Inloggningsrutan är vår egen (`customLoginGui`), och e-postmallarna ligger i `dexie-cloud/`.
- **Synk** mellan enheter i realtid.
- **Åtkomstkontroll** via _realms_. Privata recept ligger i användarens privata realm. Publika recept flyttas till den publika realmen (`rlm-public`), som alla kan läsa.

Alternativet var Supabase (Postgres + Auth + Storage) med egen synk. Det ger mer kontroll och mindre inlåsning, men betydligt mer eget arbete för synken. Det är reservplanen om spiken visar att Dexie Cloud inte räcker.

Dexie Cloud skickar avvisade ändringar i svaret från synken men gör inget med dem, så ändringen försvinner tyst. Appen läser därför avvisningarna själv (`src/db/syncRejections.ts`) och visar ett begripligt felmeddelande.

**Att verifiera i spike:**

- [ ] Inloggning och synk mellan mobil och desktop.
- [ ] Att publika recept i `rlm-public` kan läsas utan inloggning på `/[konto]`.
- [ ] Bilder: kostnad för Dexie Clouds bloblagring, och att utloggade besökare kan se bilder på publika recept. Reservplan: R2 via Workern.
- [ ] Skalning av publika sidor: den publika realmen synkas i sin helhet till alla klienter. Det fungerar i början, men med många användare bör `/[konto]` i stället hämta data via Dexie Clouds REST-API från en Worker.
- [ ] Prismodell när antalet användare växer.

### Konton, roller och admin

Alla kan logga in, men ett konto utan roll kan bara läsa det publika. Rollerna definieras i `dexie-cloud/roles.json` och delas ut med en medlemsrad i `rlm-public`:

| Roll     | Får                                                             |
| -------- | --------------------------------------------------------------- |
| `member` | Publicera egna recept och en egen profil i den publika realmen. |
| `admin`  | Hantera allt i den publika realmen, även dela ut roller.        |

Admin-sidan (`/admin`) listar konton, sätter roller och tar bort konton. Det kräver Dexie Clouds REST-API med klientnyckeln, som aldrig får nå webbläsaren. Därför går de anropen via Workern (`/api/admin/*`). Workern kontrollerar först att anroparen är inloggad och har rollen `admin`.

### Användarnamn: kontroll i klienten

Användarnamnet styr adressen till den publika sidan (`/[användarnamn]`). Det får vara 3–30 tecken (a–z, 0–9 och bindestreck), och appens egna sökvägar (`recept`, `profil`, `admin` med flera) är reserverade.

Dexie Cloud har inga globalt unika fält. **Beslut (2026-10-11):** unikhet kontrolleras i klienten mot profilerna i `rlm-public`:

- Medan man skriver visas direkt om namnet är upptaget, och då går det inte att spara.
- Innan ett nytt namn sparas hämtas det senaste från servern, så att jämförelsen inte görs mot gammal data. Går servern inte att nå sparas inget nytt namn. Visningsnamn och bio går att ändra även offline.

### Omslag och bilder

Varje recept kan ha ett omslag, antingen emojis på en tygfärg eller en egen bild:

- **Emoji-omslag** räknas fram ur ett frö (`seed`), så omslaget ser likadant ut överallt och "Blanda" bara byter frö.
- **Egna bilder** sparas som `Blob` på receptet (beslutat 2026-10-11). De krymps i webbläsaren till max 1600 px (WebP, eller JPEG i Safari), och Dexie Cloud laddar upp dem till sin bloblagring vid synk (`blobMode: 'eager'`, standard). Kostnad och publik åtkomst verifieras i spiken.

### Hosting: Cloudflare

Appen byggs till statiska filer och serveras via Cloudflare Workers static assets, med SPA-fallback så att `/[konto]`-adresser fungerar. Samma Worker hanterar `/api/*` (i dag admin-funktionerna) och förhandsvisningar för publika recept, se nedan. Klient-id och klientnyckel för Dexie Cloud ligger som hemligheter i Workern (`wrangler secret put`, lokalt i `.dev.vars`).

Gratisnivån räcker för MVP:n: obegränsad statisk trafik, 100 000 Worker-anrop per dag och 10 GB i R2. Samma plattform används senare för AI-importens backend och eventuell bildlagring.

### Publika receptadresser och förhandsvisningar

Publika recept har adresser som `/anna/kladdkaka`. Slugen räknas fram ur titeln (å, ä och ö blir a, a och o) och är unik bland ägarens recept, annars läggs en siffra till (`kladdkaka-2`). När titeln ändras får receptet en ny slug, och den gamla sparas i `slugHistory` så att länkar som redan delats skickas vidare till den nya adressen.

Tjänster som visar länkförhandsvisningar (Facebook, Slack, iMessage …) kör inte JavaScript. **Beslut (2026-10-11):**

- **Förhandsbilden ritas i webbläsaren** (1200×630 JPEG med omslag och titel) när ett publikt recept sparas eller publiceras, och sparas som `Blob` på receptet. Workern behöver då inget bildbibliotek. Bilden tas bort när receptet görs privat.
- **Workern lägger in Open Graph-taggar** i `index.html` för `/[användarnamn]/[slug]` och serverar bilden på `/og/[id].jpg`. Den läser bara via Dexie Clouds `/public`-endpoints, som inte kräver inloggning, så den kan aldrig visa något privat.

**Avvägning:** bilden ritas om vid varje sparning av ett publikt recept (cirka 100 kB uppladdning), och emojis ritas med skaparens enhets typsnitt.

**Senare:** förhandsvisning även för profilsidan `/[användarnamn]`, och server-rendering av själva receptinnehållet för bättre Google-synlighet.

### PWA

Appen kan installeras på hemskärmen, med manifest, ikoner (även maskable) och startskärmar för iOS i ljust och mörkt läge. Bilderna skapas med `npm run pwa-assets`. Någon service worker för offline-cache av själva appen finns inte än. Datan fungerar redan offline via IndexedDB.

### AI-import (uppskjutet)

Ett Claude Pro-abonnemang kan inte driva en app. Det krävs ett API-konto som betalas per anrop, och API-nyckeln ska ligga i en Cloudflare Worker, aldrig i klienten.

| Källa                               | Metod                                                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Webbsida                            | Läs i första hand receptdata i schema.org/JSON-LD (gratis och exakt). Claude bara som reserv.                                                        |
| Skärmdump / foto / handskriven lapp | Bild till Claude med structured outputs enligt receptschemat.                                                                                        |
| Instagram                           | Automatisk hämtning är skör (Meta begränsar). Användaren klistrar in bildtexten eller tar en skärmdump. På Android kan en PWA ta emot "Dela" direkt. |

Uppskattad kostnad per import: från cirka 0,001 USD (Haiku 5.5) till cirka 0,03 USD (Opus 5.5). Börja med en kapabel modell för handskrift och testa sedan om en billigare räcker för enklare källor.

**Under tiden:** man kan importera recept från Markdown-filer (`/recept/importera`). Importen visar vilka filer som är redo, redan finns eller hoppas över innan något sparas.

### Språk: svenska via vue-i18n

All gränssnittstext läggs i översättningsfiler från dag ett, även om det bara finns svenska. Det kostar nästan inget nu och gör att fler språk (och externa översättningstjänster som Crowdin eller Lokalise) kan läggas till utan omskrivning. Översättning av receptinnehåll är en separat fråga, där AI är en möjlig lösning.

## Framtid: gratis- och Pro-konton

Gratiskonton får en begränsning (t.ex. antal recept eller AI-importer per månad). Pro-konton betalas via t.ex. Stripe. Eftersom klienten är local-first kan gränser i klienten kringgås, så **gränserna måste kontrolleras på servern**, antingen via Dexie Clouds åtkomstregler eller i en Worker som hanterar AI-importen (AI-importer är den naturliga, kostnadsdrivande spärren).

## Datamodell

Den gällande modellen finns i `src/db/types.ts`. I korthet:

```ts
interface Recipe {
  id: string; // genereras av Dexie Cloud
  realmId?: string; // privat realm, eller 'rlm-public' när receptet är publikt
  owner?: string; // sätts av Dexie Cloud
  title: string;
  description?: string;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  ingredients: {
    amount?: string;
    unit?: string;
    name: string;
    note?: string;
    group?: string;
  }[];
  steps: { text: string }[];
  tags: string[];
  source?: { kind: "manual" | "url" | "image" | "instagram"; url?: string };
  cover?:
    | { kind: "emoji"; emojis: string[]; palette: Palette; seed: number }
    | { kind: "photo"; image: Blob };
  slug?: string; // del av den publika adressen /[användarnamn]/[slug]
  slugHistory?: string[]; // tidigare slugs, så att gamla länkar fungerar
  ogImage?: Blob; // förhandsbild för delade länkar, bara på publika recept
  createdAt: number;
  updatedAt: number;
}

interface Profile {
  // ligger i rlm-public, läses av /[användarnamn]
  id: string;
  username: string; // unikhet kontrolleras i klienten, se "Användarnamn"
  displayName: string;
  bio?: string;
}
```

## Nästa steg

Klart: projektet är uppsatt, Dexie Cloud-databasen är skapad, grundflödet för recept och den publika sidan är byggda, och inloggning, roller, admin, omslag, Markdown-import, PWA och publika receptadresser med förhandsbilder finns på plats.

1. Välj och registrera domän.
2. Skaffa Claude API-konto och bygg AI-import.
3. Byt till Vite+.
