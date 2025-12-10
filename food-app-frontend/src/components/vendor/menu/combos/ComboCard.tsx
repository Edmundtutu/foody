import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Edit, Copy, Check, X, Trash2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import type { Combo } from '@/services/menuService';
import {
  getPricingModeExplanation,
  getPricingModeFormula,
  getPricingModeHint,
  calculatePriceRange,
} from '@/utils/pricingUtils';

interface ComboCardProps {
  combo: Combo;
  onEdit: (combo: Combo) => void;
  onDuplicate: (combo: Combo) => void;
  onToggleStatus: (comboId: string) => void;
  onDelete: (comboId: string) => void;
  isDuplicating?: boolean;
  isToggling?: boolean;
  isDeleting?: boolean;
}

const ComboCard: React.FC<ComboCardProps> = ({
  combo,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
  isDuplicating = false,
  isToggling = false,
  isDeleting = false,
}) => {
  const [showPricingDetails, setShowPricingDetails] = useState(false);
  const priceRange = calculatePriceRange(combo);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow h-full border">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-gray-800">{combo.name}</h3>
              <Badge
                variant={combo.available ? "default" : "secondary"}
                className={combo.available ? "bg-green-500 hover:bg-green-600" : ""}
              >
                {combo.available ? 'Active' : 'Inactive'}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={`
                        cursor-help
                        ${combo.pricing_mode === 'FIXED' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        ${combo.pricing_mode === 'DYNAMIC' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                        ${combo.pricing_mode === 'HYBRID' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                      `}
                    >
                      {combo.pricing_mode}
                      <Info className="h-3 w-3 ml-1" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">{getPricingModeFormula(combo.pricing_mode)}</p>
                    <p className="text-xs">{getPricingModeExplanation(combo.pricing_mode)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{combo.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 p-2 rounded">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">Base Price</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{getPricingModeHint(combo.pricing_mode)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="font-bold text-gray-800">UGX {combo.base_price.toLocaleString()}</p>
            {combo.pricing_mode === 'DYNAMIC' && (
              <p className="text-xs text-amber-600 mt-1">Not used in DYNAMIC mode</p>
            )}
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500">Groups</p>
            <p className="font-bold text-gray-800">{combo.groups?.length || 0}</p>
          </div>
        </div>

        {priceRange && (
          <div className="mb-4 p-2 bg-blue-50 rounded border border-blue-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-blue-700">Estimated Price Range</p>
            </div>
            <p className="text-sm font-bold text-blue-900">
              UGX {priceRange.min.toLocaleString()} - {priceRange.max.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Based on min/max selections
            </p>
          </div>
        )}

        <Collapsible open={showPricingDetails} onOpenChange={setShowPricingDetails}>
          <CollapsibleTrigger className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 mb-2">
            {showPricingDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showPricingDetails ? 'Hide' : 'View'} Pricing Details
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2">
            <div className="p-3 bg-gray-50 rounded text-xs space-y-2">
              <div>
                <p className="font-semibold text-gray-700 mb-1">How pricing works:</p>
                <p className="text-gray-600">{getPricingModeExplanation(combo.pricing_mode)}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="font-semibold text-gray-700 mb-1">Formula:</p>
                <p className="font-mono text-gray-800">{getPricingModeFormula(combo.pricing_mode)}</p>
              </div>
              {combo.pricing_mode === 'FIXED' && (
                <div className="pt-2 border-t bg-green-50 p-2 rounded">
                  <p className="text-green-700">
                    ✓ Customers always pay <span className="font-bold">UGX {combo.base_price.toLocaleString()}</span> plus any dish options they choose.
                  </p>
                </div>
              )}
              {combo.pricing_mode === 'DYNAMIC' && (
                <div className="pt-2 border-t bg-blue-50 p-2 rounded">
                  <p className="text-blue-700">
                    ✓ Price varies based on which dishes customers select. No fixed base price applies.
                  </p>
                </div>
              )}
              {combo.pricing_mode === 'HYBRID' && (
                <div className="pt-2 border-t bg-purple-50 p-2 rounded">
                  <p className="text-purple-700">
                    ✓ Starts at <span className="font-bold">UGX {combo.base_price.toLocaleString()}</span>, then adds item extras and options.
                  </p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {combo.groups && combo.groups.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Groups</p>
            <div className="space-y-1">
              {combo.groups.slice(0, 2).map(group => (
                <div key={group.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium text-gray-700 truncate">{group.name}</span>
                  <span className="text-xs text-gray-500">
                    {group.items?.length || 0} items
                  </span>
                </div>
              ))}
              {combo.groups.length > 2 && (
                <div className="text-center text-xs text-gray-500 py-1">
                  +{combo.groups.length - 2} more groups
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(combo)}
              title="Edit Combo"
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDuplicate(combo)}
              disabled={isDuplicating}
              title="Duplicate Combo"
            >
              {isDuplicating ? (
                <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleStatus(combo.id)}
              disabled={isToggling}
              title={combo.available ? 'Deactivate' : 'Activate'}
            >
              {isToggling ? (
                <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
              ) : combo.available ? (
                <X className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(combo.id)}
              disabled={isDeleting}
              title="Delete Combo"
            >
              {isDeleting ? (
                <div className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ComboCard;
