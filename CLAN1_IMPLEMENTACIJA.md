# Clan 1 — Lovro Cus: Implementacija

## Odgovornost

Kamera, senzorji in scoring. Cilj: iz staticnega prikaza aktivne voznje narediti dejanski modul, ki bere podatke iz naprave in iz njih izracuna varnostno oceno.

---

## 1. Tipi in konfiguracija

**Datoteka:** `src/types.ts`

### Incident

```ts
type Incident = {
  id: string;           // npr. "hard_braking_1717500000000"
  type: IncidentType;   // tip incidenta
  timestamp: number;    // Unix ms
  intensity: number;    // 0.0–1.0 (relativna jakost)
  speedKmh?: number;    // hitrost v trenutku incidenta
  latitude?: number;    // GPS lokacija incidenta
  longitude?: number;
};
```

### IncidentType

```ts
type IncidentType =
  | 'hard_acceleration'  // mocno pospesevanje
  | 'hard_braking'       // mocno zaviranje
  | 'sharp_turn'         // ostro zavijanje
  | 'speed_exceeded'     // prekoracitev hitrosti
  | 'noise_alert';       // hrup (mikrofon)
```

### IncidentThresholds

```ts
type IncidentThresholds = {
  hardAccelerationMs2: number;  // privzeto: 3.5 m/s²
  hardBrakingMs2: number;       // privzeto: 4.0 m/s²
  sharpTurnDegS: number;        // privzeto: 45 °/s
  noiseAlertDb: number;         // privzeto: -20 dB
  speedLimitKmh: number;        // privzeto: 130 km/h
};
```

Privzete vrednosti so definirane v `src/services/storage/settingsStorage.ts` in se ob zagonu naložijo iz SecureStore. Vrednosti je mogoce spreminjati v SettingsScreen.

---

## 2. Senzorji

### 2.1 Pospeskomer

**Datoteka:** `src/services/sensors/accelerometerService.ts`

Uporablja `Accelerometer` iz `expo-sensors`. Na fizicni napravi (Android/iOS) bere realne podatke. Na webu ali simulatorju, kjer senzor ni dostopen, aktivira simulacijski fallback.

**Simulacijski fallback** generira realisticne vzorce:
- 99.94 % vzorcev: normalna vožnja (majhen šum okoli gravitacije na z-osi)
- 0.03 % vzorcev: simulirano mocno zaviranje (velik negativni sunek na y-osi)
- 0.03 % vzorcev: simulirano mocno pospesevanje (velik pozitivni sunek na y-osi)

Frekvenca branja: privzeto 100 ms (10 Hz).

### 2.2 Giroskop

**Datoteka:** `src/services/sensors/gyroscopeService.ts`

Enaka struktura kot pospeskomer. Bere kotno hitrost v rad/s. Simulacijski fallback generira obcasne sunke na z-osi (yaw) za simulacijo ostrega zavijanja.

---

## 3. Incident detektor

**Datoteka:** `src/services/sensors/incidentDetector.ts`

Osrednji algoritmicni modul. Ustvari se z `createIncidentDetector(thresholds)` in vrne objekt s tremi metodami: `processAccelerometer`, `processGyroscope`, `processSpeed`.

### 3.1 Warmup faza (3 sekunde)

Prvih 3000 ms po zagonu detektor ne beleži incidentov (`canRecord` vrne false). Namen:
1. Nizkopasovni filter gravitacije se stabilizira
2. Zbirajo se vzorci za detekcijo orientacije telefona

### 3.2 Kalibracija orientacije telefona

Med warmup fazo se zbirajo surovi vzorci pospeška. Po poteku warmupa se izracuna povprecna vrednost po vsaki osi:

```
avgX = povprecje vseh x vzorcev
avgY = povprecje vseh y vzorcev
avgZ = povprecje vseh z vzorcev
```

Os z najvecjo absolutno povprecno vrednostjo je os gravitacije (vertikalna montažna os). Glede na to se dolocita os naprej/nazaj:

| Gravitacijska os | Razlaga | Os naprej/nazaj |
|---|---|---|
| Y | Pokoncni portret (držalo, skodelica) | Z |
| X | Landscape (obrnjen vstran) | Y |
| Z | Polozno (dashboard, face-up) | Y |

Ta os se potem uporablja za locevanje zaviranja od pospesevanja.

### 3.3 Nizkopasovni filter gravitacije

Ker pospeskomer meri skupno silo (gravitacija + linearna pospesenost), je treba gravitacijo odstraniti. Uporablja se eksponentni nizkopasovni filter:

```
gravity_t = α × gravity_(t-1) + (1 - α) × raw_t
```

