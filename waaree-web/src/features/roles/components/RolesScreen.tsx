"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CmsPage, PageHeader } from "@/features/cms-shell";
import { useCan } from "@/lib/auth/session";

import { type Role, useRoles } from "../hooks";
import { RoleEditorDialog } from "./RoleEditorDialog";

export function RolesScreen() {
  const canManage = useCan("roles.manage");
  const roles = useRoles();
  // `opened` gives the editor a fresh key each time, so it starts from the role's saved values.
  const [dialog, setDialog] = useState<{ open: boolean; role?: Role; opened: number }>({ open: false, opened: 0 });
  const openEditor = (role?: Role) => setDialog((d) => ({ open: true, role, opened: d.opened + 1 }));

  return (
    <CmsPage>
      <PageHeader
        title="Roles"
        description="A role is a set of things people are allowed to do. Give each user one or more roles."
        actions={
          canManage && (
            <Button arrow onClick={() => openEditor()}>
              New role
            </Button>
          )
        }
      />

      {roles.isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : roles.isError ? (
        <EmptyState icon={<ShieldCheck />} title="Couldn't load roles" description={roles.error.message} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {roles.data.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => openEditor(r)}
                className="block h-full w-full rounded-lg text-left focus-visible:outline-offset-4"
                aria-label={`${canManage && !r.is_system ? "Edit" : "View"} role ${r.name}`}
              >
                <Card interactive className={r.is_system ? "h-full bg-(image:--brand-tint)" : "h-full"}>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-medium">{r.name}</h2>
                    {r.is_system && <Badge tone="brand">System</Badge>}
                  </div>
                  <p className="mt-1 min-h-10 text-sm text-body">{r.description ?? "No description"}</p>
                  <div className="mt-4 flex gap-4 text-sm text-muted">
                    <span>
                      <strong className="font-medium text-foreground">{r.user_count}</strong> {r.user_count === 1 ? "user" : "users"}
                    </span>
                    <span>
                      <strong className="font-medium text-foreground">{r.is_system ? "All" : r.permissions.length}</strong> permissions
                    </span>
                  </div>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}

      <RoleEditorDialog key={dialog.opened} open={dialog.open} role={dialog.role} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} />
    </CmsPage>
  );
}
