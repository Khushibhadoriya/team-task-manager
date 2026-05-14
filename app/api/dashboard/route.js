import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/middleware";
import Task from "@/models/Task";
import Project from "@/models/Project";

// ─── GET /api/dashboard ───────────────────────────────────────────────────
export async function GET(request) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();

    // ── 1. Get all projects user belongs to ───────────────────────────
    const projects = await Project.find({
      $or: [
        { owner: user._id },
        { "members.user": user._id },
      ],
    }).select("_id name status members");

    const projectIds = projects.map((p) => p._id);

    // ── 2. Get all tasks assigned to user ─────────────────────────────
    const assignedTasks = await Task.find({
      project: { $in: projectIds },
      assignedTo: user._id,
    })
      .populate("project", "name")
      .sort({ dueDate: 1 }); // soonest due date first

    // ── 3. Calculate stats ─────────────────────────────────────────────
    const now = new Date();

    const totalAssigned  = assignedTasks.length;
    const completed      = assignedTasks.filter((t) => t.status === "done").length;
    const inProgress     = assignedTasks.filter((t) => t.status === "in-progress").length;
    const pending        = assignedTasks.filter((t) => t.status === "todo").length;

    // Overdue = has dueDate, not done, dueDate is past
    const overdue = assignedTasks.filter(
      (t) => t.dueDate && t.status !== "done" && new Date(t.dueDate) < now
    ).length;

    // ── 4. Recent activity — last 5 tasks across all user projects ─────
    const recentTasks = await Task.find({
      project: { $in: projectIds },
    })
      .populate("assignedTo", "name")
      .populate("project", "name")
      .sort({ updatedAt: -1 })
      .limit(5);

    // ── 5. Project summaries ───────────────────────────────────────────
    // For each project, count tasks by status
    const projectSummaries = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        // Convert array to object: [{_id:'todo', count:3}] → {todo:3}
        const counts = taskCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {});

        return {
          _id: project._id,
          name: project.name,
          status: project.status,
          memberCount: project.members.length,
          tasks: {
            todo:        counts["todo"]        || 0,
            inProgress:  counts["in-progress"] || 0,
            done:        counts["done"]        || 0,
            total:       Object.values(counts).reduce((a, b) => a + b, 0),
          },
        };
      })
    );

    return NextResponse.json({
      stats: {
        totalAssigned,
        completed,
        inProgress,
        pending,
        overdue,
        totalProjects: projects.length,
      },
      assignedTasks,
      recentTasks,
      projectSummaries,
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard data." },
      { status: 500 }
    );
  }
}