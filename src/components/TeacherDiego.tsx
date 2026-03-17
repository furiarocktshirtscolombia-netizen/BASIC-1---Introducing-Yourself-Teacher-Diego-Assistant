import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface TeacherDiegoProps {
  isSpeaking: boolean;
}

export const TeacherDiego: React.FC<TeacherDiegoProps> = ({ isSpeaking }) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, Math.random() * 3000 + 2000); // Blink every 2-5 seconds

    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
        {/* Body / T-Shirt */}
        <motion.path
          d="M 40 200 C 40 120, 160 120, 160 200 Z"
          fill="#3b82f6" // Blue T-shirt
          animate={{
            y: isSpeaking ? [0, -2, 0] : 0,
          }}
          transition={{
            repeat: Infinity,
            duration: 0.5,
          }}
        />
        
        {/* Neck */}
        <rect x="85" y="110" width="30" height="30" fill="#fcd34d" />
        
        {/* Head */}
        <circle cx="100" cy="80" r="45" fill="#fcd34d" />
        
        {/* Hair */}
        <path d="M 55 80 C 55 20, 145 20, 145 80 C 145 60, 55 60, 55 80 Z" fill="#451a03" />
        
        {/* Beard */}
        <path d="M 60 90 C 60 140, 140 140, 140 90 C 120 110, 80 110, 60 90 Z" fill="#451a03" />
        
        {/* Eyes */}
        <g transform="translate(0, 0)">
          {/* Left Eye */}
          <ellipse cx="85" cy="75" rx="5" ry={blink ? 1 : 5} fill="#1e3a8a" />
          {/* Right Eye */}
          <ellipse cx="115" cy="75" rx="5" ry={blink ? 1 : 5} fill="#1e3a8a" />
        </g>
        
        {/* Glasses (optional, maybe no glasses to look friendly) */}
        
        {/* Nose */}
        <path d="M 100 80 L 95 95 L 105 95 Z" fill="#d97706" opacity="0.5" />
        
        {/* Mouth */}
        <motion.path
          d="M 90 105 Q 100 115 110 105"
          stroke="#78350f"
          strokeWidth="3"
          fill="transparent"
          strokeLinecap="round"
          animate={{
            d: isSpeaking 
              ? ["M 90 105 Q 100 115 110 105", "M 90 105 Q 100 125 110 105", "M 90 105 Q 100 110 110 105"] 
              : "M 90 105 Q 100 115 110 105",
          }}
          transition={{
            repeat: Infinity,
            duration: 0.3,
          }}
        />
      </svg>
    </div>
  );
};
