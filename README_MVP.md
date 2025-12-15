# Afhaalpunt MVP (Netlify + Firebase Auth + Functions + Firestore)

## Wat werkt direct?
- Mooie UI + sidebar menu
- Login/Logout (Firebase Auth)
- Routes: Dashboard, Inscan, Ophaal, Zoeken
- Admin (moderator): Rekken + Logs
- Ophaal ondersteunt handmatig plakken + Camera QR (html5-qrcode)

## Backend (Firebase Functions)
- scanning_lookupByScan (match scanValue -> package + locatie)
- packages_intakeScan
- packages_assignLocation (maakt display 1•2•3)
- packages_assignSubNo (subNo uniek via activeSubNumbers)
- packages_pickup (release subNo + status)
- packages_remove (release subNo + status + reason)
- locations_listRacks / locations_upsertRack
- audit_listEvents

## OS-invariants
- UI spreekt NOOIT direct Firestore (rules zijn dicht)
- Alle writes bevatten createdAt/updatedAt/createdBy (Functions doen dit)
- Alles is modulair + INTERFACE.json

## Wat heb ik van jou nodig (eenmalig) om live te krijgen?
1) Zet in `src/core/shared/roles.js` jouw moderator email(s).
2) Firebase Console:
   - Authentication: Email/Password aan
   - Users: maak moderator + medewerker aan
   - Authorized domains: voeg je Netlify domein toe
3) GitHub Secrets (voor auto-deploy, zonder terminal):
   - FIREBASE_PROJECT_ID = afhaalpunt-app
   - GCP_SA_KEY = service account JSON (zie instructies in chat)
