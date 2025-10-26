"use client";

import React, { useState, useEffect } from "react";
import { TourProvider as ReactourProvider } from "@reactour/tour";
import { usePathname } from "next/navigation";
import { getSteps, TourPersona } from "./steps";

interface AppTourProviderProps {
  children: React.ReactNode;
  persona: TourPersona; // "client" or "admin"
}

const AppTourProvider: React.FC<AppTourProviderProps> = ({
  children,
  persona,
}) => {
  const pathname = usePathname();
  const [steps, setSteps] = useState(getSteps(persona, pathname));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const updatedSteps = getSteps(persona, pathname);
    setSteps(updatedSteps);
  }, [persona, pathname]);

  return (
    <ReactourProvider
      steps={steps}
      afterOpen={() => (document.body.style.overflow = "hidden")}
      beforeClose={() => (document.body.style.overflow = "auto")}
      onClickMask={() => setIsOpen(false)}
      onClickClose={() => setIsOpen(false)}
      showNavigation
      showCloseButton
      showDots
      disableInteraction={false}
      styles={{
        popover: (base) => ({
          ...base,
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }),
      }}
    >
      {children}
    </ReactourProvider>
  );
};

export default AppTourProvider;
