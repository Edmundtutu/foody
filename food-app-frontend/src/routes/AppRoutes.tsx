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
import VendorMenu from '@/pages/vendor/Menu';
import VendorAccount from '@/pages/vendor/Account';
import VendorAgents from '@/pages/vendor/Agents';
import VendorDeliveries from '@/pages/vendor/Deliveries';

// Shared Pages
import OrderDetails from '@/pages/shared/OrderDetails';

// Customer Pages (placeholders - to be implemented)
import Home from '@/pages/customer/Home.tsx';
import FindFood from '@/pages/customer/FindFood.tsx';
import Restaurants from '@/pages/customer/Restaurants.tsx';
import Favorites from '@/pages/customer/Favorites.tsx';
import Profile from '@/pages/customer/Profile.tsx';
import MyMeal from '@/pages/customer/MyMeal.tsx';
import DishDetail from '@/pages/customer/DishDetail.tsx';
import RestaurantDetail from '@/pages/customer/RestaurantDetail.tsx';

// Other
import NotFound from '@/pages/NotFound';
import ComboBuilder from '@/pages/customer/ComboBuilder';

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
        // Redirect restaurants to vendor dashboard, customers to home
        const redirectPath = user.role === 'restaurant' ? '/vendor/dashboard' : '/';
        return <Navigate to={redirectPath} replace />;
    }

    const Layout = layout === 'vendor' ? VendorLayout : MainLayout;
    return <Layout>{children}</Layout>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        // Redirect based on role: restaurants go to vendor dashboard, others go to home
        const redirectPath = user?.role === 'restaurant' ? '/vendor/dashboard' : '/';
        return <Navigate to={redirectPath} replace />;
    }

    return <AuthLayout>{children}</AuthLayout>;
};

const AppRoutes: React.FC = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        }>
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

                {/* Customer Routes */}
                <Route path="/" element={
                    <ProtectedRoute layout="main">
                        <Home />
                    </ProtectedRoute>
                } />
                <Route path="/find-food" element={
                    <ProtectedRoute layout="main">
                        <FindFood />
                    </ProtectedRoute>
                } />
                <Route path="/restaurants" element={
                    <ProtectedRoute layout="main">
                        <Restaurants />
                    </ProtectedRoute>
                } />
                <Route path="/favorites" element={
                    <ProtectedRoute layout="main">
                        <Favorites />
                    </ProtectedRoute>
                } />
                <Route path="/orders/:orderId" element={
                    <ProtectedRoute layout="main">
                        <OrderDetails />
                    </ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute layout="main">
                        <Profile />
                    </ProtectedRoute>
                } />
                <Route path="/my-meal" element={
                    <ProtectedRoute layout="main">
                        <MyMeal />
                    </ProtectedRoute>
                } />
                <Route path="/dishes/:id" element={
                    <ProtectedRoute layout="main">
                        <DishDetail />
                    </ProtectedRoute>
                } />
                <Route path="/restaurants/:id" element={
                    <ProtectedRoute layout="main">
                        <RestaurantDetail />
                    </ProtectedRoute>
                } />
                <Route path="/combos/:comboId/builder" element={
                    <ProtectedRoute layout="main">
                        <ComboBuilder />
                    </ProtectedRoute>
                } />
                {/* Vendor Routes */}
                <Route path="/vendor/dashboard" element={
                    <ProtectedRoute requiredRole={['restaurant']} layout="vendor">
                        <VendorDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/kitchen" element={
                    <ProtectedRoute requiredRole={['restaurant']} layout="vendor">
                        <VendorKitchen />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/orders" element={
                    <ProtectedRoute requiredRole={['restaurant']} layout="vendor">
                        <VendorOrders />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/orders/:orderId" element={
                    <ProtectedRoute requiredRole={['restaurant']} layout="vendor">
                        <OrderDetails />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/analytics" element={
                    <ProtectedRoute requiredRole={['restaurant']} layout="vendor">
                        <VendorAnalytics />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/profile" element={
                    <ProtectedRoute requiredRole={['restaurant']} layout="vendor">
                        <VendorProfile />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/menu" element={
                    <ProtectedRoute requiredRole={['restaurant']} layout="vendor">
                        <VendorMenu />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/account" element={
                    <ProtectedRoute requiredRole={['restaurant']} layout="vendor">
                        <VendorAccount />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/agents" element={
                    <ProtectedRoute requiredRole={['restaurant']} layout="vendor">
                        <VendorAgents />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/deliveries" element={
                    <ProtectedRoute requiredRole={['restaurant']} layout="vendor">
                        <VendorDeliveries />
                    </ProtectedRoute>
                } />

                {/* Catch all route - 404 */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;