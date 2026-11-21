"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useId } from "react";

import { FieldError, FieldLabel } from "@/components/forms/fields";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export const CODE_LENGTH = 6;

const SLOT =
  "h-12 w-full rounded-lg border text-lg first:rounded-l-lg last:rounded-r-lg data-[active=true]:border-ring data-[active=true]:ring-3 data-[active=true]:ring-ring/50";

/**
 * The six-digit code from the confirmation email.
 *
 * Six boxes show how long the code is before the student starts, and pasting
 * the whole code fills them all. Built on the one-time-code input from
 * Watermelon UI, resized to our code length and theme.
 */
export function CodeField({
  value,
  onChange,
  onComplete,
  error,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={id}>Confirmation code</FieldLabel>
      <InputOTP
        id={id}
        maxLength={CODE_LENGTH}
        pattern={REGEXP_ONLY_DIGITS}
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        containerClassName="w-full"
      >
        <InputOTPGroup className="grid w-full grid-cols-6 gap-2">
          {Array.from({ length: CODE_LENGTH }, (_, index) => (
            <InputOTPSlot key={index} index={index} className={SLOT} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
