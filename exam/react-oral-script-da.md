## React Mundtlig Eksamensscript

Kort og naturligt script pa dansk, baseret pa projektets kode.

## 1. React component

"En React component er en genbrugelig del af brugerfladen med sin egen logik. I mit projekt er `Menu`, `Profile` og `AuthModal` gode eksempler. En component kan modtage props, have sin egen state og returnere JSX."

## 2. Fordele ved components frem for vanilla JavaScript

"Fordelen ved components er, at man opdeler appen i sma dele, som er nemmere at genbruge og vedligeholde. I stedet for at styre DOM manuelt med `document.createElement` og `addEventListener`, beskriver man i React bare, hvordan UI skal se ud ud fra data og state."

## 3. JSX

"JSX er en syntax i React, hvor man skriver HTML-lignende kode inde i JavaScript. Det gor komponenter lettere at lase. For eksempel bruger jeg JSX til at render lister, knapper og betinget indhold i komponenter som `FAQ` og `Menu`."

## 4. Samme funktionalitet med kun JavaScript, HTML og DOM

"Hvis jeg ikke brugte React, skulle jeg selv oprette elementer, saette tekst, tilfoje classes og oprette event listeners manuelt. Jeg skulle ogsa selv styre, hvordan UI bliver opdateret, nar data aendrer sig. React gor det meget mere overskueligt ved at koble rendering sammen med state."

## 5. Props og `children`

"Props bruges til at sende data og funktioner fra en parent component til en child component. I mit projekt sender `App` for eksempel `user`, `products` og handlers ned til andre komponenter. `children` bruges, nar en component skal kunne wrappe andet indhold, som i min `Page` component."

## 6. State

"State bruges til data, som kan aendre sig i en component. I `AuthModal` har jeg state til email, password, loading og fejlbeskeder. Nar state aendrer sig, renderer React komponenten igen automatisk."

## 7. Error handling i React

"I mit projekt handler jeg fejl med `try/catch` og state. Hvis et API-kald fejler, gemmer jeg fejlbeskeden i for eksempel `setError` eller `setRequestsError`, og sa viser jeg den i UI'et. Det bruger jeg blandt andet i `Profile`, `AuthModal` og `EmailPanel`."

## 8. Conditional rendering

"Conditional rendering betyder, at man kun viser noget, hvis en betingelse er opfyldt. I mit projekt bruger jeg `&&` til loading og fejl, ternary operators til mindre valg, og nogle steder returnerer jeg `null`, hvis noget slet ikke skal vises."

## 9. `useEffect`

"`useEffect` bruges til side effects, for eksempel at hente data eller tilfoje event listeners. I `Profile` bruger jeg `useEffect` til at hente brugerens requests, nar bruger-id'et findes. Dependency arrayet bestemmer, hvornar effekten skal kore igen. Man kan ogsa returnere en cleanup-funktion."

## 10. Event handling i React

"I React bruger man props som `onClick`, `onChange` og `onSubmit` til events. I mit projekt bruger jeg `onClick` pa knapper, `onChange` pa inputs og `onSubmit` pa formularer. React gor det nemt at koble brugerhandlinger direkte til state og funktioner."

## 11. Form submit events

"Nar en formular bliver sendt, bruger jeg `event.preventDefault()` for at undga en normal page reload. Derefter validerer jeg felterne, sender data asynkront og opdaterer loading, success eller error state. Det kan ses i `AuthModal` og `EmailPanel`."

## 12. `map` og `key`

"Jeg bruger `map` til at render lister af data som JSX. For eksempel i `Menu` og `FAQ`. Hver liste-item skal have en `key`, sa React kan holde styr pa, hvilket element der er hvilket mellem renders. Det er bedst at bruge en stabil unik vaerdi som et id."

## 13. Controlled og uncontrolled components

"I mit projekt bruger jeg mest controlled components. Det betyder, at input-vaerdien ligger i React state og bliver opdateret med `onChange`. Fordelen er, at validering og reset bliver lettere. Uncontrolled components styres i stedet direkte af DOM'en, ofte via refs."

## 14. React Hooks

"Hooks er indbyggede React-funktioner, som giver funktionelle komponenter adgang til ting som state og lifecycle-lignende funktionalitet. I mit projekt bruger jeg blandt andet `useState`, `useEffect`, `useMemo`, `useRef` og `useCallback`."

## 15. Eksempel pa fejlhaandtering i React

"Et godt eksempel er `EmailPanel`, hvor jeg validerer formularen, nulstiller tidligere fejl, prover at sende emailen med `try/catch`, og derefter viser enten success eller fejl i UI'et. Det er en typisk maade at handle fejl pa i React-applikationer."

## Kort afslutning

"Samlet set viser projektet de centrale React-koncepter i praksis: components, props, state, hooks, event handling, formularer, conditional rendering, lister og error handling. Det gor det lettere at forklare teorien med udgangspunkt i rigtig kode."
