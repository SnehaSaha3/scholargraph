"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, LoaderCircle } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { loginUser, registerUser } from "@/lib/researchApi";

import GoogleSignInButton from "@/components/auth/GoogleSignInButton"

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/workspace");
    }
  }, [authLoading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "register" && !displayName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (mode === "register" && password.length < 12) {
      setError("Your password must contain at least 12 characters.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "register") {
        await registerUser({
          email: email.trim(),
          password,
          display_name: displayName.trim(),
        });
      } else {
        await loginUser({
          email: email.trim(),
          password,
        });
      }

      const currentUser = await refreshUser();

      if (!currentUser) {
        throw new Error(
          "Your account request succeeded, but we couldn't verify your session. Please try signing in again."
        );
      }

      const requestedPath = new URLSearchParams(
        window.location.search
      ).get("next");

      const destination =
        requestedPath?.startsWith("/") &&
        !requestedPath.startsWith("//") &&
        !requestedPath.startsWith("/login")
          ? requestedPath
          : "/workspace";

      router.replace(destination);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
  }
const searchParams = useSearchParams();

useEffect(() => {
  const requestedMode = searchParams.get("mode");

  if (requestedMode === "register") {
    setMode("register");
  }
}, [searchParams]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08090c] px-4 py-12 text-white">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-10 flex items-center justify-center gap-3"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/[0.08] text-violet-200">
            <BookOpen size={22} />
          </span>
          <span className="text-xl font-semibold tracking-tight">
            ScholarGraph
          </span>
        </Link>

        <section className="rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-6 sm:p-8">
          <div className="mb-7">
            <p className="text-[10px] uppercase tracking-[0.2em] text-violet-300/70">
              Your research workspace
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              {mode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/45">
              {mode === "login"
                ? "Sign in to continue your research."
                : "Start organising your research in one place."}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
            <button
              type="button"
              onClick={() => changeMode("login")}
              aria-pressed={mode === "login"}
              className={`rounded-lg px-3 py-2.5 text-sm transition ${
                mode === "login"
                  ? "bg-white/[0.09] text-white"
                  : "text-white/45 hover:text-white/75"
              }`}
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => changeMode("register")}
              aria-pressed={mode === "register"}
              className={`rounded-lg px-3 py-2.5 text-sm transition ${
                mode === "register"
                  ? "bg-white/[0.09] text-white"
                  : "text-white/45 hover:text-white/75"
              }`}
            >
              Create account
            </button>
          </div>


         <div className="mb-6 space-y-4">
              <GoogleSignInButton />

              <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                    or continue with email
            </span>
              <div className="h-px flex-1 bg-white/[0.08]" />
              </div>
         </div>


          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label
                  htmlFor="displayName"
                  className="mb-2 block text-xs text-white/65"
                >
                  Full name
                </label>
                <input
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  maxLength={120}
                  required
                  value={displayName}
                  onChange={(event) =>
                    setDisplayName(event.target.value)
                  }
                  placeholder="Your name"
                  className="h-12 w-full rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 text-sm outline-none transition placeholder:text-white/25 focus:border-violet-300/40"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs text-white/65"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-12 w-full rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 text-sm outline-none transition placeholder:text-white/25 focus:border-violet-300/40"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs text-white/65"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                minLength={mode === "register" ? 12 : 1}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  mode === "register"
                    ? "At least 12 characters"
                    : "Enter your password"
                }
                className="h-12 w-full rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 text-sm outline-none transition placeholder:text-white/25 focus:border-violet-300/40"
              />
              {mode === "register" && (
                <p className="mt-2 text-[11px] text-white/35">
                  Use at least 12 characters.
                </p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-sm leading-5 text-red-300"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || authLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-300 px-4 text-sm font-semibold text-[#14111f] transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  {mode === "login"
                    ? "Signing in..."
                    : "Creating account..."}
                </>
              ) : (
                <>
                  {mode === "login"
                    ? "Sign in"
                    : "Create account"}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-white/35">
            {mode === "login"
              ? "New to ScholarGraph? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() =>
                changeMode(
                  mode === "login" ? "register" : "login"
                )
              }
              className="text-violet-200 hover:text-violet-100"
            >
              {mode === "login"
                ? "Create an account"
                : "Sign in"}
            </button>
          </p>
          
        </section>

        <p className="mt-6 text-center text-xs text-white/25">
          Built for curious minds and serious research.
        </p>
      </div>
    </main>
  );
}
