import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Layouts
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import VendorLayout from '@/layouts/VendorLayout';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';


// Vendor Pages
import VendorDashboard from '@/pages/vendor/Dashboard';
import VendorKitchen from '@/pages/vendor/Kitchen';
import VendorOrders from '@/pages/vendor/Orders';
import VendorAnalytics from '@/pages/vendor/Analytics';
import VendorProfile from '@/pages/vendor/Profile';

// Route Guards
interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string[];
    layout: 'main' | 'vendor';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
                                                           children,
                                                           requiredRole,
                                                           layout
                                                       }) => {
    const { user, isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user && !requiredRole.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    const Layout = layout === 'vendor' ? VendorLayout : MainLayout;
    return <Layout>{children}</Layout>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <AuthLayout>{children}</AuthLayout>;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
                <PublicRoute>
                    <Login />
                </PublicRoute>
            } />
            <Route path="/register" element={
                <PublicRoute>
                    <Register />
                </PublicRoute>
            } />


            {/* Vendor Routes */}
            <Route path="/vendor/dashboard" element={
                <ProtectedRoute requiredRole={['vendor']} layout="vendor">
                    <VendorDashboard />
                </ProtectedRoute>
            } />
            <Route path="/vendor/kitchen" element={
                <ProtectedRoute requiredRole={['vendor']} layout="vendor">
                    <VendorKitchen />
                </ProtectedRoute>
            } />
            <Route path="/vendor/orders" element={
                <ProtectedRoute requiredRole={['vendor']} layout="vendor">
                    <VendorOrders />
                </ProtectedRoute>
            } />
            <Route path="/vendor/analytics" element={
                <ProtectedRoute requiredRole={['vendor']} layout="vendor">
                    <VendorAnalytics />
                </ProtectedRoute>
            } />
            <Route path="/vendor/profile" element={
                <ProtectedRoute requiredRole={['vendor']} layout="vendor">
                    <VendorProfile />
                </ProtectedRoute>
            } />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;