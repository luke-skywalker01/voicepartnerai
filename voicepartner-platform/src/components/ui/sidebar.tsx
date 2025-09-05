'use client'

import { useState } from "react";
import { Link, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Bot, 
  GitBranch, 
  Phone, 
  PhoneCall, 
  Megaphone, 
  MessageSquare, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  CreditCard,
  Key,
  BarChart3,
  Webhook,
  Users,
  FileText,
  Zap,
  Database,
  Sliders
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Assistants", href: "/dashboard/assistants", icon: Bot },
  { name: "Workflows", href: "/dashboard/workflows", icon: GitBranch },
  { name: "Phone Numbers", href: "/dashboard/phone-numbers", icon: Phone },
  { name: "Calls", href: "/dashboard/calls", icon: PhoneCall },
  { name: "Outbound Campaigns", href: "/outbound", icon: Megaphone },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Files", href: "/dashboard/files", icon: FileText },
  { name: "Tools", href: "/dashboard/tools", icon: Zap },
  { name: "Squads", href: "/dashboard/squads", icon: Users },
  { name: "Webhooks", href: "/dashboard/webhooks", icon: Webhook },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
  { name: "Provider Keys", href: "/dashboard/provider-keys", icon: Sliders },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  user?: {
    email: string;
    name: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const handleLogout = () => {
    // Implement logout logic
    localStorage.removeItem("auth-token");
    window.location.href = "/login";
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">VoicePartnerAI</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="p-2"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("flex-shrink-0 w-5 h-5", collapsed ? "mr-0" : "mr-3")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        {!collapsed && user && (
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="ghost"
          className={cn(
            "w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className={cn("w-4 h-4", collapsed ? "mr-0" : "mr-2")} />
          {!collapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
}