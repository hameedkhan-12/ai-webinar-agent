"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { VoiceCreateForm } from "./voice-create-form";

interface VoiceCreateDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: (voice: { id: string; name: string }) => void;
  /** Called instead of the default toast when creation fails because the
   * custom-voice add-on isn't active yet, so the caller can surface its
   * own upgrade modal. */
  onSubscriptionRequired?: () => void;
}

export function VoiceCreateDialog({
  children,
  open,
  onOpenChange,
  onCreated,
  onSubscriptionRequired,
}: VoiceCreateDialogProps) {
  const isMobile = useIsMobile();

  const handleError = useCallback(
    (message: string) => {
      if (message === "SUBSCRIPTION_REQUIRED") {
        onOpenChange?.(false);
        onSubscriptionRequired?.();
      } else {
        toast.error(message);
      }
    },
    [onOpenChange, onSubscriptionRequired]
  );

  const handleCreated = useCallback(
    (voice: { id: string; name: string }) => {
      onCreated?.(voice);
      onOpenChange?.(false);
    },
    [onCreated, onOpenChange]
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create custom voice</DrawerTitle>
            <DrawerDescription>
              Upload or record an audio sample to add a new voice to your
              library.
            </DrawerDescription>
          </DrawerHeader>
          <VoiceCreateForm
            scrollable
            onError={handleError}
            onCreated={handleCreated}
            footer={(submit) => (
              <DrawerFooter>
                {submit}
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            )}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle>Create custom voice</DialogTitle>
          <DialogDescription>
            Upload or record an audio sample to add a new voice to your
            library.
          </DialogDescription>
        </DialogHeader>
        <VoiceCreateForm onError={handleError} onCreated={handleCreated} />
      </DialogContent>
    </Dialog>
  );
}