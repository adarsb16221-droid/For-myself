'use client';
import { useState } from 'react';

export default function StackedCarousel({ items, renderItem, emptyMessage }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!items || items.length === 0) {
    return (
      <div className="flex justify-center items-center h-[140px] border border-dashed border-on-surface/20 rounded-xl">
        <p className="text-on-surface-variant text-sm italic opacity-70">{emptyMessage || 'No items.'}</p>
      </div>
    );
  }

  const handleNext = () => {
    if (activeIndex < items.length - 1) setActiveIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex(prev => prev - 1);
  };

  return (
    <div className="relative w-full h-[180px] group flex flex-col items-center">
      <div className="relative w-full h-full perspective-[1000px]">
        {items.map((item, index) => {
          const relIndex = index - activeIndex;

          if (relIndex < -1 || relIndex > 3) return null;

          let zIndex = 30 - Math.abs(relIndex);
          let transform = '';
          let opacity = 1;
          let pointerEvents = 'auto';

          if (relIndex < 0) {
            transform = `translateY(20px) scale(1.05)`;
            opacity = 0;
            pointerEvents = 'none';
          } else if (relIndex === 0) {
            transform = `translateY(0px) scale(1)`;
            opacity = 1;
          } else if (relIndex === 1) {
            transform = `translateY(-12px) scale(0.95)`;
            opacity = 0.95;
          } else if (relIndex === 2) {
            transform = `translateY(-24px) scale(0.90)`;
            opacity = 0.85;
            pointerEvents = 'none';
          } else {
            transform = `translateY(-36px) scale(0.85)`;
            opacity = 0;
            pointerEvents = 'none';
          }

          return (
            <div
              key={item._id || index}
              className="absolute bottom-0 left-0 w-full transition-all duration-300 ease-out will-change-transform rounded-xl"
              style={{
                transform,
                opacity,
                zIndex,
                pointerEvents,
              }}
              onClick={() => {
                if (relIndex > 0) setActiveIndex(index);
              }}
            >
              {/* Added a solid background wrapper to prevent glassmorphism bleed-through */}
              <div className="bg-surface rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/5 w-full h-[140px] overflow-hidden">
                {renderItem(item)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls & Dots */}
      <div className="absolute -bottom-8 left-0 w-full flex justify-between items-center px-2">
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className="w-6 h-6 rounded-full bg-surface-container shadow-sm flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-30"
        >
          <span className="material-symbols-outlined text-[14px]">chevron_left</span>
        </button>
        
        <div className="flex gap-1 flex-wrap justify-center max-w-[100px] overflow-hidden max-h-[8px]">
          {items.map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-primary w-3' : 'bg-on-surface/30'}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={activeIndex === items.length - 1}
          className="w-6 h-6 rounded-full bg-surface-container shadow-sm flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-30"
        >
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
