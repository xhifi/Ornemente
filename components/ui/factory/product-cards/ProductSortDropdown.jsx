"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const ProductSortDropdown = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "latest";

  const sortOptions = [
    { value: "latest", label: "Latest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "name_asc", label: "Name: A-Z" },
    { value: "name_desc", label: "Name: Z-A" },
  ];

  const getCurrentSortLabel = () => {
    const option = sortOptions.find((opt) => opt.value === currentSort);
    return option ? option.label : "Latest First";
  };

  const handleSortChange = (sortValue) => {
    const params = new URLSearchParams(searchParams);

    if (sortValue === "latest") {
      // Remove sort parameter for default sort
      params.delete("sort");
    } else {
      params.set("sort", sortValue);
    }

    // Remove page parameter when changing sort to start from page 1
    params.delete("page");

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    router.push(newUrl);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-48 justify-between">
          <span className="truncate">{getCurrentSortLabel()}</span>
          <ChevronDownIcon className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSortChange(option.value)}
            className={currentSort === option.value ? "bg-accent" : ""}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProductSortDropdown;
