import React, { createContext, useContext, useState, type ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import DesktopSidebar from '@/components/DesktopSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useAuth } from '@/context/AuthContext';

interface MainLayoutProps {
    children: React.ReactNode;
    rightPanel?: ReactNode;
}

// Context to manage right sidebar visibility and content
interface RightSidebarContextType {
    rightPanel: ReactNode | null;
    setRightPanel: (panel: ReactNode | null) => void;
}

const RightSidebarContext = createContext<RightSidebarContextType>({
    rightPanel: null,
    setRightPanel: () => { },
});

export const useRightSidebar = () => useContext(RightSidebarContext);

// Context to manage navbar customization
interface NavbarContextType {
    mobileHeader: ReactNode | null;
    desktopHeader: ReactNode | null;
    hideNavbar: boolean;
    hideMobileBottomNav: boolean;
    setMobileHeader: (header: ReactNode | null) => void;
    setDesktopHeader: (header: ReactNode | null) => void;
    setHideNavbar: (hide: boolean) => void;
    setHideMobileBottomNav: (hide: boolean) => void;
}

const NavbarContext = createContext<NavbarContextType>({
    mobileHeader: null,
    desktopHeader: null,
    hideNavbar: false,
    hideMobileBottomNav: false,
    setMobileHeader: () => { },
    setDesktopHeader: () => { },
    setHideNavbar: () => { },
    setHideMobileBottomNav: () => { },
});

export const useNavbar = () => useContext(NavbarContext);

const MainLayout: React.FC<MainLayoutProps> = ({ children, rightPanel: initialRightPanel }) => {
    const { user } = useAuth();
    const [rightPanel, setRightPanel] = useState<ReactNode | null>(initialRightPanel || null);
    const [mobileHeader, setMobileHeader] = useState<ReactNode | null>(null);
    const [desktopHeader, setDesktopHeader] = useState<ReactNode | null>(null);
    const [hideNavbar, setHideNavbar] = useState(false);
    const [hideMobileBottomNav, setHideMobileBottomNav] = useState(false);

    // Use the rightPanel from props if provided, otherwise use state
    const activeRightPanel = initialRightPanel !== undefined ? initialRightPanel : rightPanel;

    return (
        <RightSidebarContext.Provider value={{ rightPanel: activeRightPanel, setRightPanel }}>
            <NavbarContext.Provider value={{
                mobileHeader,
                desktopHeader,
                hideNavbar,
                hideMobileBottomNav,
                setMobileHeader,
                setDesktopHeader,
                setHideNavbar,
                setHideMobileBottomNav,
            }}>
                <div className="min-h-screen bg-background overflow-x-hidden">
                    {/* Desktop: Show custom header or default navbar */}
                    <div className="hidden lg:block">
                        {!hideNavbar && (desktopHeader || <Navbar user={user as any} />)}
                    </div>
                    
                    {/* Mobile: Show custom header or default navbar */}
                    <div className="lg:hidden">
                        {!hideNavbar && (mobileHeader || <Navbar user={user as any} />)}
                    </div>

                    <div className="flex min-h-screen">
                        {/* Desktop Sidebar - Fixed left sidebar */}
                        {user && <DesktopSidebar />}

                        {/* Main Content Area - Flexible width based on sidebars */}
                        <main className={`
                flex-1 min-h-screen w-full
                ${user ? 'lg:ml-64 xl:ml-72' : ''} 
                ${user && !hideMobileBottomNav ? 'pb-16 lg:pb-0' : 'pb-0'}
              `}>
                            {/* Content Container - Adaptive width */}
                            <div className={`
                  w-full mx-auto
                  ${mobileHeader || desktopHeader ? '' : 'px-2 sm:px-4 py-4 lg:py-6'}
                  ${user && activeRightPanel ? 'max-w-full sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl' : user ? 'max-w-full' : 'max-w-6xl'}
                `}>
                                {/* Layout with optional right panel */}
                                <div className={`
                    ${user && activeRightPanel ? 'lg:grid lg:grid-cols-12 lg:gap-6' : ''}
                  `}>
                                    {/* Main Content Area */}
                                    <div className={`
                      ${user && activeRightPanel ? 'lg:col-span-8 xl:col-span-7' : ''}
                    `}>
                                        {children}
                                    </div>

                                    {/* Dynamic Right Panel - Desktop only */}
                                    {user && activeRightPanel && (
                                        <div className="hidden lg:block lg:col-span-4 xl:col-span-5">
                                            {activeRightPanel}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </main>
                    </div>

                    {/* Mobile Bottom Navigation */}
                    {user && !hideMobileBottomNav && <MobileBottomNav />}
                </div>
            </NavbarContext.Provider>
        </RightSidebarContext.Provider>
    );
};

export default MainLayout;