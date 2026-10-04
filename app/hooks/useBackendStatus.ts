import { useState, useEffect, useCallback, useRef } from "react";

const HEALTH_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "") + "/api/health";
const CHECK_INTERVAL_MS = 30_000; // poll every 30s
const RETRY_INTERVAL_MS = 8_000;  // faster retry when already down
const FAIL_THRESHOLD = 2;         // need 2 consecutive failures before showing banner

/**
 * useBackendStatus
 *
 * Polls /api/health to detect if the backend is reachable.
 * Returns { isDown, retry } where:
 *   - isDown: true when the backend appears unreachable
 *   - retry:  call this to immediately re-check
 */
export function useBackendStatus() {
  const [isDown, setIsDown] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const failCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback(async () => {
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6_000);
      const res = await fetch(HEALTH_URL, {
        method: "GET",
        credentials: "omit",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        failCount.current = 0;
        setIsDown(false);
      } else {
        failCount.current += 1;
        if (failCount.current >= FAIL_THRESHOLD) setIsDown(true);
      }
    } catch {
      failCount.current += 1;
      if (failCount.current >= FAIL_THRESHOLD) setIsDown(true);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    check(); // initial check

    const schedule = () => {
      const interval = failCount.current >= FAIL_THRESHOLD ? RETRY_INTERVAL_MS : CHECK_INTERVAL_MS;
      timerRef.current = setTimeout(() => {
        check().finally(schedule);
      }, interval);
    };

    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [check]);

  return { isDown, isChecking, retry: check };
}
