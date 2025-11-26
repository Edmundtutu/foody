import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button.tsx';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  Home,
  Search,
  MapPin,
  ShoppingCart,
  User,
  Heart,
  Store,
  BarChart3,
  LogOut,
  Settings,
  Utensils,
  CookingPot
} from 'lucide-react';
import DeskBellIcon from '@/assets/icons/desk-bell.svg?react';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const DesktopSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const customerNavItems: NavItem[] = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Discover', href: '/discover', icon: Search },
    { name: 'Map', href: '/map', icon: MapPin },
    { name: 'Favorites', href: '/favorites', icon: Heart },
    { name: 'My Order', href: '/order', icon: ShoppingCart, badge: 0 }, // TODO: Replace the Shopping Cart icon with a covered_plate_of_food icon
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const vendorNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/vendor/dashboard', icon: BarChart3 },
    { name: 'In Kitchen', href: '/vendor/kitchen', icon: CookingPot },
    { name: 'Menu', href: '/vendor/menu', icon: Utensils },
    { name: 'Orders', href: '/vendor/orders', icon: DeskBellIcon },
    { name: 'Restaurant Profile', href: '/vendor/profile', icon: Store },
    { name: 'Account', href: '/vendor/account', icon: User },
  ];

  const navItems = user.role === 'restaurant' ? vendorNavItems : customerNavItems;

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="hidden lg:flex flex-col w-64 xl:w-72 h-screen bg-card border-r fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-4 xl:p-6 border-b">
        <Link to="/" className="text-xl xl:text-2xl font-bold text-primary">
          FoodApp
        </Link>
      </div>

      {/* User Profile Section - Facebook style */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.role === 'customer' ? 
                (user.isInfluencer ? 'Influencer' : 'Customer') : 'Restaurant'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 xl:p-5 space-y-2.5">
        {navItems.map((item) => {
          const isActive = isActivePath(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex items-center gap-4 px-4 py-3 xl:py-3.5 rounded-xl text-base font-medium transition-all relative group
                ${isActive 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 truncate">{item.name}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge 
                  variant={isActive ? 'secondary' : 'default'} 
                  className="h-5 w-5 flex items-center justify-center text-xs p-0 ml-auto"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 xl:p-4 border-t space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          size="sm"
        >
          <Settings className="h-4 w-4 mr-3" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          size="sm"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default DesktopSidebar;