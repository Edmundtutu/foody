import React from 'react';
import { useAuth } from '@/context/AuthContext.tsx';

const Profile: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Profile</h1>
                {user && (
                    <div className="mb-4">
                        <p className="text-muted-foreground">
                            Logged in as: <span className="font-semibold">{user.name}</span>
                        </p>
                        <p className="text-muted-foreground">
                            Role: <span className="font-semibold">{user.role}</span>
                        </p>
                    </div>
                )}
                <p className="text-muted-foreground">
                    User profile management. Content to be implemented.
                </p>
            </div>
        </div>
    );
};

export default Profile;

