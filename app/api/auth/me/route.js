import { NextResponse } from "next/server";
import { authenticate } from "@/lib/middleware";

// The frontend will call this on every page load
// to check if the user is still logged in
export async function GET(request) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  return NextResponse.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}