"use client";

import { useEffect, useState } from 'react';

interface BodyProps {
  className?: string;
  children: React.ReactNode;
}

export default function Body({ className, children }: BodyProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <body 
      className={className}
      suppressHydrationWarning={true}
    >
      {children}
      {isClient && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Remove browser extension attributes that cause hydration issues
              document.body.removeAttribute('cz-shortcut-listen');
              document.body.removeAttribute('data-new-gr-c-s-check-loaded');
              document.body.removeAttribute('data-gr-ext-installed');
            `
          }}
        />
      )}
    </body>
  );
}
