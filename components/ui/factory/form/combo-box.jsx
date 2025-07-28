"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Check, Plus, X } from "lucide-react";

/**
 * ComboBox component for selecting multiple options with search functionality.
 * Supports selecting multiple options, creating new options, and clearing selections.
 *
 * @param {Object} props - Component props
 * @param {Array} props.options - Array of options to select from
 * @param {Array} props.selectedOptions - Array of currently selected options
 * @param {Function} props.setSelectedOptions - Callback when selections change
 * @param {string} props.placeholder - Placeholder text for the search input
 * @param {Function} props.handleCreateOption - Callback when creating a new option
 * @param {string} props.colorTheme - Color theme for the component (blue, green, purple, etc.)
 */
const ComboBox = ({
  options = [],
  selectedOptions = [],
  setSelectedOptions,
  placeholder = "Search options...",
  handleCreateOption,
  colorTheme = "blue",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(-1);
  const [newOptionText, setNewOptionText] = useState("");
  const comboBoxRef = useRef(null);
  const inputRef = useRef(null);

  // Color theme classes
  const colorClasses = {
    blue: {
      tag: "bg-blue-100 text-blue-800 border-blue-200",
      active: "bg-blue-50 text-blue-900 border-l-blue-500",
      check: "text-blue-500",
      hover: "hover:bg-blue-50",
      button: "bg-blue-500 hover:bg-blue-600 text-white",
      focus: "focus:border-blue-500 focus:ring-blue-500",
    },
    green: {
      tag: "bg-green-100 text-green-800 border-green-200",
      active: "bg-green-50 text-green-900 border-l-green-500",
      check: "text-green-500",
      hover: "hover:bg-green-50",
      button: "bg-green-500 hover:bg-green-600 text-white",
      focus: "focus:border-green-500 focus:ring-green-500",
    },
    purple: {
      tag: "bg-purple-100 text-purple-800 border-purple-200",
      active: "bg-purple-50 text-purple-900 border-l-purple-500",
      check: "text-purple-500",
      hover: "hover:bg-purple-50",
      button: "bg-purple-500 hover:bg-purple-600 text-white",
      focus: "focus:border-purple-500 focus:ring-purple-500",
    },
    // Add more color themes as needed
  };

  // Get the correct color theme or default to blue
  const colors = colorClasses[colorTheme] || colorClasses.blue;

  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm || searchTerm.trim() === "") {
      setFilteredOptions(options.filter((option) => !selectedOptions.some((selected) => selected.id === option.id)));
      setNewOptionText("");
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    const filtered = options.filter(
      (option) => option.name.toLowerCase().includes(lowerSearchTerm) && !selectedOptions.some((selected) => selected.id === option.id)
    );

    setFilteredOptions(filtered);

    // Check if we should allow creating a new option
    const exactMatch = options.some((option) => option.name.toLowerCase() === lowerSearchTerm);

    if (!exactMatch && handleCreateOption && searchTerm.trim().length > 0) {
      setNewOptionText(searchTerm.trim());
    } else {
      setNewOptionText("");
    }
  }, [searchTerm, options, selectedOptions, handleCreateOption]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (comboBoxRef.current && !comboBoxRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle select option
  const handleSelectOption = (option) => {
    setSelectedOptions([...selectedOptions, option]);
    setSearchTerm("");
    setIsOpen(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Handle remove option
  const handleRemoveOption = (optionId) => {
    setSelectedOptions(selectedOptions.filter((option) => option.id !== optionId));
  };

  // Handle create new option
  const handleCreateNewOption = () => {
    if (handleCreateOption && newOptionText) {
      handleCreateOption(newOptionText);
      setSearchTerm("");
      setNewOptionText("");
    }
  };

  // Handle key navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        setIsOpen(true);
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedOptionIndex((prevIndex) => {
            const totalOptions = filteredOptions.length + (newOptionText ? 1 : 0);
            return prevIndex < totalOptions - 1 ? prevIndex + 1 : prevIndex;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedOptionIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (isOpen) {
            if (focusedOptionIndex === filteredOptions.length && newOptionText && handleCreateOption) {
              handleCreateNewOption();
            } else if (focusedOptionIndex >= 0 && focusedOptionIndex < filteredOptions.length) {
              handleSelectOption(filteredOptions[focusedOptionIndex]);
            }
          } else {
            setIsOpen(true);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          break;
        default:
          break;
      }
    },
    [isOpen, filteredOptions, newOptionText, focusedOptionIndex, handleCreateOption, handleCreateNewOption, handleSelectOption]
  );

  return (
    <div ref={comboBoxRef} className="relative w-full">
      <div
        className={`border rounded-md p-2 flex flex-wrap gap-2 min-h-[42px] ${
          isOpen ? `ring-2 ${colors.focus} border-transparent` : "border-gray-300"
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected options displayed as tags */}
        {selectedOptions.length > 0 &&
          selectedOptions.map((option) => (
            <div key={option.id} className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm ${colors.tag}`}>
              {option.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveOption(option.id);
                }}
                className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-gray-200/50"
              >
                <X size={14} className="text-gray-500" />
                <span className="sr-only">Remove {option.name}</span>
              </button>
            </div>
          ))}

        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          className={`flex-grow outline-none min-w-[120px] text-sm ${selectedOptions.length > 0 ? "ml-1" : ""}`}
          placeholder={selectedOptions.length === 0 ? placeholder : "Add more..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            setFocusedOptionIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {filteredOptions.length === 0 && !newOptionText ? (
            <div className="py-2 px-4 text-sm text-gray-500">{searchTerm ? "No options found" : "No options available"}</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredOptions.map((option, index) => (
                <li
                  key={option.id}
                  className={`flex items-center justify-between px-4 py-2 cursor-pointer ${
                    index === focusedOptionIndex ? `${colors.active} border-l-2` : colors.hover
                  }`}
                  onClick={() => handleSelectOption(option)}
                >
                  <span className="block truncate text-sm">{option.name}</span>
                  {selectedOptions.some((selected) => selected.id === option.id) && <Check size={16} className={colors.check} />}
                </li>
              ))}

              {/* Create new option */}
              {newOptionText && handleCreateOption && (
                <li
                  className={`flex items-center px-4 py-2 cursor-pointer ${
                    focusedOptionIndex === filteredOptions.length ? `${colors.active} border-l-2` : colors.hover
                  }`}
                  onClick={handleCreateNewOption}
                >
                  <Plus size={16} className="mr-2 text-gray-400" />
                  <span className="text-sm">
                    Create "<strong>{newOptionText}</strong>"
                  </span>
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* Helper text */}
      {selectedOptions.length > 0 && (
        <div className="mt-1.5 text-xs text-gray-500">
          {selectedOptions.length} option{selectedOptions.length > 1 ? "s" : ""} selected
        </div>
      )}
    </div>
  );
};

export default ComboBox;
