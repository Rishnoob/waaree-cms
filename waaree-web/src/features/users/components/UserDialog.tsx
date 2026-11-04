"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { useRoles } from "@/features/roles";
import { useSession } from "@/lib/auth/session";

import { type User, useCreateUser, useUpdateUser } from "../hooks";

const base = z.object({
  full_name: z.string().trim().min(1, "Enter a name"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string(),
  role_ids: z.array(z.number()),
  is_active: z.boolean(),
});
type Values = z.infer<typeof base>;

/** Add a user (user = undefined) or edit one. */
export function UserDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (o: boolean) => void; user?: User }) {
  const editing = Boolean(user);
  const session = useSession();
  const isSelf = session.status === "authenticated" && user?.id === session.user.id;
  const roles = useRoles(open);
  const create = useCreateUser();
  const update = useUpdateUser();

  const schema = editing
    ? base
    : base.refine((v) => v.password.length >= 12, { path: ["password"], message: "At least 12 characters" });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", password: "", role_ids: [], is_active: true },
  });

  useEffect(() => {
    if (open)
      form.reset({
        full_name: user?.full_name ?? "",
        email: user?.email ?? "",
        password: "",
        role_ids: user?.roles.map((r) => r.id) ?? [],
        is_active: user?.is_active ?? true,
      });
  }, [open, user, form]);

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      if (user) {
        await update.mutateAsync({
          id: user.id,
          body: { full_name: v.full_name, role_ids: v.role_ids, is_active: v.is_active },
        });
        toast.success("User updated");
      } else {
        await create.mutateAsync({ full_name: v.full_name, email: v.email, password: v.password, role_ids: v.role_ids });
        toast.success(`${v.full_name} can now log in`);
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    }
  });

  const { errors, isSubmitting } = form.formState;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `Edit ${user?.full_name}` : "Add a user"}
      description={editing ? "Change their name, roles or access." : "They'll log in with this email and password."}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button arrow loading={isSubmitting} onClick={onSubmit}>
            {editing ? "Save changes" : "Add user"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field label="Full name" error={errors.full_name?.message} required>
          <Input autoComplete="off" {...form.register("full_name")} />
        </Field>
        <Field label="Work email" error={errors.email?.message} required>
          <Input type="email" autoComplete="off" disabled={editing} {...form.register("email")} />
        </Field>
        {!editing && (
          <Field label="Password" hint="At least 12 characters. Share it securely." error={errors.password?.message} required>
            <Input type="password" autoComplete="new-password" {...form.register("password")} />
          </Field>
        )}

        <fieldset className="flex flex-col gap-3">
          <legend className="pb-2 text-sm font-medium text-foreground">Roles</legend>
          {roles.isError && <p className="text-sm text-muted">You don’t have permission to see roles.</p>}
          <Controller
            control={form.control}
            name="role_ids"
            render={({ field }) => (
              <div className="grid gap-3 sm:grid-cols-2">
                {roles.data?.map((r) => (
                  <Checkbox
                    key={r.id}
                    label={r.name}
                    description={r.description ?? undefined}
                    checked={field.value.includes(r.id)}
                    onCheckedChange={(on) =>
                      field.onChange(on ? [...field.value, r.id] : field.value.filter((id) => id !== r.id))
                    }
                  />
                ))}
              </div>
            )}
          />
        </fieldset>

        {editing && !isSelf && (
          <Controller
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4 rounded-md border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Can log in</p>
                  <p className="text-xs text-muted">Turning this off logs them out everywhere right away.</p>
                </div>
                <Switch checked={field.value} onCheckedChange={field.onChange} label="Can log in" />
              </div>
            )}
          />
        )}
      </form>
    </Dialog>
  );
}
