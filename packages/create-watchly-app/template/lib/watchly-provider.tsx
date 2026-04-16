"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { parseAllowedParentOrigins } from "./allowed-parent-origins";
import { watchlyContextMessageSchema } from "./watchly-post-message";
import {
  defaultWatchlyContext,
  type WatchlyContext,
} from "./watchly-schema";

const WatchlyContextReact = createContext<WatchlyContext | undefined>(
  undefined,
);

/** Ignore dev tooling and other same-origin postMessage traffic (HMR, etc.). */
function isWatchlyContextEnvelope(
  data: unknown,
): data is { type: "watchly:context"; payload: unknown } {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data as { type: unknown }).type === "watchly:context"
  );
}

export function WatchlyProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<WatchlyContext>(defaultWatchlyContext);

  const allowedOrigins = useMemo(() => {
    return new Set(
      parseAllowedParentOrigins(
        process.env.NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS,
      ),
    );
  }, []);

  const onMessage = useCallback(
    (event: MessageEvent) => {
      if (!allowedOrigins.has(event.origin)) {
        return;
      }

      const inIframe = typeof window !== "undefined" && window.parent !== window;
      if (inIframe && event.source !== window.parent) {
        return;
      }

      if (!isWatchlyContextEnvelope(event.data)) {
        return;
      }

      const parsed = watchlyContextMessageSchema.safeParse(event.data);
      if (!parsed.success) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[watchlyDevkit] Ignoring invalid watchly:context payload",
            parsed.error.flatten(),
          );
        }
        return;
      }

      setContext(parsed.data.payload);
    },
    [allowedOrigins],
  );

  useEffect(() => {
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onMessage]);

  return (
    <WatchlyContextReact.Provider value={context}>
      {children}
    </WatchlyContextReact.Provider>
  );
}

export function useWatchlyContext(): WatchlyContext {
  const value = useContext(WatchlyContextReact);
  if (value === undefined) {
    throw new Error("useWatchlyContext must be used within a WatchlyProvider");
  }
  return value;
}
