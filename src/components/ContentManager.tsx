"use client";
import { useCallback, useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { photoToDataUrl } from "@/lib/image";

export type Field = { key: string; label: string; bilingual?: boolean; multiline?: boolean; number?: boolean; image?: boolean; wide?: boolean; picks?: "teachers"; help?: string };
type Item = { id: string; status?: string; [k: string]: unknown };
export type Seed = { id: string; data: Record<string, unknown> }[];

const flat = (item: Item | null, fields: Field[]) => {
  const v: Record<string, string> = {};
  for (const f of fields) {
    const raw = item?.[f.key] as unknown;
    if (f.bilingual) { const o = (raw ?? {}) as Record<string, string>; v[`${f.key}.en`] = o.en ?? ""; v[`${f.key}.bn`] = o.bn ?? ""; }
    else if (Array.isArray(raw)) v[f.key] = raw.join(",");
    else v[f.key] = raw === undefined || raw === null ? "" : String(raw);
  }
  return v;
};
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export default function ContentManager({ col, fields, singletonId, prefill, idField, seed }: {
  col: string; fields: Field[]; singletonId?: string; prefill?: Record<string, { en: string; bn: string }>; idField?: string; seed?: Seed;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [edit, setEdit] = useState<{ id: string | null; v: Record<string, string>; status: string } | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const needsTeachers = fields.some((f) => f.picks === "teachers");

  const load = useCallback(async () => {
    try {
      const s = await getDocs(collection(getDb(), col));
      const all = s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Item);
      setItems(singletonId ? all.filter((i) => i.id === singletonId) : all);
    } catch { setMsg("Could not load. Please retry."); }
  }, [col, singletonId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!needsTeachers) return;
    getDocs(collection(getDb(), "teachers")).then((s) => setTeachers(s.docs.map((d) => ({ id: d.id, name: d.data().name?.en || d.data().name?.bn || d.id })))).catch(() => {});
  }, [needsTeachers]);

  const open = (item: Item | null) => {
    const v = flat(item, fields);
    if (!item && prefill) for (const [k, t] of Object.entries(prefill)) { v[`${k}.en`] = t.en; v[`${k}.bn`] = t.bn; }
    setEdit({ id: item?.id ?? singletonId ?? null, v, status: item?.status ?? "draft" });
  };

  async function save() {
    if (!edit) return;
    setBusy(true); setMsg("");
    const data: Record<string, unknown> = { status: edit.status, updatedAt: serverTimestamp() };
    for (const f of fields) {
      if (f.bilingual) data[f.key] = { en: edit.v[`${f.key}.en`].trim(), bn: edit.v[`${f.key}.bn`].trim() };
      else if (f.picks) data[f.key] = edit.v[f.key] ? edit.v[f.key].split(",").filter(Boolean) : [];
      else if (f.number) data[f.key] = edit.v[f.key] === "" ? 0 : Number(edit.v[f.key]);
      else data[f.key] = edit.v[f.key].trim();
    }
    try {
      if (edit.id) await setDoc(doc(getDb(), col, edit.id), data, { merge: true });
      else if (idField) {
        const id = slugify(edit.v[idField] ?? "");
        if (!id) { setMsg("Enter a short web address name (letters, numbers and hyphens), e.g. quran-reading."); setBusy(false); return; }
        if ((await getDoc(doc(getDb(), col, id))).exists()) { setMsg(`"${id}" is already used. Choose another web address name.`); setBusy(false); return; }
        data[idField] = id;
        await setDoc(doc(getDb(), col, id), { ...data, createdAt: serverTimestamp() });
      } else await addDoc(collection(getDb(), col), { ...data, createdAt: serverTimestamp() });
      setMsg("Saved."); setEdit(null); await load();
    } catch { setMsg("Save failed. Nothing was saved. Please retry."); }
    setBusy(false);
  }
  async function remove(id: string) {
    if (!window.confirm("Delete permanently?")) return;
    try { await deleteDoc(doc(getDb(), col, id)); await load(); } catch { setMsg("Delete failed."); }
  }
  async function addSeed() {
    if (!seed || !window.confirm(`Add ${seed.length} starter items? Existing items with the same address are kept as they are.`)) return;
    setBusy(true); setMsg("");
    try {
      let added = 0;
      for (const s of seed) {
        const ref = doc(getDb(), col, s.id);
        if ((await getDoc(ref)).exists()) continue;
        await setDoc(ref, { ...s.data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); added++;
      }
      setMsg(`${added} added. Open each one to add the fee, class time, teachers and photo.`); await load();
    } catch { setMsg("Could not add. Please retry."); }
    setBusy(false);
  }

  const inp = "mt-1 w-full rounded border border-sage-300 bg-white px-3 py-2 text-sm";
  const set = (k: string, val: string) => setEdit((e) => (e ? { ...e, v: { ...e.v, [k]: val } } : e));

  if (edit) return (
    <div className="space-y-3 rounded border border-gold-200 bg-white p-4">
      {fields.map((f) => (f.bilingual ? ["en", "bn"] : [""]).map((l) => {
        const k = f.bilingual ? `${f.key}.${l}` : f.key;
        return (
          <label key={k} className="block text-sm">{f.label}{l && ` (${l === "en" ? "English" : "বাংলা"})`}
            {f.help && <span className="block text-xs text-sage-500">{f.help}</span>}
            {f.picks ? (
              <span className="mt-1 flex flex-wrap gap-3">
                {teachers.length === 0 && <span className="text-xs text-sage-500">No teachers added yet (Teachers tab).</span>}
                {teachers.map((t) => {
                  const ids = (edit.v[k] ?? "").split(",").filter(Boolean);
                  return <label key={t.id} className="flex items-center gap-1"><input type="checkbox" checked={ids.includes(t.id)} onChange={(e) => set(k, (e.target.checked ? [...ids, t.id] : ids.filter((x) => x !== t.id)).join(","))} />{t.name}</label>;
                })}
              </span>
            ) : f.image ? (
              <span className="mt-1 flex items-center gap-3">
                {edit.v[k] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={edit.v[k]} alt="" className={f.wide ? "h-20 w-36 rounded-lg object-cover" : "h-16 w-16 rounded-full object-cover"} /> : <span className={`flex items-center justify-center bg-sage-100 text-xs text-sage-700 ${f.wide ? "h-20 w-36 rounded-lg" : "h-16 w-16 rounded-full"}`}>No photo</span>}
                <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { set(k, await photoToDataUrl(file, 480, f.wide)); setMsg(""); } catch (err) { setMsg((err as Error).message); } }} className="text-xs" />
                {edit.v[k] && <button type="button" onClick={() => set(k, "")} className="text-xs text-red-700 underline">Remove</button>}
              </span>
            ) : f.multiline ? <textarea rows={5} value={edit.v[k]} onChange={(e) => set(k, e.target.value)} className={inp} />
              : <input type={f.number ? "number" : "text"} value={edit.v[k]} disabled={!!idField && f.key === idField && !!edit.id} onChange={(e) => set(k, e.target.value)} className={inp} />}
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

  const nameOf = (i: Item) => { const f = flat(i, fields); return f[`${fields.find((x) => x.bilingual)?.key ?? fields[0].key}.en`] || f[fields[0].key] || i.id; };
  return (
    <div>
      {msg && <p className="mb-2 text-sm text-sage-700">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        {singletonId ? <button onClick={() => open(items[0] ?? null)} className="rounded bg-sage-700 px-4 py-2 text-white">Edit</button>
          : <button onClick={() => open(null)} className="rounded bg-sage-700 px-4 py-2 text-white">+ Add new</button>}
        {seed && !singletonId && <button disabled={busy} onClick={addSeed} className="rounded border border-sage-300 px-4 py-2 disabled:opacity-60">Add the starter courses</button>}
      </div>
      {!singletonId && items.length === 0 && <p className="mt-4 text-sage-700">Nothing added yet.</p>}
      <ul className="mt-3 space-y-2">
        {!singletonId && items.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-2 rounded border border-gold-200 bg-white p-3 text-sm">
            <span>{nameOf(i)} <em className="text-sage-500">· {i.status ?? "draft"}</em></span>
            <span className="flex gap-2">
              <button onClick={() => open(i)} className="underline">Edit</button>
              <button onClick={() => remove(i.id)} className="text-red-700 underline">Delete</button>
            </span>
          </li>))}
      </ul>
    </div>
  );
}
