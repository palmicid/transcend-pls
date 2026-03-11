import { NextResponse, NextRequest } from "next/server"
import { friendService } from "@/services/friendService"

// Get friends of a user, pending only
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id1: string }> }
) {
  try {
    const { id1 } = await params
    const friends = await friendService.getUserFriends(parseInt(id1), {is_accepted: false});
    return NextResponse.json(friends)
  } catch (err) {
    return NextResponse.json( 
      { error: "Failed to fetch friend relations" },
      { status: 500 }
    )
  }
}
