'use client';

import { AuthProviderImpl } from "@/context/auth-context";


export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProviderImpl>{children}</AuthProviderImpl>;
}
