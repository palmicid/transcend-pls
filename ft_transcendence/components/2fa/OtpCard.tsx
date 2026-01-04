'use client';

import { Form, InputOTP, Label } from "@heroui/react";
import { REGEXP_ONLY_DIGITS } from '@heroui/react';
import { useRouter } from "next/navigation";
import React from "react";

export function OtpCard() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState("");
  const [message, setMessage] = React.useState("Enter 6-digit from two factor authenticator APP");
  const [isError, setIsError] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const executeVerify = React.useCallback(async (code: string) => {
    if (isSubmitting || code.length < 6) return;
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await fetch("/api/2fa/verify", {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code })
      });
      const response = await res.json();
      if (response.ok) {
        setMessage("Success! Redirecting...");
        router.push("/main");
        router.refresh();
      } else {
        setMessage("Invalid verify code, please try again");
        setIsError(true);
        setValue("");
        setTimeout(() => inputRef.current?.focus(), 10);
      }
    } catch (err) {
      setMessage(`ERROR: ${err}, please try again later`);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, router]);

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeVerify(value);
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Form className="flex w-[280px] flex-col gap-4" onSubmit={onFormSubmit}>
      <div className="flex flex-col gap-1">
        <Label className="text-lg font-semibold">Verify account</Label>
        <p className={`text-[13px] transition-colors ${isError ? "text-red-400" : "text-muted"}`}>
          {message}
        </p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          ref={inputRef}
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={value}
          onChange={(val) => {
            if (value.length < 6 || val.length < 6)
              setValue(val);
            if (isError)
              setIsError(false);
              setMessage("Enter 6-digit from two factor authenticator APP")
          }}
          onComplete={(code) => {
            setTimeout(() => 
              executeVerify(code)
          , 500);
          }}
        >
          <InputOTP.Group>
            {[...Array(6)].map((_, i) => (
              <InputOTP.Slot key={i} index={i} />
            ))}
          </InputOTP.Group>
        </InputOTP>
      </div>
    {isSubmitting && (
      <p className="text-center text-xs text-default-400 animate-pulse">
        Verifying code...
      </p>
    )}
    </Form>
  );
}