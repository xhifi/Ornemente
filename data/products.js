import Nishat1 from "@/data/placeholder/nishat-1.jpg";
import Nishat2 from "@/data/placeholder/nishat-2.jpg";
import Nishat3 from "@/data/placeholder/nishat-3.jpg";
import Nishat4 from "@/data/placeholder/nishat-4.jpg";
import Alkaram1 from "@/data/placeholder/alkaram-1.jpg";
import Alkaram2 from "@/data/placeholder/alkaram-2.jpg";
import Alkaram3 from "@/data/placeholder/alkaram-3.jpg";
import Alkaram4 from "@/data/placeholder/alkaram-4.jpg";
import Edenrobe1 from "@/data/placeholder/edenrobe-1.jpg";
import Edenrobe2 from "@/data/placeholder/edenrobe-2.jpg";
import Edenrobe3 from "@/data/placeholder/edenrobe-3.jpg";
import Edenrobe4 from "@/data/placeholder/edenrobe-4.jpg";
import Jdot1 from "@/data/placeholder/j-dot-1.jpg";
import Jdot2 from "@/data/placeholder/j-dot-2.jpg";
import Jdot3 from "@/data/placeholder/j-dot-3.jpg";
import Jdot4 from "@/data/placeholder/j-dot-4.jpg";
import Khaadi1 from "@/data/placeholder/khaadi-1.jpg";
import Khaadi2 from "@/data/placeholder/khaadi-2.jpg";
import Khaadi3 from "@/data/placeholder/khaadi-3.jpg";
import Khaadi4 from "@/data/placeholder/khaadi-4.jpg";
import GulAhmed1 from "@/data/placeholder/gul-ahmed-1.jpg";
import GulAhmed2 from "@/data/placeholder/gul-ahmed-2.jpg";
import GulAhmed3 from "@/data/placeholder/gul-ahmed-3.jpg";
import GulAhmed4 from "@/data/placeholder/gul-ahmed-4.jpg";
import Sapphire1 from "@/data/placeholder/sapphire-1.jpg";
import Sapphire2 from "@/data/placeholder/sapphire-2.jpg";
import Sapphire3 from "@/data/placeholder/sapphire-3.jpg";
import Sapphire4 from "@/data/placeholder/sapphire-4.jpg";
import Outfitters1 from "@/data/placeholder/outfitters-1.jpg";
import SanaSafinaz1 from "@/data/placeholder/sana-safinaz-1.jpg";

