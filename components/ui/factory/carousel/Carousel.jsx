"use client";

import { useRef, useEffect } from "react";
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

  return (
    <div className={`carousel-wrapper ${className}`}>
      <Splide ref={splideRef} options={splideOptions} onMounted={onMountHandler} aria-label="Carousel">
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

      <style jsx global>{`
        .carousel-wrapper {
          position: relative;
          width: 100%;
          margin: 0 auto;
          overflow: visible; /* Allow arrows to be visible outside the container */
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

        /* Navigation arrows styling */
        .splide__arrow {
          background: rgba(255, 255, 255, 0.8);
          width: 3rem;
          height: 3rem;
          opacity: 1;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .splide__arrow svg {
          width: 1.5rem;
          height: 1.5rem;
          fill: #333;
        }

        .splide__arrow:hover {
          background: rgba(255, 255, 255, 1);
        }

        .splide__arrow--prev {
          left: ${arrowPosition === "outside" ? "-3.5rem" : "1rem"};
        }

        .splide__arrow--next {
          right: ${arrowPosition === "outside" ? "-3.5rem" : "1rem"};
        }

        /* Pagination dots styling */
        .splide__pagination {
          bottom: ${pagination ? "-2rem" : "1rem"};
        }

        .splide__pagination__page {
          background: rgba(255, 255, 255, 0.5);
          margin: 0 0.3rem;
          transition: all 0.3s ease;
          transform: scale(1);
        }

        .splide__pagination__page.is-active {
          background: white;
          transform: scale(1.3);
        }

        /* Ensure the track and list are properly sized */
        .splide__track,
        .splide__list {
          width: 100%;
          visibility: visible !important;
        }
      `}</style>
    </div>
  );
};

export default Carousel;
