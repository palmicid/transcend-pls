import { MainLayout } from "@/components/layout/MainLayout";
import { OtpCard } from "@/components/2fa/OtpCard";
import { QrCard } from "@/components/2fa/QrCard";

export default function LoginPage() {
  return (
    <MainLayout showNav={true}>
      <div className="flex w-full items-center justify-center">
        <section className="
          relative
          w-fit
          flex flex-col
          item-center
          justify-center
          overflow-hidden
          rounded-3xl
          border
          border-white/10
          bg-white/[0.04]
          backdrop-blur-xl 
          p-5">
          <QrCard />
          <OtpCard />
        </section>
      </div>
    </MainLayout>
  );
}     