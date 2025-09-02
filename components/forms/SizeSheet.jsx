"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Edit } from "lucide-react";
import createOrUpdateSize from "@/data/dal/shop/products/sizes/create-or-update-size";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";

export default function SizeSheet({ size = null, children, open, onOpenChange, onSuccess }) {
  // If open/onOpenChange are provided, use them. Otherwise use internal state
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isEditing = !!size;

  const sheetOpen = isControlled ? open : internalOpen;
  const setSheetOpen = isControlled ? onOpenChange : setInternalOpen;

  const [code, setCode] = React.useState(size?.code || "");
  const [label, setLabel] = React.useState(size?.label || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (sheetOpen) {
      setCode(size?.code || "");
      setLabel(size?.label || "");
    }
  }, [sheetOpen, size]);

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
        setSheetOpen(false);
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
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      {!isControlled && (
        <SheetTrigger asChild>
          {children ||
            (isEditing ? (
              <button className="hover:bg-primary/10 p-1 rounded">
                <Edit size={16} />
              </button>
            ) : (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Size
              </Button>
            ))}
        </SheetTrigger>
      )}
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{size ? "Edit Size" : "Create Size"}</SheetTitle>
          <SheetDescription>{size ? "Update this size's details" : "Create a new size for your products"}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Size Code</Label>
              <Input
                id="code"
                placeholder="Size code (e.g., XS, S, M, L)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                disabled={size !== null} // Disable code field for edits (primary key)
              />
              {size && <p className="text-xs text-muted-foreground">Code cannot be changed for existing sizes</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Size Label</Label>
              <Input
                id="label"
                placeholder="Size label (e.g., Extra Small, Small)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {size ? (isSubmitting ? "Saving..." : "Save changes") : isSubmitting ? "Creating..." : "Create size"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
