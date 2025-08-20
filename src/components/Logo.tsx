'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function Logo() {
  const [hasError, setHasError] = useState(false);

  return (
    <Image
      src="/dandori-logo.jpg"
      alt="Dandori Portal"
      width={32}
      height={32}
      priority
      className="rounded-md"
      onError={() => setHasError(true)}
    />
  );
}