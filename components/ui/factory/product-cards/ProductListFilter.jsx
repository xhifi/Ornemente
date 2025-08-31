"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { FilterIcon, XIcon } from "lucide-react";

const ProductListFilter = ({ data, filterData, priceRange }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  // Extract filter data from props
  const types = filterData?.types || [];
  const brands = filterData?.brands || [];
  const sexes = filterData?.sexes || [];

  // Current filter states
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSex, setSelectedSex] = useState("");
  const [isDiscounted, setIsDiscounted] = useState(false);

  // Get dynamic price range bounds from props
  const minPrice = priceRange?.min_price || 0;
  const maxPrice = priceRange?.max_price || 10000;
  const [priceRangeState, setPriceRangeState] = useState([minPrice, maxPrice]); // [min, max] for slider

  // Initialize filters from URL params
  useEffect(() => {
    const typeParam = searchParams.get("type");
    const brandParam = searchParams.get("brand");
    const discountedParam = searchParams.get("discounted");
    const minPriceParam = searchParams.get("min_price");
    const maxPriceParam = searchParams.get("max_price");

    if (typeParam) {
      setSelectedTypes(typeParam.split(" ").map((id) => parseInt(id)));
    }
    if (brandParam) {
      setSelectedBrands(brandParam.split(" ").map((id) => parseInt(id)));
    }
    if (discountedParam !== null) {
      setIsDiscounted(true);
    }

    // Set price range from URL params or use default bounds
    const urlMinPrice = minPriceParam ? parseInt(minPriceParam) : minPrice;
    const urlMaxPrice = maxPriceParam ? parseInt(maxPriceParam) : maxPrice;
    setPriceRangeState([urlMinPrice, urlMaxPrice]);
  }, [searchParams, minPrice, maxPrice]);

  // Handle type selection (multiple)
  const handleTypeChange = (typeId, checked) => {
    if (checked) {
      setSelectedTypes((prev) => [...prev, typeId]);
    } else {
      setSelectedTypes((prev) => prev.filter((id) => id !== typeId));
    }
  };

  // Handle brand selection (multiple)
  const handleBrandChange = (brandId, checked) => {
    if (checked) {
      setSelectedBrands((prev) => [...prev, brandId]);
    } else {
      setSelectedBrands((prev) => prev.filter((id) => id !== brandId));
    }
  };

  // Handle sex selection (single)
  const handleSexChange = (sexSlug) => {
    setSelectedSex(sexSlug);
  };

  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams();

    // Add type filter
    if (selectedTypes.length > 0) {
      params.set("type", selectedTypes.join(" "));
    }

    // Add brand filter
    if (selectedBrands.length > 0) {
      params.set("brand", selectedBrands.join(" "));
    }

    // Add discounted filter
    if (isDiscounted) {
      params.set("discounted", "");
    }

    // Add price range filters
    if (priceRangeState[0] > minPrice) {
      params.set("min_price", priceRangeState[0].toString());
    }
    if (priceRangeState[1] < maxPrice) {
      params.set("max_price", priceRangeState[1].toString());
    }

    // Build the URL
    const queryString = params.toString();
    let newUrl = pathname;

    // Handle sex parameter in URL path
    if (selectedSex) {
      newUrl = `/shop/${selectedSex}`;
    } else {
      newUrl = "/shop";
    }

    if (queryString) {
      newUrl += `?${queryString}`;
    }

    router.push(newUrl);
    setIsOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedBrands([]);
    setSelectedSex("");
    setIsDiscounted(false);
    setPriceRangeState([minPrice, maxPrice]);
    router.push("/shop");
    setIsOpen(false);
  };

  // Get active filters count
  const activeFiltersCount =
    selectedTypes.length +
    selectedBrands.length +
    (selectedSex ? 1 : 0) +
    (isDiscounted ? 1 : 0) +
    (priceRangeState[0] > minPrice || priceRangeState[1] < maxPrice ? 1 : 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <FilterIcon className="w-4 h-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-full sm:w-96">
        <SheetHeader>
          <SheetTitle>Filter Products</SheetTitle>
          <SheetDescription>Narrow down your search with the filters below.</SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6 flex-1 overflow-y-auto px-6">
          {/* Price Range */}
          <div className="space-y-3">
            <h3 className="font-medium">Price Range</h3>
            <div className="space-y-4">
              <div className="px-2">
                <Slider
                  value={priceRangeState}
                  onValueChange={setPriceRangeState}
                  max={maxPrice}
                  min={minPrice}
                  step={100}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>₨ {priceRangeState[0].toLocaleString()}</span>
                <span>₨ {priceRangeState[1].toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Product Types */}
          {types.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Product Types</h3>
              <div className="space-y-2">
                {types.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type.id}`}
                      checked={selectedTypes.includes(type.id)}
                      onCheckedChange={(checked) => handleTypeChange(type.id, checked)}
                    />
                    <label
                      htmlFor={`type-${type.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {type.name} ({type.product_count})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brands */}
          {brands.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Brands</h3>
              <div className="space-y-2">
                {brands.map((brand) => (
                  <div key={brand.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand.id}`}
                      checked={selectedBrands.includes(brand.id)}
                      onCheckedChange={(checked) => handleBrandChange(brand.id, checked)}
                    />
                    <label
                      htmlFor={`brand-${brand.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {brand.name} ({brand.product_count})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sex */}
          {sexes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Category</h3>
              <RadioGroup value={selectedSex} onValueChange={handleSexChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="sex-all" />
                  <label htmlFor="sex-all" className="text-sm font-medium cursor-pointer">
                    All Categories
                  </label>
                </div>
                {sexes.map((sex) => (
                  <div key={sex.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={sex.slug} id={`sex-${sex.id}`} />
                    <label htmlFor={`sex-${sex.id}`} className="text-sm font-medium cursor-pointer">
                      {sex.name}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Discounted */}
          <div className="space-y-3">
            <h3 className="font-medium">Special Offers</h3>
            <div className="flex items-center space-x-2">
              <Checkbox id="discounted" checked={isDiscounted} onCheckedChange={setIsDiscounted} />
              <label
                htmlFor="discounted"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Show only discounted items
              </label>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-col space-y-2">
          <Button onClick={applyFilters} className="w-full">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={clearFilters} className="w-full" disabled={activeFiltersCount === 0}>
            <XIcon className="w-4 h-4 mr-2" />
            Clear All Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ProductListFilter;
