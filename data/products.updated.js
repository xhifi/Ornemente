import Nishat1 from "@/data/placeholder/nishat-1.jpg";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789", 8);

const sexIds = {
  men: "010",
  women: "101",
  unisex: "111",
  kids: "001",
};

const categoryIds = {
  none: "00",
  stitched: "02",
  "un-stitched": "04",
  dress: "05",
  pret: "06",
};

const sizesIds = {
  std: "00",
  xs: "01",
  s: "02",
  m: "03",
  l: "04",
  xl: "05",
  "2xl": "06",
  "xs/s": "21",
  "m/l": "22",
  "xl/2xl": "23",
};

const designsIds = {
  "Digital Printed": "01",
  Embroidered: "02",
  Dyed: "03",
  Printed: "04",
  "Chicken Kari": "05",
  Lace: "06",
  "Cut Work": "07",
  "Ralli Motifs": "08",
  "Indian Motifs": "09",
  Floral: "10",
  Abstract: "11",
  Solid: "12",
  Geometric: "13",
  Traditional: "14",
  Modern: "15",
  Flared: "16",
  Straight: "17",
  Kaftan: "18",
  "A-Line": "19",
  Peplum: "20",
  Anarkali: "21",
};

const generateSKU = (product) => {
  const sexId = sexIds[product.sex] || sexIds["unisex"];
  const categoryId = categoryIds[product.type] || categoryIds["none"];
  const size = sizesIds[product.size] || sizesIds["std"];
  const design = product.design.map((d) => designsIds[d]).join("") || "00";
  return `${sexId}${categoryId}${design}${size}-${product.id}`;
};

