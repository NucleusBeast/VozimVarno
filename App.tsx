import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import {
  Bell,
  Camera,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gauge,
  Heart,
  Home,
  Info,
  Lock,
  MapPin,
  Menu,
  Mic,
  Moon,
  Rocket,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Star,
  Trophy,
  User,
  Zap,
} from 'lucide-react-native';

const BLUE = '#003f7d';
const BLUE_DARK = '#002f5f';
const GREEN = '#23b54b';
const YELLOW = '#f5bf00';
const RED = '#ef3b2d';
const TEXT = '#07122f';
const MUTED = '#64718a';
const LINE = '#dce3ee';
const BG = '#f4f7fb';

type Screen =
  | 'splash'
  | 'login'
  | 'home'
  | 'prepare'
  | 'active'
  | 'summary'
  | 'history'
  | 'details'
  | 'rating'
  | 'challenges'
  | 'profile'
  | 'settings';

type IconType = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
}>;

const rideHistory = [
  { date: '24. maj 2024', distance: '18,7 km', time: '00:24:18', score: 82 },
  { date: '23. maj 2024', distance: '12,3 km', time: '00:16:42', score: 76 },
  { date: '22. maj 2024', distance: '7,5 km', time: '00:10:11', score: 90 },
  { date: '21. maj 2024', distance: '15,2 km', time: '00:20:30', score: 71 },
];

const challenges = [
  {
    title: 'Brez telefona',
    description: '7 dni brez uporabe telefona',
    progress: '5/7',
    Icon: Smartphone,
    color: '#2d7ee8',
  },
  {
    title: 'Varni pospeski',
    description: 'Manj kot 3 mocni pospeski',
    progress: '2/3',
    Icon: Rocket,
    color: GREEN,
  },
  {
    title: 'Gladko zaviranje',
    description: 'Manj kot 2 mocni zaviranji',
    progress: '1/2',
    Icon: Gauge,
    color: RED,
  },
  {
    title: 'Nocna voznja',
    description: '3 voznje ponoci',
    progress: '1/3',
    Icon: Moon,
    color: '#6d59e8',
  },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [rideSeconds, setRideSeconds] = useState(0);

  const go = (next: Screen) => setScreen(next);
  const startRide = () => {
    setRideSeconds(0);
    setScreen('active');
  };

  const content = useMemo(() => {
    switch (screen) {
      case 'splash':
        return <SplashScreen go={go} />;
      case 'login':
        return <LoginScreen go={go} />;
      case 'home':
        return <HomeScreen go={go} />;
      case 'prepare':
        return <PrepareScreen go={go} startRide={startRide} />;
      case 'active':
        return <ActiveRideScreen go={go} elapsedSeconds={rideSeconds} setElapsedSeconds={setRideSeconds} />;
      case 'summary':
        return <SummaryScreen go={go} elapsedSeconds={rideSeconds} />;
      case 'history':
        return <HistoryScreen go={go} />;
      case 'details':
        return <DetailsScreen go={go} />;
      case 'rating':
        return <RatingScreen go={go} />;
      case 'challenges':
        return <ChallengesScreen go={go} />;
      case 'profile':
        return <ProfileScreen go={go} />;
      case 'settings':
        return <SettingsScreen go={go} />;
      default:
        return <HomeScreen go={go} />;
    }
  }, [screen, rideSeconds]);

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar style={screen === 'splash' ? 'light' : 'dark'} />
      {content}
    </SafeAreaView>
  );
}

function PhoneFrame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <View style={[styles.phone, dark && styles.phoneDark]}>{children}</View>;
}

function Header({
  title,
  back,
  right,
  go,
}: {
  title: string;
  back?: Screen;
  right?: React.ReactNode;
  go: (screen: Screen) => void;
}) {
  return (
    <View style={styles.header}>
      {back ? (
        <IconButton label="Nazaj" onPress={() => go(back)}>
          <ChevronLeft size={22} color={TEXT} />
        </IconButton>
      ) : (
        <View style={styles.iconSlot} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.iconSlot}>{right}</View>
    </View>
  );
}

function IconButton({
  children,
  label,
  onPress,
}: {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityLabel={label} style={styles.iconButton} onPress={onPress}>
      {children}
    </Pressable>
  );
}

function PrimaryButton({
  title,
  onPress,
  outline = false,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  outline?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={[styles.button, outline && styles.outlineButton, danger && styles.dangerButton]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, outline && styles.outlineButtonText, danger && styles.dangerText]}>
        {title}
      </Text>
    </Pressable>
  );
}

