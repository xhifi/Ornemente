"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import createOrUpdateDesign from "@/data/dal/shop/products/designs/create-or-update-design";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";

export default function DesignDialog({ design = null, children, open, onOpenChange, onSuccess }) {
  // If open/onOpenChange are provided, use them. Otherwise use internal state
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;

  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange : setInternalOpen;

  const [name, setName] = React.useState(design?.name || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (dialogOpen) {
      setName(design?.name || "");
    }
  }, [dialogOpen, design]);

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
        setDialogOpen(false);
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
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{design ? "Edit Design" : "Create Design"}</DialogTitle>
            <DialogDescription>{design ? "Update this design's details" : "Create a new design for your products"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                placeholder="Design name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {design ? (isSubmitting ? "Saving..." : "Save changes") : isSubmitting ? "Creating..." : "Create design"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
