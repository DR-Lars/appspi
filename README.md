# Appspi — samen sparen voor Albufeira

SvelteKit-webapp (Svelte 5, TypeScript, SQLite) waarin leden hun persoonlijk budget en de groepspot volgen, met een ingebouwd Cluedo-spel dat de admins handmatig starten. Volledig in het Nederlands.

## Functies

- **Al het geld komt uit activiteiten** — leden storten zelf nooit iets. Een admin registreert een opbrengst + wie meewerkte.
- **Groepspot** (standaard € 6.000): het volledige bedrag van elke opbrengst.
- **Persoonlijk budget** (standaard € 600): het aandeel van een lid in de opbrengsten. Het bedrag wordt automatisch gelijk verdeeld over de deelnemers (resterende centen eerlijk verdeeld, som klopt altijd). Live voorbeeld van de verdeling in het formulier.
- **Overzicht** per lid: persoonlijke voortgang, groepspot, klassement, activiteiten + eigen aandeel, aftelling tot vertrek.
- **Cluedo** (klassiek: *wie, waarmee, waar*): een vaste **kaartenset** met Albufeira-personages, -voorwerpen en -locaties wordt bij de eerste start aangemaakt en is door admins te beheren (toevoegen, uitschakelen, verwijderen). Alle leden doen automatisch mee als verdachten. Bij een nieuw mysterie worden de kaarten gekopieerd en wordt een willekeurige, **geheime** oplossing (persoon + voorwerp + locatie) getrokken — niemand ziet ze, ook de admins niet, dus iedereen kan meespelen. Admins kunnen enkel blind opnieuw loten vóór de start. Ze starten het spel manueel en geven hints: eigen teksthints, of automatische hints waarbij het systeem een willekeurige kaart uitsluit die zeker niet bij de oplossing hoort (die kaart wordt voor iedereen doorgestreept). De oplossing wordt pas onthuld als het mysterie afgelopen is. Leden hebben een persoonlijk detectiveblad om kaarten af te strepen en doen beperkte beschuldigingen; de eerste juiste combinatie wint.
- **Beheer**: leden aanmaken/hernoemen/wachtwoord resetten/verwijderen, doelbedragen, bestemming en vertrekdatum instellen.
- Exact 2 admin-accounts (via omgevingsvariabelen bij de eerste start), maximum afgedwongen.

## Architectuur (OOP)

```
src/lib/server/
├── domain/        Entiteiten & value objects met de regels
│   ├── Money.ts       bedragen in centen, parse "12,50", eerlijke splitsing
│   ├── Progress.ts    voortgang t.o.v. doel
│   ├── User.ts, Earning.ts, ClueCard.ts
│   ├── Mystery.ts     aggregaat met spelregels (mag starten/gokken, juist?)
│   └── DomainError.ts fouten die veilig aan de gebruiker getoond worden
├── repositories/  Data-toegang (erven van BaseRepository)
├── services/      Use-cases: AuthService, UserService, BudgetService,
│                  MysteryService, ClueCardService, SettingsService, PasswordHasher, LoginThrottle
├── db/            Database-wrapper + migraties
├── container.ts   Composition root (dependency injection)
└── http.ts        Helpers voor rechten + DomainError → formulierfout
```

Routes zijn dun: ze lezen het formulier, roepen één service aan en geven het resultaat terug.

Beveiliging: bcrypt-wachtwoorden, sessietokens enkel als SHA-256-hash opgeslagen, httpOnly-cookies, rate limiting op login, admin-routes afgeschermd in `hooks.server.ts` én in elke service.

## Lokaal draaien

```bash
cp .env.example .env     # pas admin-wachtwoorden aan!
pnpm install
pnpm dev                 # http://localhost:5173
```

## Productie met Docker

```bash
cp .env.example .env     # vul admin-accounts en ORIGIN (bv. https://appspi.jouwdomein.be) in
docker compose up -d --build
```

De database staat in het volume `appspi-data` (`/data/appspi.db`). Back-up: kopieer dat bestand.

Achter een reverse proxy: zet `ORIGIN` op de publieke URL; eventueel `ADDRESS_HEADER=X-Forwarded-For` voor correcte IP's bij de login-rate-limiting.

De admin-accounts worden enkel aangemaakt als ze nog niet bestaan; daarna kunnen de wachtwoorden via **Profiel** gewijzigd worden.
