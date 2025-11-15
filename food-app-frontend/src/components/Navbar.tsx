import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Avatar, AvatarFallback } from './avatar';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Heart, 
  Menu,
  X,
  Bell,
  MessageCircle
} from 'lucide-react';
import { User as UserType } from './index';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { NotificationList } from './NotificationList';
import { useUnreadCount } from './useUnreadCount';
import ErrorBoundary from './ErrorBoundary';

interface NavbarProps {
  user: UserType | null;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const { logout } = useAuth();
  const { getItemCount } = useCart();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationListOpen, setNotificationListOpen] = useState(false);

  const cartItemCount = getItemCount();
  const { totalUnreadCount } = useUnreadCount();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/discover?search=${encodeURIComponent(searchQuery)}`;
    }
  };


  return (
    <nav className="bg-card/95 backdrop-blur-sm border-b sticky top-0 z-40">
      <div className="mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo - Always visible */}
          <Link to="/" className="text-lg sm:text-xl font-bold text-primary flex-shrink-0">
            Foody
          </Link>

          {/* Search Bar - Desktop and tablet */}
          {user && (
            <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-lg mx-4 lg:mx-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dishes, restaurants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-0 focus:bg-background h-9 lg:h-10"
                />
              </div>
            </form>
          )}

          {/* Desktop Actions */}
          {user ? (
            <div className="hidden lg:flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-9 w-9"
                onClick={() => window.location.href = '/chat/conversations'}
              >
                <MessageCircle className="h-4 w-4" />
                {totalUnreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                  >
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </Badge>
                )}
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => setNotificationListOpen(true)}
              >
                <Bell className="h-5 w-5" />
                {/* Notification badge removed - will be re-implemented */}
              </Button>

              {user.role === 'customer' && (
                <>
                  <Link to="/favorites">
                    <Button variant="ghost" size="icon">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </Link>

                  <Link to="/cart" className="relative">
                    <Button variant="ghost" size="icon">
                      <ShoppingCart className="h-5 w-5" />
                    </Button>
                    {cartItemCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </Badge>
                    )}
                  </Link>
                </>
              )}

              <Link to="/profile">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}

          {/* Mobile Actions */}
          {user ? (
            <div className="flex lg:hidden items-center space-x-2">
              {/* Chat button removed - will be re-implemented with new system */}

              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-9 w-9"
                onClick={() => setNotificationListOpen(true)}
              >
                <Bell className="h-4 w-4" />
                {/* Notification badge removed - will be re-implemented */}
              </Button>
              
              {user.role === 'customer' && (
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center text-xs p-0">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </Badge>
                  )}
                </Link>
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Mobile Search - Only when logged in */}
        {user && (
          <form onSubmit={handleSearch} className="sm:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search dishes, restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-0 h-9"
              />
            </div>
          </form>
        )}

        {/* Mobile Navigation - Only for non-logged in users */}
        {mobileMenuOpen && !user && (
          <div className="sm:hidden border-t">
            <div className="py-3 space-y-1">
              <Link
                to="/login"
                className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Notification List Dialog */}
      {notificationListOpen && (
        <ErrorBoundary>
          <NotificationList
            isOpen={notificationListOpen}
            onClose={() => setNotificationListOpen(false)}
            onSelectConversation={() => console.log('Chat functionality removed - will be re-implemented')}
          />
        </ErrorBoundary>
      )}
    </nav>
  );
};

export default Navbar;