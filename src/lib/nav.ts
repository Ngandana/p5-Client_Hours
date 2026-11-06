import type { IconName } from "@/components/ui/icon";
import type { Role } from "./types";

export interface Tab {
  href: string;
  label: string;
  icon: IconName;
}

export const ROLES: Array<{ role: Role; label: string }> = [
  { role: "staff", label: "Staff" },
  { role: "manager", label: "Manager" },
  { role: "client", label: "Client" },
];

export const TABS: Record<Role, Tab[]> = {
  staff: [
    { href: "/staff/track", label: "Track time", icon: "clock" },
    { href: "/staff/entries", label: "My entries", icon: "list" },
    { href: "/staff/overview", label: "Overview", icon: "chart" },
  ],
  manager: [
    { href: "/manager/overview", label: "Overview", icon: "chart" },
    { href: "/manager/approvals", label: "Approvals", icon: "inbox" },
    { href: "/manager/entries", label: "All entries", icon: "list" },
    { href: "/manager/setup", label: "Team and settings", icon: "sliders" },
  ],
  client: [{ href: "/client/report", label: "Hours report", icon: "report" }],
};

export function roleFromPath(pathname: string): Role {
  const seg = pathname.split("/")[1];
  return seg === "manager" || seg === "client" ? seg : "staff";
}
