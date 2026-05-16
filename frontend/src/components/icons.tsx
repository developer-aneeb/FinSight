import React from 'react';

export const LogoIcon = ({ width = 40, height = 40, className = "" }) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="2" y="2" width="28" height="28" rx="6" fill="#7dc3c9" opacity="0.14" />
    {/* Stylized F */}
    <path d="M7 5.5C7 4.67 7.67 4 8.5 4H21.5C22.33 4 23 4.67 23 5.5V8C23 8.83 22.33 9.5 21.5 9.5H12V13.5H19.5C20.33 13.5 21 14.17 21 15V17.5C21 18.33 20.33 19 19.5 19H12V26.5C12 27.33 11.33 28 10.5 28H8.5C7.67 28 7 27.33 7 26.5V5.5Z" fill="#0f2d54" />
    {/* Ascending bars */}
    <rect x="16" y="19" width="3" height="9" rx="1" fill="#3b82f6" />
    <rect x="20" y="15" width="3" height="13" rx="1" fill="#22b8f8" />
    <rect x="24" y="10" width="3" height="18" rx="1" fill="#2ad59c" />
  </svg>
);

export const RobotIcon = ({ width = 48, height = 48, className = "" }) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle (Optional, matches image) */}
    <circle cx="24" cy="24" r="24" fill="#ccfbf1" opacity="0.6"/>
    
    {/* Antenna */}
    <line x1="24" y1="16" x2="24" y2="8" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="24" cy="7" r="2.5" fill="#64748b"/>
    
    {/* Robot Head Base */}
    <rect x="10" y="16" width="28" height="20" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
    <rect x="14" y="20" width="20" height="12" rx="4" fill="#0f172a"/>
    
    {/* Glowing Eyes */}
    <path d="M17 24 Q18.5 21 20 24" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M28 24 Q29.5 21 31 24" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
    
    {/* Smile */}
    <path d="M22 26 Q24 28 26 26" stroke="#34d399" strokeWidth="2" strokeLinecap="round"/>
    
    {/* Ears/Bolts */}
    <path d="M10 22 H8 V28 H10 V22 Z" fill="#94a3b8"/>
    <path d="M38 22 H40 V28 H38 V22 Z" fill="#94a3b8"/>
  </svg>
);

export const SparklineIcon = ({ width = 120, height = 40, className = "" }) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 120 40" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="lineGrad" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4da8f7" />
        <stop offset="0.65" stopColor="#67d4ff" />
        <stop offset="1" stopColor="#57e8b2" />
      </linearGradient>
      <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8fd4ff" stopOpacity="0.55" />
        <stop offset="1" stopColor="#8fd4ff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#bce9ff" stopOpacity="0.5" />
        <stop offset="1" stopColor="#bce9ff" stopOpacity="0.02" />
      </linearGradient>
    </defs>

    {/* Background bars like original card */}
    <rect x="66" y="14" width="4" height="26" rx="1" fill="url(#barGrad)" />
    <rect x="74" y="9" width="4" height="31" rx="1" fill="url(#barGrad)" />
    <rect x="82" y="17" width="4" height="23" rx="1" fill="url(#barGrad)" />
    <rect x="90" y="11" width="4" height="29" rx="1" fill="url(#barGrad)" />
    <rect x="98" y="7" width="4" height="33" rx="1" fill="url(#barGrad)" />

    <path 
      d="M2 33 C 12 32, 17 26, 26 26 C 34 26, 40 33, 52 22 C 60 15, 67 17, 76 12 C 83 8, 87 11, 95 17 C 103 23, 108 13, 118 6 L 118 40 L 2 40 Z" 
      fill="url(#fillGrad)" 
    />
    
    <path 
      d="M2 33 C 12 32, 17 26, 26 26 C 34 26, 40 33, 52 22 C 60 15, 67 17, 76 12 C 83 8, 87 11, 95 17 C 103 23, 108 13, 118 6" 
      stroke="url(#lineGrad)" 
      strokeWidth="3" 
      strokeLinecap="round" 
      fill="none"
    />
    
    <circle cx="95" cy="17" r="2.8" fill="#5ac4ff" />
    <circle cx="118" cy="6" r="4" fill="#57e8b2" stroke="#fff" strokeWidth="1.5" />
  </svg>
);