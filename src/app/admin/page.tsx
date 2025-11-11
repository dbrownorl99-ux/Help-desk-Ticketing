"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

type TicketStatus = "open" | "in-progress" | "resolved" | "closed" | "new-alert";

interface Ticket {
  id: string;
  subject: string;
  email?: string | null;
  status: TicketStatus;
  details?: string | null;
  location?: string | null;
}

interface Message {
  id: string;
  text: string;
  authorRole: "agent" | "requester";
}

const STATUSES: TicketStatus[] = ["open", "in-progress", "resolved", "closed", "new-alert"];

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  "in-progress": "In progress",
  resolved: "Resolved",
  closed: "Closed",
  "new-alert": "New alert"
};

const STATUS_CLASS: Record<TicketStatus, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  "in-progress": "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-neutral-100 text-neutral-700 border-neutral-200",
  "new-alert": "bg-red-50 text-red-700 border-red-200 animate-pulse"
};

type FilterOption = TicketStatus | "all";

// 🔐 Helper: fetch with Firebase ID token
async function authFetch(url: string, init: RequestInit = {}) {
  const user = auth.currentUser;
  const headers = new Headers(init.headers || {});
  if (user) {
    const token = await user.getIdToken();
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, { ...init, headers });
}

// status priority for sorting
const STATUS_PRIORITY: Record<TicketStatus, number> = {
  "new-alert": 0,
  open: 1,
  "in-progress": 2,
  resolved: 3,
  closed: 4
};

