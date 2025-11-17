import React from 'react';
import { useSearchParams } from 'react-router-dom';

const Discover: React.FC = () => {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search');

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Discover</h1>
                {searchQuery && (
                    <p className="text-muted-foreground mb-4">
                        Search results for: <span className="font-semibold">{searchQuery}</span>
                    </p>
                )}
                <p className="text-muted-foreground">
                    Discover restaurants and dishes. Content to be implemented.
                </p>
            </div>
        </div>
    );
};

export default Discover;

