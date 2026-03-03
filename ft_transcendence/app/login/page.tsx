"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { LoginCard } from "@/components/auth/LoginCard";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <MainLayout showNav={false}>
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
        <Suspense>
          <LoginCard />
        </Suspense>
      </div>
    </MainLayout>
  );
}
