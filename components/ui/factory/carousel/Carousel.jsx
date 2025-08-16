"use client";

import { useRef, useEffect, useState } from "react";
import { Splide, SplideSlide } from "@splidejs/react-splide";
// Import Splide styles - using the default theme for better visibility
import "@splidejs/react-splide/css";
// Import additional styles needed for fade effect
import "@splidejs/react-splide/css/core";

/**
 * Carousel component using Splide
 *
 * @param {Object} props
 * @param {Array} props.slides - Array of slide content objects
 * @param {string} props.type - Type of carousel ('slide', 'loop', 'fade')
 * @param {boolean} props.autoplay - Whether to enable autoplay
 * @param {number} props.interval - Autoplay interval in milliseconds
 * @param {number} props.speed - Animation speed in milliseconds
 * @param {boolean} props.arrows - Whether to show navigation arrows
 * @param {boolean} props.pagination - Whether to show pagination dots
 * @param {string} props.height - Height of the carousel
 * @param {string} props.arrowPosition - Position of arrows ('inside', 'outside')
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
const Carousel = ({
  slides = [
    {
      id: 1,
      bgColor: "bg-amber-400",
      title: "Lorem Ipsum Dolor Sit Amet",
      content: ["Lorem ipsum dolor sit amet", "Consectetur adipiscing elit", "Sed do eiusmod tempor incididunt"],
    },
    {
      id: 2,
      bgColor: "bg-emerald-900",
      title: "Lipsum Amet Dolor Okir",
      content: ["Ut enim ad minim veniam", "Quis nostrud exercitation", "Ullamco laboris nisi ut aliquip"],
    },
    {
      id: 3,
      bgColor: "bg-fuchsia-700",
      title: "Oogway's Dreams",
      content: ["Yesterday is history", "Tomorrow is a mystery", "But today is a gift"],
    },
  ],
  type = "slide",
  autoplay = true,
  interval = 3000,
  speed = 800,
  arrows = true,
  pagination = true,
  height = "500px",
  arrowPosition = "inside",
  className = "",
}) => {
  const splideRef = useRef(null);

  const splideOptions = {
    type: type,
    perPage: 1,
    perMove: 1,
    gap: "0rem",
    pagination: pagination,
    arrows: arrows,
    autoplay: autoplay,
    pauseOnHover: true,
    pauseOnFocus: true,
    interval: interval,
    speed: speed,
    rewind: true,
    width: "100%",
    height: height,
    focus: "center",
    trimSpace: false, // Don't trim empty spaces to ensure visibility
    updateOnMove: true, // Update classes during transitions
    classes: {
      // Add custom class to active slide
      slide: {
        active: "is-active-slide",
      },
    },
    breakpoints: {
      640: {
        arrows: false,
      },
    },
  };

  const onMountHandler = () => {
    // Force refresh to ensure proper rendering
    if (splideRef.current && splideRef.current.splide) {
      setTimeout(() => {
        splideRef.current.splide.refresh();
      }, 100);
    }
  };

  // State to track current slide and total slides
  const [slideInfo, setSlideInfo] = useState({ current: 1, total: slides.length });
  // State to track if autoplay is paused
  const [isPaused, setIsPaused] = useState(!autoplay);

  // Handle slide change to update the custom pagination
  const handleMove = (splide) => {
    const currentSlide = splide.index + 1;
    setSlideInfo({ current: currentSlide, total: slides.length });
  };

  // Custom navigation handlers
  const goToPrev = () => {
    if (splideRef.current && splideRef.current.splide) {
      splideRef.current.splide.go("<");
    }
  };

  const goToNext = () => {
    if (splideRef.current && splideRef.current.splide) {
      splideRef.current.splide.go(">");
    }
  };

  // Toggle autoplay functionality
  const toggleAutoplay = () => {
    if (splideRef.current && splideRef.current.splide) {
      if (isPaused) {
        splideRef.current.splide.Components.Autoplay.play();
      } else {
        splideRef.current.splide.Components.Autoplay.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  // Update initial autoplay setting
  useEffect(() => {
    if (splideRef.current && splideRef.current.splide) {
      if (isPaused) {
        splideRef.current.splide.Components.Autoplay.pause();
      } else {
        splideRef.current.splide.Components.Autoplay.play();
      }
    }
  }, [splideRef.current, isPaused]);

  return (
    <div className={`carousel-wrapper ${className}`}>
      <Splide
        ref={splideRef}
        options={{ ...splideOptions, pagination: false, arrows: false }}
        onMounted={onMountHandler}
        onMove={handleMove}
        aria-label="Carousel"
      >
        {slides.map((slide) => (
          <SplideSlide key={slide.id}>
            <div className={`flex items-center justify-center w-full h-full ${slide.bgColor}`} style={{ minHeight: height }}>
              <div className="text-center px-8 py-12 w-full">
                <h2 className="text-4xl font-bold text-white mb-6">{slide.title}</h2>
                <div className="space-y-4">
                  {slide.content.map((text, index) => (
                    <p key={index} className="text-white text-xl">
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </SplideSlide>
        ))}
      </Splide>

      {/* Custom pagination bar */}
      <div className="flex items-center justify-center bg-primary-foreground border-b border-t border-secondary">
        <div className="flex items-center">
          {/* Previous button */}
          <button
            onClick={goToPrev}
            className="w-8 h-8 flex items-center justify-center transition-all rounded-sm"
            aria-label="Previous slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-secondary"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          {/* Slide counter */}
          <div className="font-medium mx-1 text-sm">
            <span className="text-secondary">{slideInfo.current}</span>
            <span className="text-secondary mx-1">/</span>
            <span className="text-secondary">{slideInfo.total}</span>
          </div>

          {/* Next button */}
          <button
            onClick={goToNext}
            className="w-8 h-8 flex items-center justify-center transition-all border-r focus:outline-none"
            aria-label="Next slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-secondary"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          {/* Pause/Play button */}
          <button
            onClick={toggleAutoplay}
            className="w-8 h-8 flex items-center justify-center transition-all "
            aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
          >
            {isPaused ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-secondary"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-secondary"
              >
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            )}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .carousel-wrapper {
          position: relative;
          width: 100%;
          margin: 0 auto;
          overflow: hidden; /* Keep content within boundaries */
        }

        /* Ensure the carousel and track are visible */
        .splide {
          visibility: visible !important;
          opacity: 1 !important;
        }

        /* Make sure slides are visible */
        .splide__slide {
          display: flex !important;
          align-items: center;
          justify-content: center;
          height: ${height};
          opacity: 1 !important;
          visibility: visible !important;
          transition: transform 400ms ease;
        }

        /* Add effect to active slide */
        .is-active-slide {
          transform: scale(1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          z-index: 2;
        }

        /* Ensure the track and list are properly sized */
        .splide__track,
        .splide__list {
          width: 100%;
          visibility: visible !important;
        }

        /* Custom pagination styles */
        .carousel-wrapper button {
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .carousel-wrapper button:active {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default Carousel;
