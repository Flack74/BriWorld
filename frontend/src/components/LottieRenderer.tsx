import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    lottie?: {
      loadAnimation: (config: Record<string, unknown>) => {
        destroy: () => void;
        setSpeed: (speed: number) => void;
      };
    };
  }
}

let lottieScriptPromise: Promise<void> | null = null;

function ensureLottieScript() {
  if (window.lottie) {
    return Promise.resolve();
  }

  if (lottieScriptPromise) {
    return lottieScriptPromise;
  }

  lottieScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-lottie-web="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load lottie-web")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js";
    script.async = true;
    script.dataset.lottieWeb = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load lottie-web"));
    document.body.appendChild(script);
  });

  return lottieScriptPromise;
}

interface LottieRendererProps {
  src: string;
  loop?: boolean;
  speed?: number;
  className?: string;
}

export function LottieRenderer({
  src,
  loop = true,
  speed = 1,
  className = "",
}: LottieRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<{ destroy: () => void; setSpeed: (value: number) => void } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisible(entries.some((entry) => entry.isIntersecting));
      },
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !containerRef.current || !src) {
      return;
    }

    let cancelled = false;

    ensureLottieScript()
      .then(() => {
        if (cancelled || !window.lottie || !containerRef.current) {
          return;
        }

        animationRef.current?.destroy();
        animationRef.current = window.lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop,
          autoplay: true,
          path: src,
        });
        animationRef.current.setSpeed(speed);
      })
      .catch(() => {
        // Ignore failed lottie loads and leave empty fallback.
      });

    return () => {
      cancelled = true;
      animationRef.current?.destroy();
      animationRef.current = null;
    };
  }, [isVisible, src, loop, speed]);

  useEffect(() => {
    animationRef.current?.setSpeed(speed);
  }, [speed]);

  return <div ref={containerRef} className={className} />;
}
