"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shirt, Package, Users, Target } from "lucide-react";

const navItems = [
  { href: "/room", label: "部屋", icon: Home },
  { href: "/avatar", label: "着せ替え", icon: Shirt },
  { href: "/inventory", label: "持ち物", icon: Package },
  { href: "/friends", label: "フレンド", icon: Users },
  { href: "/missions", label: "ミッション", icon: Target },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f1a]/95 backdrop-blur border-t border-[#e94560]/20 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                active ? "text-[#e94560]" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
