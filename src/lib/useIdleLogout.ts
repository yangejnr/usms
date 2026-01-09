"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_IDLE_SECONDS = 30 * 60;
const DEFAULT_COUNTDOWN_SECONDS = 60;

export function useIdleLogout() {
  const router = useRouter();
  const lastActiveRef = useRef(Date.now());
  const hasLoggedOutRef = useRef(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  useEffect(() => {
    const idleSecondsRaw = Number(
      process.env.NEXT_PUBLIC_AUTH_IDLE_TIMEOUT_SECONDS
    );
    const idleSeconds =
      Number.isFinite(idleSecondsRaw) && idleSecondsRaw > 0
        ? idleSecondsRaw
        : DEFAULT_IDLE_SECONDS;
    const countdownSecondsRaw = Number(
      process.env.NEXT_PUBLIC_AUTH_COUNTDOWN_SECONDS
    );
    const countdownSeconds =
      Number.isFinite(countdownSecondsRaw) && countdownSecondsRaw > 0
        ? countdownSecondsRaw
        : DEFAULT_COUNTDOWN_SECONDS;

    const markActivity = () => {
      lastActiveRef.current = Date.now();
      if (countdownRef.current !== null) {
        window.clearInterval(countdownRef.current);
        countdownRef.current = null;
        setCountdown(null);
      }
    };

    const checkIdle = async () => {
      if (hasLoggedOutRef.current) {
        return;
      }
      const elapsed = Date.now() - lastActiveRef.current;
      if (elapsed >= idleSeconds * 1000) {
        if (countdownRef.current === null) {
          let remaining = countdownSeconds;
          setCountdown(remaining);
          countdownRef.current = window.setInterval(async () => {
            remaining -= 1;
            setCountdown(remaining);
            if (remaining <= 0) {
              if (countdownRef.current !== null) {
                window.clearInterval(countdownRef.current);
              }
              countdownRef.current = null;
              hasLoggedOutRef.current = true;
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } finally {
                router.push("/");
              }
            }
          }, 1000);
        }
      }
    };

    const interval = window.setInterval(checkIdle, 10_000);
    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    events.forEach((event) => window.addEventListener(event, markActivity));
    document.addEventListener("visibilitychange", markActivity);

    return () => {
      window.clearInterval(interval);
      if (countdownRef.current !== null) {
        window.clearInterval(countdownRef.current);
      }
      events.forEach((event) => window.removeEventListener(event, markActivity));
      document.removeEventListener("visibilitychange", markActivity);
    };
  }, [router]);

  return { countdown };
}
