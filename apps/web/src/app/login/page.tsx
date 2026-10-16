import { Suspense } from "react";
import LoginContent from "./LoginContent";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#08090c] text-white">
          Loading...
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}