kjer je `α = 0.85`. Višji α pomeni pocasnejšo adaptacijo — gravitacija se posodablja pocasi, kratki sunki se ne "vpijejo" vanjo.

Linearna pospesenost (brez gravitacije):
```
linear = raw - gravity
```

### 3.4 Zaznava trdega zaviranja / pospesevanja

Postopek za vsak vzorec pospeška:

1. Posodobi gravity filter
2. Izracunaj linearno pospesenost: `lx, ly, lz`
3. Izracunaj skupno magnitudo: `magnitude = sqrt(lx² + ly² + lz²)`
4. Ce `magnitude < min(hardBraking, hardAcceleration)` → preskoći (premajhen sunek)
5. Preveri predznako komponente na kalibriran osi naprej/nazaj:
   - `forwardComponent <= 0` → `hard_braking`
   - `forwardComponent > 0` → `hard_acceleration`
6. Ce `magnitude < prag za tip` → preskoči
7. Ce cooldown se ni potekel (2500 ms) → preskoči
8. Ustvari incident z jakostjo: `intensity = (magnitude - threshold) / threshold`, max 1.0

**Primer:** Threshold zaviranja je 4.0 m/s². Izmerjena magnituda je 5.2 m/s².
- `intensity = (5.2 - 4.0) / 4.0 = 0.3`
- Incident: `{ type: 'hard_braking', intensity: 0.3, speedKmh: 67, ... }`

### 3.5 Zaznava ostrega zavijanja

Giroskop vraca kotno hitrost v rad/s. Yaw (rotacija okoli z-osi) predstavlja zavijanje:

```
yawRate = |data.z|   (absolutna vrednost)
thresholdRadS = sharpTurnDegS × (π / 180)
```

Ce `yawRate > thresholdRadS` in cooldown je potekel → incident `sharp_turn`.

**Primer:** Prag je 45 °/s = 0.785 rad/s. Izmerjen yaw je 1.1 rad/s.
- `intensity = (1.1 - 0.785) / 0.785 = 0.40`

### 3.6 Zaznava prekoracitve hitrosti

Kliče se ob vsaki GPS posodobitvi iz `useRideSession`:

```
ce speedKmh > speedLimitKmh:
    ce cooldown (10 s) je potekel:
        ustvari incident speed_exceeded
```

Cooldown za prekoracitev hitrosti je 10 sekund (ne 2.5 s kot pri ostalih) — da ne generira prevelike kolicine incidentov pri dalj trajajoci prekoracitvi.

Jakost: `intensity = (speedKmh - limit) / limit`. Pri 150 km/h in limitu 130 km/h: `intensity = (150 - 130) / 130 = 0.154`.

### 3.7 Cooldown sistem

Vsak tip incidenta ima casovni zig zadnje zaznave. Nov incident istega tipa se zabeleži šele ko preteče cooldown:
- `hard_braking`, `hard_acceleration`, `sharp_turn`: 2500 ms
- `speed_exceeded`: 10000 ms

---

## 4. Scoring algoritem

**Datoteka:** `src/services/scoring/index.ts`

Funkcija `calculateScore(incidents)` vrne celo število 0–100.

### Osnovna odbitka po tipu

| Tip incidenta | Osnovna odbitka (točke) |
|---|---|
| `speed_exceeded` | 10 |
| `hard_braking` | 8 |
| `sharp_turn` | 7 |
| `hard_acceleration` | 6 |
| `noise_alert` | 3 |

### Upoštevanje jakosti

Vsak incident ne odšteje fiksne vrednosti — upošteva se jakost (`intensity`, vrednost 0.0–1.0):

```
odbitka = osnovna_odbitka × (0.5 + intensity × 0.5)
```

- `intensity = 0.0` → odšteje 50 % osnove (minimalna kazen)
- `intensity = 1.0` → odšteje 100 % osnove (maksimalna kazen)
- `intensity = 0.5` → odšteje 75 % osnove

**Primer:** Hard braking z intensity 0.3:
```
odbitka = 8 × (0.5 + 0.3 × 0.5) = 8 × 0.65 = 5.2 točke
```

### Omejitev po tipu (MAX_PER_TYPE = 4)

Da agresivno stresanje telefona pri testiranju ne povzroci score 0, se upoštevajo najvec 4 incidenti istega tipa. Pri 5. in vsakem naslednjem incident score ni vec zmanjšan.

**Namen:** Ohraniti kaznovanje za slabo vožnjo, a preprečiti, da bi en sam tip (npr. med testiranjem na mizi) popolnoma uniči oceno.

### Koncni izracun

```
score = max(0, min(100, round(100 - skupna_odbitka)))
```

