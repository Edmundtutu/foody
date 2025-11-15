import { useState, useCallback } from 'react';

export interface UseImageCaptureResult {
  capturedImages: string[];
  showCameraModal: boolean;
  setShowCameraModal: (value: boolean) => void;
  handleCameraCapture: (imageData: string) => void;
  handleCameraClose: () => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  clearImages: () => void;
}

/**
 * Encapsulates image capture and upload flow for post creation.
 */
export const useImageCapture = (): UseImageCaptureResult => {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const handleCameraCapture = useCallback((imageData: string) => {
    // Limit to maximum of 4 images, matching UI constraints
    setCapturedImages(prev => (prev.length >= 4 ? prev : [...prev, imageData]));
    setShowCameraModal(false);
  }, []);

  const handleCameraClose = useCallback(() => {
    setShowCameraModal(false);
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const remainingSlots = Math.max(0, 4 - capturedImages.length);
    const filesToRead = Array.from(files).slice(0, remainingSlots);

    filesToRead.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        setCapturedImages(prev => (prev.length >= 4 ? prev : [...prev, result]));
      };
      reader.readAsDataURL(file);
    });
  }, [capturedImages.length]);

  const removeImage = useCallback((index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearImages = useCallback(() => {
    setCapturedImages([]);
  }, []);

  return {
    capturedImages,
    showCameraModal,
    setShowCameraModal,
    handleCameraCapture,
    handleCameraClose,
    handleFileUpload,
    removeImage,
    clearImages,
  };
};


