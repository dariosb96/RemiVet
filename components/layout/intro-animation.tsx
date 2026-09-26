"use client";

import { useEffect, useState } from "react";

export function IntroAnimation() {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark");
    setIsDark(dark);

    const closeTimer = window.setTimeout(() => {
      setClosing(true);
    }, 2500);

    const removeTimer = window.setTimeout(() => {
      setVisible(false);
    }, 5250);

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
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
        closing ? "opacity-0" : "opacity-100"
      } ${isDark ? "bg-black" : "bg-white"}`}
    >
      <video
        key={isDark ? "dark" : "light"}
        autoPlay
        muted
        playsInline
        className="h-full w-full object-contain"
      >
        <source
          src={isDark ? "/intro-dark.mp4" : "/intro-light.mp4"}
          type="video/mp4"
        />
      </video>
    </div>
  );
}
