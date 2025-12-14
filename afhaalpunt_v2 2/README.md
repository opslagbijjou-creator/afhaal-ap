# Afhaalpunt v2 (Medewerker/Moderator/Inscan mappen)
Plak je Firebase config in `firebase.js` en deploy (Netlify/GitHub).

## Structuur
- src/core/ (engine)
- src/medewerker/ (medewerker app)
  - inscan/
  - ophaal/
  - overzicht/
- src/moderator/ (moderator app)
- src/shared/ (shared login + data)


## Belangrijk (anders werkt het niet)
- Vul `firebase.js` met jouw Firebase Web App config.
- Gebruik een lokale webserver (bijv. VS Code Live Server) of deploy op HTTPS; ES modules werken niet via `file://`.
- Camera/scan werkt alleen op `https://` of `http://localhost`.
