import z from "zod";

const updateProductSchema = z.object({
  // Basic product information
  name: z.string().min(1, "Product name is required").max(255, "Product name must be less than 255 characters"),
  description: z.string().optional(),
  tagline: z.string().optional(),
  sex: z.coerce.number().int().min(1, "Gender selection is required"),
  type: z.coerce.number().int().min(1, "Product type is required"),
  brand: z.coerce.number().int().min(1, "Brand is required"),
  original_price: z.coerce.number().positive("Price must be greater than zero"),
  discount: z.coerce.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%").default(0),
  note: z.string().optional(),

  // Product sizes with stock information
  sizes: z
    .array(
      z.object({
        code: z.string().min(1, "Size code is required"),
        stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
      })
    )
    .min(1, "At least one size must be selected"),
  // Product designs
  designs: z
    .array(
      z.object({
        id: z.number().min(1, "Design ID is required"),
        name: z.string().min(1, "Design name is required"),
      })
    )
    .optional(),

  // Product pieces/parts
  pieces: z
    .array(
      z.object({
        id: z.number().min(1, "Piece ID is required"),
        name: z.string().min(1, "Piece name is required"),
        description: z.string().optional(),
        fabric: z.number().min(1, "Fabric is required"),
        color: z.number().min(1, "Color is required"),
      })
    )
    .optional(),

  colors: z.number().min(1, "Color selection is required").optional(),
});

export default updateProductSchema;
