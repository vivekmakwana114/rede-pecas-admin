'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, type LucideIcon } from 'lucide-react';

export interface RowAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
}

const MENU_WIDTH = 176;

/**
 * Kebab-menu button that opens a portal-rendered dropdown of row actions,
 * positioned against the trigger button and dismissed on outside click,
 * escape, or scroll.
 */
export function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node) || buttonRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleScroll = () => setOpen(false);

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  /**
   * Opens or closes the actions menu, computing its screen position
   * relative to the trigger button when opening.
   */
  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.right - MENU_WIDTH });
    }
    setOpen((prev) => !prev);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label="Open actions menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
            className="fixed z-50 overflow-hidden rounded-lg border border-border bg-background py-1 shadow-lg"
          >
            {actions.map(({ label, icon: Icon, onClick, destructive }) => (
              <button
                key={label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onClick();
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors ${
                  destructive ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
