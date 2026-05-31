# VozimVarno - ekipni backlog in razdelitev dela

Ta dokument razdeli preostalo delo za skupni projekt `VozimVarno`.
Osnova je projektna priprava iz PDF-ja `PripravaNaProjekt_ReactNativeExpo.pdf` in trenutno stanje tega repozitorija.

Projekt je React Native/Expo aplikacija za spremljanje varnosti voznje. Cilj je uporabniku med voznjo in po njej ponuditi podatke o nacinu voznje, incidentih, poti, oceni varnosti in priporocilih.

## 1. Trenutno ze implementirano

To ze obstaja in se uporabi kot osnova:

- React Native + Expo projekt s TypeScriptom
- osnovna struktura zaslonov v `src/screens/`
- vizualno dodelan mobilni UI prototip
- osnovna navigacija prek lokalnega `screen` state-a v `App.tsx`
- zacetni zasloni:
  - splash screen
  - prijava / registracija
  - domov
  - priprava na voznjo
  - aktivna voznja
  - povzetek voznje
  - zgodovina vozenj
  - podrobnosti voznje
  - ocenjevanje
  - izzivi
  - profil
  - nastavitve
- Convex backend mapa v `backend/`
- Convex Auth z e-posto in geslom
- osnovni login/register flow prek `@convex-dev/auth`
- osnovna odjava v profilu
- staticni demo podatki za zgodovino vozenj in izzive v `src/data.ts`
- UI komponente za gumbe, forme, header, bottom nav, metrike, score ring in demo mapo
- simuliran cas aktivne voznje
- simuliran prikaz hitrosti, pospeskov, zaviranj, GPS statusa in ocene

## 2. Klucne vrzeli do celovitega projekta

To je treba se narediti, da bo projekt skladen s projektno pripravo iz PDF-ja:

1. prava navigacija z Expo Router ali React Navigation
2. prava dovoljenja za kamero, lokacijo, senzorje in mikrofon
3. zajem GPS lokacije in hitrosti med voznjo
4. zajem pospeskometra in giroskopa med voznjo
5. zaznava nevarnih manevrov:
   - mocno pospesevanje
   - mocno zaviranje
   - ostro zavijanje
   - morebitno prekoracenje hitrosti
6. scoring algoritem, ki iz incidentov izracuna oceno 0-100
7. lokalna baza za voznje, incidente in GPS tocke
8. shranjevanje in prikaz resnicne zgodovine vozenj
9. prikaz poti na pravi mapi
10. vremenski ali cestni REST API
11. kamera za zaznavo utrujenosti oziroma vsaj modularna priprava za ML
12. mikrofon za zaznavo hrupa oziroma jokajocega otroka
13. nastavitve pragov, dovoljenj, teme in enot naj bodo funkcionalne
14. profil naj uporablja podatke prijavljenega uporabnika
15. backend schema naj vsebuje domenske tabele, ne samo auth tabel
16. testiranje na fizicni napravi ali Development Buildu
17. finalna stabilizacija, napake, dovoljenja, baterija in demo scenarij

## 3. Priporocena delitev med 3 clane

Razdelitev sledi PDF-ju:

- Clan 1: Lovro Cus - funkcionalnosti 1, 2, 3
- Clan 2: Filip Skrget - funkcionalnosti 4, 5, 3
- Clan 3: Marko Kramer - funkcionalnosti 6, 7, 8

### Clan 1 - Kamera, senzorji in scoring

**Odgovornost:** zaznava utrujenosti, analiza nacina voznje in ocena varnosti.

**Glavni cilj:** iz staticnega prikaza aktivne voznje narediti dejanski modul, ki bere podatke iz naprave in iz njih izracuna varnostno oceno.

**Datoteke / moduli:**

- `src/screens/PrepareScreen.tsx`
- `src/screens/ActiveRideScreen.tsx`
- `src/screens/SummaryScreen.tsx`
- `src/screens/RatingScreen.tsx`
- nova mapa: `src/services/sensors/`
- nova mapa: `src/services/scoring/`
- nova mapa: `src/hooks/`

**Naloge:**

