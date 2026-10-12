export default {
  app: {
    name: "Min Kokbok",
    github: "GitHub",
  },
  nav: {
    myRecipes: "Mina recept",
    newRecipe: "Nytt recept",
    profile: "Min profil",
    admin: "Konton och roller",
    login: "Logga in",
    logout: "Logga ut",
    account: "Konto",
    publicPage: "Min publika sida",
    back: "Tillbaka",
    find: "Hitta kockar",
  },
  cloud: {
    rejected:
      "En ändring kunde inte sparas i molnet och har tagits bort. Försök igen senare.",
    rejectedPermission:
      "En ändring kunde inte sparas eftersom ditt konto saknar behörighet att publicera. Be en administratör om medlemskap.",
    dismiss: "Stäng",
    notConfigured:
      "Lokalt läge: recepten sparas bara i den här webbläsaren. Konfigurera Dexie Cloud för inloggning och synk.",
  },
  list: {
    title: "Mina recept",
    othersTitle: "Andras recept",
    following: "Kockar du följer",
    followingEmpty:
      "Du följer inga kockar än. Sök upp någon och tryck på Följ.",
    latest: "Nytt från kockar du följer",
    saved: "Sparade recept",
    savedEmpty:
      "Inga sparade recept än. Tryck på bokmärket på en annan kocks recept, så hamnar det här.",
    search: "Sök bland recepten",
    emptyTitle: "Välkommen till din kokbok",
    emptyText:
      "Samla alla dina recept på ett ställe: mormors köttbullar, din vegetariska lasagne och den där kakan alla älskar. Alltid till hands, i mobilen, paddan eller på datorn.",
    emptyAction: "Lägg till ditt första recept",
    emptyImport: "Importera recept",
    emptyFeatures: {
      write: {
        title: "Skriv in egna recept",
        text: "Ingredienser, steg och en bild. Stor och tydlig text som går att läsa på håll medan du lagar maten.",
      },
      import: {
        title: "Importera från webben och bilder",
        text: "Klistra in en länk från en receptsajt eller fota en kokbokssida, så blir det ett recept du kan granska och spara.",
      },
      share: {
        title: "Dela och hitta inspiration",
        text: "Gör recept publika, följ andra kockar och spara deras bästa recept i din egen samling.",
      },
    },
    noMatches: 'Inga recept matchar "{query}".',
  },
  recipe: {
    title: "Titel",
    titlePlaceholder: "T.ex. Mormors köttbullar",
    description: "Beskrivning",
    descriptionPlaceholder: "Vad gör receptet speciellt?",
    servings: "Portioner",
    servingsCount: "{n} portion | {n} portioner",
    prepMinutes: "Förberedelser (min)",
    cookMinutes: "Tillagning (min)",
    totalTime: "{n} min",
    prepShort: "Förberedelse {n} min",
    cookShort: "Tillagning {n} min",
    ingredients: "Ingredienser",
    ingredientsHint:
      'En ingrediens per rad, t.ex. "2 dl mjölk". Avsluta en rad med kolon för att skapa en grupp, t.ex. "Sås:".',
    steps: "Gör så här",
    stepsHint: "Ett steg per rad, eller separera stegen med en tom rad.",
    tags: "Taggar",
    tagsHint: 'Separera med kommatecken, t.ex. "vardag, vegetariskt"',
    sourceUrl: "Källa (länk)",
    source: "Källa",
    save: "Spara recept",
    cancel: "Avbryt",
    edit: "Redigera",
    delete: "Ta bort",
    deleteConfirmTitle: "Ta bort receptet?",
    deleteConfirmText:
      '"{title}" tas bort från alla dina enheter. Det går inte att ångra.',
    newTitle: "Nytt recept",
    importAction: "Importera",
    editTitle: "Redigera recept",
    notFound: "Receptet hittades inte",
    notFoundText:
      "Det kan ha tagits bort, eller så har det inte synkats hit än.",
    backToList: "Tillbaka till mina recept",
    copyLink: "Kopiera länk",
    linkCopied: "Länken är kopierad",
    public: "Visa på min publika sida",
    publicHint: "Publika recept syns för alla på {url}",
    publicNeedsLogin: "Logga in för att kunna dela recept publikt.",
    publicNeedsRole:
      "Ditt konto kan inte dela recept publikt än. Be en administratör om medlemskap.",
    publicNeedsProfile:
      "Välj ett användarnamn i din profil för att få en publik sida.",
    isPublic: "Publikt",
    by: "Av",
    bookmark: "Spara receptet",
    bookmarked: "Sparat, tryck för att ta bort",
  },
  cover: {
    title: "Omslag",
    intro:
      "Lägg till en egen bild, t.ex. från kamerarullen. Eller skapa ett glatt omslag av emojis: vi föreslår emojis utifrån titeln och ingredienserna, och du kan ändra dem som du vill.",
    uploadImage: "Ladda upp bild",
    replaceImage: "Byt bild",
    imageError:
      "Bilden kunde inte läsas. Prova en annan bild, t.ex. JPEG eller PNG.",
    create: "Skapa emoji-omslag",
    emojis: "Emojis",
    emojisHint:
      "Skriv eller klistra in upp till {max} emojis, eller välj bland förslagen.",
    suggestions: "Förslag",
    add: "Lägg till {emoji}",
    color: "Färg",
    shuffle: "Blanda om",
    remove: "Ta bort omslag",
  },
  import: {
    title: "Importera recept",
    url: {
      title: "Från en webbsida",
      intro:
        "Klistra in adressen till ett recept, t.ex. från en receptsajt. Du får granska receptet innan det sparas.",
      label: "Adress till receptet",
      placeholder: "https://…",
      submit: "Hämta recept",
      needsLogin: "Logga in för att kunna hämta recept från webbsidor.",
      errorInvalid:
        "Det ser inte ut som en webbadress. Kontrollera att den är rätt.",
      errorFetch:
        "Sidan gick inte att hämta. Kontrollera adressen eller försök igen senare.",
      errorNoRecipe:
        "Hittade inget recept på sidan. Sidan behöver ha receptdata enligt schema.org, vilket de flesta receptsajter har.",
    },
    photo: {
      title: "Från bilder",
      intro:
        "Ladda upp en skärmdump, t.ex. från Instagram, ett foto av en kokbokssida eller en handskriven lapp. Receptet tolkas med AI, recept på andra språk översätts till svenska, och du får granska det innan det sparas.",
      dropHint:
        "Släpp bilder här eller klistra in en skärmdump. Upp till {max} bilder av samma recept.",
      choose: "Välj bilder",
      imageAlt: "Bild {n}",
      remove: "Ta bort bild",
      submit: "Tolka receptet",
      waiting: "Det kan ta upp till en minut.",
      needsLogin: "Logga in för att kunna tolka recept från bilder.",
      needsRole:
        "Ditt konto kan inte tolka bilder än. Be en administratör om medlemskap.",
      errorNotConfigured: "Bildimport är inte påslagen på servern än.",
      errorUnreadable: "Bilderna kunde inte tolkas. Prova en tydligare bild.",
      errorNoRecipe: "Hittade inget recept i bilderna.",
      errorFetch:
        "Något gick fel när bilderna tolkades. Försök igen om en stund.",
    },
    markdown: {
      title: "Från markdown-filer",
      intro:
        "Ladda upp recept som markdown-filer, t.ex. från en gammal blogg. Varje fil blir ett recept som du kan redigera efteråt.",
    },
    dropHint: "Släpp .md-filer här",
    chooseFiles: "Välj filer",
    ingredientCount: "inga ingredienser | {n} ingrediens | {n} ingredienser",
    stepCount: "inga steg | {n} steg | {n} steg",
    importButton: "Importera | Importera {n} recept | Importera {n} recept",
    toList: "Till mina recept",
    done: "Inga recept importerades | {n} recept importerades | {n} recept importerades",
    errorNotRecipe: "Hittade varken ingredienser eller steg",
    errorMissingTitle: "Receptet saknar titel",
    errorUnknown: "Kunde inte läsa filen",
    status: {
      ready: "Redo",
      duplicate: "Finns redan",
      error: "Hoppas över",
      imported: "Importerat",
    },
  },
  profile: {
    title: "Min profil",
    username: "Användarnamn",
    usernameHint: "Används i adressen till din publika sida: {url}",
    usernameInvalid: "Använd 3–30 tecken: a–z, 0–9 och bindestreck.",
    usernameTaken: "Användarnamnet är redan taget.",
    usernameUnverified:
      "Kunde inte kontrollera om användarnamnet är ledigt. Kontrollera din anslutning och försök igen.",
    displayName: "Visningsnamn",
    bio: "Om dig",
    save: "Spara profil",
    saved: "Profilen är sparad",
    viewPublic: "Visa min publika sida",
    needsLogin:
      "Du är inte inloggad. Logga in för att se och ändra din profil.",
    rejected:
      "Profilen kunde inte sparas: ditt konto saknar behörighet att publicera. Be en administratör om medlemskap.",
    needsRole:
      "Ditt konto kan inte ha en publik profil än. Be en administratör om medlemskap.",
  },
  appearance: {
    title: "Utseende",
    hint: "Välj färg på kokbokens omslag. Valen sparas i den här webbläsaren.",
    palettes: {
      salvia: "Salvia",
      naturlinne: "Naturlinne",
      duvbla: "Duvblå",
      marin: "Marinblå",
      vinrod: "Vinröd",
    },
  },
  admin: {
    title: "Konton och roller",
    needsAdmin: "Den här sidan kräver admin-behörighet.",
    requestFailed: "Anropet misslyckades ({status}).",
    account: "Konto",
    license: "Licens",
    daysLeft: "{days} dagar kvar",
    deactivated: "Avstängt",
    lastLogin: "Senast inloggad",
    role: "Roll",
    roles: { none: "Ingen (Eval)", member: "Member", admin: "Admin" },
    delete: "Ta bort konto",
    deleteTitle: "Ta bort konto?",
    deleteText:
      "Kontot {account} och all dess data tas bort från molnet. Det går inte att ångra.",
  },
  login: {
    cancel: "Avbryt",
    email: {
      title: "Logga in",
      intro:
        "Skriv din e-postadress. Vi skickar ett mejl med en kod som du sedan skriver in här. Du behöver inget lösenord.",
      submit: "Skicka koden till min e-post",
      why: {
        title: "Varför logga in?",
        devices:
          "Dina recept sparas i molnet, så att du kommer åt dem på mobilen, surfplattan och datorn.",
        localRecipes:
          "Recept du redan lagt in i den här webbläsaren flyttas till ditt konto när du loggar in.",
      },
    },
    otp: {
      title: "Kolla din e-post",
      intro:
        "Öppna mejlet från Min Kokbok och skriv av koden som står där. Hittar du inte mejlet? Titta i skräpposten.",
      submit: "Logga in",
    },
    "logout-confirmation": {
      title: "Logga ut?",
      submit: "Logga ut ändå",
      cancel: "Stanna kvar",
    },
    "message-alert": {
      submit: "OK",
    },
    fields: {
      email: {
        label: "Din e-postadress",
        hint: "T.ex. anna.andersson{'@'}gmail.com",
      },
      otp: { label: "Koden från mejlet" },
    },
    alerts: {
      OTP_SENT: "Vi har skickat ett mejl till {email}.",
      INVALID_EMAIL:
        "Det ser inte ut som en e-postadress. Kontrollera att den är rätt skriven, med {'@'} och punkt.",
      INVALID_OTP:
        "Koden stämmer inte. Kontrollera att du skrivit av den rätt, eller begär en ny kod.",
      LOGOUT_CONFIRMATION:
        "{numUnsyncedChanges} ändringar har inte hunnit sparas på nätet än och försvinner om du loggar ut nu.",
      GENERIC_ERROR: "Något gick fel. Försök igen om en liten stund.",
      USER_NOT_REGISTERED: "Den här e-postadressen har inget konto.",
      USER_NOT_ACCEPTED: "Kontot är inte godkänt än.",
      USER_DEACTIVATED: "Kontot är avstängt.",
      LICENSE_LIMIT_REACHED: "Det går inte att skapa fler konton just nu.",
      NO_SEATS_AVAILABLE: "Det går inte att skapa fler konton just nu.",
    },
  },
  find: {
    title: "Hitta kockar",
    intro: "Sök på namn eller användarnamn för att hitta någons kokbok.",
    search: "Namn eller användarnamn",
    noMatches: 'Hittade ingen som heter "{query}".',
    recipeCount: "inga publika recept | {n} recept | {n} recept",
  },
  public: {
    follow: "Följ",
    following: "Följer",
    recipesBy: "Recept från {name}",
    empty: "{name} har inte delat några recept än.",
    notFound: 'Hittade ingen kokbok under "{username}".',
  },
  update: {
    available: "Det finns en ny version av Min Kokbok.",
    reload: "Uppdatera",
    later: "Senare",
  },
} as const;
