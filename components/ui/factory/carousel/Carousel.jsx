"use client";

import { useRef, useEffect, useState } from "react";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import "@splidejs/react-splide/css/core";

import SliderImage1 from "@/data/placeholder/nishat_banner_1.webp";
import SliderImage1_1 from "@/data/placeholder/nishat_banner_1_1.webp";
import SliderImage2 from "@/data/placeholder/nishat_banner_2.webp";
import SliderImage3 from "@/data/placeholder/nishat_banner_3.webp";
import SliderImage4 from "@/data/placeholder/nishat_banner_4.webp";
import Image from "next/image";
import Link from "next/link";

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
      images: [SliderImage1_1, SliderImage1],
    },
    {
      id: 2,
      bgColor: "bg-emerald-900",
      title: "Lipsum Amet Dolor Okir",
      content: ["Ut enim ad minim veniam", "Quis nostrud exercitation", "Ullamco laboris nisi ut aliquip"],
      images: [SliderImage2],
    },
    {
      id: 3,
      bgColor: "bg-fuchsia-700",
      title: "Oogway's Dreams",
      content: ["Yesterday is history", "Tomorrow is a mystery", "But today is a gift"],
      images: [SliderImage3],
    },
    {
      id: 4,
      bgColor: "bg-indigo-600",
      title: "The Final Frontier",
      content: ["To infinity and beyond", "Space: the final frontier", "These are the voyages of the Starship Enterprise"],
      images: [SliderImage4],
    },
  ],
  type = "slide",
  autoplay = true,
  interval = 3000,
  speed = 800,
  arrows = true,
  pagination = true,
  // height = "700px",
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
    // height: height,
    autoHeight: true,
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
    <div className={`carousel-wrapper relative w-full overflow-hidden my-0 mx-auto ${className}`}>
      <Splide
        ref={splideRef}
        options={{ ...splideOptions, pagination: false, arrows: false }}
        onMounted={onMountHandler}
        onMove={handleMove}
        aria-label="Carousel"
        className="opacity-100 visible h-[30rem] md:h-[25rem] lg:h-[calc(100vw_*_0.4)] lg:max-h-[calc(100vh_-_16rem)]"
      >
        {slides.map((slide) => {
          return (
            <SplideSlide
              key={slide.id}
              className="d-flex items-center justify-center visible opacity-100 transition-transform duration-500 h-[30rem] ease-in-out md:h-[25rem] lg:h-[calc(100vw_*_0.4)] lg:max-h-[calc(100vh_-_16rem)]"
            >
              <div className={`flex items-center justify-center w-full h-full ${slide.bgColor} relative aspect-video`}>
                <Link href="/" className="absolute top-0 left-0 w-full h-full z-0">
                  <picture>
                    <source media="(min-width: 48rem)" srcSet={slide.images[0].src}></source>
                    <source media="(min-width: 40rem)" srcSet={slide.images[1]?.src || slide.images[0].src}></source>
                    <Image
                      src={slide.images[1] || null}
                      loading="lazy"
                      width={1920}
                      height={1080}
                      alt={slide.title}
                      className="w-full h-full object-cover object-center"
                    />
                  </picture>
                </Link>
              </div>
            </SplideSlide>
          );
        })}
      </Splide>

      {/* Custom pagination bar */}
      <div className="flex items-center justify-center bg-primary-foreground border-b border-t border-primary">
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
              className="text-primary"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          {/* Slide counter */}
          <div className="font-medium mx-1 text-sm">
            <span className="text-primary">{slideInfo.current}</span>
            <span className="text-primary mx-1">/</span>
            <span className="text-primary">{slideInfo.total}</span>
          </div>

          {/* Next button */}
          <button
            onClick={goToNext}
            className="w-8 h-8 flex items-center justify-center transition-all border-r border-primary focus:outline-none"
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
              className="text-primary"
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
                className="text-primary"
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
                className="text-primary"
              >
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            )}
          </button>
        </div>
      </div>

      <style jsx global>{`
        /* Add effect to active slide */
        .is-active-slide {
          transform: scale(1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          z-index: 2;
        }
      `}</style>
    </div>
  );
};

export default Carousel;
