'use client';

import React from 'react';

export const FrostedGlassBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-gradient-to-br from-[#FAFAFA] via-[#F4F4F5] to-[#E4E4E7] dark:from-[#09090B] dark:via-[#121215] dark:to-[#18181B]">
      {/* Dynamic Ambient Monochrome Light Mesh Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full bg-zinc-300/40 dark:bg-zinc-700/20 blur-[130px] animate-ios-orb-1" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full bg-zinc-400/30 dark:bg-zinc-800/25 blur-[140px] animate-ios-orb-2" />
      <div className="absolute top-[25%] right-[10%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-zinc-200/50 dark:bg-zinc-800/15 blur-[110px] animate-ios-orb-3" />

      {/* Multi-layered Frosted Glass Overlay */}
      <div className="absolute inset-0 backdrop-blur-[60px] backdrop-saturate-[180%] bg-white/40 dark:bg-zinc-950/50" />

      {/* Specular Ambient Reflection Sheen */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/10 dark:from-white/5 dark:to-transparent opacity-60" />
    </div>
  );
};

export default FrostedGlassBackground;
