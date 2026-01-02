'use client';

import {Button, Form, InputOTP, Label, Spinner} from "@heroui/react";
import { REGEXP_ONLY_DIGITS } from '@heroui/react';
import { redirect } from "next/navigation";
import React from "react";

export function OtpCard() {
  const [value, setValue] = React.useState("");
  const [isComplete, setIsComplete] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const handleComplete = (code: string) => {
    setIsComplete(true);
    console.log("Code complete:", code);
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await fetch("/api/2fa/verify", {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: value
      })
    });
    const { ok, message } = await res.json();
    if (ok)
      redirect("/main");
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setValue("");
      setIsComplete(false);
    }, 2000);
  };
  
  return (
    <Form className="flex w-[280px] flex-col gap-2" onSubmit={handleSubmit}>
      <Label>Verify account</Label>
      <InputOTP
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        value={value}
        onComplete={handleComplete}
        onChange={(val) => {
          setValue(val);
          setIsComplete(false);
        }}
      >
          <InputOTP.Slot index={0} />
          <InputOTP.Slot index={1} />
          <InputOTP.Slot index={2} />
          <InputOTP.Slot index={3} />
          <InputOTP.Slot index={4} />
          <InputOTP.Slot index={5} />
      </InputOTP>
      <Button
        className="mt-2 w-full"
        isDisabled={!isComplete}
        isPending={isSubmitting}
        type="submit"
        variant="primary"
        // onClick={handleOnClick}
      >
        {isSubmitting ? (
          <>
            <Spinner color="current" size="sm" />
            Verifying...
          </>
        ) : (
          "Verify Code"
        )}
      </Button>
    </Form>
  );
}

