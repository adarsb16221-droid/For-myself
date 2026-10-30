'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

export default function BookCover({ name, isMobile, onOpened }) {
  const rootRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.6, onComplete: onOpened });

    if (isMobile) {
      tl.to('.cover-board', { rotationY: -115, duration: 1.1, ease: 'power2.inOut' })
        .to('.cover-board', { opacity: 0, duration: 0.3 }, '-=0.35');
    } else {
      // Cover swings over the spine; the blank "left side" fades as the cover passes upright
      tl.to('.cover-board', { rotationY: -180, duration: 1.5, ease: 'power2.inOut' })
        .to('.cover-under', { opacity: 0, duration: 0.35 }, 0.75)
        .to('.cover-board', { opacity: 0, duration: 0.45 }, '+=0.2');
    }
  }, { scope: rootRef });

  return (
    <div ref={rootRef} className="absolute inset-0 z-40" style={{ transformStyle: 'preserve-3d' }} aria-hidden="true">
      {!isMobile && <div className="cover-under absolute -inset-y-4 -left-6 right-1/2 bg-surface" />}

      <div
        className={`cover-board absolute top-0 right-0 h-full ${isMobile ? 'w-full' : 'w-1/2'}`}
        style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
      >
        <div className="journal-cover absolute inset-0 rounded-r-xl rounded-l-sm flex flex-col items-center justify-center [backface-visibility:hidden]">
          <div className="journal-cover-stitch absolute inset-4 rounded-lg" />
          <div className="journal-cover-strap absolute inset-y-0 right-10 w-3" />
          <span className="material-symbols-outlined journal-foil text-[64px]">raven</span>
          <p className="journal-foil font-journal-serif text-3xl md:text-4xl font-semibold mt-3 px-10 text-center">{name}</p>
          <p className="journal-foil uppercase tracking-[0.4em] text-[11px] mt-3">Hawk Journal · {new Date().getFullYear()}</p>
        </div>
        <div className="journal-endpaper absolute inset-0 rounded-l-xl [backface-visibility:hidden]" style={{ transform: 'rotateY(180deg)' }} />
      </div>
    </div>
  );
}
