"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isNavActive } from "@/lib/navigation";
import type { NavLinkItem } from "@/components/AppNav";

type NavMoreMenuProps = {
  items: NavLinkItem[];
  moreLabel: string;
};

export function NavMoreMenu({ items, moreLabel }: NavMoreMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`rounded-lg px-2.5 py-2 text-sm transition ${
          open ? "bg-emerald-500/25 text-emerald-100" : "text-white/90 hover:bg-white/10"
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        ☰ {moreLabel}
      </button>
      {open && (
        <div className="absolute end-0 top-full z-50 mt-1 min-w-[11rem] rounded-xl border border-white/10 bg-[#0b1f3a] py-2 shadow-xl">
          {items.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`block px-4 py-2.5 text-sm transition ${
                  active ? "bg-emerald-500/20 text-emerald-200" : "text-white/90 hover:bg-white/10"
                }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
