import { NextResponse, NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { userService } from "@/services/userService"
import bcrypt from "bcryptjs";

// Get all users
export async function GET() {
  try {
    const users = await userService.getAllUsers();
    return NextResponse.json(users)
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

// Create user
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const user = await prisma.user.create({
      data: {
        email: body.email,
        display_name: body.display_name,
        password: body.password
        // password: bcrypt.hash(body.password, process.env())
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}
