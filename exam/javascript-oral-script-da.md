## JavaScript Mundtlig Eksamensscript

Kort og naturligt script pa dansk, baseret pa projektets kode.

## 1. Higher-order functions

"En higher-order function er en funktion, som enten tager en anden funktion som argument eller returnerer en funktion. I mit projekt bruger jeg for eksempel `reduce` og `map`. I `Menu.jsx` bruger jeg `reduce` til at gruppere produkter efter type. Fordelen er, at koden bliver mere kort, mere tydelig og lettere at genbruge."

## 2. Callback-funktioner

"En callback er en funktion, som sendes ind i en anden funktion. I mit projekt bruger jeg callbacks i `map`, `setTimeout` og `addEventListener`. Det er smart, fordi jeg kan bestemme, hvad der skal ske, nar noget bliver klikket pa, nar tid gar, eller nar data skal behandles."

## 3. `package.json`

"`package.json` er projektets konfigurationsfil. Den indeholder information om projektet, dependencies og scripts. I det her projekt kan jeg for eksempel kore `npm run dev`, `npm run build` og `npm run lint`, fordi de star i `package.json`."

## 4. `fetch`

"`fetch` bruger man til at sende requests til en server eller et API. I mit projekt har jeg samlet det i en helper-funktion, der hedder `fetchJson`, sa jeg kan genbruge logik til headers og error handling. Jeg bruger den blandt andet til login og registrering."

## 5. Synkron og asynkron programmering

"Synkron kode korer trin for trin med det samme. Asynkron kode bruger man, nar noget tager tid, for eksempel at hente data fra en server. I mit projekt bruger jeg `async` og `await`, nar jeg loader produkter og opretter requests. Det gor koden lettere at lase, fordi den ligner almindelig synkron kode."

## 6. `localStorage` og `sessionStorage`

"Forskellen er, hvor lange data bliver gemt. `localStorage` bliver bevaret, selv om browseren lukkes. `sessionStorage` forsvinder, nar fanen eller sessionen slutter. I mit projekt bruger jeg `localStorage` til at gemme token og brugerinformation, sa brugeren kan forblive logget ind."

## 7. Storage i browserens developer tools

"I developer tools kan jeg ga ind under Application og se browserens storage. I det her projekt ville jeg vise Local Storage, hvor appen gemmer `mm_api_token` og `mm_api_user`. Jeg kan ogsa naevne andre typer som Session Storage, Cookies og IndexedDB."

## 8. DOM manipulation

"DOM manipulation betyder, at man aendrer HTML-elementer eller attributter med JavaScript. I mit projekt gor jeg det i SEO-komponenten, hvor jeg opretter eller opdaterer meta-tags i `document.head`. Det er et tydeligt eksempel pa direkte DOM manipulation."

## 9. Event bubbling

"Event bubbling betyder, at en event starter pa det element, man klikker pa, og derefter bobler op til parent-elementer. I mit projekt bruger jeg `stopPropagation()` pa en knap, sa et klik pa knappen ikke ogsa aktiverer parent-elementets drag-handler."

## 10. Scope

"Scope betyder, hvor en variabel er synlig i koden. En lokal variabel findes kun inde i en funktion eller blok. I mit projekt er for eksempel `response` lokal inde i en funktion, mens konstanter som `TOKEN_STORAGE_KEY` er tilgaengelige i hele filen."

## 11. Spread og rest operator

"Spread og rest bruger begge `...`, men de gor ikke det samme. Spread bruges til at folde eller kopiere vaerdier ud, for eksempel nar jeg opdaterer state med `{ ...c }`. Rest bruges til at samle de resterende vaerdier, for eksempel `...fetchOptions`."

## Kort afslutning

"Samlet set viser projektet praktisk brug af centrale JavaScript-emner som higher-order functions, callbacks, `fetch`, `async/await`, browser storage, DOM manipulation, event bubbling, scope samt spread og rest. Det gor det lettere at forklare teorien ud fra rigtig kode."
