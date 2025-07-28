"use client";

import React, { useRef, useEffect } from "react";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import Image from "next/image";

/**
 * Image Slideshow Component with synchronized thumbnails
 * Features:
 * - Main image preview with navigation arrows
 * - Vertical thumbnail slider on desktop, horizontal on mobile
 * - Thumbnails below main image on mobile, to the side on desktop
 * - Max 5 visible thumbnails, scrollable
 * - No scrollbars or pagination indicators
 * - Synced navigation between thumbnails and main image
 * - Responsive layout
 *
 * Based on official Splide documentation at: https://splidejs.com/guides/thumbnail-slider/
 *
 * @param {Object} props
 * @param {Array} props.images - Array of image objects with src and alt properties
 * @param {string} props.height - Height of the main slider
 * @param {string} props.thumbsHeight - Height of the thumbnail slider (desktop)
 * @param {boolean} props.arrows - Show/hide navigation arrows on main slider
 * @param {boolean} props.autoplay - Enable/disable autoplay
 * @param {number} props.interval - Autoplay interval in milliseconds
 * @param {string} props.className - Additional CSS classes
 */
const ImageSlideshow = ({
  images = [],
  height = "700px",
  thumbsHeight = "400px",
  arrows = true,
  autoplay = false,
  interval = 3000,
  className = "",
}) => {
  // Create refs for the sliders
  const mainRef = useRef(null);
  const thumbsRef = useRef(null);

  // Setup slider synchronization
  useEffect(() => {
    if (!mainRef.current || !thumbsRef.current) return;

    const mainSplide = mainRef.current.splide;
    const thumbsSplide = thumbsRef.current.splide;

    if (!mainSplide || !thumbsSplide) return;

    // When the main slider moves, sync the thumbnail slider
    const syncThumbs = () => {
      // Skip if thumbs slider isn't ready
      if (!thumbsSplide || !mainSplide) {
        return;
      }
      // Safely sync the thumbnail slider with the main slider
      thumbsSplide.go(mainSplide.index);
    };

    // When thumbnail is clicked, update the main slider
    const handleThumbClick = () => {
      if (!mainSplide || !thumbsSplide) {
        return;
      }
      mainSplide.go(thumbsSplide.index);
    };

    // Add event listeners for both sliders
    mainSplide.on("move", syncThumbs);
    mainSplide.on("moved", syncThumbs); // Also sync after movement completes
    thumbsSplide.on("click", handleThumbClick);
    thumbsSplide.on("moved", handleThumbClick); // Handle thumbnail navigation

    // Initial sync
    syncThumbs();

    // Clean up
    return () => {
      if (mainSplide) {
        try {
          mainSplide.off("move");
          mainSplide.off("moved");
        } catch (e) {
          console.log("Error removing main splide events:", e);
        }
      }
      if (thumbsSplide) {
        try {
          thumbsSplide.off("click");
          thumbsSplide.off("moved");
        } catch (e) {
          console.log("Error removing thumb splide events:", e);
        }
      }
    };
  }, []);

  // Main slider options
  const mainOptions = {
    type: "fade",
    perPage: 1,
    perMove: 1,
    gap: "1rem",
    pagination: false,
    height: height,
    arrows: arrows,
    autoplay: autoplay,
    interval: interval,
    rewind: true,
    keyboard: true,
    speed: 700,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    breakpoints: {
      640: {
        height: "480px",
      },
    },
  };

  // Thumbnail slider options
  const thumbsOptions = {
    // This is the key option: make thumbnails navigable
    isNavigation: true,
    // Direction vertical for desktop
    direction: "ttb",
    height: height, // Same height as main slider
    gap: "0.5rem",
    pagination: false,
    arrows: false,
    cover: true,
    focus: "center",
    perPage: 5,
    rewind: true,
    fixedWidth: 80,
    fixedHeight: 110,
    trimSpace: false,
    updateOnMove: true,
    breakpoints: {
      768: {
        // Direction horizontal for mobile
        direction: "ltr",
        height: "120px", // Increased height for mobile thumbnails
        perPage: 3, // Reduced number to allow larger thumbnails
        fixedWidth: 60, // Width maintained to fit multiple thumbnails
        fixedHeight: 110, // Increased height to create portrait look
      },
    },
  };

  return (
    <div className={`image-slideshow-container ${className}`}>
      <div className="slider-layout">
        {/* Main slider */}
        <div className="main-slider-wrapper">
          <Splide options={mainOptions} ref={mainRef} className="main-slider" aria-label="Main Product Images" hasTrack={false}>
            <SplideTrack>
              {images.map((image, index) => (
                <SplideSlide key={`main-${image.id || image.src}`}>
                  <div className="h-full w-full bg-secondary">
                    <Image
                      src={image.src}
                      alt={`product ${index} preview image`}
                      width={400}
                      height={700}
                      className="w-full h-full object-cover"
                      draggable="false"
                    />
                  </div>
                </SplideSlide>
              ))}
            </SplideTrack>
          </Splide>
        </div>

        {/* Thumbnails slider */}
        <div className="thumbnails-wrapper">
          <Splide options={thumbsOptions} ref={thumbsRef} className="thumbnail-slider" aria-label="Thumbnail Images">
            {images.map((image, index) => (
              <SplideSlide
                key={`thumb-${image.id || image.src}`}
                className="thumbnail-slide opacity-50 transition-opacity duration-300 cursor-pointer "
              >
                <div className="cursor-pointer border-2 border-transparent overflow-hidden transition-opacity h-full w-full">
                  <Image
                    src={image.src}
                    width={110}
                    height={180}
                    alt={`product ${index} preview thumbnail`}
                    className="w-full h-full object-cover object-center"
                    draggable="false"
                  />
                </div>
              </SplideSlide>
            ))}
          </Splide>
        </div>
      </div>

      <style jsx global>{`
        /* Core container styles */
        .image-slideshow-container {
          width: 100%;
          position: relative;
        }

        /* Layout container */
        .slider-layout {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .slider-layout {
            flex-direction: row;
          }
        }

        /* Main slider styles */
        .main-slider-wrapper {
          flex: 1;
          order: 1;
        }

        .main-slider {
          width: 100%;
          border-radius: 4px;
          overflow: hidden;
        }

        /* Thumbnail styling */
        .thumbnails-wrapper {
          position: relative;
          width: 100%;
          order: 2;
          height: 120px; /* Increased height to match thumbnail slider height */
        }

        @media (min-width: 768px) {
          .thumbnails-wrapper {
            width: 80px;
            order: 0;
            height: auto; /* Will take height from the Splide options */
          }
        }

        /* Active thumbnail styling - no transition for border and outline */
        .thumbnail-slider .is-active .thumbnail {
          border-color: var(--color-primary);
          transform: scale(1.05);
          /* Remove transition for immediate visual feedback */
          transition: none;
        }

        /* Hide scrollbars but maintain scrolling */
        .splide__track {
          overflow: hidden !important;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .splide__track::-webkit-scrollbar {
          display: none;
        }

        /* Remove pagination dots */
        .splide__pagination {
          display: none !important;
        }

        /* Thumbnail appearance */
        .thumbnail-slide {
          /* Only transition opacity, not transforms or other properties */
          transition: opacity 0.3s ease;
          cursor: pointer;
          transform: scale(0.95);
        }

        .thumbnail-slide.is-active {
          opacity: 1;
          transform: scale(1);
          /* Instant active state */
          transition: none;
        }

        /* Mobile horizontal thumbnail layout */
        @media (max-width: 767px) {
          /* Make thumbnails taller on mobile */
          .thumbnail-slider .splide__slide {
            height: 110px !important;
          }

          /* Ensure thumbnail images fill their container properly */
          .thumbnail-slide img {
            height: 110px !important;
            object-fit: cover;
            object-position: center;
          }

          /* Fade indicators for horizontal thumbnails */
          .thumbnails-wrapper::before,
          .thumbnails-wrapper::after {
            content: "";
            position: absolute;
            top: 0;
            bottom: 0;
            width: 20px;
            height: 100%;
            z-index: 2;
            pointer-events: none;
          }

          .thumbnails-wrapper::before {
            left: 0;
            background: linear-gradient(to right, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
          }

          .thumbnails-wrapper::after {
            right: 0;
            background: linear-gradient(to left, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
          }
        }

        /* Desktop vertical thumbnail layout */
        @media (min-width: 768px) {
          /* Fade indicators for vertical thumbnails */
          .thumbnails-wrapper::before,
          .thumbnails-wrapper::after {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            width: 100%;
            height: 20px;
            z-index: 2;
            pointer-events: none;
          }

          .thumbnails-wrapper::before {
            top: 0;
            background: linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
          }

          .thumbnails-wrapper::after {
            bottom: 0;
            background: linear-gradient(to top, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
          }
        }

        /* Arrow styling */
        .splide__arrow {
          background: rgba(255, 255, 255, 0.8);
          width: 2.5rem;
          height: 2.5rem;
          opacity: 0.9;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .splide__arrow:hover {
          background: white;
          opacity: 1;
        }

        .splide__arrow svg {
          width: 1.2rem;
          height: 1.2rem;
          fill: var(--color-primary);
        }

        .main-slider .splide__arrow--prev {
          left: 0.5rem;
        }

        .main-slider .splide__arrow--next {
          right: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default ImageSlideshow;
