import { NextResponse, NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/client"
import { userService, userUpdateSchema } from "@/services/userService"
import bcrypt from "bcryptjs";
import { z } from "zod";
import Select from "@/components/ui/Select";

// Get user by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
){
  const { id } = await params
  try {
    const user = await userService.getProfileById(parseInt(id));
    if (!user)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const { email, stats, recentGames, ...publicProfile } = user as any;
    return NextResponse.json(publicProfile, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to get user ID ', id },
      { status: 500 }
    )
  }
}

// Update user by ID
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await _request.json();
    const validatedBody = await userUpdateSchema.parse(body);
    if (body.password)
      body.password = await bcrypt.hash(body.password, 12);
    const updateUser = await prisma.user.update({
      where: {
        id: parseInt(id),
      },
      data: {
        ...validatedBody
      },
      select: {
        id: true,
        email: true,
        display_name: true,
        avatar_url: true,
        online_status: true,
        created_at: true,
        is_verified: true,
        use2FA: true,
      }
    })
    return NextResponse.json(updateUser, { status: 201 })
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError){
      if (err.code == 'P2025')
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (err instanceof PrismaClientValidationError)
      return NextResponse.json({ error: 'Invalid JSON body request' }, { status: 400 });
    if (err instanceof z.ZodError){
      const [issue] = err.issues;
      return NextResponse.json({ error: issue?.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

// Delete user by ID (just in case, not applicable, bc no cascade on_delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const deleteUser = await prisma.user.delete({
      where: { id: parseInt(id)}
    })
    return NextResponse.json(deleteUser, { status: 200 })
  } catch(err) {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
