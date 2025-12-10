import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormLabel, FormDescription } from '@/components/ui/form';
import { Upload, X, Star } from 'lucide-react';

interface ImageUploadSectionProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  onImageUpload: (files: FileList | null) => void;
  isUploading?: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  images,
  onImagesChange,
  onImageUpload,
  isUploading = false,
  fileInputRef,
}) => {
  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  const handleSetHeroImage = (index: number) => {
    if (index === 0) return; // Already hero
    const updatedImages = [...images];
    const [heroImage] = updatedImages.splice(index, 1);
    updatedImages.unshift(heroImage);
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-2">
      <FormLabel>Images</FormLabel>
      <FormDescription>
        Upload up to 8 images. The first image will be used as the hero image.
      </FormDescription>

      {/* Image Upload Area */}
      <div
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('border-primary');
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-primary');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-primary');
          onImageUpload(e.dataTransfer.files);
        }}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-1">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, WEBP up to 5MB each
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => onImageUpload(e.target.files)}
        className="hidden"
        disabled={isUploading || images.length >= 8}
      />

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border"
            >
              <img
                src={imageUrl}
                alt={`Dish image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {index === 0 && (
                  <Badge variant="default" className="absolute top-1 left-1">
                    <Star className="h-3 w-3 mr-1" />
                    Hero
                  </Badge>
                )}
                {index !== 0 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetHeroImage(index);
                    }}
                    title="Set as hero image"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(index);
                  }}
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <p className="text-sm text-muted-foreground">Uploading images...</p>
      )}
    </div>
  );
};

export default ImageUploadSection;
