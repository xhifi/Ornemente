"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle, X, Edit } from "lucide-react";
import createProductColor from "@/data/dal/shop/products/actions/colors/create-product-color";
import { toast } from "sonner";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ColorSheet = ({ color }) => {
  const [open, setOpen] = useState(false);
  const [colorName, setColorName] = useState("");
  const [hexColors, setHexColors] = useState([]);
  const [tempColor, setTempColor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isEditing = !!color;

  // Initialize form with existing data if in edit mode
  useEffect(() => {
    if (open) {
      if (color) {
        setColorName(color.name || "");
        setHexColors(Array.isArray(color.hex) ? color.hex : []);
      } else {
        setColorName("");
        setHexColors([]);
      }
      setTempColor("");
    }
  }, [color, open]);

  // Remove a color from the array
  const removeColor = (colorToRemove) => {
    setHexColors(hexColors.filter((c) => c !== colorToRemove));
  };

  // Add a color to the array
  const addColor = (newColor) => {
    if (newColor && !hexColors.includes(newColor)) {
      setHexColors([...hexColors, newColor]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate input
    if (!colorName.trim()) {
      toast.error("Color name is required");
      setIsSubmitting(false);
      return;
    }

    if (hexColors.length === 0) {
      toast.error("At least one color is required");
      setIsSubmitting(false);
      return;
    }

    try {
      let response;

      // The createProductColor function handles both create and update
      response = await createProductColor({
        id: isEditing ? color.id : undefined,
        name: colorName.trim(),
        hex: hexColors,
      });

      if (response.ok) {
        revalidatePathSSR("/dashboard/products/colors");
        revalidatePathSSR("/dashboard/products");

        toast.success(isEditing ? `Color "${colorName}" updated successfully` : `Color "${colorName}" created successfully`);
        setOpen(false);
        if (!isEditing) {
          setColorName("");
          setHexColors([]);
        }
        router.refresh();
      } else {
        toast.error(`Failed to ${isEditing ? "update" : "create"} color: ${response.error}`);
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen) => {
    if (!isSubmitting) {
      setOpen(newOpen);
    }
  };

  const handleColorSelection = (selectedColor) => {
    if (selectedColor && selectedColor !== tempColor) {
      setTempColor(selectedColor);
    }
  };

  const confirmColorSelection = () => {
    if (tempColor) {
      addColor(tempColor);
      setTempColor("");
    }
  };

  return (
    <Sheet onOpenChange={handleOpenChange} open={open}>
      <SheetTrigger
        asChild
        className={isEditing ? "" : "ms-auto bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer px-3 py-1.5"}
      >
        {isEditing ? (
          <button className="hover:bg-primary/10 p-1 rounded">
            <Edit size={16} />
          </button>
        ) : (
          <button onClick={() => setOpen(true)}>Create Color</button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-md px-6">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit" : "Create"} Color</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the color details below. The slug will be automatically updated."
              : "Create a new color for products. You can add multiple color variations."}
          </SheetDescription>
        </SheetHeader>

        <form className="space-y-6 mt-6" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="color-name" className="block mb-2">
              Color Name
            </Label>
            <Input
              id="color-name"
              name="color-name"
              value={colorName}
              onChange={(e) => setColorName(e.target.value)}
              placeholder="Enter a unique color name"
              disabled={isSubmitting}
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">Enter a color name like 'Red', 'Ocean Blue', 'Forest Green', etc.</p>
          </div>

          <div>
            <Label className="block mb-2">Color Values</Label>
            <p className="text-xs text-muted-foreground mb-3">Click the + button to add color variations</p>

            {/* Display color selection UI */}
            <div className="flex flex-wrap gap-3 mb-4">
              {/* Display already selected colors */}
              {hexColors.map((colorHex, index) => (
                <div
                  key={index}
                  className="w-12 h-12 rounded-md flex items-center justify-center relative border-2 border-gray-200"
                  style={{ backgroundColor: colorHex }}
                  title={colorHex}
                >
                  <button
                    type="button"
                    onClick={() => removeColor(colorHex)}
                    className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm hover:bg-gray-100 border"
                    disabled={isSubmitting}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Color picker for adding new colors */}
              <div className="relative">
                <label
                  className={`w-12 h-12 rounded-md flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 ${
                    tempColor ? "border-primary" : ""
                  }`}
                  style={tempColor ? { backgroundColor: tempColor, borderStyle: "solid" } : {}}
                >
                  {!tempColor && <PlusCircle size={24} className="text-gray-400" />}

                  <Input
                    type="color"
                    value={tempColor || "#000000"}
                    onChange={(e) => handleColorSelection(e.target.value)}
                    disabled={isSubmitting}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
                {tempColor && (
                  <Button type="button" size="sm" onClick={confirmColorSelection} className="mt-1 text-xs" disabled={isSubmitting}>
                    Add
                  </Button>
                )}
              </div>
            </div>

            {hexColors.length > 0 && <div className="text-sm text-muted-foreground">Selected colors: {hexColors.join(", ")}</div>}
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update" : "Create") + " Color"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

ColorSheet.displayName = "ColorSheet";
export default ColorSheet;
