'use client';

import Image from 'next/image';
import { Card, Skeleton } from "@heroui/react";
import { useEffect, useState } from 'react';

export function QrCard() {
  const [src, setSrc] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const qrGenerate = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/2fa/qrcode", {
          method: 'GET',
          credentials: 'include'
        });
        const result = await res.json();
        if (result.data)
          setSrc(result.data);
        setIsVerified(result.isVerified);
      } catch (err) {
        console.error("Failed to fetch QR:", err);
      } finally {
        setIsLoading(false);
      }
    };
    qrGenerate();
  }, []);

  if (isLoading) {
    return (
      <Card className="relative h-[280px] w-[280px] mb-4">
        <Skeleton className="w-full h-full" />
      </Card>
    );
  }

  if (isVerified === true) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <Card className="relative h-[280px] w-[280px] mb-4 overflow-hidden bg-white flex items-center justify-center">
        {src ? (
          <Image
            alt="2FA QRcode"
            fill
            src={src}
            className="p-4 object-contain"
            unoptimized
          />
        ) : (
          <div className="text-sm text-gray-500">Fail generating the QR Code</div>
        )}
      </Card>
    </div>
  );
}