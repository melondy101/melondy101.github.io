"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/logout-button";

type User = { name: string; email: string } | null;

export default function AccountMenu({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  // Close the dropdown when route changes (e.g., clicking personal center or jumping back to home)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle click outside and Escape key to close the dropdown
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    setIsOpen(e.currentTarget.open);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <details
      id="account-menu-details"
      ref={menuRef}
      className="account-menu"
      open={isOpen}
      onToggle={handleToggle}
    >
      <summary id="account-menu-summary" aria-expanded={isOpen} aria-haspopup="menu">
        <span>{user ? user.name : "登录 / 注册"}</span>
        <svg
          className="summary-chevron"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <div id="account-menu-popover" className="account-popover" onClick={handleClose}>
        {user ? (
          <>
            <div className="popover-user-info">
              <span className="popover-user-name">{user.name}</span>
              <span className="popover-user-email">{user.email}</span>
            </div>
            <Link className="popover-link" href="/account">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              个人中心
            </Link>
            <Link className="popover-link" href="/account/settings">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              账号设置
            </Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <div className="popover-user-info">
              <span className="popover-user-name">欢迎来到 melondy101</span>
              <span className="popover-user-email">登录后可收藏文章、管理个人资料</span>
            </div>
            <Link className="popover-link" href="/sign-in">
              登录
            </Link>
            <Link className="menu-primary" href="/sign-up">
              注册账号
            </Link>
          </>
        )}
      </div>
    </details>
  );
}
