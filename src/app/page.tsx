"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const [id, setId] = useState("");
  const [secret, setSecret] = useState("");
  const router = useRouter();

  function openTicket() {
    if (!id) return;
    const base = `/ticket/${id.toUpperCase()}`;
    const url = secret ? `${base}?s=${secret}` : base;
    router.push(url);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Find Your Ticket</h1>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="border rounded-2xl px-3 py-2 flex-1"
          placeholder="Ticket number (e.g. HDK-8FQ2X3)"
          value={id}
          onChange={(e) => setId(e.target.value.toUpperCase())}
        />
        <input
          className="border rounded-2xl px-3 py-2 flex-1"
          placeholder="Secret (from your link/email, optional to view, required to post)"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <button
          className="rounded-2xl px-4 py-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
          onClick={openTicket}
        >
          Open
        </button>
      </div>
      <p className="text-sm text-neutral-600">
        Don&apos;t have a ticket?{" "}
        <a href="/new-ticket" className="underline">
          Create one
        </a>
        .
      </p>
    </div>
  );
}
