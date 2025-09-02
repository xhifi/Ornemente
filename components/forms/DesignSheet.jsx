"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Edit } from "lucide-react";
import createOrUpdateDesign from "@/data/dal/shop/products/designs/create-or-update-design";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";

export default function DesignSheet({ design = null, children, open, onOpenChange, onSuccess }) {
  // If open/onOpenChange are provided, use them. Otherwise use internal state
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isEditing = !!design;

  const sheetOpen = isControlled ? open : internalOpen;
  const setSheetOpen = isControlled ? onOpenChange : setInternalOpen;

  const [name, setName] = React.useState(design?.name || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (sheetOpen) {
      setName(design?.name || "");
    }
  }, [sheetOpen, design]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Error", {
        description: "Design name is required",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("name", name);
      if (design?.id) {
        formData.append("id", design.id);
      }

      const response = await createOrUpdateDesign(formData);

      if (response.ok) {
        revalidatePathSSR("/dashboard/products/designs");

        toast.success(`Design ${design ? "updated" : "created"}`, {
          description: `Design "${name}" has been ${design ? "updated" : "created"} successfully.`,
        });
        setSheetOpen(false);
        router.refresh();
        if (onSuccess && typeof onSuccess === "function") {
          onSuccess();
        }
        return;
      } else {
        toast.error(`Error ${design ? "updating" : "creating"} design`, {
          description: response.error || "Something went wrong.",
        });
      }
    } catch (error) {
      toast.error(`Error ${design ? "updating" : "creating"} design`, {
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
                Create Design
              </Button>
            ))}
        </SheetTrigger>
      )}
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{design ? "Edit Design" : "Create Design"}</SheetTitle>
          <SheetDescription>{design ? "Update this design's details" : "Create a new design for your products"}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Design Name</Label>
              <Input id="name" placeholder="Design name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            </div>
          </div>
          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {design ? (isSubmitting ? "Saving..." : "Save changes") : isSubmitting ? "Creating..." : "Create design"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
