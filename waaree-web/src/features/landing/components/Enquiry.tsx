"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";

import { ENQUIRY } from "../data/home";
import { Glow } from "./Chapter";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").regex(/^[a-zA-Z\s\-'.]+$/, "Letters only, please"),
  email: z.string().trim().email("Please enter a valid email"),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Please enter a valid number"),
  pincode: z.string().trim().regex(/^\d{6}$/, "6-digit pincode"),
  topic: z.string().min(1, "Choose a topic"),
  details: z.string().trim().min(10, "At least 10 characters").max(500, "Up to 500 characters"),
});
type Values = z.infer<typeof schema>;

/** “Let’s go green” enquiry (waaree.com home-form). In this concept it validates but doesn’t send. */
export function Enquiry() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { topic: "" } });

  const onSubmit = handleSubmit(async () => {
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Thank you! This concept doesn’t send enquiries yet; the live site will route them to the right Waaree team.");
    reset();
  });

  return (
    // the closing band: the invitation on the left, the form beside it (no big chapter at the end)
    <section id="contact" aria-labelledby="contact-title" className="bg-[linear-gradient(180deg,#ffffff,#f3f9f6)] px-6 py-14 md:px-[7vw] md:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:items-start lg:gap-16">
      <div>
        <p className="text-xs font-medium tracking-[0.25em] text-primary uppercase">The end of the story, the start of yours</p>
        <h2 id="contact-title" className="mt-3 text-4xl leading-[1.08] font-light tracking-tight text-foreground md:text-5xl">
          {ENQUIRY.title.replace("green", "")}
          <Glow>green.</Glow>
        </h2>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-body">Tell us what you’re planning, from a rooftop to a gigawatt. The right Waaree team will reach out.</p>
      </div>
      <form
        onSubmit={onSubmit}
        noValidate
        data-reveal
        className="grid gap-5 rounded-lg border border-border bg-white p-6 shadow-soft md:grid-cols-2 md:gap-x-6 md:gap-y-4 md:p-8"
      >
        <Field label="Name" error={errors.name?.message} required>
          <Input autoComplete="name" {...register("name")} />
        </Field>
        <Field label="Email" error={errors.email?.message} required>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Contact number" error={errors.phone?.message} required>
          <Input type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
        <Field label="Pincode" error={errors.pincode?.message} required>
          <Input inputMode="numeric" autoComplete="postal-code" {...register("pincode")} />
        </Field>
        <Field label="Enquiry about" error={errors.topic?.message} required className="md:col-span-2">
          <Controller
            control={control}
            name="topic"
            render={({ field }) => (
              <Select
                placeholder="Choose a topic"
                options={ENQUIRY.topics.map((t) => ({ value: t, label: t }))}
                value={field.value || undefined}
                onValueChange={field.onChange}
              />
            )}
          />
        </Field>
        <Field label="Details of enquiry" error={errors.details?.message} required className="md:col-span-2">
          <Textarea rows={3} {...register("details")} />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-4 md:col-span-2">
          <p className="max-w-md text-xs leading-relaxed text-muted">
            By submitting, you agree to be contacted by Waaree about this enquiry. We collect only what’s needed to respond.
          </p>
          <Button type="submit" size="lg" arrow loading={isSubmitting}>
            Request a call back
          </Button>
        </div>
      </form>
      </div>
    </section>
  );
}
