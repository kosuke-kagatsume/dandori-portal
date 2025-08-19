'use client';

import { useState } from "react";
import Image from "next/image";

export default function Logo() {
  const [err, setErr] = useState(false);
  
  return err ? (
    <div 
      aria-label="Dandori Portal" 
      className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-blue-500 text-white grid place-items-center font-bold"
    >
      D
    </div>
  ) : (
    <div style={{outline: "2px solid red", padding: 4}}>
      <Image 
        src="/dandori-logo.jpg" 
        alt="Dandori Portal" 
        width={32} 
        height={32} 
        onError={() => setErr(true)} 
        priority 
      />
    </div>
  );
}