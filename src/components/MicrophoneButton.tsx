import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface MicrophoneButtonProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ onTranscription, disabled }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US'; // Focus on English

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscription(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setError(event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setError("Speech recognition not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscription]);

  const toggleListening = () => {
    if (disabled) return;
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setError(null);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }
  };

  if (error && !recognitionRef.current) {
    return (
      <div className="text-red-500 text-sm flex items-center gap-2">
        <MicOff size={16} /> Browser not supported
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleListening}
        disabled={disabled}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors ${
          disabled 
            ? 'bg-slate-300 cursor-not-allowed' 
            : isListening 
              ? 'bg-red-500 text-white' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
        }`}
      >
        {isListening ? (
          <>
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 rounded-full border-4 border-red-400"
            />
            <Loader2 size={32} className="animate-spin" />
          </>
        ) : (
          <Mic size={36} />
        )}
      </motion.button>
      
      <span className={`text-sm font-medium ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
        {isListening ? "Listening..." : "Tap to speak"}
      </span>
      
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};
