import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticate, isProjectAdmin } from "@/lib/middleware";
import Project from "@/models/Project";

// ─── DELETE /api/projects/[id]/members/[userId] ───────────────────────────
export async function DELETE(request, { params }) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();

    const project = await Project.findById(params.id);

    if (!project) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 }
      );
    }

    // Only project admin/owner can remove members
    if (!isProjectAdmin(project, user._id)) {
      return NextResponse.json(
        { message: "Only project admins can remove members." },
        { status: 403 }
      );
    }

    // Cannot remove the owner
    if (project.owner.toString() === params.userId) {
      return NextResponse.json(
        { message: "Cannot remove the project owner." },
        { status: 400 }
      );
    }

    // Remove the member using filter
    project.members = project.members.filter(
      (m) => m.user.toString() !== params.userId
    );

    await project.save();

    return NextResponse.json({
      message: "Member removed successfully.",
    });

  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { message: "Failed to remove member." },
      { status: 500 }
    );
  }
}