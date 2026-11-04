"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { api, unwrap } from "@/lib/api/client";

/** Site-wide settings. Switches that need a third-party key stay off until Waaree provides one. */
export function SettingsScreen() {
  const q = useQuery({ queryKey: ["settings"], queryFn: async () => unwrap(await api.GET("/site/settings")) });
  return q.data ? <Form key={JSON.stringify(q.data)} initial={q.data} /> : <p className="text-sm text-muted">Loading…</p>;
}

function Form({ initial }: { initial: Record<string, string> }) {
  const qc = useQueryClient();
  const [v, setV] = useState(initial);
  const save = useMutation({
    mutationFn: async (body: Record<string, string>) => unwrap(await api.PUT("/site/settings", { body })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["settings"] });
      void qc.invalidateQueries({ queryKey: ["site-public"] });
    },
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-tight font-light tracking-tight text-foreground">Settings</h1>
          <p className="mt-2 max-w-xl text-body">Details and switches for the whole website. Changes apply as soon as you save.</p>
        </div>
        <Button
          disabled={!dirty}
          loading={save.isPending}
          onClick={async () => {
            try {
              await save.mutateAsync(v);
              toast.success("Settings saved");
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        >
          Save changes
        </Button>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-5 rounded-lg border border-border p-6">
          <p className="text-[0.6875rem] tracking-[0.2em] text-muted uppercase">Company</p>
          <Field label="Site name">
            <Input value={v.site_name ?? ""} onChange={set("site_name")} />
          </Field>
          <Field label="Contact email">
            <Input type="email" value={v.contact_email ?? ""} onChange={set("contact_email")} />
          </Field>
          <Field label="Contact phone">
            <Input value={v.contact_phone ?? ""} onChange={set("contact_phone")} />
          </Field>
          <Field label="Announcement bar" hint="One line shown at the top of every public page. Leave empty to hide it.">
            <Input value={v.announcement ?? ""} onChange={set("announcement")} placeholder="e.g. Q2 results are out" />
          </Field>
        </section>

        <section className="flex flex-col gap-5 rounded-lg border border-border p-6">
          <p className="text-[0.6875rem] tracking-[0.2em] text-muted uppercase">Features</p>
          {[
            { k: "approval_required", label: "Approval before publishing", hint: "Maker-checker. Kept on in this release.", locked: true },
            { k: "ai_search_enabled", label: "AI search on the website", hint: "Needs an AI provider key from Waaree.", locked: true },
            { k: "stock_ticker_enabled", label: "Share price ticker", hint: "Needs a market-data key from Waaree.", locked: true },
          ].map((s) => (
            <div key={s.k} className="flex items-start justify-between gap-6">
              <span>
                <span className="block text-sm font-medium text-foreground">{s.label}</span>
                <span className="block text-xs text-muted">{s.hint}</span>
              </span>
              <Switch checked={v[s.k] === "true"} disabled={s.locked} onCheckedChange={(c) => setV({ ...v, [s.k]: String(c) })} label={s.label} />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
