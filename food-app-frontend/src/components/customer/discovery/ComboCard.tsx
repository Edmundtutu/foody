import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Star, Tag } from 'lucide-react';
import Buffet from '@/assets/icons/buffet.svg?react';
import type { Combo } from '@/services/menuService';

interface ComboCardProps {
    combo: Combo;
    onViewDetails?: (combo: Combo) => void;
}
const ComboCard: React.FC<ComboCardProps> = ({ combo, onViewDetails }) => {
    const navigate = useNavigate();
    const [showTooltip, setShowTooltip] = useState(false);

    const handleCardClick = () => {
        // Navigate to combo builder
        navigate(`/combos/${combo.id}/builder`);

        // Also call onViewDetails if provided (for backwards compatibility)
        if (onViewDetails) {
            onViewDetails(combo);
        }
    };

    const pricingModeIndicatorClass = () => {
        switch (combo.pricing_mode) {
            case 'FIXED':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'DYNAMIC':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'HYBRID':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div
            className="w-full bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02] cursor-pointer border-2 border-primary/20"
            onClick={handleCardClick}
        >
            <div className="relative">
                <img
                    src={`https://placehold.co/400x300/4F46E5/ffffff?text=${combo.name.split(' ')[0]}`}
                    alt={combo.name}
                    className="w-full h-32 object-cover rounded-t-xl"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "https://placehold.co/400x300/4F46E5/ffffff?text=COMBO";
                    }}
                />

                {/* Combo Badge */}
                <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                    <Buffet width={10} height={10} className="fill-white" fill="white" />
                    COMBO
                </div>

                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails?.(combo);
                            handleCardClick();
                        }}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary-dark transition duration-150 active:scale-95 z-10"
                        aria-label={`View ${combo.name} details`}
                    >
                        <Eye size={16} />
                    </button>
                    {showTooltip && (
                        <div className="absolute bottom-12 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                            View Details
                        </div>
                    )}
                </div>
            </div>
            <div className="p-3">

                <div className="flex justify-between items-center mb-1 sm:mb-2">
                    <h3 className="text-sm sm:text-base font-semibold truncate text-foreground flex-1 mr-2">{combo.name}</h3>
                    <p className="text-xs sm:text-sm font-bold text-primary whitespace-nowrap">
                        UGX {combo.base_price.toLocaleString()}
                    </p>
                </div>

                {/* Pricing Mode Indicator */}
                <div className="mb-2">
                    <div className="flex items-center text-[10px] text-gray-600 mb-1">
                        <Tag
                            size={10}
                            className={'mr-1 ' + pricingModeIndicatorClass()}
                        />
                        <span className={`font-medium ${pricingModeIndicatorClass()}`}>{combo.pricing_mode} Pricing</span>
                    </div>

                    {/* Group Info */}
                    <div className="flex items-center text-[10px] text-gray-600">

                        <span>{combo.groups?.length || 0} categor{(combo.groups?.length || 0) > 1 ? 'ies' : 'y'}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center text-accent font-medium">
                        <Star size={10} className="mr-1 fill-yellow-400 text-yellow-400" />
                        {combo.restaurant?.rating || 'N/A'}
                    </span>
                    <span className="text-gray-500">{combo.delivery_time ? `${combo.delivery_time} min` : 'N/A'}</span>
                </div>
            </div>
        </div>
    );
};

export default ComboCard;