"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import SalonCard from "./SalonCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const SalonsGrid = ({ salons, title }: { salons: any[], title: string }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();
  const isRTL = (i18n.language || "").toLowerCase().startsWith("ar");

  const [showNextBtn, setShowNextBtn] = useState(false);
  const [showPrevBtn, setShowPrevBtn] = useState(false);

  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      
      const isScrollable = scrollWidth > clientWidth + 2; 

      if (!isScrollable) {
        setShowNextBtn(false);
        setShowPrevBtn(false);
        return;
      }

      const scrollPos = Math.abs(scrollLeft);
      // In RTL, scrollLeft starts at 0 and goes negative as we scroll through content (to the left)
      // clientWidth is what's visible. scrollWidth is total content.
      const isAtStart = scrollPos <= 5;
      const isAtEnd = scrollPos + clientWidth >= scrollWidth - 5;

      setShowPrevBtn(!isAtStart);
      setShowNextBtn(!isAtEnd);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      // Initial check
      const timer = setTimeout(checkScroll, 500);
      
      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      
      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [salons, checkScroll]);

  const handleScroll = (direction: "next" | "prev") => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.8; 
      let moveBy = direction === "next" ? scrollAmount : -scrollAmount;
      
      // In RTL, "next" (moving content to view more on the left) means scrollLeft becomes more negative.
      if (isRTL) moveBy = -moveBy;

      scrollContainerRef.current.scrollBy({
        left: moveBy,
        behavior: "smooth",
      });
    }
  };

  return (
    <section dir={isRTL ? "rtl" : "ltr"} className="py-6 overflow-hidden">
      <div className="max-w-full lg:max-w-[85%] mx-auto px-4 overflow-visible">
        {title && (
          <div className="w-full flex mb-6">
            <h2
              className={[
                "font-bold text-xl md:text-2xl text-gray-900 border-[#7BAE6A]",
                isRTL ? "border-r-4 pr-3" : "border-l-4 pl-3",
              ].join(" ")}
            >
              {title}
            </h2>
          </div>
        )}

        <div className="relative group overflow-visible">
          {showPrevBtn && (
            <button
              onClick={() => handleScroll("prev")}
              className={`absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/95 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-[#7BAE6A] hover:text-white transition-all duration-300 border border-gray-100 
                ${isRTL ? "-right-3 md:-right-6" : "-left-3 md:-left-6"}`}
              aria-label="Previous"
            >
              {isRTL ? <ChevronRight className="w-5 h-5 md:w-6 md:h-6" /> : <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
          )}

          <div className="flex-1 overflow-visible">
            <div
              ref={scrollContainerRef}
              className="flex items-stretch gap-4 md:gap-6 py-4 px-1 overflow-x-auto scroll-smooth no-scrollbar"
              style={{ direction: isRTL ? "rtl" : "ltr" }}
            >
              {salons.map((salon) => (
                <div key={salon.id} className="w-[280px] xs:w-[300px] sm:w-[350px] flex-shrink-0 flex items-stretch transition-transform duration-300 hover:scale-[1.02] overflow-visible">
                  <SalonCard salon={salon} />
                </div>
              ))}
            </div>
          </div>

          {showNextBtn && (
            <button
              onClick={() => handleScroll("next")}
              className={`absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/95 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-[#7BAE6A] hover:text-white transition-all duration-300 border border-gray-100 
                ${isRTL ? "-left-3 md:-left-6" : "-right-3 md:-right-6"}`}
              aria-label="Next"
            >
              {isRTL ? <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" /> : <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default SalonsGrid;