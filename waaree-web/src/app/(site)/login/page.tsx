import { LayoutTemplate, ShieldCheck, Workflow } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/features/auth";
import { LandingNav } from "@/features/landing/components/LandingNav";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

const POINTS = [
  { icon: LayoutTemplate, title: "Edit the website itself", text: "Type on the page; it saves by itself." },
  { icon: Workflow, title: "Approved before it goes live", text: "Every change is checked by someone else." },
  { icon: ShieldCheck, title: "Secure by default", text: "Roles, an activity record and protected sign-in." },
];

/** Staff sign-in for the whole website (not a separate CMS login): the site’s own navbar and look. */
export default function SignInPage() {
  return (
    <>
      <LandingNav />
      <main className="relative min-h-svh overflow-hidden bg-white px-6 pt-36 pb-20 md:px-[7vw] md:pt-44">
        <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 size-[36rem] rounded-full bg-(image:--brand-mesh) opacity-60 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.1fr_1fr]">
          <section className="hidden lg:block">
            <p className="text-xs font-medium tracking-[0.25em] text-primary uppercase">Waaree staff</p>
            <h2 className="mt-5 text-5xl leading-tight font-light tracking-tight text-foreground">
              The Waaree website,
              <br />
              <span className="bg-(image:--brand-gradient) bg-clip-text text-transparent">managed with ease.</span>
            </h2>
            <ul className="mt-10 flex flex-col gap-5">
              {POINTS.map((p) => (
                <li key={p.title} className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-white text-primary shadow-soft">
                    <p.icon aria-hidden className="size-5" strokeWidth={1.75} />
                  </span>
                  <span>
                    <span className="block font-medium text-foreground">{p.title}</span>
                    <span className="block text-sm text-body">{p.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mx-auto w-full max-w-sm animate-rise-in rounded-xl border border-border bg-white p-8 shadow-lg">
            <h1 className="text-3xl font-light tracking-tight text-foreground">Sign in</h1>
            <p className="mt-2 mb-8 text-body">For Waaree staff who look after the website.</p>
            <Suspense>
              <LoginForm />
            </Suspense>
            <p className="mt-8 text-center text-xs text-muted">Access is given by your administrator. There’s no public sign-up.</p>
          </section>
        </div>
      </main>
    </>
  );
}
