"use client";

import { BarChart3, CheckCircle2, Clock, FolderKanban, Users } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Active projects", value: "128", icon: FolderKanban },
  { label: "Pending approvals", value: "34", icon: Clock },
  { label: "Mentor reviews", value: "61", icon: CheckCircle2 },
  { label: "Campus users", value: "1.8k", icon: Users },
];

const chartData = [
  { name: "Idea", value: 42 },
  { name: "Approved", value: 36 },
  { name: "Progress", value: 58 },
  { name: "Review", value: 22 },
  { name: "Done", value: 31 },
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Command Center</p>
            <h1 className="text-3xl font-black tracking-tight">ProjectFlow Enterprise Dashboard</h1>
          </div>
          <div className="rounded-md border bg-white px-3 py-2 text-sm font-semibold text-slate-600">
            Realtime socket layer ready
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon size={18} className="text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={18} />
                Project lifecycle analytics
              </CardTitle>
              <CardDescription>Phase 2 will bind this to cached backend metrics.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0f172a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-md bg-slate-100" />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Phase roadmap</CardTitle>
              <CardDescription>Production rollout sequence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {["Architecture + auth", "Dashboards + UI system", "Project management", "Realtime collaboration", "AI features", "Deployment"].map((phase, index) => (
                <div key={phase} className="flex items-center gap-3 rounded-md border bg-white p-3">
                  <div className="flex size-7 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <span className="font-semibold">{phase}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
