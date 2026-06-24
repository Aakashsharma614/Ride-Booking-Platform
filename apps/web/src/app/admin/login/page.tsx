"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function AdminLogin() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { accessToken } = await api.adminLogin(email, password);
      setUser({ id: "admin-001", email, name: "Admin", role: "ADMIN", accessToken });
      toast.success("Welcome, Admin");
      router.push("/admin");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-black animate-fade-in">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-white mb-1">Admin Portal</h1>
        <p className="text-gray-400 text-sm">RideX Operations Dashboard</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto w-full">
        <div>
          <Label className="mb-2 block">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input type="email" className="pl-10" placeholder="admin@ridex.io" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input type="password" className="pl-10" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Signing in…" : <span className="flex items-center gap-2">Sign In <ArrowRight className="w-4 h-4" /></span>}
        </Button>
      </form>
    </div>
  );
}
