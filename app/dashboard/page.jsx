"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(d) {
  if (!d) return "No due date";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "done") return false;
  return new Date(task.dueDate) < new Date();
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, gradient, icon }) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-lg ${gradient}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm mt-1 opacity-90 font-medium">{label}</p>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    "todo":        { cls: "bg-slate-100 text-slate-600",  label: "To Do"       },
    "in-progress": { cls: "bg-blue-100 text-blue-700",    label: "In Progress" },
    "done":        { cls: "bg-green-100 text-green-700",  label: "Done"        },
  };
  const { cls, label } = map[status] || map["todo"];
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

// ── Priority Dot ──────────────────────────────────────────────────────────
function PriorityDot({ priority }) {
  const map = {
    low:    "bg-gray-400",
    medium: "bg-amber-400",
    high:   "bg-red-500",
  };
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-500 capitalize">
      <span className={`inline-block w-2 h-2 rounded-full ${map[priority]}`} />
      {priority}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user }          = useAuth();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchDashboard(); }, []);

  async function fetchDashboard() {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard.");
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-3 text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">
          Try Again
        </button>
      </div>
    );
  }

  const { stats, assignedTasks, recentTasks, projectSummaries } = data;

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-indigo-200 mt-1 text-sm">
          Here&apos;s what&apos;s happening with your projects today.
        </p>
        <div className="flex gap-3 mt-4">
          <Link href="/projects"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-50 transition shadow-sm">
            View Projects →
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Assigned"
          value={stats.totalAssigned}
          icon="📋"
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon="⚡"
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon="✅"
          gradient="bg-gradient-to-br from-emerald-400 to-teal-600"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon="🔥"
          gradient="bg-gradient-to-br from-rose-500 to-pink-600"
        />
      </div>

      {/* ── Content Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── My Tasks ────────────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-gray-900">My Tasks</h2>
              <p className="text-xs text-gray-400 mt-0.5">{stats.totalAssigned} tasks assigned to you</p>
            </div>
            <Link href="/projects"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition">
              All Projects →
            </Link>
          </div>

          {assignedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-500 font-medium">No tasks assigned yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Tasks assigned to you will appear here.
              </p>
              <Link href="/projects"
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition font-medium">
                Go to Projects
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {assignedTasks.map((task) => (
                <div key={task._id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold truncate ${
                          task.status === "done"
                            ? "line-through text-gray-400"
                            : "text-gray-800"
                        }`}>
                          {task.title}
                        </p>
                        {isOverdue(task) && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="text-xs text-gray-400 font-medium">
                          📁 {task.project?.name}
                        </span>
                        <span className={`text-xs font-medium ${
                          isOverdue(task) ? "text-red-500" : "text-gray-400"
                        }`}>
                          📅 {formatDate(task.dueDate)}
                        </span>
                        <PriorityDot priority={task.priority} />
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Column ──────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Projects Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Projects</h2>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                {stats.totalProjects}
              </span>
            </div>

            {projectSummaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
                <div className="text-4xl mb-3">🗂️</div>
                <p className="text-gray-500 text-sm font-medium">No projects yet</p>
                <Link href="/projects"
                  className="mt-3 text-indigo-600 text-sm hover:underline font-semibold">
                  Create your first project
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {projectSummaries.map((project) => {
                  const pct = project.tasks.total > 0
                    ? Math.round((project.tasks.done / project.tasks.total) * 100)
                    : 0;
                  return (
                    <div key={project._id} className="px-5 py-4 hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-800 truncate flex-1">
                          {project.name}
                        </p>
                        <span className="text-xs font-bold text-gray-500 ml-2 flex-shrink-0">
                          {pct}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: pct === 100
                              ? "#10b981"
                              : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          👥 {project.memberCount} member{project.memberCount !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-gray-400">
                          {project.tasks.done}/{project.tasks.total} tasks
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Recent Activity</h2>
            </div>

            {recentTasks.length === 0 ? (
              <div className="py-10 text-center px-5">
                <p className="text-gray-400 text-sm">No recent activity.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentTasks.map((task) => (
                  <div key={task._id}
                    className="px-5 py-3.5 hover:bg-gray-50 transition">
                    <p className="text-sm font-semibold text-gray-700 truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <StatusBadge status={task.status} />
                      <span className="text-xs text-gray-400">
                        {task.project?.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}