export default function AdminPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterOption>("all");
  const [search, setSearch] = useState("");

  // 🔐 Redirect if not logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/admin/login");
      } else {
        setCurrentUserEmail(user.email || null);
        setAuthChecking(false);
      }
    });
    return () => unsub();
  }, [router]);

  async function loadTickets() {
    setLoadingTickets(true);
    try {
      const res = await authFetch("/api/admin/tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
      // if a ticket was selected, refresh its info too
      if (selected) {
        const updated = (data.tickets || []).find((t: Ticket) => t.id === selected.id);
        if (updated) {
          setSelected(updated);
        }
      }
    } finally {
      setLoadingTickets(false);
    }
  }

  async function openTicket(t: Ticket) {
    setSelected(t);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/tickets/${t.id}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function setStatus(id: string, status: TicketStatus) {
    await authFetch(`/api/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    await loadTickets();
    if (selected && selected.id === id) {
      setSelected({ ...selected, status });
    }
  }

  async function sendAgent() {
    if (!selected || !text.trim()) return;
    await authFetch(`/api/tickets/${selected.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        authorRole: "agent",
        authorId: "agent"
      })
    });
    setText("");
    const res = await fetch(`/api/tickets/${selected.id}/messages`);
    const data = await res.json();
    setMessages(data.messages || []);
    await loadTickets();
  }

  useEffect(() => {
    if (!authChecking) {
      loadTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecking]);

  // Count tickets per status for filter buttons
  const statusCounts = useMemo(() => {
    const base: Record<FilterOption, number> = {
      all: 0,
      open: 0,
      "in-progress": 0,
      resolved: 0,
      closed: 0,
      "new-alert": 0
    };
    for (const t of tickets) {
      base.all += 1;
      base[t.status] += 1;
    }
    return base;
  }, [tickets]);

  // Apply filter + search + sort
  const visibleTickets = useMemo(() => {
    let list = tickets;
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }

    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((t) => {
        const subject = (t.subject || "").toLowerCase();
        const email = (t.email || "").toLowerCase();
        const details = (t.details || "").toLowerCase();
        return (
          subject.includes(term) ||
          email.includes(term) ||
          details.includes(term)
        );
      });
    }

    return [...list].sort(
      (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
    );
  }, [tickets, statusFilter, search]);

  if (authChecking) {
    return <div className="text-sm text-neutral-600">Checking admin session...</div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* LEFT: ticket list + filters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold">Tickets</h1>
            {currentUserEmail && (
              <p className="text-xs text-neutral-500">Signed in as {currentUserEmail}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="text-sm underline disabled:opacity-60"
              onClick={loadTickets}
              disabled={loadingTickets}
            >
              {loadingTickets ? "Refreshing..." : "Refresh"}
            </button>
            <button
              className="text-xs text-neutral-500 border rounded-xl px-2 py-1"
              onClick={async () => {
                await signOut(auth);
                router.replace("/admin/login");
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3 text-xs">
          {(["all", "open", "new-alert", "in-progress", "resolved", "closed"] as FilterOption[]).map(
            (filter) => {
              const isActive = statusFilter === filter;
              const label =
                filter === "all" ? "All" : STATUS_LABEL[filter as TicketStatus];
              return (
                <button
                  key={filter}
                  className={
                    "px-3 py-1 rounded-full border flex items-center gap-1 " +
                    (isActive
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-neutral-700 border-neutral-200")
                  }
                  onClick={() => setStatusFilter(filter)}
                >
                  <span>{label}</span>
                  <span className="text-[10px] opacity-80">
                    {statusCounts[filter] ?? 0}
                  </span>
                </button>
              );
            }
          )}
        </div>

        {/* Search */}
        <div className="mb-3">
          <input
            className="w-full border rounded-2xl px-3 py-2 text-xs"
            placeholder="Search by email, subject or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Ticket list */}
        <div className="space-y-2">
          {visibleTickets.map((t) => (
            <div
              key={t.id}
              className="p-3 rounded-2xl border bg-white hover:bg-neutral-50 cursor-pointer flex flex-col gap-1"
              onClick={() => openTicket(t)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium truncate">
                  {t.id} — {t.subject}
                </div>
                <span
                  className={
                    "px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap " +
                    STATUS_CLASS[t.status]
                  }
                >
                  {STATUS_LABEL[t.status]}
                </span>
              </div>
              <div className="text-xs text-neutral-600">
                From: {t.email || "—"}
              </div>
            </div>
          ))}
          {visibleTickets.length === 0 && !loadingTickets && (
            <div className="text-sm text-neutral-500">
              No tickets for this filter.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: selected ticket */}
      <div>
        {selected ? (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
<div className="flex flex-col gap-1 min-w-0">
  <div className="font-semibold truncate">
    {selected.id} — {selected.subject}
  </div>
  <div className="text-xs text-neutral-500 truncate">
    {selected.email ? `From: ${selected.email}` : "No email"}
  </div>
  {selected.location && (
    <div className="text-xs text-neutral-500 truncate">
      Location: {selected.location}
    </div>
  )}
</div>
              <select
                className="border rounded-2xl px-2 py-1 text-sm"
                value={selected.status}
                onChange={(e) => setStatus(selected.id, e.target.value as TicketStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* Details panel */}
            {selected.details && (
              <div className="border rounded-2xl bg-white p-3 text-sm">
                <div className="text-xs font-semibold text-neutral-500 mb-1">
                  Details
                </div>
                <p className="whitespace-pre-wrap">{selected.details}</p>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-2 max-h-[50vh] overflow-auto p-2 border rounded-2xl bg-white">
              {loadingMessages && (
                <div className="text-xs text-neutral-500">Loading messages...</div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded-xl border text-sm ${
                    m.authorRole === "agent" ? "bg-green-50" : "bg-white"
                  }`}
                >
                  <div className="text-[11px] text-neutral-500 mb-1">
                    {m.authorRole === "agent" ? "Helpdesk" : "Requester"}
                  </div>
                  <div>{m.text}</div>
                </div>
              ))}
              {!loadingMessages && messages.length === 0 && (
                <div className="text-xs text-neutral-500">No messages yet.</div>
              )}
            </div>

            {/* Reply box */}
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-2xl px-3 py-2 text-sm"
                placeholder="Reply as helpdesk"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                className="rounded-2xl px-4 py-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-60"
                onClick={sendAgent}
                disabled={!text.trim()}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="text-neutral-600">Select a ticket to view details.</div>
        )}
      </div>
    </div>
  );
}


