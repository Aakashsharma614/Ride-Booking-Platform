"use client";
import { Settings, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Settings" subtitle="Platform configuration" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4 text-emerald-400" /> General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Platform Name", value: "RideX" },
              { label: "Support Email", value: "support@ridex.com" },
              { label: "Default City", value: "nyc" },
              { label: "Max Surge Multiplier", value: "3.0" },
            ].map((f) => (
              <div key={f.label}>
                <Label className="mb-1.5 block">{f.label}</Label>
                <Input defaultValue={f.value} />
              </div>
            ))}
            <Button className="w-full mt-2"><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Feature Flags</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Surge Pricing", desc: "Enable dynamic fare multipliers", enabled: true },
              { label: "Live Driver Tracking", desc: "Real-time GPS in rider app", enabled: true },
              { label: "Payment Webhooks", desc: "Outgoing payment event webhooks", enabled: false },
              { label: "Analytics Export", desc: "CSV export for analytics data", enabled: true },
              { label: "Maintenance Mode", desc: "Block new ride requests", enabled: false },
            ].map((f) => (
              <div key={f.label}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{f.label}</p>
                    <p className="text-xs text-gray-500">{f.desc}</p>
                  </div>
                  <Switch defaultChecked={f.enabled} />
                </div>
                <Separator className="mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
