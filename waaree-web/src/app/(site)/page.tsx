import type { Metadata } from "next";

import { LandingPage } from "@/features/landing";

export const metadata: Metadata = {
  title: "Waaree · One with the Sun",
  description: "From a ray of sunlight to the power that runs homes, factories and nations.",
};

export default function HomePage() {
  return <LandingPage />;
}
