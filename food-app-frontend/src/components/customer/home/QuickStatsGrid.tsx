import React from 'react';
import { TrendingUp, Store, Users, Heart } from 'lucide-react';
import ActionButton from './StatsCard';

const actionButtons = [
  {
    id: 'trending',
    title: 'Hot deals',
    icon: TrendingUp,
    gradientFrom: "from-blue-500",
    gradientTo: "to-blue-600",
    onClick: () => console.log('Trending clicked')
  },
  {
    id: 'shops',
    title: 'Near you',
    icon: Store,
    gradientFrom: "from-green-500",
    gradientTo: "to-green-600",
    onClick: () => console.log('Shops clicked')
  },
  {
    id: 'community',
    title: 'Connect',
    icon: Users,
    gradientFrom: "from-purple-500",
    gradientTo: "to-purple-600",
    onClick: () => console.log('Community clicked')
  },
  {
    id: 'favorites',
    title: '0 items',
    icon: Heart,
    gradientFrom: "from-red-500",
    gradientTo: "to-red-600",
    onClick: () => console.log('Favorites clicked')
  }
];
const QuickStatsGrid: React.FC = () => {
  return (
    <div className="px-2 py-2">
          <div className="grid grid-cols-4 gap-1">
            {actionButtons.map((button) => (
              <ActionButton key={button.id} {...button} />
            ))}
          </div>
    </div>
  );
};

export default QuickStatsGrid;


