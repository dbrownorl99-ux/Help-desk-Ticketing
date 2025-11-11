import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { genTicketId, sendAlertEmail } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const subjectRaw = body.subject ?? "";
    const subject = String(subjectRaw).slice(0, 200).trim();

    const locationRaw = body.location ?? "";
    const location = String(locationRaw).trim();

    const emailRaw = body.email ?? "";
    const email = String(emailRaw).trim();

    const requesterName = body.name ? String(body.name).trim() : null;

    const detailsRaw = body.details ?? "";
    const details = String(detailsRaw).trim();

    if (!subject) {
      return NextResponse.json({ error: "Missing subject" }, { status: 400 });
    }

    if (!location) {
      return NextResponse.json(
        { error: "Location is required (in office or working at home)." },
        { status: 400 }
      );
    }

    if (!details || details.length < 20) {
      return NextResponse.json(
        { error: "Details must be at least 20 characters long." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required so we can contact the requester." },
        { status: 400 }
      );
    }

    const ticketId = genTicketId();
    const now = new Date();

    const ticketRef = adminDb.collection("tickets").doc(ticketId);
    await ticketRef.set({
      subject,
      location,
      email,
      requesterName,
      details,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: null,
      status: "open"
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const ticketUrl = `${baseUrl}/ticket/${ticketId}`;

    // 1️⃣ Email to helpdesk
    const helpdeskTo = process.env.ALERT_EMAIL_TO;
    const from = process.env.ALERT_EMAIL_FROM;
    if (helpdeskTo && from) {
      const html = `New ticket <b>${ticketId}</b><br/>
Subject: ${subject}<br/>
Location: ${location}<br/>
From: ${email}<br/>
Details:<br/><pre>${details}</pre><br/>
<a href="${ticketUrl}">Open Ticket</a>`;
      try {
        await sendAlertEmail({
          to: helpdeskTo,
          from,
          subject: `New Ticket ${ticketId}`,
          html
        });
      } catch (err) {
        console.error("Email send failed for helpdesk", ticketId, err);
      }
    }

    // 2️⃣ Email to requester
    if (email && from) {
      const requesterHtml = `
        Hi${requesterName ? " " + requesterName : ""},<br/><br/>
        We have received your helpdesk request.<br/><br/>
        <b>Ticket ID:</b> ${ticketId}<br/>
        <b>Subject:</b> ${subject}<br/>
        <b>Location:</b> ${location}<br/><br/>
        You can view and reply to your ticket here:<br/>
        <a href="${ticketUrl}">${ticketUrl}</a><br/><br/>
        Thanks,<br/>
        Helpdesk
      `;
      try {
        await sendAlertEmail({
        to: email,
        from,
        subject: `We received your ticket (${ticketId})`,
        html: requesterHtml
        });
      } catch (err) {
        console.error("Email send failed for requester", ticketId, err);
      }
    }

    return NextResponse.json({ ticketId });
  } catch (err: any) {
    console.error("Error in POST /api/tickets:", err);
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