const articles = [
  {
    id: nanoid(),
    name: "Dyed Embroidered Suit",
    sex: "women",
    description:
      "Be radiant and remarkable in this dyed embroidered two-piece suit from our latest Summer Collection, designed to combine rich color, intricate embroidery, and breathable comfort for effortless seasonal elegance.",
    pieces: [
      {
        name: "Shirt",
        description:
          "Embroidered Solid Grid Lawn Shirt Front Center Panel: 1 Piece\nSolid Grid Lawn Shirt Front Side Panel: 1 Piece\nSolid Grid Lawn Back & Sleeves: 1 Piece\nEmbroidered Border: 1 Piece",
        fabric: "Grid Lawn",
        color: "Rusty Orange",
      },
      { name: "Trouser", description: "Solid Cambric Trouser 2.5 Meter", fabric: "Cambric", color: "Rusty Orange" },
    ],
    sizes: [{ name: "std", remainingStock: 4 }],
    tagline: "Lazer Cut Style Shirt with Trousers",
    type: "un-stitched",
    collection: "",
    design: ["Dyed", "Embroidered"],
    brand: "Nishat",
    originalPrice: 6490,
    discount: 0,
    coverImage: Nishat1,
    note: "Sizes may vary, please refer to the size chart before ordering.",
  },
  {
    id: nanoid(),
    name: "Printed Embroidered Suit",
    sex: "women",
    description:
      "A digital dream brought to life this printed embroidered two-piece from our latest Summer Collection blends vibrant prints and delicate embroidery for a look that’s bold, elegant, and effortlessly stylish.",
    pieces: [
      {
        name: "Shirt",
        description: "Embroidered Neckline: 1 PiecePrinted Cambric Shirt: 3 MeterEmbroidered Border: 1 Piece",
        fabric: "Cambric",
        color: "Purple",
      },
      { name: "Trouser", description: "Solid Cambric Trouser: 2.5 Meter", fabric: "Cambric", color: "Purple" },
    ],
    sizes: [{ name: "std", remainingStock: 4 }],
    tagline: "Abstract Floral Style Shirt with Trouser",
    type: "un-stitched",
    collection: "",
    design: ["Printed", "Embroidered"],
    brand: "Nishat",
    originalPrice: 6490,
    discount: 0,
    coverImage: Nishat1,
    note: "Sizes may vary, please refer to the size chart before ordering.",
  },
  {
    id: nanoid(),
    name: "Digital Printed Suit",
    sex: "women",
    description:
      "Wear your strength in every fold with this digitally printed two-piece from our latest Summer Collection, designed to empower your look with bold design, graceful flow, and effortless seasonal style.",
    pieces: [
      {
        name: "Shirt",
        description: "Printed Super Fine Lawn Shirt: 3 Meter",
        fabric: "Lawn",
        color: "Indigo",
      },
      { name: "Dupatta", description: "Digital Printed Crinkle Chiffon Dupatta: 2.5 Meter", fabric: "Crinkle Chiffon", color: "Indigo" },
    ],
    sizes: [{ name: "std", remainingStock: 4 }],
    tagline: "Traditional Lace Pattern Style Shirt with Dupatta",
    type: "un-stitched",
    collection: "",
    design: ["Digital Printed"],
    brand: "Nishat",
    originalPrice: 6490,
    discount: 0,
    // coverImage: Nishat2,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
  {
    id: nanoid(8),
    name: "Dyed Embroidered Suit",
    sex: "women",
    description:
      "The art of digital prints and the heart of tradition come together in this dyed embroidered two-piece from our latest Summer Collection, blending heritage craftsmanship with modern elegance.",
    pieces: [
      {
        name: "Shirt",
        description:
          "Embroidered Solid Cambric Shirt Front Center Panel: 1 Piece\nEmbroidered Solid Cambric Shirt Front Side Panel: 2 Piece\nSolid Cambric Back & Sleeves: 1 Piece\nEmbroidered Border: 1 Piece",
        fabric: "Cambric",
        color: "Purple",
      },
      { name: "Trouser", description: "Solid Cambric Trouser: 2.5 Meter", fabric: "Cambric", color: "Purple" },
    ],
    sizes: [{ name: "std", remainingStock: 4 }],

    tagline: "Cut Work Style Shirt with Trouser",
    type: "un-stitched",
    collection: "",
    design: ["Dyed", "Embroidered"],
    brand: "Nishat",
    originalPrice: 6490,
    discount: 0,
    // coverImage: Nishat3,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
  {
    id: nanoid(),
    name: "Dyed Embroidered Suit",
    sex: "women",
    description:
      "The art of digital prints meets the heart of tradition in this dyed embroidered two-piece from our latest Summer Collection, where timeless elegance blends with modern design for a truly captivating look.",
    pieces: [
      {
        name: "Shirt",
        description:
          "Embroidered Solid Cambric Shirt Front Center Panel: 1 Piece\nEmbroidered Solid Cambric Shirt Front Side Panel: 2 Piece\nSolid Cambric Back & Sleeves: 1 Piece\nEmbroidered Border: 1 Piece",
        fabric: "Cambric",
        color: "Gold",
      },
      { name: "Trouser", description: "Solid Cambric Trouser: 2.5 Meter", fabric: "Cambric", color: "Gold" },
    ],
    sizes: [{ name: "std", remainingStock: 4 }],
    tagline: "Modern Floral Style Shirt with Trouser",
    type: "un-stitched",
    collection: "",
    design: ["Dyed", "Embroidered"],
    brand: "Nishat",
    originalPrice: 6490,
    discount: 0,
    // coverImage: Nishat4,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
  {
    id: nanoid(),
    name: "Dyed Embroidered Suit",
    sex: "women",
    description:
      "Let color and confidence lead the way with this dyed embroidered two-piece suit from our latest Summer Collection, designed to blend bold hues, intricate detailing, and breathable comfort for effortless seasonal elegance.",
    pieces: [
      {
        name: "Shirt",
        description:
          "Embroidered Solid Grid Lawn Shirt Front: 1 Piece\nSolid Grid Lawn Back & Sleeves: 1 Piece\nEmbroidered Border: 1 Piece",
        fabric: "Grid Lawn",
        color: "Burgundy",
      },
      { name: "Trouser", description: "Solid Cambric Trouser: 2.5 Meter", fabric: "Cambric", color: "Burgundy" },
    ],
    sizes: [{ name: "std", remainingStock: 4 }],
    tagline: "Ralli Motifs Style Shirt with Trousers",
    type: "un-stitched",
    collection: "",
    design: ["Dyed", "Embroidered"],
    brand: "Nishat",
    originalPrice: 6490,
    discount: 0,
    // coverImage: Nishat5,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
  {
    id: nanoid(),
    name: "Dyed Embroidered Suit",
    sex: "women",
    description:
      "The art of digital prints meets the heart of tradition in this dyed embroidered two-piece from our latest Summer Collection, a seamless fusion of modern aesthetics and timeless craftsmanship.",
    pieces: [
      {
        name: "Shirt",
        description:
          "Embroidered Solid Cambric Shirt Front Center Panel: 1 Piece\nEmbroidered Solid Cambric Shirt Front Side Panel: 2 Piece\nSolid Cambric Back & Sleeves: 1 Piece\nEmbroidered Border: 1 Piece",
        fabric: "Cambric",
        color: "Greenish Grey",
      },
      { name: "Trouser", description: "Solid Cambric Trouser: 2.5 Meter", fabric: "Cambric", color: "Greenish Grey" },
    ],
    sizes: [{ name: "std", remainingStock: 4 }],
    tagline: "Indian Motifs Style Shirt with Trouser",
    type: "un-stitched",
    collection: "",
    design: ["Dyed", "Embroidered"],
    brand: "Nishat",
    originalPrice: 6490,
    discount: 0,
    // coverImage: Nishat6,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
  {
    id: nanoid(),
    name: "Dyed Embroidered Suit",
    sex: "women",
    description:
      "The art of digital prints meets the heart of tradition in this dyed embroidered two-piece from our latest Summer Collection, a seamless fusion of modern aesthetics and timeless craftsmanship.",
    pieces: [
      {
        name: "Shirt",
        description:
          "Embroidered Solid Cambric Shirt Front Center Panel: 1 Piece\nEmbroidered Solid Cambric Shirt Front Side Panel: 2 Piece\nSolid Cambric Back & Sleeves: 1 Piece\nEmbroidered Border: 1 Piece",
        fabric: "Cambric",
        color: "Greenish Grey",
      },
      { name: "Trouser", description: "Solid Cambric Trouser: 2.5 Meter", fabric: "Cambric", color: "Greenish Grey" },
    ],
    sizes: [{ name: "std", remainingStock: 4 }],
    tagline: "Indian Motifs Style Shirt with Trouser",
    type: "un-stitched",
    collection: "",
    design: ["Dyed", "Embroidered"],
    brand: "Nishat",
    originalPrice: 6490,
    discount: 0,
    // coverImage: Nishat7,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
  {
    id: nanoid(),
    name: "Printed Suit",
    sex: "women",
    description:
      "Elevate your summer wardrobe with this printed two-piece suit from the latest Pret Summer Collection, featuring bold prints, breathable fabric, and effortless sophistication for everyday style.",
    sizes: [
      {
        name: "xs/s",
        remainingStock: 8,
      },
      {
        name: "m/l",
        remainingStock: 6,
      },
      {
        name: "xl/2xl",
        remainingStock: 1,
      },
    ],
    pieces: [
      {
        name: "Shirt",
        description:
          "Straight shirt featuring a round neckline with slit, adorned with lace detailing on the neckline and sleeves, finished with a round hem.",
        fabric: "Cambric",
        color: "Black",
      },
      {
        name: "Trouser",
        description: "Comfortable trousers featuring an all-over print for a vibrant, modern look.",
        fabric: "Cambric",
        color: "Black ",
      },
    ],
    tagline: "Printed Shirt With Trousers",
    type: "pret",
    collection: "",
    design: ["Digital Printed"],
    brand: "Nishat",
    originalPrice: 3990,
    discount: 0,
    // coverImage: Nishat8,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
  {
    id: nanoid(),
    name: "Basic Dress",
    sex: "women",
    description:
      "Elevate your summer style with this beautifully basic pret dress from the latest Summer Collection, effortless, elegant, and ready to wear.",
    sizes: [
      {
        name: "xs",
        remainingStock: 12,
      },
      {
        name: "s",
        remainingStock: 8,
      },
      {
        name: "m",
        remainingStock: 6,
      },
      {
        name: "l",
        remainingStock: 11,
      },
    ],
    pieces: [
      {
        name: "Dress",
        description: "Button-down long dress featuring a band neckline, cuff sleeves, and organza panel detailing.",
        fabric: "Brouche Jacquard / Organza",
        color: "Off White",
      },
    ],
    tagline: "Indian Motifs Style Shirt with Trouser",
    type: "pret",
    collection: "Vintage Pastels",
    design: ["Chicken Kari"],
    brand: "Nishat",
    originalPrice: 6490,
    discount: 0,
    // coverImage: Nishat9,
    note: "All measurements are in inches with slight tolerance.",
  },
  {
    id: nanoid(),
    name: "Basic Dress",
    sex: "women",
    description:
      "Elevate your summer style with this beautifully printed pret dress from the latest Summer Collection, where effortless charm meets everyday elegance.",
    sizes: [
      {
        name: "xs",
        remainingStock: 12,
      },
      {
        name: "s",
        remainingStock: 0,
      },
      {
        name: "m",
        remainingStock: 0,
      },
      {
        name: "l",
        remainingStock: 1,
      },
    ],
    pieces: [
      {
        name: "Dress",
        description: "Long flared dress featuring a band neckline and elasticated gathered sleeves.",
        fabric: "Viscose Lawn",
        color: "Neon Green",
      },
    ],
    tagline: "Elegant Printed Dress",
    type: "pret",
    collection: "Vintage Pastels",
    design: ["Digital Printed"],
    brand: "Nishat",
    originalPrice: 5990,
    discount: 0,
    // coverImage: Nishat10,
    note: "Product color may vary slightly due to photographic lighting sources or monitor settings.\nAll measurements are in inches with slight tolerance.",
  },
  {
    id: nanoid(),
    name: "Printed Dress",
    sex: "women",
    description:
      "Elevate your summer style with this beautifully printed pret dress from the latest Summer Collection, the perfect blend of seasonal charm and effortless elegance.",
    sizes: [
      {
        name: "xs/s",
        remainingStock: 12,
      },
      {
        name: "m/l",
        remainingStock: 5,
      },
    ],
    pieces: [
      {
        name: "Dress",
        description: "Sleeveless flared long dress featuring a high neckline with gathered detailing, tied into a knot at the back.",
        fabric: "Silk",
        color: "Black & White",
      },
    ],
    tagline: "Elegant Printed Dress",
    type: "pret",
    collection: "",
    design: ["Digital Printed"],
    brand: "Nishat",
    originalPrice: 8990,
    discount: 0,
    // coverImage: Nishat11,
    note: "Product color may vary slightly due to photographic lighting sources or monitor settings.\nAll measurements are in inches with slight tolerance.",
  },
  {
    id: nanoid(),
    name: "BLACK SILK DIGITAL PRINTED",
    sex: "women",
    sizes: [
      {
        name: "xs",
        remainingStock: 12,
      },
      {
        name: "s",
        remainingStock: 5,
      },
      {
        name: "m",
        remainingStock: 5,
      },
      {
        name: "l",
        remainingStock: 5,
      },
      {
        name: "xl",
        remainingStock: 5,
      },
      {
        name: "2xl",
        remainingStock: 5,
      },
    ],
    pieces: [
      {
        name: "Shirt",
        description: "Loose Fit traditional Shirt with round neckline in Kaftan style.",
        fabric: "Printed Maple Silk",
        color: "Black",
      },
      {
        name: "Trouser",
        description: "Loose Fit traditional Trouser.",
        fabric: "Printed Maple Silk",
        color: "Black",
      },
    ],
    tagline: "Printed Loose Fit Kaftan Shirt with Printed Trousers",
    type: "pret",
    collection: "",
    design: ["Digital Printed"],
    brand: "JDot",
    originalPrice: 6990,
    discount: 0,
    // coverImage: JDot1,
    note: "Product color may vary slightly due to photographic lighting sources or monitor settings.\nAll measurements are in inches with slight tolerance.",
  },
  {
    id: nanoid(),
    name: "GREY LAWN EMBROIDERED",
    sex: "women",
    sizes: [
      {
        name: "xs",
        remainingStock: 8,
      },
      {
        name: "s",
        remainingStock: 2,
      },
      {
        name: "m",
        remainingStock: 1,
      },
      {
        name: "l",
        remainingStock: 4,
      },
      {
        name: "xl",
        remainingStock: 4,
      },
      {
        name: "2xl",
        remainingStock: 1,
      },
    ],
    pieces: [
      {
        name: "Shirt",
        description: "Silken embroidered shirt with high round neckline.",
        fabric: "Silk",
        color: "Brownish Grey",
      },
      {
        name: "Trouser",
        description: "Plain silk trousers with embroidered bottoms.",
        fabric: "Silk",
        color: "Brownish Grey",
      },
      {
        name: "Dupatta",
        description: "Plain silk Dupatta.",
        fabric: "Silk",
        color: "Brownish Grey",
      },
    ],
    tagline: "Printed Loose Fit Kaftan Shirt with Printed Trousers",
    type: "stitched",
    collection: "Monsoon Collection",
    design: ["Embroidered"],
    brand: "JDot",
    originalPrice: 6990,
    discount: 0,
    // coverImage: JDot1,
    note: "Product color may vary slightly due to photographic lighting sources or monitor settings.\nAll measurements are in inches with slight tolerance.",
  },
];

let products = [];

articles.forEach((article) => {
  article.sizes.forEach((size) => {
    products.push({
      ...article,
      size: size.name,
      sku: generateSKU({ ...article, size: size.name }),
    });
  });
});

export default products;
