## Router, Deployment, Auth og Web Security Mundtlig Script

Kort og naturligt script pa dansk, baseret pa projektets kode.

## 1. React Router

"React Router bruges til navigation i en React-app uden at reloade hele siden. I mit projekt bruger jeg det til at koble URL'er som `/`, `/catering`, `/profile` og `/admin` til bestemte komponenter. Det loser problemet med client-side navigation og gør appen mere flydende."

## 2. Vigtige byggesten i React Router

"De vigtigste byggesten i mit projekt er `BrowserRouter`, `Routes`, `Route`, `Navigate`, `NavLink`, `useNavigate` og `useLocation`. `BrowserRouter` wrapper appen, `Route` kobler path til komponenter, `Navigate` bruges til redirects, og `NavLink` bruges til navigation med active state."

## 3. Flexbox og grid i CSS

"Flexbox og grid bruges til layout. Flexbox er bedst til en dimension, for eksempel en navbar eller en række knapper. Grid er bedst til to dimensioner, for eksempel sektioner med kolonner eller kortlayouts. I mit projekt bruger jeg flexbox til topbaren og grid til blandt andet menu- og booking-layouts."

## 4. Deployment gennem CI/CD

"Deployment-flowet i projektet er, at jeg pusher kode til `main`, GitHub Actions bygger et Docker-image, og workflowet pusher det til Docker Hub. Derefter kan serveren hente det nye image og starte containeren via `docker-compose`. Til sidst sørger Caddy for at gøre appen tilgaengelig via domænet."

## 5. Formaalet med Caddy

"Caddy bruges som webserver og reverse proxy. Den kan tage imod requests pa domænet, sende dem videre til frontend-containeren og samtidig handtere HTTPS-certifikater automatisk. Derfor er Caddy vigtig i deployment, selv om React-appen ikke selv styrer HTTPS."

## 6. Hvordan vi bruger Caddy

"Konceptuelt star Caddy foran applikationen. Brugeren rammer domænet, Caddy modtager requesten, og derefter sender Caddy trafikken videre til frontend-containeren. Caddy kan ogsa serve statiske filer og styre certifikater og HTTPS-fornyelse."

## 7. JWT authentication flow

"Et typisk JWT-flow er, at brugeren logger ind, backend returnerer et token, frontend gemmer tokenet og sender det med i senere API-kald. I mit projekt bliver tokenet gemt i `localStorage`, og det bliver sendt som `Authorization: Bearer ...` i requests til beskyttede endpoints."

## 8. JWT-tokenets dele

"Et JWT-token bestar af tre dele: header, payload og signature. Headeren beskriver token-typen og algoritmen, payload indeholder claims som bruger-id eller rolle, og signaturen bruges til at kontrollere, at tokenet er gyldigt og ikke er blevet aendret."

## 9. Hvordan vi bruger JWT i appen

"I mit projekt bruger vi JWT til at holde styr pa login-sessionen. Tokenet gemmes i browseren, og ved senere requests bliver det sendt i request-headeren. Vi dekoder ogsa payloaden for at hente information som bruger-id og rolle."

## 10. Login-processen med JWT

"Brugeren skriver email og password i `AuthModal`. Formularen kalder `login(credentials)`, som sender credentials til backend. Hvis backend returnerer et token, bliver det gemt i `localStorage`, og appen opretter en bruger-session og navigerer brugeren videre til `profile` eller `admin`."

## 11. HTTPS

"HTTPS er HTTP over TLS. Det betyder, at trafikken mellem browser og server er krypteret. Det beskytter data og bekræfter serverens identitet. I vores setup bliver HTTPS typisk handteret af Caddy, som automatisk henter og fornyer certifikater."

## 12. Sub-routing

"Jeg har ikke egentlig nested routing i den nuværende kode, men konceptuelt kunne man have noget som `/admin/users` eller `/admin/products`. I dag bruger appen top-level routes og skifter admin-indhold internt med tabs i stedet for URL-baseret sub-routing."

## 13. SOP og CORS

"Same Origin Policy er en browser-sikkerhedsregel, som forhindrer en side i frit at hente data fra en anden origin. CORS er mekanismen, hvor serveren kan sige, at cross-origin requests er tilladt. Altsa: SOP er blokeringen, og CORS er den kontrollerede undtagelse."

## 14. Hvordan vi undgar CORS-fejl

"I mit projekt undgar vi CORS-problemer i development ved at bruge `/api` som base path, sa requests kan ga gennem samme origin eller en proxy. I produktion bruger vi en HTTPS-API-URL, og der skal backend eller reverse proxy saettes op korrekt, sa browseren accepterer requesten."

## Kort afslutning

"Samlet set viser projektet, hvordan routing, layout, deployment, reverse proxy, JWT-login, HTTPS og CORS fungerer sammen i en rigtig frontend-applikation. Det gor det lettere at forklare teorien ud fra virkelig kode og virkelig drift."