function BottomNav({ active, go }: { active: 'home' | 'history' | 'profile'; go: (screen: Screen) => void }) {
  const items = [
    { key: 'home', label: 'Domov', Icon: Home, screen: 'home' as Screen },
    { key: 'history', label: 'Zgodovina', Icon: Clock3, screen: 'history' as Screen },
    { key: 'profile', label: 'Profil', Icon: User, screen: 'profile' as Screen },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map(({ key, label, Icon, screen }) => {
        const focused = active === key;
        return (
          <Pressable key={key} style={styles.navItem} onPress={() => go(screen)}>
            <Icon size={21} color={focused ? BLUE : '#6b7280'} fill={focused ? BLUE : 'none'} strokeWidth={2} />
            <Text style={[styles.navLabel, focused && styles.navLabelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SplashScreen({ go }: { go: (screen: Screen) => void }) {
  return (
    <PhoneFrame dark>
      <Pressable style={styles.splashBody} onPress={() => go('login')}>
        <View style={styles.brandMark}>
          <Car size={56} color="#ffffff" strokeWidth={2.6} />
          <View style={styles.brandShield}>
            <ShieldCheck size={39} color="#ffffff" strokeWidth={2.4} />
          </View>
        </View>
        <Text style={styles.splashTitle}>VozimVarno</Text>
        <Text style={styles.splashSubtitle}>Vozim odgovorno.{'\n'}Prihodnost varno.</Text>
        <View style={styles.homeIndicator} />
      </Pressable>
    </PhoneFrame>
  );
}

function LoginScreen({ go }: { go: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <View style={styles.loginBody}>
        <Text style={styles.loginTitle}>Dobrodosel nazaj!</Text>
        <Text style={styles.loginSubtitle}>Prijavi se za zacetek</Text>
        <FormField label="E-posta" placeholder="vnesi e-posto" />
        <FormField label="Geslo" placeholder="vnesi geslo" secure />
        <Pressable style={styles.forgot}>
          <Text style={styles.forgotText}>Pozabljeno geslo?</Text>
        </Pressable>
        <PrimaryButton title="Prijava" onPress={() => go('home')} />
        <Text style={styles.orText}>ali</Text>
        <PrimaryButton title="Ustvari racun" onPress={() => go('home')} outline />
      </View>
    </PhoneFrame>
  );
}

function FormField({ label, placeholder, secure = false }: { label: string; placeholder: string; secure?: boolean }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#a1adbf"
          secureTextEntry={secure}
          editable={false}
        />
        {secure ? <Lock size={16} color={MUTED} /> : null}
      </View>
    </View>
  );
}

function HomeScreen({ go }: { go: (screen: Screen) => void }) {
  const cards: Array<{ label: string; Icon: IconType; screen: Screen }> = [
    { label: 'Nova voznja', Icon: Car, screen: 'prepare' },
    { label: 'Moje voznje', Icon: Clock3, screen: 'history' },
    { label: 'Rezultati', Icon: Gauge, screen: 'summary' },
    { label: 'Ocenjevanje', Icon: Star, screen: 'rating' },
    { label: 'Izzivi', Icon: Trophy, screen: 'challenges' },
    { label: 'Nastavitve', Icon: Settings, screen: 'settings' },
  ];

  return (
    <PhoneFrame>
      <Header
        title="VozimVarno"
        go={go}
        right={
          <IconButton label="Meni" onPress={() => go('settings')}>
            <Menu size={22} color={BLUE} />
          </IconButton>
        }
      />
      <View style={styles.homeGrid}>
        {cards.map(({ label, Icon, screen }) => (
          <Pressable key={label} style={styles.menuCard} onPress={() => go(screen)}>
            <Icon size={41} color={BLUE} strokeWidth={2} />
            <Text style={styles.menuCardText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <BottomNav active="home" go={go} />
    </PhoneFrame>
  );
}

function PrepareScreen({ go, startRide }: { go: (screen: Screen) => void; startRide: () => void }) {
  const checks = [
    { label: 'Kamera', status: 'Povezano', Icon: Camera },
    { label: 'GPS', status: 'Povezano', Icon: MapPin },
    { label: 'Pospeskometer', status: 'Povezano', Icon: Gauge },
    { label: 'Mikrofon', status: 'Povezano', Icon: Mic },
    { label: 'Shranjevanje', status: 'Dovoljeno', Icon: Shield },
  ];

  return (
    <PhoneFrame>
      <Header title="Nova voznja" back="home" go={go} />
      <View style={styles.content}>
        <Text style={styles.sectionIntro}>Pred zacetkom preveri:</Text>
        <View style={styles.checkList}>
          {checks.map(({ label, status, Icon }) => (
            <View key={label} style={styles.checkRow}>
              <View style={styles.checkCircle}>
                <Check size={18} color={GREEN} strokeWidth={3} />
              </View>
              <Icon size={20} color={BLUE} />
              <View>
                <Text style={styles.checkLabel}>{label}</Text>
                <Text style={styles.checkStatus}>{status}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.flexSpacer} />
        <PrimaryButton title="Zacni voznjo" onPress={startRide} />
      </View>
    </PhoneFrame>
  );
}

function ActiveRideScreen({
  go,
  elapsedSeconds,
  setElapsedSeconds,
}: {
  go: (screen: Screen) => void;
  elapsedSeconds: number;
  setElapsedSeconds: React.Dispatch<React.SetStateAction<number>>;
}) {
  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <PhoneFrame>
      <Header title="Voznja v teku" go={go} />
      <View style={styles.activeBody}>
        <View style={styles.timerRow}>
          <View style={styles.redDot} />
          <Text style={styles.timerText}>{formatDuration(elapsedSeconds)}</Text>
        </View>
        <SpeedGauge value={72} />
        <View style={styles.metricGrid}>
          <MetricCard label="Pospeski" value="3" />
          <MetricCard label="Zaviranja" value="1" />
          <MetricCard label="Odst. telefona" value="0" />
        </View>
        <View style={styles.gpsRow}>
          <View style={styles.greenDot} />
          <Text style={styles.gpsText}>GPS: Odlicen</Text>
        </View>
        <PrimaryButton title="Zakljuci voznjo" onPress={() => go('summary')} outline danger />
      </View>
    </PhoneFrame>
  );
}

function SummaryScreen({ go, elapsedSeconds }: { go: (screen: Screen) => void; elapsedSeconds: number }) {
  return (
    <PhoneFrame>
      <Header title="Povzetek voznje" back="active" go={go} />
      <View style={styles.content}>
        <View style={styles.centerBlock}>
          <ScoreRing value={82} size={122} stroke={9} />
          <Text style={styles.successText}>Dobro opravljeno!</Text>
        </View>
        <InfoRows
          rows={[
            ['Razdalja', '18,7 km'],
            ['Cas voznje', formatDuration(elapsedSeconds)],
            ['Povprecna hitrost', '46 km/h'],
          ]}
        />
        <Text style={styles.sectionTitle}>Dosezeni dogodki</Text>
        <InfoRows
          compact
          rows={[
            ['Pospeski', '5'],
            ['Zaviranja', '2'],
            ['Odstopanja hitrosti', '1'],
          ]}
        />
        <View style={styles.flexSpacer} />
        <PrimaryButton title="Shrani voznjo" onPress={() => go('rating')} />
      </View>
    </PhoneFrame>
  );
}

function HistoryScreen({ go }: { go: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <Header title="Moje voznje" back="home" go={go} />
      <View style={styles.tabs}>
        {['Vse', 'Ta teden', 'Ta mesec'].map((tab, index) => (
          <Pressable key={tab} style={[styles.tab, index === 0 && styles.tabActive]}>
            <Text style={[styles.tabText, index === 0 && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.historyList} showsVerticalScrollIndicator={false}>
        {rideHistory.map((ride) => (
          <Pressable key={ride.date} style={styles.historyItem} onPress={() => go('details')}>
            <View>
              <Text style={styles.historyDate}>{ride.date}</Text>
              <Text style={styles.historyMeta}>
                {ride.distance}  •  {ride.time}
              </Text>
            </View>
            <ScoreRing value={ride.score} size={48} stroke={4} small />
          </Pressable>
        ))}
      </ScrollView>
      <BottomNav active="history" go={go} />
    </PhoneFrame>
  );
}

function DetailsScreen({ go }: { go: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <Header title="Podrobnosti voznje" back="history" go={go} />
      <ScrollView contentContainerStyle={styles.detailsBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.dateCenter}>24. maj 2024 ob 15:42</Text>
        <MapCard />
        <View style={styles.metricGrid}>
          <MetricCard label="Razdalja" value="18,7 km" />
          <MetricCard label="Cas voznje" value="00:24:18" />
          <MetricCard label="Povp. hitrost" value="46 km/h" />
        </View>
        <Text style={styles.sectionTitle}>Dogodki</Text>
        <InfoRows
          compact
          rows={[
            ['Pospeski', '5'],
            ['Zaviranja', '2'],
            ['Odstopanja hitrosti', '1'],
          ]}
        />
      </ScrollView>
    </PhoneFrame>
  );
}

function RatingScreen({ go }: { go: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <Header title="Ocenjevanje" back="summary" go={go} />
      <View style={styles.content}>
        <View style={styles.centerBlock}>
          <ScoreRing value={82} size={124} stroke={9} />
          <Text style={styles.ratingQuestion}>Kako varno si vozil?</Text>
        </View>
        <View style={styles.starRow}>
          {[0, 1, 2, 3, 4].map((index) => (
            <Star
              key={index}
              size={42}
              color={index < 4 ? YELLOW : '#9aa6b7'}
              fill={index < 4 ? YELLOW : 'none'}
              strokeWidth={1.8}
            />
          ))}
        </View>
        <TextInput
          editable={false}
          multiline
          placeholder="Dodaj komentar (neobvezno)"
          placeholderTextColor="#9aa6b7"
          style={styles.commentBox}
        />
        <View style={styles.flexSpacer} />
        <PrimaryButton title="Shrani oceno" onPress={() => go('home')} />
      </View>
    </PhoneFrame>
  );
}

function ChallengesScreen({ go }: { go: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <Header title="Izzivi" back="home" go={go} />
      <View style={styles.tabs}>
        {['Aktivni', 'Zakljuceni'].map((tab, index) => (
          <Pressable key={tab} style={[styles.tab, index === 0 && styles.tabActive]}>
            <Text style={[styles.tabText, index === 0 && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.challengeList} showsVerticalScrollIndicator={false}>
        {challenges.map(({ title, description, progress, Icon, color }) => (
          <View key={title} style={styles.challengeCard}>
            <View style={[styles.challengeIcon, { backgroundColor: `${color}18` }]}>
              <Icon size={28} color={color} />
            </View>
            <View style={styles.challengeText}>
              <Text style={styles.challengeTitle}>{title}</Text>
              <Text style={styles.challengeDescription}>{description}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progress === '5/7' ? '72%' : progress === '2/3' ? '66%' : '50%', backgroundColor: color }]} />
              </View>
            </View>
            <Text style={styles.progressText}>{progress}</Text>
          </View>
        ))}
      </ScrollView>
    </PhoneFrame>
  );
}

function ProfileScreen({ go }: { go: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <View style={styles.profileBody}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>
        <Text style={styles.profileName}>Matej</Text>
        <Text style={styles.profileSince}>Clan od maj 2024</Text>
        <View style={styles.profileStats}>
          <Stat label="Skupno vozenj" value="24" />
          <Stat label="Povprecna ocena" value="78" />
          <Stat label="Skupna razdalja" value="312 km" />
        </View>
        <View style={styles.settingsList}>
          <SettingsRow title="Dosezki" Icon={Trophy} onPress={() => go('challenges')} />
          <SettingsRow title="Nastavitve" Icon={Settings} onPress={() => go('settings')} />
          <SettingsRow title="Pomoc in podpora" Icon={Info} onPress={() => go('settings')} />
        </View>
      </View>
      <BottomNav active="profile" go={go} />
    </PhoneFrame>
  );
}

function SettingsScreen({ go }: { go: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <Header title="Nastavitve" back="home" go={go} />
      <View style={styles.settingsList}>
        <SettingsRow title="Racun" subtitle="Uredi profil" Icon={User} />
        <SettingsRow title="Obvestila" Icon={Bell} trailing={<Switch value trackColor={{ true: BLUE, false: '#cfd7e3' }} thumbColor="#ffffff" />} />
        <SettingsRow title="Privoljenja" subtitle="Kamera, GPS, Mikrofon" Icon={Lock} />
        <SettingsRow title="Enote" subtitle="km/h" Icon={Gauge} />
        <SettingsRow title="Tema" subtitle="Svetla" Icon={Clock3} />
        <SettingsRow title="O aplikaciji" subtitle="VozimVarno v1.0.0" Icon={Info} />
      </View>
    </PhoneFrame>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function InfoRows({ rows, compact = false }: { rows: Array<[string, string]>; compact?: boolean }) {
  return (
    <View style={[styles.infoRows, compact && styles.infoRowsCompact]}>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.infoRow}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function SettingsRow({
  title,
  subtitle,
  Icon,
  trailing,
  onPress,
}: {
  title: string;
  subtitle?: string;
  Icon: IconType;
  trailing?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.settingsRow} onPress={onPress}>
      <Icon size={20} color={TEXT} />
      <View style={styles.settingsRowText}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle ? <Text style={styles.settingsSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ?? <ChevronRight size={18} color={MUTED} />}
    </Pressable>
  );
}

function ScoreRing({
  value,
  size,
  stroke,
  small = false,
}: {
  value: number;
  size: number;
  stroke: number;
  small?: boolean;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  const color = value >= 80 ? GREEN : value >= 75 ? YELLOW : '#e0ba00';

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#e7ecf2" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.ringLabel}>
        <Text style={[styles.ringValue, small && styles.ringValueSmall]}>{value}</Text>
        {!small ? <Text style={styles.ringTotal}>/100</Text> : null}
      </View>
    </View>
  );
}

function SpeedGauge({ value }: { value: number }) {
  const progress = Math.min(Math.max(value / 100, 0), 1);
  const radius = 84;
  const stroke = 13;
  const arcLength = Math.PI * radius;
  const arcPath = 'M 36 126 A 84 84 0 0 1 204 126';

  return (
    <View style={styles.speedWrap}>
      <Svg width={240} height={154} viewBox="0 0 240 154">
        <Path
          d={arcPath}
          stroke="#e8eaee"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={arcPath}
          stroke="#1268b9"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${arcLength * progress} ${arcLength}`}
        />
      </Svg>
      <View style={styles.speedTextBlock}>
        <Text style={styles.speedValue}>{value}</Text>
        <Text style={styles.speedUnit}>km/h</Text>
      </View>
    </View>
  );
}

function MapCard() {
  return (
    <View style={styles.mapCard}>
      <Svg width="100%" height="100%" viewBox="0 0 260 150">
        <Path d="M0 120 L70 40 L130 95 L260 20" stroke="#dce4df" strokeWidth="28" fill="none" />
        <Path d="M0 40 L72 68 L170 18 L260 92" stroke="#e6ecef" strokeWidth="22" fill="none" />
        <Polyline
          points="22,112 60,78 83,84 103,48 132,61 158,42 176,34 199,16 226,34"
          fill="none"
          stroke="#1767b0"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="22" cy="112" r="10" fill={GREEN} />
        <Circle cx="226" cy="34" r="10" fill="#ff6a35" />
      </Svg>
    </View>
  );
}

const { width } = Dimensions.get('window');
const phoneWidth = Math.min(width - 28, 390);

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: {
    width: phoneWidth,
    maxWidth: 390,
    height: '100%',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  phoneDark: {
    backgroundColor: BLUE_DARK,
  },
  splashBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 58,
  },
  brandMark: {
    width: 110,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandShield: {
    position: 'absolute',
    right: 16,
    bottom: 0,
  },
  splashTitle: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '800',
    marginTop: 6,
  },
  splashSubtitle: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 12,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 36,
    width: 70,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  loginBody: {
    paddingHorizontal: 27,
    paddingTop: 66,
  },
  loginTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: TEXT,
    textAlign: 'center',
  },
  loginSubtitle: {
    color: MUTED,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 30,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputWrap: {
    height: 52,
    borderWidth: 1,
    borderColor: '#cfd8e4',
    borderRadius: 7,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  button: {
    height: 55,
    borderRadius: 7,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  outlineButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: BLUE,
  },
  outlineButtonText: {
    color: BLUE,
  },
  dangerButton: {
    borderColor: RED,
  },
  dangerText: {
    color: RED,
  },
  orText: {
    textAlign: 'center',
    color: MUTED,
    fontSize: 12,
    marginVertical: 17,
  },
  header: {
    height: 56,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '800',
  },
  iconSlot: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeGrid: {
    paddingHorizontal: 24,
    paddingTop: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  menuCard: {
    width: (phoneWidth - 62) / 2,
    minHeight: 137,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8edf4',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0c1a2e',
    shadowOpacity: 0.09,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  menuCardText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 16,
  },
  bottomNav: {
    marginTop: 'auto',
    height: 72,
    borderTopWidth: 1,
    borderTopColor: LINE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 92,
    gap: 5,
  },
  navLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '700',
  },
  navLabelActive: {
    color: BLUE,
  },
  content: {
    flex: 1,
    paddingHorizontal: 27,
    paddingTop: 18,
    paddingBottom: 28,
  },
  sectionIntro: {
    color: TEXT,
    fontSize: 15,
    marginBottom: 18,
  },
  checkList: {
    gap: 22,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '800',
  },
  checkStatus: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  flexSpacer: {
    flex: 1,
  },
  activeBody: {
    flex: 1,
    paddingHorizontal: 27,
    paddingTop: 10,
    paddingBottom: 28,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  redDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: RED,
  },
  timerText: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '700',
  },
  speedWrap: {
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedTextBlock: {
    position: 'absolute',
    top: 82,
    alignItems: 'center',
  },
  speedValue: {
    color: '#000000',
    fontSize: 58,
    fontWeight: '900',
  },
  speedUnit: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 13,
  },
  metricCard: {
    flex: 1,
    minHeight: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e7edf4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#0c1a2e',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  metricLabel: {
    color: TEXT,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 34,
    marginBottom: 28,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN,
  },
  gpsText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
  },
  centerBlock: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 22,
  },
  ringLabel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    color: '#000000',
    fontSize: 42,
    fontWeight: '900',
  },
  ringValueSmall: {
    fontSize: 18,
  },
  ringTotal: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
    marginTop: -3,
  },
  successText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 18,
  },
  infoRows: {
    gap: 15,
    marginTop: 8,
    marginBottom: 16,
  },
  infoRowsCompact: {
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '700',
  },
  infoValue: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 8,
  },
  tabs: {
    height: 47,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  tab: {
    flex: 1,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: BLUE,
  },
  tabText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: BLUE,
  },
  historyList: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  historyItem: {
    minHeight: 86,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
  },
  historyMeta: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  detailsBody: {
    paddingHorizontal: 22,
    paddingBottom: 32,
  },
  dateCenter: {
    textAlign: 'center',
    color: TEXT,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 16,
  },
  mapCard: {
    height: 170,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eff3ed',
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  ratingQuestion: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 20,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  commentBox: {
    minHeight: 128,
    borderWidth: 1,
    borderColor: '#cfd8e4',
    borderRadius: 8,
    padding: 15,
    color: TEXT,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  challengeList: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 13,
  },
  challengeCard: {
    minHeight: 92,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#0c1a2e',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeText: {
    flex: 1,
  },
  challengeTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
  },
  challengeDescription: {
    color: TEXT,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  progressTrack: {
    height: 5,
    borderRadius: 4,
    backgroundColor: '#e5e9f0',
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '900',
    alignSelf: 'flex-end',
    marginBottom: 17,
  },
  profileBody: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 34,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#7c858f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#d3d8df',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '800',
  },
  profileName: {
    color: TEXT,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 12,
  },
  profileSince: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  profileStats: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 34,
    paddingBottom: 26,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  stat: {
    alignItems: 'center',
    gap: 7,
  },
  statLabel: {
    color: TEXT,
    fontSize: 10,
    fontWeight: '700',
  },
  statValue: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '900',
  },
  settingsList: {
    width: '100%',
    marginTop: 16,
  },
  settingsRow: {
    minHeight: 67,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingsRowText: {
    flex: 1,
  },
  settingsTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
  },
  settingsSubtitle: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});