- [ ] dodaj Expo Sensors dependency, ce se ekipa odloci za Expo managed izvedbo
- [ ] pripravi hook za pospeskometer
- [ ] pripravi hook za giroskop
- [ ] doloci pragove za:
  - mocno pospesevanje
  - mocno zaviranje
  - ostro zavijanje
  - tresljaje / sum meritev
- [ ] med aktivno voznjo belezi incidente s casovnim zigom
- [ ] naredi osnovni model incidenta:
  - tip
  - cas
  - jakost
  - trenutna hitrost, ce je na voljo
  - lokacija, ce je na voljo
- [ ] zamenjaj staticne vrednosti v `ActiveRideScreen` z dejanskim stanjem voznje
- [ ] pripravi scoring algoritem 0-100
- [ ] v `SummaryScreen` prikazi resnicno stevilo incidentov
- [ ] v `RatingScreen` loceno obravnavaj uporabnikovo samooceno in sistemsko oceno
- [ ] pripravi modularen vmesnik za kamero:
  - dovoljenje za kamero
  - vklop / izklop zaznave utrujenosti
  - placeholder za ML rezultat
- [ ] ce cas dopusca, dodaj osnovno zaznavo utrujenosti z enostavnim mock ali prototipnim modelom
- [ ] poskrbi, da se senzorji pravilno ustavijo ob koncu voznje

**Definition of done:**

- aktivna voznja uporablja realne senzorje ali jasno locen simulacijski fallback
- incidenti niso vec samo staticno besedilo
- povzetek voznje dobi oceno iz scoring algoritma
- senzorji se ne izvajajo po zakljucku voznje
- kamera modul je pripravljen za nadaljnji ML del ali ima osnovno demo zaznavo

---

### Clan 2 - GPS, pot, zunanji podatki in backend integracija

**Odgovornost:** sledenje poti, hitrosti, zunanji REST podatki in podatkovni model za voznje.

**Glavni cilj:** aplikacija mora znati shraniti dejansko voznjo s potjo, hitrostjo in kontekstom iz spleta.

**Datoteke / moduli:**

- `src/screens/ActiveRideScreen.tsx`
- `src/screens/DetailsScreen.tsx`
- `src/components/metrics.tsx`
- `backend/convex/schema.ts`
- nova mapa: `backend/convex/`
- nova mapa: `src/services/location/`
- nova mapa: `src/services/api/`
- nova mapa: `src/state/`

**Naloge:**

- [ ] dodaj Expo Location dependency
- [ ] pripravi dovoljenje za lokacijo v `PrepareScreen`
- [ ] med voznjo pridobivaj GPS koordinate
- [ ] iz GPS-a pridobivaj trenutno hitrost
- [ ] zamenjaj staticno hitrost `72` v `ActiveRideScreen` z realno ali fallback vrednostjo
- [ ] belezi GPS tocke:
  - latitude
  - longitude
  - speed
  - timestamp
  - altitude, ce je na voljo
- [ ] pripravi podatkovni model za voznjo v Convexu:
  - rides
  - ridePoints
  - rideIncidents
  - userSettings
- [ ] pripravi Convex queries/mutations za:
  - ustvarjanje voznje
  - dodajanje GPS tock
  - dodajanje incidentov
  - zakljucek voznje
  - branje zgodovine
  - branje podrobnosti voznje
- [ ] povezati `HistoryScreen` z dejanskimi shranjenimi voznjami
- [ ] povezati `DetailsScreen` z dejanskimi podrobnostmi iz baze
- [ ] zamenjati staticno `MapCard` z map komponento ali jasno pripravljeno integracijo
- [ ] pripraviti REST integracijo za vreme ali nevarne ceste
- [ ] cacheirati zunanje podatke, da aplikacija ne pade brez interneta
- [ ] uskladiti podatke s scoring modulom clana 1

**Definition of done:**

- aplikacija med voznjo belezi lokacijo in hitrost
- voznja se lahko shrani v backend ali dogovorjeno podatkovno plast
- zgodovina ne uporablja vec samo `src/data.ts`
- podrobnosti voznje prikazejo dejansko razdaljo, cas, hitrost in pot
- zunanji API je integriran vsaj v osnovni obliki ali ima jasen fallback

---

### Clan 3 - Lokalna baza, mikrofon, UI/nastavitve in finalna integracija

