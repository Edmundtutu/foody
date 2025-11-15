import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, RotateCcw, Upload, Check } from 'lucide-react';
import { useCamera } from '@/hooks/utils/useCamera';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { 
    videoRef, 
    canvasRef, 
    error, 
    isStreaming, 
    startCamera, 
    stopCamera, 
    capturePhoto: hookCapturePhoto,
    switchCamera 
  } = useCamera();

  React.useEffect(() => {
    startCamera('environment');
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const capturePhoto = useCallback(() => {
    setIsProcessing(true);
    const imageData = hookCapturePhoto();
    if (imageData) {
      setCapturedImage(imageData);
    }
    setIsProcessing(false);
  }, [hookCapturePhoto]);

  const handleConfirm = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onCapture(result);
      };
      reader.readAsDataURL(file);
    }
  };


  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">Camera access failed: {error}</p>
            <div className="space-y-2">
              <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo Instead
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                Cancel
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 text-white">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="h-6 w-6" />
        </Button>
        <h2 className="text-lg font-medium">
          {capturedImage ? 'Photo Preview' : 'Take Photo'}
        </h2>
        {!capturedImage && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={switchCamera}
            className="text-white hover:bg-white/20"
          >
            <RotateCcw className="h-6 w-6" />
          </Button>
        )}
        {capturedImage && <div className="w-10" />}
      </div>

      {/* Camera/Preview Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {capturedImage ? (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls - sticky bottom with gradient background */}
      <div className="sticky bottom-0 left-0 w-full p-6" style={{zIndex: 10}}>
        <div className="absolute inset-0 h-full w-full pointer-events-none" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.85) 80%, rgba(0,0,0,0.2) 100%)', zIndex: 0}} />
        <div className="relative z-10">
          {capturedImage ? (
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={handleRetake} className="flex-1">
                Retake
              </Button>
              <Button onClick={handleConfirm} className="flex-1" disabled={isProcessing}>
                <Check className="h-4 w-4 mr-2" />
                {isProcessing ? 'Adding...' : 'Add Photo'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="flex gap-4 items-center">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-white hover:bg-white/20"
                >
                  <Upload className="h-6 w-6" />
                </Button>
                <Button
                  size="lg"
                  onClick={capturePhoto}
                  disabled={isProcessing || !isStreaming}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white text-black hover:bg-gray-200 shadow-lg border-4 border-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  style={{boxShadow: '0 4px 24px 0 rgba(0,0,0,0.4)'}}
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black" />
                  ) : (
                    <Camera className="h-10 w-10 md:h-12 md:w-12" />
                  )}
                </Button>
                <div className="w-12" /> {/* Spacer */}
              </div>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default CameraCapture;