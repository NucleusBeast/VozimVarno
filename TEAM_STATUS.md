# VozimVarno - trenutno stanje po clanih

Datum pregleda: 3. junij 2026

Ta dokument povzema dejansko stanje kode glede na `TEAM_PLAN.md`. Statusi niso samo prepis checkboxov iz plana, ampak temeljijo na trenutnih datotekah v `src/` in `backend/convex/`.

## Kratek povzetek

Projekt je iz prototipa ze premaknjen v delno funkcionalno aplikacijo. Obstajajo realni moduli za senzorje, scoring, dovoljenja, lokalno shrambo, Convex domenske tabele, nastavitve, profil, izzive, vreme in zgodovino vozenj.

Najvecja odprta vrzel je integracija GPS poti in zunanjih podatkov v glavni tok `useRideSession`. Trenutno aktivna voznja uporablja senzorje in scoring, GPS/location modul pa obstaja loceno in ni zares povezan v shranjeno voznjo. Mapa je se SVG prikaz poti, ne prava map komponenta. Mikrofon in kamera sta osnovna oziroma mock modula, ne produkcijska ML zaznava.

## Clan 1 - Lovro Cus

Odgovornost iz plana: kamera, senzorji in scoring.

### Narejeno

- Dodan je `expo-sensors`.
- Obstaja modul za pospeskometer: `src/services/sensors/accelerometerService.ts`.
- Obstaja modul za giroskop: `src/services/sensors/gyroscopeService.ts`.
- Senzorja imata realen Expo Sensors tok in simulacijski fallback za web/simulator.
- Obstaja incident detector: `src/services/sensors/incidentDetector.ts`.
- Incident detector zazna:
  - mocno zaviranje,
  - mocno pospesevanje,
  - ostro zavijanje.
- Incident ima tip, cas, jakost, hitrost in opcijsko lokacijo.
- Obstaja scoring algoritem 0-100: `src/services/scoring/index.ts`.
- `useRideSession` poveze senzorje, incidente, scoring in zakljucek voznje.
- `ActiveRideScreen` prikazuje dejanske incidente iz stanja voznje namesto staticnih stevil.
- `SummaryScreen` prikaze oceno in stevilke incidentov iz dejanske voznje.
- `RatingScreen` loceno shrani uporabnikovo oceno in komentar.
- Obstaja kamera/fatigue modul: `src/services/camera/cameraService.ts`.
- Senzorji in fatigue mock se ustavijo ob koncu voznje oziroma unmountu.

### Delno narejeno

- Kamera/fatigue je trenutno mock oziroma modularni placeholder, ne prava ML zaznava.
- Dovoljenje za kamero se preverja v `PrepareScreen`, vendar nastavitev `cameraEnabled` se ne uporablja dosledno za sam permission flow.
- Lokacija v incidentih je podprta v tipu, ampak `useRideSession` trenutno senzorjem ne poda realne lokacije.

### Se manjka

- Testiranje pragov na fizicni napravi.
- Boljsa kalibracija za razlicne orientacije telefona v avtu.
- Morebitna zaznava `speed_exceeded`.
- Prava implementacija fatigue detection z modelom ali vsaj boljsim demo scenarijem.
- Povezava incidentov z GPS lokacijo iz glavnega ride session toka.

## Clan 2 - Filip Skrget

Odgovornost iz plana: GPS, pot, zunanji podatki in backend integracija.

### Narejeno

- Dodan je `expo-location`.
- `PrepareScreen` preverja in zahteva GPS dovoljenje.
- Obstaja location modul: `src/services/location/`.
- `useRideLocation` zna spremljati GPS tocke, trenutno hitrost, accuracy in status.
- `useRideSession` zdaj neposredno uporablja GPS watcher med aktivno voznjo.
- `useRideSession` sproti posodablja hitrost in GPS status iz realnih GPS vzorcev.
- Incident detector dobi trenutno GPS lokacijo, zato incidenti lahko vsebujejo latitude/longitude.
- Obstajajo helperji za:
  - pretvorbo lokacije v `RidePoint`,
  - izracun razdalje,
  - povprecno hitrost,
  - najvisjo hitrost.
- Tip `RidePoint` vsebuje latitude, longitude, speedKmh, timestamp in altitude.
- Ob zakljucku voznje se shranijo dejanske GPS tocke, razdalja, najvisja hitrost in povprecna hitrost.
- Convex schema ima domenske tabele:
  - `rides`,
  - `ridePoints`,
  - `rideIncidents`,
  - `userSettings`.
- Obstaja Convex modul `backend/convex/rides.ts` z mutacijami/queryji za ustvarjanje, tocke, incidente, zakljucek, zgodovino in podrobnosti.
- Ob zakljucku voznje se voznja lokalno shrani in se nato best-effort sinhronizira v Convex.
- `HistoryScreen` bere shranjene voznje iz lokalne hrambe in odpira podrobnosti z `rideId`.
- `DetailsScreen` zna prikazati dejanske podrobnosti voznje iz lokalne hrambe.
- `MapCard` zna narisati pot iz `RidePoint[]` kot SVG polyline.
- `MapCard` na native platformah uporablja `react-native-maps` za dejanski map prikaz poti, na webu ostane SVG fallback.
- Obstaja weather REST integracija: `src/services/api/weather.ts`.
- Weather API ima cache/fallback prek AsyncStorage.
- Weather API je priklopljen v zakljucek voznje in se shrani v `Ride.weather`, ce obstaja zadnja GPS tocka.