**Odgovornost:** zgodovina, lokalna hramba, mikrofon, nastavitve, profil, uporabniska izkusnja in koncna stabilizacija.

**Glavni cilj:** aplikacijo povezati v uporaben produkt, ki ima nastavitve, profil, lokalno obstojnost podatkov in pripravljen demo tok.

**Datoteke / moduli:**

- `src/screens/HomeScreen.tsx`
- `src/screens/HistoryScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/screens/ChallengesScreen.tsx`
- `src/data.ts`
- `App.tsx`
- nova mapa: `src/services/storage/`
- nova mapa: `src/services/audio/`
- nova mapa: `src/navigation/`

**Naloge:**

- [ ] odlociti se za Expo SQLite, SecureStore, AsyncStorage ali kombinacijo
- [ ] pripraviti lokalno shrambo za:
  - voznje
  - incidente
  - GPS tocke
  - nastavitve
  - nedokoncan sync
- [ ] dodati offline fallback, ce Convex ali internet ni dosegljiv
- [ ] pripraviti sinhronizacijo lokalnih vozenj z backendom
- [ ] dodati Expo Audio oziroma ustrezen audio modul
- [ ] pripraviti dovoljenje za mikrofon
- [ ] dodati osnovno zaznavo hrupa:
  - raven glasnosti
  - cas trajanja
  - prag za opozorilo
- [ ] ce cas dopusca, pripraviti demo zaznavo jokajocega otroka kot mock klasifikacijo ali modularno tocko za ML
- [ ] narediti `SettingsScreen` funkcionalen:
  - obvestila
  - dovoljenja
  - enote
  - tema
  - pragovi za incidente
- [ ] narediti `ProfileScreen` povezan z dejanskim uporabnikom
- [ ] povezati statistike profila z zgodovino vozenj
- [ ] narediti izzive odvisne od shranjenih vozenj
- [ ] izboljsati navigacijo z Expo Router ali React Navigation
- [ ] urediti loading, error in empty states
- [ ] preveriti responsive prikaz na manjsih zaslonih
- [ ] pripraviti finalni demo scenarij za zagovor

**Definition of done:**

- podatki se ne izgubijo ob zaprtju aplikacije
- zgodovina, profil, izzivi in nastavitve niso vec samo staticni prototip
- mikrofon modul ima vsaj osnovno zaznavo hrupa ali jasno demo implementacijo
- aplikacija ima stabilen tok od prijave do zakljucka voznje
- projekt je pripravljen za predstavitev na fizicni napravi ali emulatorju

## 4. Skupne funkcionalnosti, ki jih mora ekipa kot celota pokriti

To so checklist tocke za koncno verzijo:

- [x] osnovni Expo/React Native projekt
- [x] osnovni UI prototip
- [x] osnovna prijava / registracija
- [x] osnovna odjava
- [x] zaslon za novo voznjo
- [x] zaslon aktivne voznje
- [x] zaslon povzetka voznje
- [x] zaslon zgodovine
- [x] zaslon profila
- [x] zaslon nastavitev
- [ ] prava navigacija
- [ ] dovoljenja za kamero
- [ ] dovoljenja za lokacijo
- [ ] dovoljenja za senzorje
- [ ] dovoljenja za mikrofon
- [ ] realen zajem GPS poti
- [ ] realen zajem hitrosti
- [ ] realen zajem pospeskometra
- [ ] realen zajem giroskopa
- [ ] zaznava nevarnih manevrov
- [ ] zaznava utrujenosti ali pripravljen kamera/ML modul
- [ ] zaznava hrupa ali pripravljen mikrofon/ML modul
- [ ] scoring algoritem 0-100
- [ ] shranjevanje voznje
- [ ] lokalna baza ali obstojna hramba
- [ ] backend schema za domenske podatke
- [ ] zgodovina iz dejanskih podatkov
- [ ] podrobnosti voznje iz dejanskih podatkov
- [ ] prikaz poti na mapi
- [ ] vreme ali nevarne ceste prek REST API-ja
- [ ] funkcionalne nastavitve
- [ ] funkcionalen profil
- [ ] izzivi iz dejanskih podatkov
- [ ] offline fallback ali lokalni cache
- [ ] testiranje na fizicni napravi / Development Buildu
- [ ] finalni demo scenarij