**Primer voznje:**
- 2× hard_braking (intensity 0.4 in 0.7) → `8×0.7 + 8×0.85 = 5.6 + 6.8 = 12.4`
- 1× speed_exceeded (intensity 0.15) → `10×0.575 = 5.75`
- Skupaj: `100 - 18.15 = 81.85 → score = 82`

---

## 5. Zaznava utrujenosti — Azure Face API

### 5.1 Pregled arhitekture

```
ActiveRideScreen
  └── useFatigueCamera (hook)
        ├── CameraView (skriti, 1×1 px, sprednja kamera)
        ├── takePictureAsync() vsakih 10 s
        └── analyzeFrame() → Azure Face API
              └── pushFatigueResult() → cameraService notify()
                    └── useRideSession listener → fatigueResult prop → UI
```

### 5.2 Zajem slike

**Datoteka:** `src/hooks/useFatigueCamera.ts`

- Interval: 10 sekund
- Prva slika: 3 sekunde po zagonu (cas za inicializacijo CameraView)
- Kamera: sprednja (facing="front")
- Kakovost: 0.3 (dovolj za zaznavo obraza, manjša datoteka)
- `skipProcessing: true` (hitrejše shranjevanje)

CameraView je dodan v `ActiveRideScreen` kot absolutno pozicioniran element velikosti 1×1 px z opacity 0 — neviden, a aktiven.

### 5.3 Azure Face API klic

**Datoteka:** `src/services/camera/azureFaceApi.ts`

Endpoint: `POST {AZURE_ENDPOINT}face/v1.0/detect`

Parametri:
- `returnFaceAttributes=headpose,occlusion`
- `detectionModel=detection_01`

Slika se pošlje kot binarni blob (`Content-Type: application/octet-stream`). API vrne JSON z atributi za vsak zaznan obraz.

Pridobljeni atributi:
- `headPose.pitch` — naklon glave naprej/nazaj v stopinjah (negativno = glava navzdol)
- `headPose.yaw` — nagib glave vstran v stopinjah
- `occlusion.eyeOccluded` — ali so oci zakriti/zaprte (boolean)

### 5.4 Algoritem za izracun fatigue score

```
eyeScore  = eyeOccluded ? min(80, 40 + occludedStreak × 20) : 0
pitchScore = max(0, |headPitchDeg| - 8) × 2.5
tiltScore  = max(0, headTiltDeg - 12) × 2

score = min(100, eyeScore + pitchScore + tiltScore)
```

**Komponente:**

**eyeScore** — Zaprtost oci je najmocnejši signal zaspanosti. `occludedStreak` steje zaporedje zaznav z zaprtimi ocmi:
- 1. zaznava zaprtih oci: `40 + 1×20 = 60`
- 2. zaznava: `40 + 2×20 = 80` (maksimum)
- Ce so oci odprte: streak se zmanjša za 1

**pitchScore** — Glava navzdol (negativen pitch) ali nazaj (pozitiven pitch). Prag je 8°, vsaka stopinja vec doda 2.5 tocke:
- Pitch -12° → `(12 - 8) × 2.5 = 10`
- Pitch -17° → `(17 - 8) × 2.5 = 22.5`

**tiltScore** — Nagib glave vstran (yaw). Prag 12°, vsaka stopinja vec doda 2 tocki:
- Yaw 20° → `(20 - 12) × 2 = 16`

**Razlaga pragov v UI** (`ActiveRideScreen`):
- score < 10 → zeleno "Utrujenost: V redu"
- score 10–29 → rumeno "Utrujenost: Pozor"
- score ≥ 30 → rdece "Utrujenost: Opozorilo!"

### 5.5 Demo fallback

Ce `EXPO_PUBLIC_AZURE_FACE_KEY` ni nastavljen, `enableFatigueDetection()` zažene casovni simulator (`cameraService.ts`):
- Zacetni score: 8
- Rast: ~8 točk/minuto (max 65)
- Obcasni sunki (15 % verjetnost): +15–35 točk
- Naravni šum: ±10 točk
- Interval: 8 sekund

---

## 6. Zasloni

### 6.1 PrepareScreen

**Datoteka:** `src/screens/PrepareScreen.tsx`

Prikazuje stanje dovoljenj pred zacetkom voznje. Naloženi so:
- `ExpoCamera.Camera.getCameraPermissionsAsync()`
- `Location.getForegroundPermissionsAsync()`
- `ExpoCamera.Camera.getMicrophonePermissionsAsync()`
- `Location.hasServicesEnabledAsync()`

Dovoljenja se osvežijo ob vsakem prehodu aplikacije v ospredje (`AppState` listener).

