import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticate, isProjectAdmin } from "@/lib/middleware";
import Project from "@/models/Project";
import User from "@/models/User";

// ─── POST /api/projects/[id]/members ─────────────────────────────────────
// Add a member to a project by email
export async function POST(request, { params }) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();
     
    const {id} = await params
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 }
      );
    }

    // Only project admin/owner can add members
    if (!isProjectAdmin(project, user._id)) {
      return NextResponse.json(
        { message: "Only project admins can add members." },
        { status: 403 }
      );
    }

    const { email, role = "member" } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    // Find the user to add
    const userToAdd = await User.findOne({ email: email.toLowerCase() });

    if (!userToAdd) {
      return NextResponse.json(
        { message: "No user found with this email." },
        { status: 404 }
      );
    }

    // Check if already a member
    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      return NextResponse.json(
        { message: "This user is already a member of this project." },
        { status: 409 }
      );
    }

    // Add the member
    project.members.push({ user: userToAdd._id, role });
    await project.save();
    await project.populate("members.user", "name email");

    return NextResponse.json({
      message: `${userToAdd.name} added to project successfully!`,
      project,
    });

  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json(
      { message: "Failed to add member." },
      { status: 500 }
    );
  }
}