"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

import { type User, useResetPassword } from "../hooks";

export function ResetPasswordDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const reset = useResetPassword();
  const tooShort = password.length > 0 && password.length < 12;

  const submit = async () => {
    if (!user || password.length < 12) return;
    try {
      await reset.mutateAsync({ id: user.id, password });
      toast.success(`New password set for ${user.full_name}`);
      setPassword("");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't reset password");
    }
  };

  return (
    <Dialog
      open={user !== null}
      onOpenChange={(o) => {
        if (!o) {
          setPassword("");
          onClose();
        }
      }}
      title={`New password for ${user?.full_name ?? ""}`}
      description="They'll be logged out everywhere and must use the new password."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={reset.isPending} disabled={password.length < 12} onClick={submit}>
            Set password
          </Button>
        </>
      }
    >
      <Field label="New password" hint="At least 12 characters" error={tooShort ? "At least 12 characters" : undefined}>
        <Input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
        />
      </Field>
    </Dialog>
  );
}
