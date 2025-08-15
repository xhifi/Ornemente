"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SizeDialog from "@/components/forms/SizeDialog";
import SizeActionButtons from "@/components/ui/factory/form/SizeActionButtons";

export default function SizeList({ initialSizes }) {
  const router = useRouter();
  const [sizes, setSizes] = React.useState(initialSizes);
  const [editingSize, setEditingSize] = React.useState(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Update the local state when initialSizes prop changes
  React.useEffect(() => {
    setSizes(initialSizes);
  }, [initialSizes]);

  const handleEdit = (size) => {
    setEditingSize(size);
    setDialogOpen(true);
  };

  // Function to handle successful updates/creations/deletions
  const handleSizeChange = () => {
    router.refresh(); // Refresh the page to get latest data from server
  };

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sizes</h1>
          <p className="text-muted-foreground">Manage the sizes available in your store</p>
        </div>
        <SizeDialog onSuccess={handleSizeChange}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Size
          </Button>
        </SizeDialog>
      </div>

      <div className="rounded-md border">
        <div className="bg-muted/50 p-4 grid grid-cols-12 font-medium">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Code</div>
          <div className="col-span-5">Label</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {sizes?.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No sizes found. Create one to get started.</div>
        ) : (
          <>
            {sizes.map((size, index) => (
              <div key={size.code} className="grid grid-cols-12 items-center p-4 hover:bg-muted/50">
                <div className="col-span-1">{index + 1}</div>
                <div className="col-span-3">{size.code}</div>
                <div className="col-span-5">{size.label || "—"}</div>
                <div className="col-span-3">
                  <SizeActionButtons size={size} onEdit={() => handleEdit(size)} onSuccess={handleSizeChange} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Dialog for editing a size */}
      {dialogOpen && editingSize && (
        <SizeDialog
          size={editingSize}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingSize(null);
          }}
          onSuccess={handleSizeChange}
        >
          <span style={{ display: "none" }}></span>
        </SizeDialog>
      )}
    </div>
  );
}
