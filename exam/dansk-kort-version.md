## Dansk Kort Version

Kort samlet repetition til mundtlig eksamen.

## JavaScript

### Higher-order functions

En higher-order function er en funktion, der enten tager en anden funktion som argument eller returnerer en funktion. I projektet bruger jeg for eksempel `map`, `reduce` og `Promise.all`.

### Callbacks

En callback er en funktion, der bliver sendt ind i en anden funktion. Jeg bruger callbacks i `map`, `setTimeout` og `addEventListener`.

### `package.json`

`package.json` beskriver projektet, dependencies og scripts. I dette projekt bruges den blandt andet til `npm run dev`, `npm run build` og `npm run lint`.

### `fetch`

`fetch` bruges til at sende requests til backend. I projektet er det pakket ind i en helper-funktion, sa vi genbruger headers og error handling.

### Synkron og asynkron kode

Synkron kode korer trin for trin med det samme. Asynkron kode bruges, nar noget tager tid, som for eksempel API-kald. `async` og `await` gor den asynkrone kode lettere at lase.

### `localStorage` og `sessionStorage`

`localStorage` gemmer data, selv om browseren lukkes. `sessionStorage` varer kun i den aktuelle session eller fane. I projektet bruges `localStorage` til token og brugerdata.

### DOM manipulation

DOM manipulation betyder, at man aendrer elementer eller attributter med JavaScript. I projektet sker det blandt andet i SEO-koden, hvor meta-tags oprettes og opdateres.

### Event bubbling

Event bubbling betyder, at en event starter pa det inderste element og derefter bobler op gennem parent-elementer. Det kan stoppes med `stopPropagation()`.

### Scope

Scope betyder, hvor en variabel er synlig. Lokale variabler findes kun i en funktion eller blok, mens top-level konstanter typisk er tilgaengelige i hele filen.

### Spread og rest

Spread bruges til at folde eller kopiere vaerdier ud. Rest bruges til at samle de resterende vaerdier i en ny variabel.

## React

### Components

En React component er en genbrugelig del af UI'et med sin egen logik. I projektet er `Menu`, `Profile` og `AuthModal` eksempler.

### Fordele ved components

Components gor det lettere at genbruge kode, opdele appen i sma dele og undga manuel DOM-styring.

### JSX

JSX er HTML-lignende syntax inde i JavaScript. Det gor React-komponenter lettere at laese og skrive.

### Props og `children`

Props bruges til at sende data og funktioner fra parent til child. `children` bruges, nar en component skal wrappe andet indhold.

### State

State er data, som kan aendre sig i en component. Nar state aendrer sig, renderer React komponenten igen.

### Error handling

I React-projektet bruges `try/catch` sammen med error state som `setError` eller `setRequestsError`, sa fejl kan vises i UI'et.

### Conditional rendering

Conditional rendering betyder, at man kun viser noget, hvis en betingelse er opfyldt. Jeg bruger `&&`, ternary operators og nogle steder `return null`.

### `useEffect`

`useEffect` bruges til side effects som API-kald og event listeners. Dependency arrayet bestemmer, hvornar effekten skal kore igen.

### Event handling

React bruger props som `onClick`, `onChange` og `onSubmit` til events.

### Forms

Ved formularer bruger jeg `event.preventDefault()`, validerer input, sender data asynkront og opdaterer loading, success og error state.

### Lister og `key`

`map` bruges til at render lister i JSX. `key` bruges af React til at holde styr pa hvert element mellem renders.

### Controlled vs uncontrolled

I projektet bruges mest controlled inputs, hvor input-vaerdien ligger i React state og opdateres med `onChange`.

### Hooks

Hooks er indbyggede React-funktioner. I projektet bruges blandt andet `useState`, `useEffect`, `useMemo`, `useRef` og `useCallback`.

## Router, deployment og sikkerhed

### React Router

React Router bruges til navigation uden full page reload. I projektet bruges `BrowserRouter`, `Routes`, `Route`, `Navigate`, `NavLink`, `useNavigate` og `useLocation`.

### Flexbox og grid

Flexbox bruges bedst til en dimension, for eksempel en navbar eller en knap-rakke. Grid bruges bedst til to dimensioner, for eksempel kolonner, kortlayouts og sektioner.

### CI/CD deployment

Flowet er: push til `main`, GitHub Actions bygger Docker-image, imaget pushes til Docker Hub, serveren henter imaget, og containeren startes via `docker-compose`.

### Caddy

Caddy bruges som reverse proxy og til HTTPS. Den kan sende trafik videre til frontend-containeren og handtere certifikater automatisk.

### JWT

Et typisk JWT-flow er: bruger logger ind, backend returnerer token, frontend gemmer token, og token sendes senere med som `Authorization: Bearer ...`.

### JWT dele

Et JWT bestar af tre dele: header, payload og signature.

### Login flow

Brugeren logger ind via formularen, frontend sender credentials til backend, backend returnerer token, token gemmes, og appen opdaterer brugerens session.

### HTTPS

HTTPS er HTTP over TLS. Det betyder, at trafikken er krypteret og serveren kan verificeres. I deployment handteres det typisk af Caddy.

### Sub-routing

Projektet bruger top-level routes, men sub-routing ville vaere noget som `/admin/users` eller `/admin/products`.

### SOP og CORS

Same Origin Policy er browserens sikkerhedsregel, der blokerer usikre cross-origin requests. CORS er mekanismen, hvor serveren kan tillade dem. I development undgas mange CORS-problemer ved at bruge `/api` som base path.

## Gode korte saetninger til eksamen

1. "I mit projekt er et godt eksempel..."
2. "Formalet med det her er..."
3. "Fordelen er, at..."
4. "Konceptuelt fungerer det ved, at..."
5. "I kodebasen kan man se det i..."
