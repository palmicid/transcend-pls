"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { RegisterCard } from "@/components/auth/RegisterCard";

export default function RegisterPage() {
    return (
        <MainLayout showNav={false}>
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
                <RegisterCard />
            </div>
        </MainLayout>
    );
}