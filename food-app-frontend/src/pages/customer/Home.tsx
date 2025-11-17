import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.tsx';

const Home: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect restaurant users to their dashboard
    useEffect(() => {
        if (user?.role === 'restaurant') {
            navigate('/vendor/dashboard', { replace: true });
        }
    }, [user, navigate]);

    // Don't render customer content if user is a restaurant (will redirect)
    if (user?.role === 'restaurant') {
        return null;
    }

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Welcome to Foody</h1>
                <p className="text-muted-foreground">
                    This is the home page. Content to be implemented.
                </p>
            </div>
        </div>
    );
};

export default Home;

