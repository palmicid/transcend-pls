import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth-session";
import prisma from "@/lib/prisma";

const INACTIVITY_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

export async function POST() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update this user's last_active_at and ensure online_status is true
    await prisma.user.update({
      where: { id: session.userId },
      data: { last_active_at: new Date(), online_status: true },
    });

    // Piggyback: mark stale users as offline (last_active_at > 15 min ago)
    const cutoff = new Date(Date.now() - INACTIVITY_THRESHOLD_MS);
    await prisma.user.updateMany({
      where: {
        online_status: true,
        last_active_at: { lt: cutoff },
      },
      data: { online_status: false },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
