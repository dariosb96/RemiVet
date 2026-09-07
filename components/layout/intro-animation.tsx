"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function IntroAnimation() {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const closeTimer = window.setTimeout(() => {
      setClosing(true);
    }, 900);

    const removeTimer = window.setTimeout(() => {
      setVisible(false);
    }, 1250);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-300 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`transition-all duration-700 ease-out ${
          closing
            ? "scale-105 opacity-0"
            : "scale-100 opacity-100"
        }`}
      >
        <p className="text-2xl font-bold text-white text-center">Bienvenidos</p>
        <Image
          src="/RemiLogo.png"
          alt="Remi Vet"
          width={420}
          height={420}
          priority
          className="h-auto w-[260px] sm:w-[320px]"
        />
      </div>
    </div>
  );
}