import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

interface RouteParams {
  params: { ticketId: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const doc = await adminDb.collection("tickets").doc(params.ticketId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const data = doc.data() || {};
    return NextResponse.json({
      ticket: {
        ticketId: params.ticketId,
        subject: data.subject,
        status: data.status,
        requesterName: data.requesterName ?? null,
        email: data.email ?? null,
        details: data.details ?? "",
        location: data.location ?? null,
        createdAt: data.createdAt ?? null
      }
    });
  } catch (err: any) {
    console.error("Error in GET /api/tickets/[ticketId]:", err);
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
