'use client';

// import QRCode from "qrcode";
// import { authenticator } from 'otplib';
import Image from 'next/image'
import { Card, Button } from "@heroui/react";
import { useState } from 'react';


export function QrCard() {
  const [src, setSrc] = useState("https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/neo1.jpeg");
  async function QrImage() {
    const res = await fetch("/api/2fa/qrcode", {
      method : 'GET',
      credentials: 'include'
    })
    const { data } = await res.json().catch(() => null);
    setSrc(data)
    console.log(src)
  }

  // console.log(await res.json());
    return (
        <div>
            <Card className="relative col-span-12 h-[250px] sm:h-[300px] md:col-span-8 md:h-[350px]">
            <img
                alt="NEO Home Robot"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                // src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/neo1.jpeg"
                src={src}
            />
            <Card.Footer className="z-10 mt-auto flex items-end justify-between">
              <div>
                <div className="text-base font-medium text-black sm:text-lg">NEO</div>
                <div className="text-xs font-medium text-black/50 sm:text-sm">$499/m</div>
              </div>
              <Button className="bg-white text-black" size="sm" variant="tertiary" onClick={QrImage}>
                Get now
              </Button>
            </Card.Footer>
          </Card>
        </div>
    );
}