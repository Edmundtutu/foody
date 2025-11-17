import React from 'react';
import { useAuth } from '@/context/AuthContext';
import DesktopSidebar from '@/components/DesktopSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import Navbar from '@/components/Navbar';

interface VendorLayoutProps {
    children: React.ReactNode;
}

const VendorLayout: React.FC<VendorLayoutProps> = ({ children }) => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header - Fixed */}
            <Navbar user={user} />

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar - Fixed width */}
                <aside className="hidden md:block w-64 border-r border-border bg-muted/30 overflow-y-auto flex-shrink-0">
                    <DesktopSidebar />
                </aside>

                {/* Main Content - Scrollable */}
                <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation - Fixed */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background z-40">
                <MobileBottomNav />
            </nav>
        </div>
    );
};

export default VendorLayout;