"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Car, Lock, ArrowRight, Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Step = 0 | 1 | 2;

const VEHICLE_CLASSES = [
  { id: "economy", label: "Economy", icon: "🚗", req: "2015 or newer" },
  { id: "comfort", label: "Comfort", icon: "🚙", req: "2018 or newer" },
  { id: "premium", label: "Premium", icon: "🚘", req: "2020 or newer, luxury brands" },
  { id: "xl",      label: "XL",      icon: "🚐", req: "6+ seater" },
];

const stepLabels = ["Personal Info", "Vehicle Details", "Vehicle Class"];

export default function DriverRegister() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState<Step>(0);
  const [vehicleClass, setVehicleClass] = useState("economy");
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", cityId: "nyc",
    make: "", model: "", year: "", plate: "",
  });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  const registerMutation = useMutation({
    mutationFn: () => api.driverRegister({
      email: form.email,
      password: form.password,
      name: form.name,
      phone: form.phone,
      cityId: form.cityId,
      vehicle: { plate: form.plate, make: form.make, model: form.model, class: vehicleClass },
    }),
    onSuccess: async () => {
      toast.success("Application submitted! Logging you in…");
      try {
        const { accessToken } = await api.driverLogin(form.email, form.password);
        const driver = await api.getDriver(accessToken);
        setUser({ id: driver._id, email: driver.email, name: driver.name, role: "DRIVER", accessToken });
        router.push("/driver/dashboard");
      } catch {
        toast.info("Account created. Please log in.");
        router.push("/driver/login");
      }
    },
    onError: (err: unknown) => toast.error((err as Error).message ?? "Registration failed"),
  });

  return (
    <div className="min-h-screen flex flex-col px-6 py-10 bg-black animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Become a Driver</h1>
        <p className="text-gray-400 text-sm">Complete your application in 3 steps</p>
      </div>

      <div className="flex items-center gap-1 mb-8">
        {stepLabels.map((l, i) => (
          <div key={l} className="flex items-center flex-1">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors",
              i < step ? "bg-blue-500 text-white" : i === step ? "bg-blue-500/20 border-2 border-blue-500 text-blue-400" : "bg-gray-800 text-gray-600")}>
              {i < step ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            {i < stepLabels.length - 1 && <div className={cn("flex-1 h-0.5 mx-1 transition-colors", i < step ? "bg-blue-500" : "bg-gray-800")} />}
          </div>
        ))}
      </div>

      <div className="flex-1">
        {step === 0 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="font-bold text-white">Personal Information</h2>
            {[
              { k: "name" as const,     label: "Full Legal Name",   type: "text",     placeholder: "Your Name",       icon: User },
              { k: "email" as const,    label: "Email Address",     type: "email",    placeholder: "you@email.com",   icon: Mail },
              { k: "password" as const, label: "Password",          type: "password", placeholder: "••••••••",        icon: Lock },
              { k: "phone" as const,    label: "Phone Number",      type: "tel",      placeholder: "+1 555 000 0000", icon: Phone },
              { k: "cityId" as const,   label: "City ID",           type: "text",     placeholder: "nyc",             icon: User },
            ].map((f) => (
              <div key={f.k}>
                <Label className="mb-2 block">{f.label}</Label>
                <div className="relative">
                  <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input type={f.type} className="pl-10" placeholder={f.placeholder} value={form[f.k]} onChange={set(f.k)} required />
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="font-bold text-white">Vehicle Details</h2>
            {[
              { k: "make" as const,  label: "Make",          placeholder: "Toyota" },
              { k: "model" as const, label: "Model",         placeholder: "Camry" },
              { k: "year" as const,  label: "Year",          placeholder: "2022" },
              { k: "plate" as const, label: "License Plate", placeholder: "ABC 1234" },
            ].map((f) => (
              <div key={f.k}>
                <Label className="mb-2 block">{f.label}</Label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input className="pl-10" placeholder={f.placeholder} value={form[f.k]} onChange={set(f.k)} required />
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 animate-slide-up">
            <h2 className="font-bold text-white">Select Vehicle Class</h2>
            {VEHICLE_CLASSES.map((c) => (
              <button key={c.id}
                className={cn("w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                  vehicleClass === c.id ? "border-blue-500 bg-blue-500/5" : "border-gray-800 bg-gray-900/50 hover:border-gray-700")}
                onClick={() => setVehicleClass(c.id)}>
                <span className="text-2xl">{c.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">{c.label}</p>
                  <p className="text-xs text-gray-500">{c.req}</p>
                </div>
                {vehicleClass === c.id && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-8">
        {step > 0 && (
          <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep((s) => (s - 1) as Step)}>Back</Button>
        )}
        {step < 2 ? (
          <Button size="lg" className="flex-1 bg-blue-500 hover:bg-blue-600" onClick={() => setStep((s) => (s + 1) as Step)}>Continue</Button>
        ) : (
          <Button size="lg" className="flex-1 bg-blue-500 hover:bg-blue-600" disabled={registerMutation.isPending} onClick={() => registerMutation.mutate()}>
            {registerMutation.isPending
              ? "Submitting…"
              : <span className="flex items-center gap-2">Submit Application <ArrowRight className="w-4 h-4" /></span>}
          </Button>
        )}
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already a driver? <Link href="/driver/login" className="text-blue-400 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
