"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Home, Shirt, Package, Users, Target, Mail } from "lucide-react";

const navItems = [
  { href: "/room", label: "部屋", icon: Home },
  { href: "/mailbox", label: "メール", icon: Mail, badge: true },
  { href: "/avatar", label: "着せ替え", icon: Shirt },
  { href: "/inventory", label: "持ち物", icon: Package },
  { href: "/friends", label: "フレンド", icon: Users },
  { href: "/missions", label: "ミッション", icon: Target },
];

export function BottomNav() {
  const pathname = usePathname();
  const [unclaimedMails, setUnclaimedMails] = useState(0);

  const fetchBadge = useCallback(async () => {
    const res = await fetch("/api/mailbox");
    if (res.ok) {
      const data = await res.json();
      setUnclaimedMails(data.unclaimedCount ?? 0);
    }
  }, []);

  useEffect(() => {
    fetchBadge();
  }, [fetchBadge, pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#ffd6e8] safe-area-bottom shadow-[0_-4px_20px_rgba(255,107,157,0.1)]">
      <div className="flex justify-around items-center h-16 max-w-3xl mx-auto px-1">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const showBadge = badge && unclaimedMails > 0;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 px-1.5 py-1 transition-colors ${
                active
                  ? "text-[#ff6b9d]"
                  : "text-[#9494b0] hover:text-[#ff6b9d]"
              }`}
            >
              <Icon size={18} />
              {showBadge && (
                <span className="absolute top-0 right-0 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#ff6b9d] text-[8px] font-bold text-white flex items-center justify-center">
                  {unclaimedMails > 9 ? "9+" : unclaimedMails}
                </span>
              )}
              <span className="text-[9px] leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
