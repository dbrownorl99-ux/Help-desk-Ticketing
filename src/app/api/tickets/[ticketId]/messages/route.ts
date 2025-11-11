import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

interface RouteParams {
  params: { ticketId: string };
}

async function requireAdminIfAgent(req: NextRequest, authorRole: string) {
  if (authorRole !== "agent") return true; // requester messages no auth
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.split(" ")[1];
  try {
    await adminAuth.verifyIdToken(token);
    return true;
  } catch (err) {
    console.error("Agent auth failed:", err);
    return false;
  }
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const q = await adminDb
    .collection("tickets")
    .doc(params.ticketId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .get();

  const items = q.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ messages: items });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const body = await req.json();
  const textRaw = body.text ?? "";
  const text = String(textRaw).trim();
  const authorRole: "agent" | "requester" =
    body.authorRole === "agent" ? "agent" : "requester";
  const authorId = body.authorId ? String(body.authorId) : null;

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const allowed = await requireAdminIfAgent(req, authorRole);
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tRef = adminDb.collection("tickets").doc(params.ticketId);
  const tDoc = await tRef.get();
  if (!tDoc.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();

  await tRef.collection("messages").add({
    text,
    createdAt: now,
    authorRole,
    authorId: authorRole === "agent" ? authorId : null
  });

  if (authorRole === "requester") {
    await tRef.update({
      status: "new-alert",
      updatedAt: now,
      lastMessageAt: now
    });
  } else {
    await tRef.update({
      updatedAt: now,
      lastMessageAt: now
    });
  }

  return NextResponse.json({ ok: true });
}
