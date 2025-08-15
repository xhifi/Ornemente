"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCallback, useState, useEffect } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { PlusCircle, X, Edit } from "lucide-react";
import createProductColor from "@/data/dal/shop/products/actions/colors/create-product-color";
import { toast } from "sonner";

const ColorDialog = ({ color }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [hexColors, setHexColors] = useState([]);
  const [tempColor, setTempColor] = useState(""); // Track color during selection but before confirmation
  const [isEdit, setIsEdit] = useState(false);

  // Initialize form with color data when editing
  useEffect(() => {
    if (color) {
      setIsEdit(true);
      setName(color.name || "");
      setHexColors(Array.isArray(color.hex) ? color.hex : []);
    } else {
      setIsEdit(false);
      setName("");
      setHexColors([]);
    }
  }, [color, open]);

  // No longer need separate addColor function as colors are added immediately on selection

  // Remove a color from the array
  const removeColor = useCallback(
    (colorToRemove) => {
      setHexColors(hexColors.filter((color) => color !== colorToRemove));
    },
    [hexColors]
  );

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!name.trim()) {
      return toast.error("Color name is required");
    }

    if (hexColors.length === 0) {
      return toast.error("At least one color is required");
    }

    try {
      // Call the create/update color API
      const response = await createProductColor({
        id: isEdit ? color.id : undefined, // Pass ID only when editing
        name: name.trim(),
        hex: hexColors,
      });

      if (response.ok) {
        setName("");
        setHexColors([]);
        setOpen(false);

        // Show different success message based on operation
        const actionType = isEdit ? "updated" : "created";
        toast.success(`Color ${name} ${actionType} successfully`);
      } else {
        toast.error(response.error || "Operation failed");
      }
    } catch (err) {
      console.error(`Error ${isEdit ? "updating" : "creating"} color:`, err);
      toast.error(`Failed to ${isEdit ? "update" : "create"} color: ${err.message}`);
    }
  };

  return (
    <Dialog
      className="ms-auto"
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setTempColor("");
        }
      }}
      open={open}
    >
      <DialogTrigger
        asChild
        className={`${!isEdit ? "ms-auto" : ""} ${
          isEdit ? "text-blue-500 hover:text-blue-700" : "bg-primary text-primary-foreground hover:bg-primary/90"
        } ${isEdit ? "" : "px-3 py-1.5 rounded"} hover:cursor-pointer`}
      >
        {isEdit ? (
          <button onClick={() => setOpen(true)} title="Edit Color">
            <Edit size={16} />
          </button>
        ) : (
          <button onClick={() => setOpen(true)}>Create Color</button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Create"} Product Color</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the color details below. The slug will be automatically updated."
              : "The slug will be automatically generated based on the name you provide"}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 mt-3" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="color-name" className="block mb-2">
              Color Name
            </Label>
            <Input
              id="color-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a unique color name"
              className="mb-2"
            />
          </div>

          <div>
            <Label className="block mb-2">Color Values</Label>

            {/* Display color selection UI */}
            <div className="flex flex-wrap gap-3 mb-4">
              {/* Display already selected colors */}
              {hexColors.map((color, index) => (
                <div
                  key={index}
                  className="w-12 h-12 rounded-md flex items-center justify-center relative"
                  style={{ backgroundColor: color }}
                >
                  <button
                    type="button"
                    onClick={() => removeColor(color)}
                    className="absolute top-0 right-0 bg-white rounded-full p-0.5 shadow-sm hover:bg-gray-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Color picker (always present) */}
              <div className="relative">
                <label
                  className={`w-12 h-12 rounded-md flex items-center justify-center cursor-pointer overflow-hidden ${
                    !tempColor ? "border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100" : ""
                  }`}
                  style={tempColor ? { backgroundColor: tempColor } : {}}
                >
                  {!tempColor && <PlusCircle size={24} className="text-gray-400" />}

                  <Input
                    type="color"
                    value={tempColor || "#000000"}
                    // Track color selection without adding it
                    onChange={(e) => {
                      setTempColor(e.target.value);
                    }}
                    // Only add the color when the input loses focus (selection complete)
                    onBlur={(e) => {
                      if (tempColor) {
                        if (!hexColors.includes(tempColor)) {
                          setHexColors([...hexColors, tempColor]);
                          // Reset temp color after adding
                          setTempColor("");
                        } else {
                          setTempColor("");
                        }
                      }
                    }}
                    // Also handle color picker close via change event
                    onClick={(e) => {
                      // Prevent immediate triggering of the color selection
                      e.stopPropagation();
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            {isEdit ? "Update" : "Create"} Color
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

ColorDialog.displayName = "ColorDialog";

export default ColorDialog;
