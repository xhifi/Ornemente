"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";

/**
 * ComboBox - A streamlined select/multi-select component
 *
 * @param {Object} props
 * @param {Array} props.options - Array of option objects with id and name props
 * @param {Any} props.value - Selected value(s) - string/number for single, array for multi
 * @param {Function} props.onChange - Function to handle value changes
 * @param {String} props.placeholder - Placeholder text
 * @param {Boolean} props.isMulti - Whether multiple values can be selected
 * @param {Boolean} props.disabled - Whether the component is disabled
 * @param {String} props.label - Label for the combobox
 */
const ComboBox = ({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  isMulti = false,
  disabled = false,
  label = null,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const ref = useRef(null);
  const searchInputRef = useRef(null);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filter options based on search term
  useEffect(() => {
    if (!search) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter((option) => option.name.toLowerCase().includes(search.toLowerCase()));
      setFilteredOptions(filtered);
    }
  }, [search, options]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle option selection
  const handleSelect = (option) => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      const isSelected = currentValues.some((item) => item.id === option.id);

      if (isSelected) {
        // Remove option if already selected
        onChange(currentValues.filter((item) => item.id !== option.id));
      } else {
        // Add option
        onChange([...currentValues, option]);
      }
    } else {
      // Single select mode
      onChange(option);
      setIsOpen(false);
    }

    // Clear search on selection
    setSearch("");
  };

  // Remove a selected item in multi-select mode
  const removeItem = (e, option) => {
    e.stopPropagation();
    if (isMulti && Array.isArray(value)) {
      onChange(value.filter((item) => item.id !== option.id));
    }
  };

  // Check if an option is selected
  const isOptionSelected = (option) => {
    if (isMulti && Array.isArray(value)) {
      return value.some((item) => item.id === option.id);
    }
    return value && value.id === option.id;
  };

  // Get display value for the input
  const getDisplayValue = () => {
    if (!value) return "";

    if (isMulti) {
      return Array.isArray(value) && value.length > 0 ? value.map((item) => item.name).join(", ") : "";
    }

    return value.name || "";
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between bg-white border rounded-md p-2 cursor-pointer
          ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "hover:border-blue-500"}
          ${isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-300"}
        `}
      >
        <div className="flex-1 flex flex-wrap gap-1">
          {isMulti && Array.isArray(value) && value.length > 0 ? (
            // Show selected items as pills in multi-select mode
            value.map((item) => (
              <div key={item.id} className="flex items-center bg-blue-100 text-blue-800 rounded-md px-2 py-1 text-sm">
                <span>{item.name}</span>
                {!disabled && (
                  <X className="ml-1 h-3 w-3 text-blue-600 hover:text-blue-800 cursor-pointer" onClick={(e) => removeItem(e, item)} />
                )}
              </div>
            ))
          ) : (
            // Show text input for search or placeholder when nothing is selected
            <input
              ref={searchInputRef}
              type="text"
              placeholder={value && !isMulti ? getDisplayValue() : placeholder}
              value={isOpen ? search : ""}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              disabled={disabled}
              className="w-full border-none focus:outline-none focus:ring-0 placeholder-gray-400 text-gray-700"
            />
          )}
        </div>

        <div className="ml-2 text-gray-400">{isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md border border-gray-200 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                className={`
                  flex items-center px-3 py-2 cursor-pointer
                  ${isOptionSelected(option) ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100"}
                `}
                onClick={() => handleSelect(option)}
              >
                {isMulti && (
                  <div
                    className={`
                    flex-shrink-0 h-4 w-4 mr-2 border rounded
                    ${isOptionSelected(option) ? "bg-blue-500 border-blue-500" : "border-gray-300"}
                  `}
                  >
                    {isOptionSelected(option) && <Check className="h-4 w-4 text-white" />}
                  </div>
                )}
                <span>{option.name}</span>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500">No options found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComboBox;
