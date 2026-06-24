"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function RiderLogin() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { accessToken } = await api.riderLogin(email, password);
      const me = await api.getMe(accessToken);
      setUser({ id: me._id, email: me.email, name: me.name, role: "RIDER", accessToken });
      toast.success("Welcome back!");
      router.push("/rider/home");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-black animate-fade-in">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-white mb-2">Ride<span className="text-gradient">X</span></h1>
        <p className="text-gray-400 text-sm">Sign in to your rider account</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Label className="mb-2 block">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input type="email" className="pl-10" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input type={showPw ? "text" : "password"} className="pl-10 pr-10" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white" onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Signing in…" : <span className="flex items-center gap-2">Sign In <ArrowRight className="w-4 h-4" /></span>}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-8">
        New to RideX?{" "}
        <Link href="/rider/signup" className="text-emerald-400 font-medium hover:underline">Create account</Link>
      </p>
    </div>
  );
}
