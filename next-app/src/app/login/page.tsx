"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/use-auth";

export default function LoginPage() {
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md rounded-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-slate-950 text-white">
            <ShieldCheck size={22} />
          </div>
          <CardTitle className="text-2xl">Enterprise Sign In</CardTitle>
          <CardDescription>JWT + refresh-session auth for ProjectFlow roles</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              login.mutate({ email, password });
            }}
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-900">Email</label>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-900">Password</label>
              <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
            </div>
            {login.error && <p className="text-sm font-medium text-red-600">{login.error.message}</p>}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
              Sign in
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="font-semibold text-slate-950 hover:underline">
              Back to platform overview
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
