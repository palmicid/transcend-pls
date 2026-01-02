import { MainLayout } from "@/components/layout/MainLayout";
import { OtpCard } from "@/components/2fa/OtpCard";
import { QrCard } from "@/components/2fa/QrCard";

export default function LoginPage() {
  return (
     <MainLayout showNav={false}>
       <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
         <QrCard />
         <OtpCard />
       </div>
    </MainLayout>
  );
}     