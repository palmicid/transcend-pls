import { NextResponse, NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/client"
import { userService } from "@/services/userService"

// Get user by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
){
  const { id } = await params
  try {
    const user = await userService.getUserById(parseInt(id));
    if (!user)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json(user, { status: 200 })
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
    const updateUser = await prisma.user.update({
      where: {
        id: parseInt(id),
      },
      data: {
        ...body
      },
    })
    return NextResponse.json(updateUser, { status: 201 })
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError){
      if (err.code == 'P2025') 
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (err instanceof PrismaClientValidationError)
      return NextResponse.json({ error: 'Invalid JSON body request' }, { status: 400 })
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
