# Min Kokbok – beslutsunderlag

*Senast uppdaterad: 2026-10-11*

Min Kokbok är en webbapp där man samlar sina recept, når dem snabbt från mobil och dator, och kan visa utvalda recept publikt på sin egen sida. Appen ska kännas varm och enkel att använda och främja matlagningsglädje.

## Sammanfattning av beslut

| Område | Beslut | Status |
|---|---|---|
| Namn | **Min Kokbok** (tekniskt: `minkokbok`) | Beslutat |
| Frontend | Vue 3 + TypeScript | Beslutat |
| Byggverktyg | Vite 8 nu, **Vite+** när 1.x har mognat några veckor | Beslutat |
| Designsystem | Web Awesome 3 | Beslutat |
| Lokal data | Dexie (IndexedDB), local-first | Beslutat |
| Synk + inloggning | Dexie Cloud | Beslutat, verifieras i spike |
| Hosting | Cloudflare (Workers static assets) | Beslutat |
| AI-import | Claude API via Cloudflare Worker | Uppskjutet |
| Språk | Svenska, men all UI-text via `vue-i18n` från start | Beslutat |

## MVP-omfång

1. Inloggning.
2. Spara, visa, redigera och ta bort recept i sitt konto.
3. Fungerar bra på mobil och desktop, och synkar snabbt mellan enheter.
4. Recept är privata som standard. Valda recept kan visas publikt på `minkokbok.<tld>/[konto]` (domän ej vald).
5. Import av recept från skärmdump, foto (även handskrivna lappar), webbsida eller Instagram-bildtext. *Byggs efter grundappen, kräver Claude API-konto.*

## Beslut och motiveringar

### Namn: Min Kokbok

Appen hette först Receptlådan, men `receptladan.se` var redan upptaget av en annan receptapp. Därför bytte vi till Min Kokbok. Namnet är personligt och lätt att förstå. Det passar en app där man samlar sina egna recept.

Tekniska identifierare (repo, npm, Cloudflare-projekt, Dexie-databas, domän) skrivs `minkokbok`. I gränssnitt och marknadsföring skrivs det "Min Kokbok".

Avvägning: precis som med "MinaRecept" blir "min" lite fel ur besökarens perspektiv på den publika sidan (`minkokbok.<tld>/anna`). Det har vi accepterat.

**Att göra:** välja domän. `minkokbok.se`, `minkokbok.com` och `min-kokbok.se` är registrerade (kontrollerat 2026-10-11, `.se` går ut 2027-03-28). `minkokbok.nu` såg ledig ut.

### Frontend: Vue 3 + Vite (→ Vite+)

Vue är beprövat och har ett mogent ekosystem (router, i18n). Vite+ (VoidZero) samlar dev-server, build, test (Vitest), lint (Oxlint) och format i ett verktyg. Vite+ 1.0 släpptes 2026-09-28 och är för färskt för att låsa sig vid i dag. Eftersom Vite+ bygger på Vite är det ett litet steg att byta senare.

### Designsystem: Web Awesome 3

Rena, temabara webbkomponenter med bra tillgänglighet som fungerar i alla ramverk. Saker att känna till i Vue:

- `wa-*`-taggar registreras som custom elements i Vite-konfigurationen.
- `v-model` fungerar inte direkt på webbkomponenter. Använd `:value` + `@input`, eller tunna wrapper-komponenter för formulärfält.
- En del komponenter och teman ingår bara i Web Awesome Pro (betalt). MVP:n håller sig till gratisdelen.

Appens egen känsla (färger, typsnitt, rundningar) läggs ovanpå via Web Awesomes design tokens (CSS-variabler).

### Data och synk: Dexie + Dexie Cloud

**Local-first:** all data ligger i webbläsarens IndexedDB via Dexie. Appen är snabb och fungerar offline, och gränssnittet läser data reaktivt (`liveQuery`).

**Dexie Cloud** ger på köpet:

- **Inloggning** med e-post och engångskod, utan lösenord att hantera. Stöd för social inloggning (OAuth) finns också.
- **Synk** mellan enheter i realtid.
- **Åtkomstkontroll** via *realms*. Privata recept ligger i användarens privata realm. Publika recept flyttas till den publika realmen (`rlm-public`), som alla kan läsa.

Alternativet var Supabase (Postgres + Auth + Storage) med egen synk. Det ger mer kontroll och mindre inlåsning, men betydligt mer eget arbete för synken. Det är reservplanen om spiken visar att Dexie Cloud inte räcker.

