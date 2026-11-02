"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Bugün", icon: "📊" },
  { href: "/ekle", label: "Ekle", icon: "➕" },
  { href: "/rapor", label: "Rapor", icon: "📝" },
  { href: "/profil", label: "Profil", icon: "👤" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                className={`flex flex-col items-center py-2 text-xs ${active ? "font-semibold text-emerald-700" : "text-stone-500"}`}
              >
                <span className="text-xl leading-6">{it.icon}</span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
