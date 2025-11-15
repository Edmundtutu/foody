import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-background">
            <Navbar user={user} />
            
            {/* Main Content */}
            <main className="flex-1 min-h-screen pb-20 md:pb-6">
                <div className="container mx-auto px-4 py-6">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </div>
    );
};

export default MainLayout;
