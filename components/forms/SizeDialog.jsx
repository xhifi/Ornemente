"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import createOrUpdateSize from "@/data/dal/shop/products/sizes/create-or-update-size";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";

export default function SizeDialog({ size = null, children, open, onOpenChange, onSuccess }) {
  // If open/onOpenChange are provided, use them. Otherwise use internal state
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;

  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange : setInternalOpen;

  const [code, setCode] = React.useState(size?.code || "");
  const [label, setLabel] = React.useState(size?.label || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (dialogOpen) {
      setCode(size?.code || "");
      setLabel(size?.label || "");
    }
  }, [dialogOpen, size]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Error", {
        description: "Size code is required",
      });
      return;
    }

    if (!label.trim()) {
      toast.error("Error", {
        description: "Size label is required",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("code", code);
      formData.append("label", label);
      if (size?.code) {
        formData.append("oldCode", size.code); // Used for updates to keep track of the original code
      }

      const response = await createOrUpdateSize(formData);

      if (response.ok) {
        revalidatePathSSR("/dashboard/products/sizes");
        setDialogOpen(false);
        toast.success(`Size ${size ? "updated" : "created"}`, {
          description: `Size "${code}" has been ${size ? "updated" : "created"} successfully.`,
        });
        if (onSuccess && typeof onSuccess === "function") {
          onSuccess();
        }
        return;
      } else {
        toast.error(`Error ${size ? "updating" : "creating"} size`, {
          description: response.error || "Something went wrong.",
        });
      }
    } catch (error) {
      toast.error(`Error ${size ? "updating" : "creating"} size`, {
        description: error.message || "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{size ? "Edit Size" : "Create Size"}</DialogTitle>
            <DialogDescription>{size ? "Update this size's details" : "Create a new size for your products"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input
                id="code"
                placeholder="Size code (e.g., XS, S, M, L)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="col-span-3"
                autoComplete="off"
                disabled={size !== null} // Disable code field for edits (primary key)
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">
                Label
              </Label>
              <Input
                id="label"
                placeholder="Size label (e.g., Extra Small, Small)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="col-span-3"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {size ? (isSubmitting ? "Saving..." : "Save changes") : isSubmitting ? "Creating..." : "Create size"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
