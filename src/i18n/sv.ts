export default {
  app: {
    name: "Min Kokbok",
  },
  nav: {
    myRecipes: "Mina recept",
    newRecipe: "Nytt recept",
    profile: "Min profil",
    admin: "Konton och roller",
    login: "Logga in",
    logout: "Logga ut",
    account: "Konto",
    importRecipes: "Importera recept",
    publicPage: "Min publika sida",
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
    search: "Sök bland recepten",
    emptyTitle: "Kokboken är tom än så länge",
    emptyText:
      "Spara ditt första recept: mormors köttbullar, veckans soppa eller den där kakan alla frågar efter.",
    emptyAction: "Lägg till ett recept",
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
    importAction: "Importera från markdown",
    editTitle: "Redigera recept",
    notFound: "Receptet hittades inte",
    notFoundText:
      "Det kan ha tagits bort, eller så har det inte synkats hit än.",
    backToList: "Tillbaka till mina recept",
    public: "Visa på min publika sida",
    publicHint: "Publika recept syns för alla på {url}",
    publicNeedsLogin: "Logga in för att kunna dela recept publikt.",
    publicNeedsRole:
      "Ditt konto kan inte dela recept publikt än. Be en administratör om medlemskap.",
    publicNeedsProfile:
      "Välj ett användarnamn i din profil för att få en publik sida.",
    isPublic: "Publikt",
  },
  cover: {
    title: "Omslag",
    intro:
      "Lägg till en egen bild, t.ex. från kamerarullen. Eller skapa ett glatt omslag av emojis: vi föreslår emojis utifrån titeln och ingredienserna, och du kan ändra dem som du vill.",
    uploadImage: "Ladda upp bild",
    replaceImage: "Byt bild",
    imageError: "Bilden kunde inte läsas. Prova en annan bild, t.ex. JPEG eller PNG.",
    create: "Skapa emoji-omslag",
    emojis: "Emojis",
    emojisHint: "Skriv eller klistra in upp till {max} emojis, eller välj bland förslagen.",
    suggestions: "Förslag",
    add: "Lägg till {emoji}",
    color: "Färg",
    shuffle: "Blanda om",
    remove: "Ta bort omslag",
  },
  import: {
    title: "Importera recept",
    intro:
      "Ladda upp recept som markdown-filer, t.ex. från en gammal blogg. Varje fil blir ett recept som du kan redigera efteråt.",
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
    hint: "Välj färg på kokbokens omslag. Valet sparas i den här webbläsaren.",
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
  public: {
    recipesBy: "Recept från {name}",
    empty: "{name} har inte delat några recept än.",
    notFound: 'Hittade ingen kokbok under "{username}".',
  },
} as const;
