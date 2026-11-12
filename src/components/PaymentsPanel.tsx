"use client";
import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, orderBy, query, serverTimestamp, writeBatch } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { downloadCsv } from "@/lib/csv";
import { useAuth } from "@/lib/auth";

type R = { id: string; userId: string; userName: string; userEmail: string; courseId: string; methodId: string; methodName: string; amount: number; currency: string; senderAccount: string; transactionId: string; status: string; rejectReason?: string };

export default function PaymentsPanel() {
  const { user } = useAuth();
  const [rows, setRows] = useState<R[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("pending");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const [s, c] = await Promise.all([getDocs(query(collection(db, "paymentRequests"), orderBy("createdAt", "desc"))), getDocs(collection(db, "courses"))]);
      setRows(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<R, "id">) })));
      const t: Record<string, string> = {}; c.docs.forEach((d) => { t[d.id] = d.data().title?.en || d.id; }); setTitles(t);
    } catch { setMsg("Could not load payment requests. Retry."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function decide(r: R, approve: boolean) {
    if (!user) return;
    let reason = "";
    if (approve) { if (!window.confirm(`Approve ${r.amount} ${r.currency} from ${r.userName} (trx ${r.transactionId})?\nOnly approve after matching it in your bank/wallet.`)) return; }
    else { reason = (window.prompt("Reason for rejecting (shown to the student):") ?? "").trim(); if (!reason) return; }
    setBusy(r.id); setMsg("");
    try {
      const db = getDb();
      const b = writeBatch(db);
      b.update(doc(db, "paymentRequests", r.id), approve
        ? { status: "approved", reviewedBy: user.uid, reviewedAt: serverTimestamp() }
        : { status: "rejected", reviewedBy: user.uid, reviewedAt: serverTimestamp(), rejectReason: reason });
      if (approve) {
        b.set(doc(db, "enrollments", `${r.userId}_${r.courseId}`), { userId: r.userId, courseId: r.courseId, status: "active", paymentRequestId: r.id, createdAt: serverTimestamp() });
        b.set(doc(db, "paymentLedger", r.id), { requestId: r.id, userId: r.userId, courseId: r.courseId, methodId: r.methodId, amount: r.amount, currency: r.currency, transactionId: r.transactionId, approvedBy: user.uid, createdAt: serverTimestamp() });
      }
      b.set(doc(collection(db, "auditLogs")), { actorId: user.uid, action: approve ? "payment.approve" : "payment.reject", targetId: r.id, createdAt: serverTimestamp() });
      await b.commit();
      setMsg(approve ? "Approved. Course access granted." : "Rejected.");
      await load();
    } catch { setMsg("Failed. Nothing was saved. Please retry."); }
    setBusy("");
  }

  const shown = rows.filter((r) => filter === "all" || r.status === filter);
  return (
    <div>
      <div className="flex items-center gap-2 text-sm">
        <span>Show:</span>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded border border-sage-300 px-2 py-1">
          {["pending", "approved", "rejected", "all"].map((s) => <option key={s}>{s}</option>)}</select>
        <button onClick={load} className="underline">Refresh</button>
        <button onClick={() => downloadCsv("payments.csv", rows as unknown as Record<string, unknown>[])} className="underline">Export CSV</button>
      </div>
      {msg && <p role="status" className="mt-2 text-sm text-sage-700">{msg}</p>}
      {shown.length === 0 ? <p className="mt-4 text-sage-700">No requests.</p> : (
        <ul className="mt-3 space-y-3">{shown.map((r) => (
          <li key={r.id} className="rounded border border-gold-200 bg-white p-4 text-sm">
            <p className="font-medium">{r.userName} · {r.userEmail}</p>
            <p>Course: {titles[r.courseId] ?? r.courseId}</p>
            <p>Amount: <b>{r.amount} {r.currency}</b> via {r.methodName}</p>
            <p>Sent from: {r.senderAccount} · Trx ID: <b>{r.transactionId}</b></p>
            <p>Status: <b>{r.status}</b>{r.rejectReason && ` — ${r.rejectReason}`}</p>
            {r.status === "pending" && (
              <div className="mt-2 flex gap-2">
                <button disabled={busy === r.id} onClick={() => decide(r, true)} className="rounded bg-sage-700 px-3 py-1 text-white disabled:opacity-60">Approve</button>
                <button disabled={busy === r.id} onClick={() => decide(r, false)} className="rounded border border-red-700 px-3 py-1 text-red-700 disabled:opacity-60">Reject</button>
              </div>)}
          </li>))}</ul>
      )}
    </div>
  );
}
