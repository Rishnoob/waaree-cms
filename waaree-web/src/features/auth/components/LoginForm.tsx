"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { login } from "../api";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your work email"),
  password: z.string().min(1, "Enter your password"),
});
type Values = z.infer<typeof schema>;

/** Back to the page you came from, on this website only (no open redirects to other sites). */
function safeNext(next: string | null): string {
  return next?.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/cms";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    try {
      await login(email, password);
      router.replace(safeNext(params.get("next")));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Couldn't log in");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field label="Work email" error={errors.email?.message}>
        <Input type="email" autoComplete="username" autoFocus icon={<Mail />} placeholder="you@waaree.com" {...register("email")} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <Input type="password" autoComplete="current-password" icon={<Lock />} {...register("password")} />
      </Field>
      {formError && (
        <p role="alert" className="rounded-md bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" arrow loading={isSubmitting} className="mt-1 w-full">
        Log in
      </Button>
    </form>
  );
}
