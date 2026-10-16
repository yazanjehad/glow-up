"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";

interface CustomDialogProps {
  title?: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CustomDialog({
  title,
  children,
  open,
  onOpenChange,
}: CustomDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className={title ? "" : "sr-only"}>
            {title || "Dialog"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for controlling dialog state
export function useCustomDialog(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);

  const openDialog = () => setOpen(true);
  const closeDialog = () => setOpen(false);
  const toggleDialog = () => setOpen(!open);

  return {
    open,
    openDialog,
    closeDialog,
    toggleDialog,
    setOpen,
  };
}

export default CustomDialog;