### Delno narejeno

- Convex sync je best-effort po zakljucku voznje, ne pa se popoln dvosmerni sync z lokalno vrsto za kasnejse poskuse.
- Zgodovina in podrobnosti se se vedno primarno bereta iz lokalne hrambe, ne direktno iz Convex queryjev.
- Web prikaz mape ostaja SVG fallback, ker `react-native-maps` je native komponenta.

### Se manjka

- Dodati zanesljivo retry vrsto za neuspele Convex synce.
- Po potrebi prikazati Convex zgodovino na drugi napravi, ne samo lokalno shranjenih vozenj.
- Testirati GPS in map prikaz na fizicni napravi.

## Clan 3 - Marko Kramer

Odgovornost iz plana: lokalna baza, mikrofon, UI/nastavitve in finalna integracija.

### Narejeno

- Izbrana je lokalna hramba prek AsyncStorage/SecureStore kombinacije.
- Obstaja `src/services/storage/rideStorage.ts` za voznje, povzetke, podrobnosti, brisanje in statistiko.
- Obstaja `src/services/storage/settingsStorage.ts` za nastavitve.
- Ride storage normalizira stare/nepopolne voznje.
- `HistoryScreen` uporablja lokalno shranjene voznje, z demo fallbackom ko ni podatkov.
- `ProfileScreen` uporablja dejanskega Convex uporabnika in lokalno statistiko vozenj.
- `ProfileScreen` podpira urejanje imena.
- `SettingsScreen` je funkcionalen za obvestila, enote, temo in toggle nastavitve za kamero/GPS/mikrofon.
- Nastavitve se shranjujejo lokalno in se sinhronizirajo s Convex `settings`.
- `ChallengesScreen` izracuna izzive iz shranjenih vozenj, z demo fallbackom.
- Obstaja audio/microphone modul: `src/services/audio/microphoneService.ts`.
- Navigacija je izboljsana z lokalnim `NavigationProvider` in parametri.
- Dodani so osnovni empty/fallback state-i v zgodovini, podrobnostih in izzivih.

### Delno narejeno

- Mikrofon modul obstaja, ampak ni povezan v `useRideSession` ali UI aktivne voznje.
- Noise alert ni pretvorjen v `Incident` med voznjo.
- Nastavitve pragov za incidente obstajajo v tipu/storage/backendu, ampak niso prikazane kot editabilni kontrolniki v UI.
- Tema se shrani, vendar ni globalno uporabljena za dejanski dark mode.
- Navigacija je boljsa, ni pa Expo Router ali React Navigation.
- Offline fallback obstaja lokalno, vendar ni prave sync vrste za kasnejso sinhronizacijo.

### Se manjka

- Integrirati `startNoiseMonitoring`/`stopNoiseMonitoring` v `useRideSession`.
- Iz hrupa ustvariti `noise_alert` incidente s pragom iz nastavitev.
- Dodati UI za urejanje pragov incidentov.
- Uporabiti shranjeno temo v celotni aplikaciji.
- Pripraviti sync lokalnih vozenj s Convex backendom ali jasno omejiti scope na lokalno hrambo.
- Dodati bolj jasne loading/error state-e pri Convex napakah.
- Preveriti responsive prikaz na manjsih zaslonih.
- Pripraviti finalni demo scenarij in seed/test voznjo.

## Skupne stvari, ki so narejene

- Expo/React Native/TypeScript osnova.
- Vizualni UI prototip.
- Login/register/logout prek Convex Auth.
- Dovoljenja za kamero, GPS in mikrofon v pripravi na voznjo.
- Senzorji in incident detection.
- Scoring 0-100.
- Lokalna hramba vozenj in nastavitev.
- Zgodovina in podrobnosti iz lokalne hrambe.
- Convex domenska schema in ride/settings/users moduli.
- Weather REST API z lokalnim cache/fallbackom.
- Profil iz dejanskega uporabnika.
- Izzivi iz shranjenih vozenj.
- Osnovna navigacija s parametri.

## Skupne stvari, ki se manjkajo

- Fizicno testiranje na telefonu ali development buildu.
- Testiranje GPS integracije v glavnem ride sessionu na fizicni napravi.
- Integracija mikrofon/hrup v glavni ride session.
- Poln retry sync za lokalno shranjene voznje v Convex.
- Produkcijska mapa je na native platformah dodana, web ima fallback.
- Produkcijska fatigue/ML zaznava ali dodelan demo fallback.
- Pravi globalni dark mode.
- Finalni demo scenarij.

## Priporocen naslednji vrstni red dela

1. Lovro preizkusi pragove senzorjev na napravi in potrdi, da GPS lokacija incidentov deluje v realnem toku.
2. Marko poveze mikrofon v `useRideSession` in doda `noise_alert` incidente.
3. Filip testira novo GPS/map/weather integracijo na telefonu z dejansko voznjo ali sprehodom.
4. Ekipa se odloci, ali se doda retry vrsta za Convex sync ali ostane lokalna hramba primarni demo vir.
5. Ekipa pripravi eno zanesljivo demo voznjo za zagovor.
