import Link from "next/link";
import { Activity, BarChart3, BrainCircuit, ShieldCheck, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const capabilities = [
  {
    icon: ShieldCheck,
    title: "Enterprise auth",
    description: "JWT access tokens, refresh sessions, RBAC, lockout, verification, and audit logging.",
  },
  {
    icon: BarChart3,
    title: "Analytics-ready",
    description: "Role-aware dashboards for students, mentors, HODs, admins, and super admins.",
  },
  {
    icon: Zap,
    title: "Realtime-first",
    description: "Socket.IO and Redis-ready collaboration, notifications, presence, and live counters.",
  },
  {
    icon: BrainCircuit,
    title: "AI platform layer",
    description: "Designed for idea generation, project scoring, AI review, and mentor recommendations.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Activity size={20} />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight">ProjectFlow Enterprise</div>
              <div className="text-xs font-medium text-muted-foreground">Campus Project Management</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <Badge className="bg-white">Phase 1 architecture is live</Badge>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">
                AI-powered campus project operations, built for scale.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                ProjectFlow is being upgraded into a production-grade platform with modern auth,
                real-time collaboration, project lifecycle tracking, analytics, and AI review workflows.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">Open command center</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Role-based sign in</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((item) => (
              <Card key={item.title} className="rounded-lg">
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-slate-100 text-slate-950">
                    <item.icon size={20} />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
            <Card className="rounded-lg bg-slate-950 text-white sm:col-span-2">
              <CardContent className="grid gap-6 p-6 sm:grid-cols-3">
                <div>
                  <div className="text-3xl font-black">5</div>
                  <div className="text-sm text-slate-300">roles secured</div>
                </div>
                <div>
                  <div className="text-3xl font-black">12+</div>
                  <div className="text-sm text-slate-300">core modules planned</div>
                </div>
                <div>
                  <div className="text-3xl font-black">RT</div>
                  <div className="text-sm text-slate-300">realtime-ready architecture</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
