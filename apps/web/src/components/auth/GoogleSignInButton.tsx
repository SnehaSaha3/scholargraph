"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
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

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleIdentity;
      };
    };
  }
}

export default function GoogleSignInButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (
      !scriptReady ||
      !window.google ||
      !buttonRef.current ||
      !clientId ||
      initialized.current
    ) {
      return;
    }

    initialized.current = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        if (busy) return;

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

          router.replace("/");
          router.refresh();
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Google sign-in failed. Please try again."
          );
          initialized.current = false;
        } finally {
          setBusy(false);
        }
      },
    });

    buttonRef.current.replaceChildren();

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "filled_black",
      size: "large",
      shape: "rectangular",
      text: "continue_with",
      width: Math.min(
        360,
        Math.max(240, Math.floor(buttonRef.current.clientWidth))
      ),
    });
  }, [scriptReady, refreshUser, router, busy]);

  return (
    <div className="space-y-3">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() =>
          setError("Google sign-in could not load. Check your connection.")
        }
      />

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
