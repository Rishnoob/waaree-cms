"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useCan, useSession } from "@/lib/auth/session";

import { type Role, useDeleteRole, usePermissionCatalog, useSaveRole } from "../hooks";

const MODULE_LABEL: Record<string, string> = { users: "Users", roles: "Roles & permissions" };
const label = (m: string) => MODULE_LABEL[m] ?? m.charAt(0).toUpperCase() + m.slice(1);

/** Create a role (role = undefined) or edit one, with the permissions matrix grouped by area. */
export function RoleEditorDialog({ open, onOpenChange, role }: { open: boolean; onOpenChange: (o: boolean) => void; role?: Role }) {
  const canManage = useCan("roles.manage");
  const session = useSession();
  const myPerms = session.status === "authenticated" ? session.user.permissions : [];
  const catalog = usePermissionCatalog();
  const save = useSaveRole();
  const del = useDeleteRole();

  // Initialised from props; the parent remounts this dialog (new `key`) every time it opens.
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(role?.permissions ?? []));
  const [nameError, setNameError] = useState<string>();

  const readOnly = !canManage || Boolean(role?.is_system);
  // You can only grant what you have (the API enforces this too).
  const grantable = (key: string) => !readOnly && myPerms.includes(key);

  const toggle = (keys: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      keys.filter(grantable).forEach((k) => (on ? next.add(k) : next.delete(k)));
      return next;
    });

  const submit = async () => {
    if (!name.trim()) return setNameError("Give the role a name");
    try {
      await save.mutateAsync({ id: role?.id, body: { name: name.trim(), description: description.trim() || null, permissions: [...selected] } });
      toast.success(role ? "Role updated" : `Role "${name.trim()}" created`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save the role");
    }
  };

  const remove = async () => {
    if (!role) return;
    try {
      await del.mutateAsync(role.id);
      toast.success(`Role "${role.name}" deleted`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete the role");
    }
  };

  const title = role ? (readOnly ? role.name : `Edit ${role.name}`) : "New role";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={title}
      description={role?.is_system ? undefined : "Tick what people with this role are allowed to do."}
      footer={
        readOnly ? (
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        ) : (
          <div className="flex w-full items-center justify-between gap-2">
            {role && role.user_count === 0 ? (
              <Button variant="ghost" className="text-danger" loading={del.isPending} onClick={remove}>
                Delete role
              </Button>
            ) : role ? (
              <span className="text-xs text-muted">To delete this role, first move its {role.user_count} user(s).</span>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button arrow loading={save.isPending} onClick={submit}>
                {role ? "Save changes" : "Create role"}
              </Button>
            </div>
          </div>
        )
      }
    >
      {role?.is_system && (
        <div className="flex items-start gap-3 rounded-md bg-(image:--brand-tint) p-4 text-sm text-foreground">
          <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
          Super Admin can do everything, including anything added in the future. This role can’t be changed.
        </div>
      )}

      {!role?.is_system && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role name" error={nameError} required>
            <Input value={name} disabled={readOnly} onChange={(e) => setName(e.target.value)} placeholder="e.g. Investor Relations team" />
          </Field>
          <Field label="Description">
            <Textarea
              value={description}
              disabled={readOnly}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-11"
              placeholder="Who is this role for?"
            />
          </Field>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-foreground">Permissions</h3>
        {catalog.isPending && <p className="text-sm text-muted">Loading permissions…</p>}
        {catalog.data?.map((group) => {
          const keys = group.permissions.map((p) => p.key);
          const on = keys.filter((k) => role?.is_system || selected.has(k)).length;
          const all = on === keys.length ? true : on === 0 ? false : "indeterminate";
          return (
            <section key={group.module} className="rounded-md border border-border">
              <div className="flex items-center justify-between gap-4 border-b border-border bg-surface-muted/60 px-4 py-3">
                <Checkbox label={label(group.module)} checked={all} disabled={readOnly} onCheckedChange={(v) => toggle(keys, v)} />
                <span className="text-xs text-muted">
                  {on} of {keys.length}
                </span>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                {group.permissions.map((p) => (
                  <Checkbox
                    key={p.key}
                    label={p.description}
                    description={!readOnly && !myPerms.includes(p.key) ? "You can't grant this (you don't have it)" : undefined}
                    checked={role?.is_system || selected.has(p.key)}
                    disabled={!grantable(p.key)}
                    onCheckedChange={(v) => toggle([p.key], v)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Dialog>
  );
}