**Integracija z nastavitvami:** Ob zagonu se naložijo uporabniške nastavitve. Ce je `cameraEnabled = false`, kamera ni zahtevana za start voznje (prikaz: "Izklopljeno v nastavitvah"). Enako za `microphoneEnabled`.

Gumb "Zacni voznjo" je aktiven šele ko so vsa zahtevana dovoljenja dana.

### 6.2 ActiveRideScreen

**Datoteka:** `src/screens/ActiveRideScreen.tsx`

Prikazuje v realnem casu:
- Timer (format HH:MM:SS) z rdeco piko
- Polulocni merilnik hitrosti (SVG arc, komponenta `SpeedGauge`)
- 3 metricne kartice: Pospeški, Zaviranja, Odst. hitrosti
- GPS status z barvno piko (zelena/rumena/rdeca)
- Hrup status (ce mikrofon aktiven)
- Utrujenost status (ce kamera/Azure aktiven)
- Gumb "Zakljuci voznjo"

Vsebuje skriti `CameraView` za Azure fatigue detection (1×1 px, opacity 0, sprednja kamera). Hook `useFatigueCamera` se zažene ob mountu komponente.

### 6.3 SummaryScreen

**Datoteka:** `src/screens/SummaryScreen.tsx`

Prikaže povzetek zakljucene voznje:
- `ScoreRing` komponenta s score 0–100 in opisom
- Statistike: razdalja, cas voznje, povprecna hitrost
- Doseženi dogodki: Pospeški, Zaviranja, Odstopanja hitrosti
- Gumb "Shrani voznjo" → odpre RatingScreen

Voznja je že shranjena v trenutku zakljucka (v `useRideSession.end()`). Gumb samo pelje naprej v ocenjevanje.

### 6.4 RatingScreen

**Datoteka:** `src/screens/RatingScreen.tsx`

Locen zaslon za subjektivno oceno voznje:
- `ScoreRing` s sistemsko oceno (samo prikaz)
- 5 zvezdic za uporabnikovo self-oceno (1–5)
- Besedilno polje za komentar (neobvezno)

Ob pritisku "Shrani oceno" se voznja posodobi v lokalni hrambi z `userRating` in `userComment`, nato navigacija na domaci zaslon.

**Locitev sistemske in uporabnikove ocene:**
- `Ride.score` — algoritmicna ocena (0–100, izracunana iz incidentov)
- `Ride.userRating` — zvezdicna samoocena (1–5, shranjena v RatingScreen)

---

## 7. Integracija v useRideSession

**Datoteka:** `src/hooks/useRideSession.ts` (relevantni deli za Clan 1)

Ob `start()`:
1. Naložijo se nastavitve iz SecureStore
2. Ustvari se nov `IncidentDetector` s trenutnimi pragi
3. Zažene se pospeskomer → `processAccelerometer(data, speed, location)`
4. Zažene se giroskop → `processGyroscope(data, speed, location)`
5. Ce `cameraEnabled`: `enableFatigueDetection()` + subscription na `onFatigueUpdate`
6. GPS lokacija (Clan 2) se sproti posodablja v `latestPointRef` — ta se poda senzorjem kot lokacija incidenta

Ob `end()`:
1. Ustavi pospeskomer, giroskop, fatigue detection, mikrofon
2. `calculateScore(finalIncidents)` — izracun ocene
3. Ustvari `Ride` objekt z vsemi podatki
4. Shrani lokalno + sinhronizira z backendom

---

## 8. Datotecna struktura (Clan 1)

```
src/
├── types.ts                          # IncidentType, Incident, IncidentThresholds
├── services/
│   ├── sensors/
│   │   ├── accelerometerService.ts   # Expo Sensors wrapper + sim fallback
│   │   ├── gyroscopeService.ts       # Expo Sensors wrapper + sim fallback
│   │   ├── incidentDetector.ts       # Gravity filter, orientacija, zaznava
│   │   └── index.ts                  # Re-export
│   ├── scoring/
│   │   └── index.ts                  # calculateScore algoritem
│   └── camera/
│       ├── cameraService.ts          # Pub/sub, enable/disable, demo fallback
│       ├── azureFaceApi.ts           # Azure Face API klic + fatigue formula
│       └── index.ts                  # Re-export
├── hooks/
│   ├── useRideSession.ts             # Glavni hook voznje (integrira Clan 1, 2, 3)
│   └── useFatigueCamera.ts           # Periodicni zajem + Azure klic
└── screens/
    ├── PrepareScreen.tsx             # Preverjanje dovoljenj
    ├── ActiveRideScreen.tsx          # Aktivna voznja + skriti CameraView
    ├── SummaryScreen.tsx             # Povzetek z oceno
    └── RatingScreen.tsx              # Zvezdice + komentar
```
