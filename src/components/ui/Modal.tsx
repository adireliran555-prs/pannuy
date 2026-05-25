"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = "md",
}: ModalProps) {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    full: "max-w-full h-full",
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed z-50 bg-white shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            // Mobile: full screen bottom sheet
            "bottom-0 left-0 right-0 rounded-t-3xl sm:rounded-2xl",
            // Desktop: centered
            "sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
            sizes[size],
            "sm:w-full",
            className
          )}
        >
          {/* Drag handle on mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-gray-300" />
          </div>

          {(title || description) && (
            <div className="px-6 pt-4 pb-2 border-b border-border">
              {title && (
                <Dialog.Title className="text-lg font-bold text-text-main">
                  {title}
                </Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="text-sm text-text-muted mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>
          )}

          <Dialog.Close
            className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors text-text-muted"
            aria-label="סגור"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>

          <div className="px-6 py-4 overflow-y-auto max-h-[80vh] sm:max-h-[70vh]">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
