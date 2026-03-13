import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth-session";
import { getXPInfo } from "@/lib/game/xpService";

// Next.js dynamic routing type for route handlers
type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, context: Context) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const userId = Number(params.id);
  
  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const xpInfo = await getXPInfo(userId);
  return NextResponse.json(xpInfo);
}
