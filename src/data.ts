import { Gauge, Moon, Rocket, Smartphone } from 'lucide-react-native';

import { GREEN, RED } from './constants';

export const rideHistory = [
  { date: '24. maj 2024', distance: '18,7 km', time: '00:24:18', score: 82 },
  { date: '23. maj 2024', distance: '12,3 km', time: '00:16:42', score: 76 },
  { date: '22. maj 2024', distance: '7,5 km', time: '00:10:11', score: 90 },
  { date: '21. maj 2024', distance: '15,2 km', time: '00:20:30', score: 71 },
];

export const challenges = [
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
