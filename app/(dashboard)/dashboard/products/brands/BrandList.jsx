"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import BrandDialog from "@/components/forms/BrandDialog";
import BrandActionButtons from "@/components/ui/factory/form/BrandActionButtons";

export default function BrandList({ initialBrands }) {
  const router = useRouter();
  const [brands, setBrands] = React.useState(initialBrands);
  const [editingBrand, setEditingBrand] = React.useState(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Update the local state when initialBrands prop changes
  React.useEffect(() => {
    setBrands(initialBrands);
  }, [initialBrands]);

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setDialogOpen(true);
  };

  // Function to handle successful updates/creations/deletions
  const handleBrandChange = () => {
    router.refresh(); // Refresh the page to get latest data from server
  };

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">Manage the brands available in your store</p>
        </div>
        <BrandDialog onSuccess={handleBrandChange}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        </BrandDialog>
      </div>

      <div className="rounded-md border">
        <div className="bg-muted/50 p-4 grid grid-cols-12 font-medium">
          <div className="col-span-1">#</div>
          <div className="col-span-2">Logo</div>
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Products</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {brands?.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No brands found. Create one to get started.</div>
        ) : (
          <>
            {brands.map((brand, index) => (
              <div key={brand.id} className="grid grid-cols-12 items-center p-4 hover:bg-muted/50">
                <div className="col-span-1">{index + 1}</div>
                <div className="col-span-2">
                  {brand.image_url ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                      <Image src={brand.image_url} alt={brand.name} fill className="object-contain" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 flex items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                      No logo
                    </div>
                  )}
                </div>
                <div className="col-span-3">{brand.name}</div>
                <div className="col-span-3">
                  {brand.product_count} product{brand.product_count !== 1 && "s"}
                </div>
                <div className="col-span-3">
                  <BrandActionButtons brand={brand} onEdit={() => handleEdit(brand)} onSuccess={handleBrandChange} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Dialog for editing a brand */}
      {dialogOpen && editingBrand && (
        <BrandDialog
          brand={editingBrand}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingBrand(null);
          }}
          onSuccess={handleBrandChange}
        >
          <span style={{ display: "none" }}></span>
        </BrandDialog>
      )}
    </div>
  );
}
