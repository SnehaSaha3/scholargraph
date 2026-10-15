"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { googleLogin } from "@/lib/researchApi";
import { useAuth } from "@/components/auth/AuthProvider";

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleIdentity = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    element: HTMLElement,
    options: {
      theme: "filled_black";
      size: "large";
      shape: "rectangular";
      text: "continue_with";
      width: number;
    }
  ) => void;
};

type GsiStore = {
  initializedFor: string | null;
  handler: ((credential: string) => void) | null;
  loader: Promise<void> | null;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleIdentity;
      };
    };
    __gsiStore?: GsiStore;
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

function getStore(): GsiStore {
  if (!window.__gsiStore) {
    window.__gsiStore = { initializedFor: null, handler: null, loader: null };
  }
  return window.__gsiStore;
}

function loadGoogleScript(): Promise<void> {
  const store = getStore();

  if (window.google?.accounts?.id) return Promise.resolve();
  if (store.loader) return store.loader;

  store.loader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SRC}"]`
    );
    const script = existing ?? document.createElement("script");

    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        store.loader = null;
        reject(new Error("Google sign-in could not load. Check your connection."));
      },
      { once: true }
    );

    if (!existing) {
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return store.loader;
}

export default function GoogleSignInButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { refreshUser } = useAuth();
  const router = useRouter();

  const handlerRef = useRef<(credential: string) => Promise<void>>(
    async () => {}
  );

  handlerRef.current = async (credential: string) => {
    if (busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setError("");

    try {
      await googleLogin(credential);

      const user = await refreshUser();

      if (!user) {
        throw new Error(
          "Google sign-in completed, but your session could not be verified."
        );
      }

      router.replace("/workspace");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Google sign-in failed. Please try again."
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setError("Google client ID is not configured.");
      return;
    }

    let cancelled = false;
    const store = getStore();

    const myHandler = (credential: string) => {
      void handlerRef.current(credential);
    };
    store.handler = myHandler;

    loadGoogleScript()
      .then(() => {
        const element = buttonRef.current;
        const google = window.google;

        if (cancelled || !element || !google?.accounts?.id) return;

        if (store.initializedFor !== clientId) {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: ({ credential }) => getStore().handler?.(credential),
          });
          store.initializedFor = clientId;
        }

        element.replaceChildren();

        google.accounts.id.renderButton(element, {
          theme: "filled_black",
          size: "large",
          shape: "rectangular",
          text: "continue_with",
          width: Math.min(360, Math.max(240, element.clientWidth || 320)),
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Google sign-in could not load."
        );
      });

    return () => {
      cancelled = true;
      if (store.handler === myHandler) store.handler = null;
      buttonRef.current?.replaceChildren();
    };
  }, []);

  return (
    <div className="space-y-3">
      <div
        ref={buttonRef}
        className="flex min-h-10 justify-center"
        aria-label="Continue with Google"
      />

      {busy && (
        <p role="status" className="text-center text-xs text-white/50">
          Signing in with Google...
        </p>
      )}

      {error && (
        <p role="alert" className="text-center text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}