## 5. Faze dela

Najbolj varno je projekt razvijati v fazah.

### Faza 1 - stabilizacija osnove

- [ ] ekipa se odloci za navigacijo: Expo Router ali React Navigation
- [ ] ekipa definira skupne TypeScript tipe za `Ride`, `RidePoint`, `Incident`, `UserSettings`
- [ ] Clan 1 pripravi senzorje in scoring skeleton
- [ ] Clan 2 pripravi GPS/location skeleton in Convex schema
- [ ] Clan 3 pripravi lokalno shrambo, nastavitve in audio skeleton

### Faza 2 - jedrni tok voznje

- [ ] Clan 1 poveze pospeskometer/giroskop z incidenti
- [ ] Clan 2 poveze GPS, hitrost in shranjevanje poti
- [ ] Clan 3 poskrbi, da se voznja shrani lokalno in prezivi restart aplikacije
- [ ] ekipa poveze `ActiveRideScreen` -> `SummaryScreen` -> `HistoryScreen`

### Faza 3 - napredne funkcionalnosti

- [ ] Clan 1 doda kamera/utrujenost modul ali kakovosten demo fallback
- [ ] Clan 2 doda REST API za vreme/nevarne ceste in map prikaz
- [ ] Clan 3 doda mikrofon/hrup modul in funkcionalne nastavitve
- [ ] ekipa uredi profil, izzive in statistiko iz dejanskih podatkov

### Faza 4 - integracija in polish

- [ ] uskladitev UI
- [ ] bug fixing
- [ ] testiranje dovoljenj na Android/iOS ali emulatorju
- [ ] preverjanje porabe baterije in ustavljanja senzorjev
- [ ] priprava seed/demo podatkov
- [ ] priprava predstavitvenega scenarija

## 6. Git priporocilo

Da se izognete konfliktom:

- vsak clan dela v svoji veji:
  - `feature/sensors-scoring`
  - `feature/gps-backend-api`
  - `feature/storage-audio-ui`
- `main` naj bo stabilna integracijska veja
- pred merganjem naj vsak clan:
  - potegne zadnji `main`
  - resi konflikte
  - preveri `npm run web` ali ustrezen Expo zagon
  - preveri, da osnovni tok prijava -> nova voznja -> povzetek -> zgodovina ni zlomljen

## 7. Kaj NE spada v obvezni scope, razen ce ostane cas

To so ideje, ki so uporabne, ampak niso nujne za prvo celovito verzijo:

- [ ] pravi on-device ML model za utrujenost
- [ ] popolna zaznava jokajocega otroka z naucenim modelom
- [ ] starsevski dashboard
- [ ] deljenje rezultatov s starsi v realnem casu
- [ ] placljiva zavarovalniska telematika
- [ ] napredna analiza nevarnih cestnih odsekov
- [ ] cloud sync med vec napravami
- [ ] gamification z lestvicami med uporabniki

Te funkcionalnosti so smiselne kot bonus, vendar naj najprej deluje osnovni tok voznje, shranjevanja in prikaza rezultatov.

## 8. Predlagan minimalni koncni demo

Za zagovor naj bo mogoce pokazati ta tok:

1. registracija ali prijava uporabnika
2. pregled domacega zaslona
3. odprtje nastavitev in preverjanje dovoljenj
4. zacetek nove voznje
5. prikaz GPS statusa, hitrosti in aktivnega casa
6. simulacija ali dejanska zaznava pospeska/zaviranja
7. zakljucek voznje
8. izracun ocene varnosti
9. prikaz povzetka voznje
10. shranjevanje voznje
11. pregled zgodovine
12. odprtje podrobnosti voznje
13. prikaz poti ali demo mape
14. prikaz profila s statistikami
15. prikaz izzivov, ki temeljijo na voznjah
16. odjava

## 9. Najbolj nujen naslednji korak

Preden ekipa gradi naprej, naj se uskladi okoli skupnega podatkovnega modela:

- `Ride`
- `RidePoint`
- `Incident`
- `RideSummary`
- `UserSettings`

Ko so ti tipi dogovorjeni, lahko vsi trije clani delajo vzporedno brez stalnega lomljenja integracije.
