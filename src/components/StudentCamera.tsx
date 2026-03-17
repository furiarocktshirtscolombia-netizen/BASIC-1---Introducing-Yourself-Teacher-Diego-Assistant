import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

export const StudentCamera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCamera(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Camera not available");
        setHasCamera(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-48 h-48 bg-slate-800 rounded-xl overflow-hidden shadow-lg border-4 border-slate-700 flex items-center justify-center">
      {hasCamera ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100" // Mirror the video
        />
      ) : (
        <div className="flex flex-col items-center text-slate-400">
          <CameraOff size={32} />
          <span className="text-xs mt-2">{error || "Camera off"}</span>
        </div>
      )}
      
      {/* Optional overlay */}
      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
        <Camera size={12} /> Student
      </div>
    </div>
  );
};