**Att verifiera i spike:**

- [ ] Inloggning och synk mellan mobil och desktop.
- [ ] Att publika recept i `rlm-public` kan läsas utan inloggning på `/[konto]`.
- [ ] Bilder: Dexie Cloud har inbyggt blob-stöd (`blobMode: 'eager' | 'lazy'`). Verifiera storlek, kostnad och prestanda för receptbilder.
- [ ] Skalning av publika sidor: den publika realmen synkas i sin helhet till alla klienter. Det fungerar i början, men med många användare bör `/[konto]` i stället hämta data via Dexie Clouds REST-API från en Worker.
- [ ] Unika kontonamn (`/[konto]`). Dexie Cloud har inga globalt unika fält, så det kan kräva en liten serverfunktion.
- [ ] Prismodell när antalet användare växer.

### Hosting: Cloudflare

Appen byggs till statiska filer och serveras via Cloudflare Workers static assets, med SPA-fallback så att `/[konto]`-adresser fungerar. Gratisnivån räcker för MVP:n: obegränsad statisk trafik, 100 000 Worker-anrop per dag och 10 GB i R2. Samma plattform används senare för AI-importens backend och eventuell bildlagring.

**Senare:** server-rendering av publika receptsidor för snygga länkförhandsvisningar och bättre Google-synlighet.

### AI-import (uppskjutet)

Ett Claude Pro-abonnemang kan inte driva en app. Det krävs ett API-konto som betalas per anrop, och API-nyckeln ska ligga i en Cloudflare Worker, aldrig i klienten.

| Källa | Metod |
|---|---|
| Webbsida | Läs i första hand receptdata i schema.org/JSON-LD (gratis och exakt). Claude bara som reserv. |
| Skärmdump / foto / handskriven lapp | Bild till Claude med structured outputs enligt receptschemat. |
| Instagram | Automatisk hämtning är skör (Meta begränsar). Användaren klistrar in bildtexten eller tar en skärmdump. På Android kan en PWA ta emot "Dela" direkt. |

Uppskattad kostnad per import: från cirka 0,001 USD (Haiku 5.5) till cirka 0,03 USD (Opus 5.5). Börja med en kapabel modell för handskrift och testa sedan om en billigare räcker för enklare källor.

### Språk: svenska via vue-i18n

All gränssnittstext läggs i översättningsfiler från dag ett, även om det bara finns svenska. Det kostar nästan inget nu och gör att fler språk (och externa översättningstjänster som Crowdin eller Lokalise) kan läggas till utan omskrivning. Översättning av receptinnehåll är en separat fråga, där AI är en möjlig lösning.

## Framtid: gratis- och Pro-konton

Gratiskonton får en begränsning (t.ex. antal recept eller AI-importer per månad). Pro-konton betalas via t.ex. Stripe. Eftersom klienten är local-first kan gränser i klienten kringgås, så **gränserna måste kontrolleras på servern**, antingen via Dexie Clouds åtkomstregler eller i en Worker som hanterar AI-importen (AI-importer är den naturliga, kostnadsdrivande spärren).

## Utkast till datamodell

```ts
interface Recipe {
  id: string;            // genereras av Dexie Cloud
  realmId?: string;      // privat realm, eller 'rlm-public' när receptet är publikt
  owner?: string;        // sätts av Dexie Cloud
  title: string;
  description?: string;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  ingredients: { amount?: string; unit?: string; name: string; note?: string; group?: string }[];
  steps: { text: string }[];
  tags: string[];
  source?: { kind: 'manual' | 'url' | 'image' | 'instagram'; url?: string };
  createdAt: number;
  updatedAt: number;
}

interface Profile {      // ligger i rlm-public, läses av /[konto]
  id: string;
  username: string;      // unikhet: se öppen fråga ovan
  displayName: string;
  bio?: string;
}
```

## Nästa steg

1. Scaffolda projektet (Vue, Vite, Web Awesome, vue-i18n, Dexie, Cloudflare-konfiguration).
2. Skapa en Dexie Cloud-databas (`npx dexie-cloud create`) och gå igenom spike-listan ovan.
3. Bygg grundflödet: lista, visa, skapa och redigera recept.
4. Publik sida `/[konto]`.
5. Första deploy till Cloudflare på standardadressen `minkokbok.<konto>.workers.dev`. Egen domän registreras senare.
6. Skaffa Claude API-konto och bygg AI-import.
7. Byt till Vite+.
