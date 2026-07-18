'use client';

import React from 'react';

export const FrostedGlassBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-gradient-to-br from-[#F8F5FC] via-[#EFE5F7] to-[#DEC6EA] dark:from-[#0A0512] dark:via-[#150B24] dark:to-[#230D3B]">
      {/* Dynamic Apple iOS Ambient Light Mesh Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full bg-purple-400/35 dark:bg-purple-600/30 blur-[100px] animate-ios-orb-1" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full bg-pink-400/30 dark:bg-pink-600/25 blur-[120px] animate-ios-orb-2" />
      <div className="absolute top-[25%] right-[10%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-sky-400/25 dark:bg-sky-600/20 blur-[90px] animate-ios-orb-3" />
      <div className="absolute bottom-[20%] left-[15%] w-[45vw] h-[45vw] max-w-[550px] max-h-[550px] rounded-full bg-amber-300/20 dark:bg-amber-500/15 blur-[110px] animate-ios-orb-1" />

      {/* Multi-layered Apple iOS Frosted Glass Prism Overlay */}
      <div className="absolute inset-0 backdrop-blur-[70px] backdrop-saturate-[190%] backdrop-brightness-[102%] bg-white/20 dark:bg-black/30" />

      {/* Specular Ambient Reflection Sheen */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-white/10 dark:from-white/5 dark:to-transparent opacity-70" />
    </div>
  );
};

export default FrostedGlassBackground;
