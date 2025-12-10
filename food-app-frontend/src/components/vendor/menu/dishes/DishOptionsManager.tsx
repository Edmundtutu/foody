import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FormLabel, FormDescription } from '@/components/ui/form';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface DishOption {
  name: string;
  extra_cost: number;
  required: boolean;
}

interface DishOptionsManagerProps {
  options: DishOption[];
  onOptionsChange: (options: DishOption[]) => void;
}

const DishOptionsManager: React.FC<DishOptionsManagerProps> = ({
  options,
  onOptionsChange,
}) => {
  const [newOptionName, setNewOptionName] = React.useState('');
  const [newOptionCost, setNewOptionCost] = React.useState(0);
  const [newOptionRequired, setNewOptionRequired] = React.useState(false);

  const handleAddOption = () => {
    if (!newOptionName.trim()) {
      toast.error('Please enter option name');
      return;
    }
    
    onOptionsChange([
      ...options,
      {
        name: newOptionName,
        extra_cost: newOptionCost,
        required: newOptionRequired,
      },
    ]);
    
    setNewOptionName('');
    setNewOptionCost(0);
    setNewOptionRequired(false);
  };

  const handleRemoveOption = (index: number) => {
    onOptionsChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <FormLabel>Dish Options</FormLabel>
        <Badge variant="secondary">{options.length} options</Badge>
      </div>
      <FormDescription>
        Add customizable options like sizes, extras, or toppings with additional costs.
      </FormDescription>

      {/* Existing Options List */}
      {options.length > 0 && (
        <div className="space-y-2">
          {options.map((option, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white rounded-lg border"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{option.name}</span>
                  {option.required && (
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  +UGX {option.extra_cost.toLocaleString()}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveOption(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Option Form */}
      <div className="grid grid-cols-12 gap-2 pt-2 border-t">
        <div className="col-span-5">
          <Input
            type="text"
            placeholder="Option name"
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
          />
        </div>
        <div className="col-span-3">
          <Input
            type="number"
            placeholder="Cost"
            value={newOptionCost || ''}
            onChange={(e) => setNewOptionCost(Number(e.target.value) || 0)}
            min="0"
          />
        </div>
        <div className="col-span-2 flex items-center gap-1">
          <Checkbox
            id="new-option-required"
            checked={newOptionRequired}
            onCheckedChange={(checked) => setNewOptionRequired(!!checked)}
          />
          <label
            htmlFor="new-option-required"
            className="text-xs text-gray-600 cursor-pointer"
          >
            Required
          </label>
        </div>
        <div className="col-span-2">
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={handleAddOption}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DishOptionsManager;
