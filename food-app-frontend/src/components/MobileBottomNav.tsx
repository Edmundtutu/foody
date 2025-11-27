import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Menu, 
  MapPin, 
  ShoppingCart, 
  User,
  Store,
  Package,
  BarChart3,
  MessageCircle,
  HandPlatter
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMeal } from '@/context/MealContext';
import { Badge } from '@/components/ui/badge';
import ErrorBoundary from '@/components/ErrorBoundary';

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  onClick?: () => void;
}

const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const { getItemCount } = useMeal();
  const location = useLocation();
  // Chat functionality removed - will be re-implemented with new system

  if (!user) return null;

  const cartItemCount = getItemCount();

  const customerNavItems: NavItem[] = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Find Food', href: '/find-food', icon: Menu },
    { name: 'My Meal', href: '/my-meal', icon: HandPlatter, badge: cartItemCount },
    { name: 'Map', href: '/map', icon: MapPin },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const vendorNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/vendor/dashboard', icon: BarChart3 },
    { name: 'In Kitchen', href: '/vendor/kitchen', icon: Package },
    { name: 'Orders', href: '/vendor/orders', icon: ShoppingCart },
    { name: 'Restaurant', href: '/vendor/profile', icon: Store },
  ];

  const navItems = user.role === 'restaurant' ? vendorNavItems : customerNavItems;

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t lg:hidden">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map((item) => {
          const isActive = item.href ? isActivePath(item.href) : false;
          const isChatItem = item.name === 'Chat';
          const content = (
            <>
              <div className="relative">
                <item.icon className={`h-5 w-5 ${isActive ? 'scale-110 text-primary' : ''} ${isChatItem && item.badge ? 'animate-pulse' : ''} transition-all duration-200`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge className={`absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center text-xs p-0 ${
                    isChatItem ? 'bg-blue-500 animate-bounce' : 'bg-red-500'
                  }`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs mt-1 truncate max-w-full ${isActive ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                {item.name}
              </span>
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </>
          );

          if (item.onClick) {
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center p-2 min-w-0 flex-1 relative transition-colors text-muted-foreground active:text-foreground"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.href!}
              className={`
                flex flex-col items-center justify-center p-2 min-w-0 flex-1 relative transition-colors
                ${isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground active:text-foreground'
                }
              `}
            >
              {content}
            </Link>
          );
        })}
      </div>

      {/* Chat functionality removed - will be re-implemented with new system */}
    </div>
  );
};

export default MobileBottomNav;