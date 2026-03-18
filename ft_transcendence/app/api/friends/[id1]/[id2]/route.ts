import { NextResponse, NextRequest } from "next/server"
import { friendService } from "@/services/friendService"
import prisma from "@/lib/prisma";

// Accepted friend request
export async function PATCH(
    _request: NextRequest,
    { params }: { params: Promise<{ id1: string, id2: string }> }
) {
    const { id1, id2 } = await params
    try {
        const friendRelation = await friendService.checkExistingRelation(parseInt(id1), parseInt(id2));
        if(!friendRelation){
        return NextResponse.json(
            { error: "Friend relation not found" },
            { status: 404 }
        );
        }
        const { user_id, friend_id, ..._ } = friendRelation;
        const updateFriendRelation = await friendService.acceptFriendRequest(user_id, friend_id);
        return NextResponse.json(updateFriendRelation, { status: 200 });
    } catch (err) {
        return NextResponse.json(
        { error: "Failed to update friend relation" },
        { status: 500 }
        )
    }
}

// Delete friend relation
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id1: string, id2: string }> }
) {
    const { id1, id2 } = await params
    try {
        const friendRelation = await friendService.checkExistingRelation(parseInt(id1), parseInt(id2));
        if(!friendRelation){
        return NextResponse.json(
            { error: "Friend relation not found" },
            { status: 404 }
        );
        }
        const { user_id, friend_id, ..._ } = friendRelation;
        const deleteFriendRelation = await prisma.friendRelation.delete({
            where: {
                user_id_friend_id: {
                    user_id: user_id,
                    friend_id: friend_id
                }
            },
        });
        return NextResponse.json(deleteFriendRelation, { status: 201 });
    } catch (err) {
        return NextResponse.json(
        { error: "Failed to delete friend relation" },
        { status: 500 }
        )
    }
}
