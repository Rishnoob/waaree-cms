"use client";

import { KeyRound, Pencil, Users as UsersIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { SearchInput } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { CmsPage, PageHeader } from "@/features/cms-shell";
import { useCan } from "@/lib/auth/session";

import { type User, useUsers } from "../hooks";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { UserDialog } from "./UserDialog";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

function Status({ user }: { user: User }) {
  if (!user.is_active) return <Badge tone="neutral">Can’t log in</Badge>;
  if (user.is_locked) return <Badge tone="warning">Locked</Badge>;
  return <Badge tone="success">Active</Badge>;
}

export function UsersScreen() {
  const canManage = useCan("users.manage");
  const users = useUsers();
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; user?: User }>({ open: false });
  const [resetFor, setResetFor] = useState<User | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users.data ?? []).filter(
      (u) => !q || u.full_name.toLowerCase().includes(q) || u.email.includes(q) || u.roles.some((r) => r.name.toLowerCase().includes(q)),
    );
  }, [users.data, query]);

  return (
    <CmsPage>
      <PageHeader
        title="People"
        description="Everyone who can sign in to the CMS, and their role."
        actions={
          canManage && (
            <Button arrow onClick={() => setDialog({ open: true })}>
              Add user
            </Button>
          )
        }
      />

      {users.isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-11 w-80" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : users.isError ? (
        <EmptyState icon={<UsersIcon />} title="Couldn't load users" description={users.error.message} />
      ) : users.data.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="No users yet"
          description="Add the people who'll edit and approve content."
          action={canManage && <Button arrow onClick={() => setDialog({ open: true })}>Add the first user</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <SearchInput value={query} onValueChange={setQuery} placeholder="Search by name, email or role" label="Search users" className="max-w-sm" />
          <Table>
            <THead>
              <Tr>
                <Th>Name</Th>
                <Th>Roles</Th>
                <Th>Status</Th>
                <Th>Last login</Th>
                {canManage && <Th className="text-right">Actions</Th>}
              </Tr>
            </THead>
            <TBody>
              {filtered.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <p className="font-medium text-foreground">{u.full_name}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {u.roles.length ? u.roles.map((r) => <Badge key={r.id} tone="info">{r.name}</Badge>) : <span className="text-muted">No role</span>}
                    </div>
                  </Td>
                  <Td>
                    <Status user={u} />
                  </Td>
                  <Td className="whitespace-nowrap">
                    {u.last_login_at ? dateFmt.format(new Date(`${u.last_login_at}Z`)) : <span className="text-muted">Never</span>}
                  </Td>
                  {canManage && (
                    <Td>
                      <div className="flex justify-end gap-1">
                        <IconButton label={`Edit ${u.full_name}`} size="sm" onClick={() => setDialog({ open: true, user: u })}>
                          <Pencil aria-hidden />
                        </IconButton>
                        <IconButton label={`Set a new password for ${u.full_name}`} size="sm" onClick={() => setResetFor(u)}>
                          <KeyRound aria-hidden />
                        </IconButton>
                      </div>
                    </Td>
                  )}
                </Tr>
              ))}
              {filtered.length === 0 && (
                <Tr>
                  <Td colSpan={5} className="py-10 text-center text-muted">
                    No users match “{query}”
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        </div>
      )}

      <UserDialog open={dialog.open} user={dialog.user} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} />
      <ResetPasswordDialog user={resetFor} onClose={() => setResetFor(null)} />
    </CmsPage>
  );
}
