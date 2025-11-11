"use client";

import { useEffect, useState } from "react";

interface TicketMeta {
  ticketId: string;
  subject: string;
  status: string;
  requesterName?: string | null;
  email?: string | null;
  details?: string;
  location?: string | null;
}

interface Message {
  id: string;
  text: string;
  authorRole: "agent" | "requester";
}

interface TicketPageProps {
  params: { ticketId: string };
}

export default function TicketPage({ params }: TicketPageProps) {
  const [ticket, setTicket] = useState<TicketMeta | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Load ticket meta
      const tRes = await fetch(`/api/tickets/${params.ticketId}`);
      const tText = await tRes.text();
      let tData: any = null;
      try {
        tData = tText ? JSON.parse(tText) : null;
      } catch {
        console.error("Non-JSON response from /api/tickets/[ticketId]:", tText);
      }

      if (tRes.ok && tData?.ticket) {
        setTicket(tData.ticket);
      } else if (!tRes.ok) {
        setTicket(null);
        setError(tData?.error || "Ticket not found.");
      }

      // Load messages
      const mRes = await fetch(`/api/tickets/${params.ticketId}/messages`);
      const mText = await mRes.text();
      let mData: any = null;
      try {
        mData = mText ? JSON.parse(mText) : null;
      } catch {
        console.error(
          "Non-JSON response from /api/tickets/[ticketId]/messages:",
          mText
        );
      }
      if (mRes.ok && mData?.messages) {
        setMessages(mData.messages);
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.ticketId]);

  async function sendMessage() {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${params.ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          authorRole: "requester"
        })
      });

      const rText = await res.text();
      let data: any = {};
      try {
        data = rText ? JSON.parse(rText) : {};
      } catch {
        console.error(
          "Non-JSON response when posting /api/tickets/[ticketId]/messages:",
          rText
        );
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setText("");

      // Reload messages after sending
      const mRes = await fetch(`/api/tickets/${params.ticketId}/messages`);
      const mData = await mRes.json();
      setMessages(mData.messages || []);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error sending message");
    } finally {
      setSending(false);
    }
  }

  if (loading && !ticket && !error) {
    return <div className="text-sm text-neutral-600">Loading ticket...</div>;
  }

  if (!ticket && error) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Ticket not found</h1>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Ticket not found</h1>
        <p className="text-sm text-neutral-600">
          We couldn&apos;t find that ticket. Check the URL or ticket number.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header + details */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          {ticket.ticketId} — {ticket.subject}
        </h1>
        <div className="text-sm text-neutral-600 space-y-1">
  {ticket.email && <div>Email: {ticket.email}</div>}
  {ticket.requesterName && <div>Name: {ticket.requesterName}</div>}
  {ticket.location && <div>Location: {ticket.location}</div>}
  <div>
    Status:{" "}
    <span className="inline-flex items-center px-2 py-0.5 rounded-full border bg-neutral-100 text-xs font-medium">
      {ticket.status}
    </span>
  </div>
</div>
        {ticket.details && (
          <div className="border rounded-2xl bg-white p-3 text-sm">
            <div className="text-xs font-semibold text-neutral-500 mb-1">
              Details
            </div>
            <p className="whitespace-pre-wrap">{ticket.details}</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-2 max-h-[50vh] overflow-auto p-2 border rounded-2xl bg-white">
        {messages.length === 0 && (
          <div className="text-xs text-neutral-500">
            No messages yet. You can send a message below to ask for an update.
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2 rounded-xl border text-sm ${
              m.authorRole === "agent" ? "bg-green-50" : "bg-white"
            }`}
          >
            <div className="text-[11px] text-neutral-500 mb-1">
              {m.authorRole === "agent" ? "Helpdesk" : "You"}
            </div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>

      {/* Reply box */}
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-2xl px-3 py-2 text-sm"
          placeholder="Type a message to the helpdesk..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="rounded-2xl px-4 py-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-60"
          onClick={sendMessage}
          disabled={!text.trim() || sending}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
