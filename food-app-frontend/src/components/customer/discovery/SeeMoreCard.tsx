import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SeeMoreCardProps {
    onClick: () => void;
    isLoading?: boolean;
}

const SeeMoreCard: React.FC<SeeMoreCardProps> = ({ onClick, isLoading }) => {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className="flex-shrink-0 w-48 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02] cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {/* Match image height of other cards */}
            <div className="h-32 flex items-center justify-center bg-primary/5 rounded-t-xl">
                {isLoading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                ) : (
                    <div className="bg-primary/20 rounded-full p-3 inline-block">
                        <ChevronRight className="h-6 w-6 text-primary" />
                    </div>
                )}
            </div>
            {/* Match content area height */}
            <div className="p-3 flex flex-col justify-center items-center min-h-[120px]">
                {isLoading ? (
                    <p className="text-sm font-medium text-primary">Loading more...</p>
                ) : (
                    <>
                        <p className="text-sm font-bold text-primary mb-1">See More</p>
                        <p className="text-xs text-muted-foreground">Load more items</p>
                    </>
                )}
            </div>
        </button>
    );
};

export default SeeMoreCard;
