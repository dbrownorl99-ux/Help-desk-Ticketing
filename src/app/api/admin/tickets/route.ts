import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    // If you want to restrict to certain emails, do it here:
    // if (decoded.email !== "your-admin-email@domain.com") return null;
    return decoded;
  } catch (err) {
    console.error("Admin auth failed:", err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = await adminDb
    .collection("tickets")
    .orderBy("lastMessageAt", "desc")
    .limit(200)
    .get();

  const items = q.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ tickets: items });
}
