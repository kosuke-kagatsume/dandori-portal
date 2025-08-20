'use client';

import { useState } from "react";
import Image from "next/image";

export default function Logo() {
  const [err, setErr] = useState(false);
  
  return err ? (
    <div className="flex items-center space-x-2">
      <div 
        aria-label="Dandori Portal" 
        className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-blue-500 text-white grid place-items-center font-bold shadow-sm"
      >
        D
      </div>
      <span className="text-lg font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 bg-clip-text text-transparent hidden sm:inline">
        ダンドリワーク
      </span>
    </div>
  ) : (
    <div className="flex items-center space-x-2">
      <Image 
        src="/dandori-logo.jpg" 
        alt="Dandori Portal" 
        width={32} 
        height={32} 
        onError={() => setErr(true)} 
        priority 
        className="rounded-md"
      />
      <span className="text-lg font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 bg-clip-text text-transparent hidden sm:inline">
        ダンドリワーク
      </span>
    </div>
  );
}