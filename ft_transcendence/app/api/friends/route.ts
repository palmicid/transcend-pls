import { NextResponse, NextRequest } from "next/server"
import { friendService } from "@/services/friendService"
import { userService } from "@/services/userService"
import { getSession } from "@/lib/auth/auth-session";

// Get all friend relations
export async function GET() {
  try {
    const friendRelation = await friendService.getAllFriendRelation();
    return NextResponse.json(friendRelation)
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch friend relations" },
      { status: 500 }
    )
  }
}

// Add friend
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const session = await getSession();
    if (!body.userId || !body.friendId){
      return NextResponse.json(
        { error: "Invalid user ID/friend ID" },
        { status: 400 }
      )
    }
    if (body.userId === body.friendId){
      return NextResponse.json(
        { error: "Users cannot add themselves as a friend" },
        { status: 400 }
      )
    }
    const isExist = await friendService.checkExistingRelation(body.userId, body.friendId)
    if (isExist){
      return NextResponse.json(
        { error: "Duplicate friend relations" },
        { status: 409 }
      )
    }
    if (![body.userId, body.friendId].includes(session.userId))
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const user = await userService.getUserById(body.userId);
    const friend = await userService.getUserById(body.friendId);
    if (!user || !friend){
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    const friendRequest = await (friendService).sendRequest(body.userId, body.friendId)
    return NextResponse.json(friendRequest, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to add friend" },
      { status: 500 }
    )
  }
}

