"use client";
import { useCallback, useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

export type Field = { key: string; label: string; bilingual?: boolean; multiline?: boolean; number?: boolean };
type Item = { id: string; status?: string; [k: string]: unknown };
const flat = (item: Item | null, fields: Field[]) => {
  const v: Record<string, string> = {};
  for (const f of fields) {
    const raw = item?.[f.key] as unknown;
    if (f.bilingual) { const o = (raw ?? {}) as Record<string, string>; v[`${f.key}.en`] = o.en ?? ""; v[`${f.key}.bn`] = o.bn ?? ""; }
    else v[f.key] = raw === undefined || raw === null ? "" : String(raw);
  }
  return v;
};

export default function ContentManager({ col, fields, singletonId }: { col: string; fields: Field[]; singletonId?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [edit, setEdit] = useState<{ id: string | null; v: Record<string, string>; status: string } | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await getDocs(collection(getDb(), col));
      const all = s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Item);
      setItems(singletonId ? all.filter((i) => i.id === singletonId) : all);
    } catch { setMsg("Could not load. Please retry."); }
  }, [col, singletonId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (singletonId && items.length >= 0) setEdit((e) => e ?? null); }, [singletonId, items]);

  const open = (item: Item | null) => setEdit({ id: item?.id ?? singletonId ?? null, v: flat(item, fields), status: item?.status ?? "draft" });

  async function save() {
    if (!edit) return;
    setBusy(true); setMsg("");
    const data: Record<string, unknown> = { status: edit.status, updatedAt: serverTimestamp() };
    for (const f of fields) {
      if (f.bilingual) data[f.key] = { en: edit.v[`${f.key}.en`].trim(), bn: edit.v[`${f.key}.bn`].trim() };
      else if (f.number) data[f.key] = edit.v[f.key] === "" ? 0 : Number(edit.v[f.key]);
      else data[f.key] = edit.v[f.key].trim();
    }
    try {
      if (edit.id) await setDoc(doc(getDb(), col, edit.id), data, { merge: true });
      else await addDoc(collection(getDb(), col), { ...data, createdAt: serverTimestamp() });
      setMsg("Saved."); setEdit(null); await load();
    } catch { setMsg("Save failed. Nothing was saved. Please retry."); }
    setBusy(false);
  }
  async function remove(id: string) {
    if (!window.confirm("Delete permanently?")) return;
    try { await deleteDoc(doc(getDb(), col, id)); await load(); } catch { setMsg("Delete failed."); }
  }

  const inp = "mt-1 w-full rounded border border-sage-300 bg-white px-3 py-2 text-sm";
  const set = (k: string, val: string) => setEdit((e) => (e ? { ...e, v: { ...e.v, [k]: val } } : e));

  if (edit) return (
    <div className="space-y-3 rounded border border-gold-200 bg-white p-4">
      {fields.map((f) => (f.bilingual ? ["en", "bn"] : [""]).map((l) => {
        const k = f.bilingual ? `${f.key}.${l}` : f.key;
        return (
          <label key={k} className="block text-sm">{f.label}{l && ` (${l === "en" ? "English" : "বাংলা"})`}
            {f.multiline ? <textarea rows={4} value={edit.v[k]} onChange={(e) => set(k, e.target.value)} className={inp} />
              : <input type={f.number ? "number" : "text"} value={edit.v[k]} onChange={(e) => set(k, e.target.value)} className={inp} />}
          </label>
        );
      }))}
      <label className="block text-sm">Status
        <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} className={inp}>
          <option value="draft">Draft (not public)</option><option value="published">Published</option><option value="archived">Archived</option>
        </select></label>
      {msg && <p role="alert" className="text-sm text-red-700">{msg}</p>}
      <div className="flex gap-2">
        <button disabled={busy} onClick={save} className="rounded bg-sage-700 px-4 py-2 text-white disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
        <button onClick={() => setEdit(null)} className="rounded border border-sage-300 px-4 py-2">Cancel</button>
      </div>
    </div>
  );

  const nameOf = (i: Item) => { const v = flat(i, fields)[`${fields[0].key}.en`] ?? flat(i, fields)[fields[0].key]; return v || i.id; };
  return (
    <div>
      {msg && <p className="mb-2 text-sm text-sage-700">{msg}</p>}
      {singletonId ? (
        <button onClick={() => open(items[0] ?? null)} className="rounded bg-sage-700 px-4 py-2 text-white">Edit</button>
      ) : (
        <button onClick={() => open(null)} className="rounded bg-sage-700 px-4 py-2 text-white">+ Add new</button>
      )}
      {!singletonId && items.length === 0 && <p className="mt-4 text-sage-700">Nothing added yet.</p>}
      <ul className="mt-3 space-y-2">
        {!singletonId && items.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-2 rounded border border-gold-200 bg-white p-3 text-sm">
            <span>{nameOf(i)} <em className="text-sage-500">· {i.status ?? "draft"}</em></span>
            <span className="flex gap-2">
              <button onClick={() => open(i)} className="underline">Edit</button>
              <button onClick={() => remove(i.id)} className="text-red-700 underline">Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
