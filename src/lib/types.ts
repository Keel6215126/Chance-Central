import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface GameConfig {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: ReactNode; // Changed from iconText to ReactNode
  iconComponent?: LucideIcon; // Optional: if you want to store the component type
  href: string;
}

export interface ChartDataItem {
  name: string;
  value: number;
}

export interface RoulettePocket {
  number: number;
  color: 'red' | 'black' | 'purple'; // 'purple' for 0
  originalIndex: number; // position on the wheel, 0-36
}
