"use client";

import type { ReactNode } from "react";
import AuthProvider from "./AuthProvider";
import BottomNav from "./BottomNav";
import { ProfileProvider } from "./ProfileProvider";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-24">{children}</main>
        <BottomNav />
      </ProfileProvider>
    </AuthProvider>
  );
}
