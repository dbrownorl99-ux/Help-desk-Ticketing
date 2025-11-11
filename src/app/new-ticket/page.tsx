"use client";

import { useState } from "react";

interface CreateResult {
  ticketId: string;
}

const SUBJECT_OPTIONS = [
  "L.O.S Issue",
  "Five9 issue",
  "Outlook/Email Issue",
  "Spark Issue",
  "Special Request"
] as const;

type SubjectOption = (typeof SUBJECT_OPTIONS)[number];

export default function NewTicketPage() {
  const [subject, setSubject] = useState<SubjectOption | "">("");
  const [location, setLocation] = useState<"" | "In office" | "Working at home">("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<CreateResult | null>(null);

  async function submit() {
    if (!subject) {
      alert("Please choose a subject.");
      return;
    }

    if (!location) {
      alert("Please select if you are in office or working at home.");
      return;
    }

    if (details.trim().length < 20) {
      alert("Details must be at least 20 characters so we can understand the issue.");
      return;
    }

    if (!email.trim()) {
      alert("Please enter your email so we can contact you.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          location,
          email,
          name,
          details
        })
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error("Non-JSON response from /api/tickets:", text);
        throw new Error("Server error. Check dev logs.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to create ticket");
      }

      setResult(data);
    } catch (err: any) {
      alert(err.message || "Error creating ticket");
    } finally {
      setCreating(false);
    }
  }

  if (result) {
    const link = `/ticket/${result.ticketId}`;
    return (
      <div className="space-y-4 max-w-xl">
        <h1 className="text-2xl font-bold">Ticket Created</h1>
        <p>
          Your ticket number is <b>{result.ticketId}</b>.
        </p>
        <p className="text-sm text-neutral-600">
          Save this link so you can check updates and send messages:
        </p>
        <a className="underline break-all" href={link}>
          {link}
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">New Ticket</h1>

      {/* Subject dropdown */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Subject</label>
        <select
          className="w-full border rounded-2xl px-3 py-2 text-sm bg-white"
          value={subject}
          onChange={(e) => {
            const value = e.target.value as SubjectOption | "";
            setSubject(value);
            // reset location when subject changes
            setLocation("");
          }}
        >
          <option value="">Select a subject…</option>
          {SUBJECT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Location dropdown – appears when subject chosen */}
      {subject && (
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Are you in office or working at home?
          </label>
          <select
            className="w-full border rounded-2xl px-3 py-2 text-sm bg-white"
            value={location}
            onChange={(e) =>
              setLocation(e.target.value as "In office" | "Working at home" | "")
            }
          >
            <option value="">Select a location…</option>
            <option value="In office">In office</option>
            <option value="Working at home">Working at home</option>
          </select>
        </div>
      )}

      <textarea
        className="w-full border rounded-2xl px-3 py-2 text-sm min-h-[120px]"
        placeholder="Describe the issue in detail (at least 20 characters)..."
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />

      <input
        className="w-full border rounded-2xl px-3 py-2"
        placeholder="Your email (required)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="w-full border rounded-2xl px-3 py-2"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button
        disabled={creating}
        className="rounded-2xl px-4 py-2 bg-green-600 text-white font-medium hover:bg-green-700 transition disabled:opacity-60"
        onClick={submit}
      >
        {creating ? "Creating..." : "Create Ticket"}
      </button>

      <p className="text-sm text-neutral-600">
        You&apos;ll get a link to view your ticket and send follow-up messages.
      </p>
    </div>
  );
}
