import React from 'react';
import { useSearchParams } from 'react-router-dom';

const FindFood: React.FC = () => {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search');

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Find Food</h1>
                {searchQuery && (
                    <p className="text-muted-foreground mb-4">
                        Showing meals for <span className="font-semibold">{searchQuery}</span>
                    </p>
                )}
                <p className="text-muted-foreground">
                    Browse dishes and restaurants tailored to your cravings. Content to be implemented.
                </p>
            </div>
        </div>
    );
};

export default FindFood;

