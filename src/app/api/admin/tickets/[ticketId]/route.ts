import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

interface RouteParams {
  params: { ticketId: string };
}

const ALLOWED = ["open", "in-progress", "resolved", "closed", "new-alert"];

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch (err) {
    console.error("Admin auth failed:", err);
    return null;
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const status = String(body.status);

  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Bad status" }, { status: 400 });
  }

  await adminDb.collection("tickets").doc(params.ticketId).update({
    status,
    updatedAt: new Date()
  });

  return NextResponse.json({ ok: true });
}