const products = [
  {
    id: 1,
    name: "Hue",
    sex: "women",
    description:
      "Every print is a masterpiece of confidence with this digitally printed three-piece from our latest Summer Collection, a perfect blend of bold design, breathable fabric, and timeless elegance.",
    pieces: [
      { name: "Shirt", description: "Digital Printed Cambric Shirt 3 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Dupatta", description: "Digital Printed Voile Dupatta 2.5 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Trouser", description: "Solid Cambric Trouser 2.5 Meter", fabric: "Cambric", color: "Dull Gold" },
    ],
    tagline: "Mughal Art Style Shirt with Dupatta & Trousers",
    type: "un-stitched",
    collection: "Summer Collection",
    design: "Embroidered",
    sku: "123456789",
    brand: "Nishat",
    originalPrice: 7999.0,
    discount: 17,
    remainingStock: 22,
    coverImage: Nishat1,
    note: "Sizes may vary, please refer to the size chart before ordering.",
  },
  {
    id: 2,
    name: "Tangent",
    sex: "women",
    description:
      "Every print is a masterpiece of confidence with this digitally printed three-piece from our latest Summer Collection, a perfect blend of bold design, breathable fabric, and timeless elegance.",
    pieces: [
      { name: "Shirt", description: "Digital Printed Cambric Shirt 3 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Dupatta", description: "Digital Printed Voile Dupatta 2.5 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Trouser", description: "Solid Cambric Trouser 2.5 Meter", fabric: "Cambric", color: "Dull Gold" },
    ],
    type: "stitched",
    collection: "Summer Collection",
    design: "Printed",
    sku: "987654321",
    brand: "Gul Ahmed",
    originalPrice: 8999.0,
    discount: 22,
    remainingStock: 11,
    coverImage: GulAhmed1,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
  {
    id: 3,
    name: "Elysian",
    sex: "women",
    description:
      "Every print is a masterpiece of confidence with this digitally printed three-piece from our latest Summer Collection, a perfect blend of bold design, breathable fabric, and timeless elegance.",
    pieces: [
      { name: "Shirt", description: "Digital Printed Cambric Shirt 3 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Dupatta", description: "Digital Printed Voile Dupatta 2.5 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Trouser", description: "Solid Cambric Trouser 2.5 Meter", fabric: "Cambric", color: "Dull Gold" },
    ],
    tagline: "Mughal Art Style Shirt with Dupatta & Trousers",
    type: "un-stitched",
    collection: "Festive Collection",
    design: "Embroidered",
    sku: "1122334455",
    brand: "Alkaram",
    originalPrice: 6999.0,
    discount: 29,
    remainingStock: 8,
    coverImage: Alkaram1,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
  {
    id: 4,
    name: "Serenity",
    sex: "women",
    description:
      "Every print is a masterpiece of confidence with this digitally printed three-piece from our latest Summer Collection, a perfect blend of bold design, breathable fabric, and timeless elegance.",
    pieces: [
      { name: "Shirt", description: "Digital Printed Cambric Shirt 3 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Dupatta", description: "Digital Printed Voile Dupatta 2.5 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Trouser", description: "Solid Cambric Trouser 2.5 Meter", fabric: "Cambric", color: "Dull Gold" },
    ],
    type: "stitched",
    collection: "Casual Collection",
    design: "Plain",
    sku: "5566778899",
    brand: "Khaadi",
    originalPrice: 4999.0,
    discount: 20,
    remainingStock: 9,
    coverImage: Khaadi1,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
  {
    id: 5,
    name: "Radiance",
    sex: "women",
    description:
      "Every print is a masterpiece of confidence with this digitally printed three-piece from our latest Summer Collection, a perfect blend of bold design, breathable fabric, and timeless elegance.",
    pieces: [
      { name: "Shirt", description: "Digital Printed Cambric Shirt 3 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Dupatta", description: "Digital Printed Voile Dupatta 2.5 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Trouser", description: "Solid Cambric Trouser 2.5 Meter", fabric: "Cambric", color: "Dull Gold" },
    ],
    type: "un-stitched",
    collection: "Luxury Collection",
    design: "Embroidered",
    sku: "9988776655",
    brand: "Sapphire",
    originalPrice: 9999.0,
    discount: 20,
    remainingStock: 7,
    coverImage: Sapphire1,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
  {
    id: 6,
    name: "Harmony",
    sex: "women",
    description:
      "Every print is a masterpiece of confidence with this digitally printed three-piece from our latest Summer Collection, a perfect blend of bold design, breathable fabric, and timeless elegance.",
    pieces: [
      { name: "Shirt", description: "Digital Printed Cambric Shirt 3 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Dupatta", description: "Digital Printed Voile Dupatta 2.5 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Trouser", description: "Solid Cambric Trouser 2.5 Meter", fabric: "Cambric", color: "Dull Gold" },
    ],
    type: "stitched",
    collection: "Formal Collection",
    design: "Printed",
    sku: "2233445566",
    brand: "Edenrobe",
    originalPrice: 7499.0,
    discount: 27,
    remainingStock: 2,
    coverImage: Edenrobe1,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
  {
    id: 7,
    name: "Bliss",
    sex: "women",
    description:
      "Every print is a masterpiece of confidence with this digitally printed three-piece from our latest Summer Collection, a perfect blend of bold design, breathable fabric, and timeless elegance.",
    pieces: [
      { name: "Shirt", description: "Digital Printed Cambric Shirt 3 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Dupatta", description: "Digital Printed Voile Dupatta 2.5 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Trouser", description: "Solid Cambric Trouser 2.5 Meter", fabric: "Cambric", color: "Dull Gold" },
    ],
    type: "un-stitched",
    collection: "Spring Collection",
    design: "Embroidered",
    sku: "3344556677",
    brand: "Outfitters",
    originalPrice: 8999.0,
    discount: 22,
    remainingStock: 20,
    coverImage: Outfitters1,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
  {
    id: 8,
    name: "Elegance",
    sex: "women",
    description:
      "Every print is a masterpiece of confidence with this digitally printed three-piece from our latest Summer Collection, a perfect blend of bold design, breathable fabric, and timeless elegance.",
    pieces: [
      { name: "Shirt", description: "Digital Printed Cambric Shirt 3 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Dupatta", description: "Digital Printed Voile Dupatta 2.5 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Trouser", description: "Solid Cambric Trouser 2.5 Meter", fabric: "Cambric", color: "Dull Gold" },
    ],
    type: "stitched",
    collection: "Party Collection",
    design: "Plain",
    sku: "4455667788",
    brand: "J.",
    originalPrice: 10999.0,
    discount: 18,
    remainingStock: 17,
    coverImage: Jdot1,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
  {
    id: 9,
    name: "Tranquility",
    sex: "women",
    description:
      "Every print is a masterpiece of confidence with this digitally printed three-piece from our latest Summer Collection, a perfect blend of bold design, breathable fabric, and timeless elegance.",
    pieces: [
      { name: "Shirt", description: "Digital Printed Cambric Shirt 3 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Dupatta", description: "Digital Printed Voile Dupatta 2.5 Meter", fabric: "Lawn", color: "Dull Gold" },
      { name: "Trouser", description: "Solid Cambric Trouser 2.5 Meter", fabric: "Cambric", color: "Dull Gold" },
    ],
    type: "un-stitched",
    collection: "Winter Collection",
    design: "Embroidered",
    sku: "5566778899",
    brand: "Sana Safinaz",
    originalPrice: 8999.0,
    discount: 22,
    remainingStock: 18,
    coverImage: SanaSafinaz1,
    note: "Product color may slightly vary due to photographic lighting sources or your device settings.",
  },
];

export default products;
