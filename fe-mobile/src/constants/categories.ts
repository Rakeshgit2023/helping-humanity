import { Droplet, PawPrint, Shirt, UtensilsCrossed, Wallet } from 'lucide-react-native';

import { brand } from '@/theme';

export interface HelpCategory {
  id: string;
  label: string;
  icon: typeof PawPrint;
  accent: string;
  soft: string;
}

export const CATEGORIES: HelpCategory[] = [
  {
    id: 'animal',
    label: 'Animal Rescue',
    icon: PawPrint,
    accent: brand.teal,
    soft: brand.tealSoft,
  },
  {
    id: 'food',
    label: 'Food Donation',
    icon: UtensilsCrossed,
    accent: brand.marigold,
    soft: brand.marigoldSoft,
  },
  { id: 'blood', label: 'Blood Request', icon: Droplet, accent: brand.clay, soft: brand.claySoft },
  { id: 'clothes', label: 'Clothes', icon: Shirt, accent: brand.leaf, soft: brand.leafSoft },
  { id: 'money', label: 'Funds', icon: Wallet, accent: brand.purple, soft: brand.purpleSoft },
];
