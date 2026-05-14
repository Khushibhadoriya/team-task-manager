import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { signToken } from "@/lib/auth";
import User from "@/models/User";

export async function POST(request) {
  try {
    // ── 1. Parse the request body ──────────────────────────────────────
    const { name, email, password } = await request.json();

    // ── 2. Basic validation ────────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // ── 3. Connect to DB and check if email already exists ─────────────
    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }   // 409 = Conflict
      );
    }

    // ── 4. Create the user (password gets hashed by our pre-save hook) ──
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
    });

    // ── 5. Create JWT token ────────────────────────────────────────────
    const token = signToken(user._id);

    // ── 6. Build the response ──────────────────────────────────────────
    const response = NextResponse.json(
      {
        message: "Account created successfully!",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }   // 201 = Created
    );

    // ── 7. Set JWT as HTTP-only cookie ─────────────────────────────────
    response.cookies.set("token", token, {
      httpOnly: true,       // JS cannot access this cookie
      secure: process.env.NODE_ENV === "production",  // HTTPS only in prod
      sameSite: "lax",      // protects against CSRF attacks
      maxAge: 60 * 60 * 24 * 7,  // 7 days in seconds
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}