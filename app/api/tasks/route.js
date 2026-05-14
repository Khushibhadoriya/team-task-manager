import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/middleware";
import Task from "@/models/Task";
import Project from "@/models/Project";

// ─── GET /api/tasks ───────────────────────────────────────────────────────
// Supports filters: ?project=id  ?status=todo  ?assignedTo=me  ?overdue=true
export async function GET(request) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const projectId   = searchParams.get("project");
    const status      = searchParams.get("status");
    const assignedTo  = searchParams.get("assignedTo");
    const overdue     = searchParams.get("overdue");

    // ── Build the query object dynamically ────────────────────────────
    // We only add filters that were actually sent
    const query = {};

    if (projectId) {
      // Verify the user is actually a member of this project
      const project = await Project.findById(projectId);
      if (!project) {
        return NextResponse.json(
          { message: "Project not found." },
          { status: 404 }
        );
      }

      const isMember = project.members.some(
        (m) => m.user.toString() === user._id.toString()
      );
      const isOwner = project.owner.toString() === user._id.toString();

      if (!isMember && !isOwner) {
        return NextResponse.json(
          { message: "You don't have access to this project." },
          { status: 403 }
        );
      }

      query.project = projectId;

    } else {
      // No project filter — only return tasks from projects user belongs to
      const userProjects = await Project.find({
        $or: [{ owner: user._id }, { "members.user": user._id }],
      }).select("_id");

      const projectIds = userProjects.map((p) => p._id);
      query.project = { $in: projectIds };
    }

    // Add optional filters
    if (status) query.status = status;

    if (assignedTo === "me") query.assignedTo = user._id;

    if (overdue === "true") {
      // Overdue = has a dueDate, not done, and dueDate is in the past
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: "done" };
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ tasks });

  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { message: "Failed to fetch tasks." },
      { status: 500 }
    );
  }
}

// ─── POST /api/tasks ──────────────────────────────────────────────────────
export async function POST(request) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();

    const { title, description, projectId, assignedTo, priority, dueDate } =
      await request.json();

    // ── Validate required fields ───────────────────────────────────────
    if (!title || title.trim().length < 2) {
      return NextResponse.json(
        { message: "Task title must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { message: "Project ID is required." },
        { status: 400 }
      );
    }

    // ── Check project exists and user has admin access ─────────────────
    const project = await Project.findById(projectId);

    if (!project) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 }
      );
    }

    // Find this user's role in the project
    const memberEntry = project.members.find(
      (m) => m.user.toString() === user._id.toString()
    );
    const isOwner = project.owner.toString() === user._id.toString();
    const isAdmin = memberEntry?.role === "admin";

    // Only project owner or admin can create tasks
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { message: "Only project admins can create tasks." },
        { status: 403 }
      );
    }

    // ── If assignedTo is provided, verify they are a project member ────
    if (assignedTo) {
      const isValidMember = project.members.some(
        (m) => m.user.toString() === assignedTo
      );
      const isProjectOwner = project.owner.toString() === assignedTo;

      if (!isValidMember && !isProjectOwner) {
        return NextResponse.json(
          { message: "Assigned user is not a member of this project." },
          { status: 400 }
        );
      }
    }

    // ── Create the task ────────────────────────────────────────────────
    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || "",
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: user._id,
      priority: priority || "medium",
      dueDate: dueDate || null,
    });

    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    await task.populate("project", "name");

    return NextResponse.json(
      { message: "Task created successfully!", task },
      { status: 201 }
    );

  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { message: "Failed to create task." },
      { status: 500 }
    );
  }
}