"use client";

import React from "react";
import Spotlight from "@/icons/Spotlight";
import { usePathname } from "next/navigation";
import { sidebarData } from "@/lib/data";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import ThemeToggle from "./ThemeToggle";
import { ChevronsUpDown, Sparkles, HardDrive } from "lucide-react";

const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useUser();

  const userEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.fullName ||
    "Voxinar Workspace";

  return (
    <aside className="w-18 md:w-60 lg:w-64 h-screen sticky top-0 py-6 px-3 border-r bg-card/90 border-border/50 flex flex-col justify-between shrink-0 select-none transition-all">
      {/* Top Section: Brand & Workspace Selector */}
      <div className="space-y-6">
        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
            <Spotlight />
          </div>
          <div className="hidden md:flex flex-col min-w-0">
            <span className="font-bold text-sm text-foreground tracking-tight truncate">
              Voxinar
            </span>
            <span className="text-[11px] text-muted-foreground font-medium truncate">
              AI Webinar Platform
            </span>
          </div>
        </Link>

        {/* Workspace Pill / User Profile Selector (Pivora Style) */}
        <div className="hidden md:flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-secondary/50 text-xs text-foreground cursor-pointer hover:bg-secondary transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-accent-primary/20 text-accent-primary font-bold text-[10px] flex items-center justify-center shrink-0">
              {userEmail.slice(0, 1).toUpperCase()}
            </div>
            <span className="font-medium text-foreground truncate">
              {userEmail}
            </span>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </div>

        {/* Navigation Items (Pivora Style) */}
        <nav className="space-y-1.5 pt-2">
          <div className="px-2 pb-1 hidden md:block">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Main Menu
            </span>
          </div>
          {sidebarData.map((item) => {
            const isActive =
              pathname === item.link ||
              (item.link !== "/home" && pathname.startsWith(item.link));

            return (
              <TooltipProvider key={item.id}>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.link}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                        isActive
                          ? "bg-accent-primary/10 text-accent-primary border-l-2 border-accent-primary font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      }`}
                    >
                      <item.icon
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                          isActive
                            ? "text-accent-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      />
                      <span className="hidden md:inline truncate">
                        {item.title}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="md:hidden text-xs">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Status Card + Controls */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        {/* Quick Platform Status Box (Pivora Style) */}
        <div className="hidden md:block p-3 rounded-xl border border-border/40 bg-secondary/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent-primary" /> Active
              Plan
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
              PRO
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">
            AI Voice & Webinar automation active
          </p>
        </div>

        {/* User Button & Theme Controls */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <UserButton />
            <div className="hidden md:flex flex-col min-w-0">
              <span className="text-xs font-medium text-foreground truncate">
                {user?.firstName || "Account"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                Online
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
