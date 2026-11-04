/**
 * After the e2e run: delete what the tests made (pages whose web address starts "e2e-", menu items,
 * custom blocks and files named "E2E…"/"e2e-…"), through the API as the super admin. Keeps the CMS tidy.
 */
const API = process.env.E2E_API_URL ?? "http://localhost:8002";

export default async function teardown() {
  const password = process.env.E2E_PASSWORD;
  if (!password) return;
  const login = await fetch(`${API}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "superadmin@waaree.test", password }) });
  if (!login.ok) return;
  const { access_token } = (await login.json()) as { access_token: string };
  const h = { authorization: `Bearer ${access_token}` };
  const get = async <T>(path: string) => (await (await fetch(`${API}${path}`, { headers: h })).json()) as T;
  const del = (path: string) => fetch(`${API}${path}`, { method: "DELETE", headers: h });

  const menu = await get<{ items: { id: number; label: string; page_id: number | null }[] }>("/site/menu");
  for (const m of menu.items.filter((i) => !i.page_id && i.label.startsWith("E2E"))) await del(`/site/menu/${m.id}`);
  for (const p of (await get<{ id: number; slug: string }[]>("/pages")).filter((p) => p.slug.startsWith("e2e-"))) await del(`/pages/${p.id}`);
  for (const f of (await get<{ id: number; original_name: string }[]>("/media")).filter((f) => f.original_name.startsWith("e2e-"))) await del(`/media/${f.id}`);
  for (const b of (await get<{ id: number; name: string }[]>("/blocks")).filter((b) => b.name.startsWith("E2E"))) await del(`/blocks/${b.id}`);
  // collections are never deleted (by design); test ones are archived after their pages are gone
  for (const c of (await get<{ key: string; name: string }[]>("/collections")).filter((c) => c.name.startsWith("E2E"))) await fetch(`${API}/collections/${c.key}/archive`, { method: "POST", headers: h });
}
