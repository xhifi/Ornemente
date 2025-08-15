"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DesignDialog from "@/components/forms/DesignDialog";
import DesignActionButtons from "@/components/ui/factory/form/DesignActionButtons";

export default function DesignList({ initialDesigns }) {
  const router = useRouter();
  const [designs, setDesigns] = React.useState(initialDesigns);
  const [editingDesign, setEditingDesign] = React.useState(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Update the local state when initialDesigns prop changes
  React.useEffect(() => {
    setDesigns(initialDesigns);
  }, [initialDesigns]);

  const handleEdit = (design) => {
    setEditingDesign(design);
    setDialogOpen(true);
  };

  // Function to handle successful updates/creations/deletions
  const handleDesignChange = () => {
    router.refresh(); // Refresh the page to get latest data from server
  };

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Designs</h1>
          <p className="text-muted-foreground">Manage the designs available in your store</p>
        </div>
        <DesignDialog onSuccess={handleDesignChange}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Design
          </Button>
        </DesignDialog>
      </div>

      <div className="rounded-md border">
        <div className="bg-muted/50 p-4 grid grid-cols-12 font-medium">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Name</div>
          <div className="col-span-3">Products</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {designs?.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No designs found. Create one to get started.</div>
        ) : (
          <>
            {designs.map((design, index) => (
              <div key={design.id} className="grid grid-cols-12 items-center p-4 hover:bg-muted/50">
                <div className="col-span-1">{index + 1}</div>
                <div className="col-span-5">{design.name}</div>
                <div className="col-span-3">
                  {design.product_count} product{design.product_count !== 1 && "s"}
                </div>
                <div className="col-span-3">
                  <DesignActionButtons design={design} onEdit={() => handleEdit(design)} onSuccess={handleDesignChange} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Dialog for editing a design */}
      {dialogOpen && editingDesign && (
        <DesignDialog
          design={editingDesign}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingDesign(null);
          }}
          onSuccess={handleDesignChange}
        >
          <span style={{ display: "none" }}></span>
        </DesignDialog>
      )}
    </div>
  );
}
