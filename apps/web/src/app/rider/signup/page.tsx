"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export default function RiderSignup() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setUser({ id: "new-user", email: form.email, name: form.name, role: "RIDER", accessToken: "demo-token" });
    toast.success("Account created! Welcome to RideX.");
    router.push("/rider/home");
    setLoading(false);
  }

  const fields = [
    { key: "name" as const, label: "Full Name", type: "text", placeholder: "Alex Johnson", icon: User },
    { key: "email" as const, label: "Email address", type: "email", placeholder: "you@email.com", icon: Mail },
    { key: "phone" as const, label: "Phone number", type: "tel", placeholder: "+1 555 000 0000", icon: Phone },
    { key: "password" as const, label: "Password", type: "password", placeholder: "Min 8 characters", icon: Lock },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-black animate-fade-in">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-white mb-2">Create Account</h1>
        <p className="text-gray-400 text-sm">Join millions of riders on RideX</p>
      </div>
      <form onSubmit={handleSignup} className="space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <Label className="mb-2 block">{f.label}</Label>
            <div className="relative">
              <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input type={f.type} className="pl-10" placeholder={f.placeholder} value={form[f.key]} onChange={set(f.key)} required />
            </div>
          </div>
        ))}
        <p className="text-xs text-gray-500">By signing up you agree to our Terms of Service and Privacy Policy.</p>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Creating account…" : <span className="flex items-center gap-2">Create Account <ArrowRight className="w-4 h-4" /></span>}
        </Button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-8">
        Already have an account?{" "}
        <Link href="/rider/login" className="text-emerald-400 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
