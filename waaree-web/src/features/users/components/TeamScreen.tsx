"use client";

import { useState } from "react";

import { RolesScreen } from "@/features/roles";
import { useCan } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import { UsersScreen } from "./UsersScreen";

/** Team: the people who use the CMS and the roles that decide what they can do, on one screen. */
export function TeamScreen() {
  const canRoles = useCan("roles.view");
  const [tab, setTab] = useState<"people" | "roles">("people");
  return (
    <div>
      {canRoles && (
        <div className="mb-8 inline-flex rounded-lg border border-border bg-surface-muted p-1" role="tablist" aria-label="People">
          {(
            [
              ["people", "People"],
              ["roles", "Roles"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm transition-colors focus-visible:shadow-glow focus-visible:outline-none",
                tab === k ? "bg-white font-medium text-foreground shadow-soft" : "text-body hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {tab === "people" ? <UsersScreen /> : <RolesScreen />}
    </div>
  );
}
