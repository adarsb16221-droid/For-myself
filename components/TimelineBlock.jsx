import { useRef, useState } from 'react';

// Helper to convert "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Helper to convert minutes from midnight to "HH:MM"
const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export default function TimelineBlock({ block, onUpdate, onDelete, pixelsPerMinute = 1, layout = { left: '0%', width: '100%' } }) {
  const blockRef = useRef(null);
  
  const startMins = timeToMinutes(block.startTime);
  const endMins = timeToMinutes(block.endTime);
  const duration = endMins - startMins;

  const [isResizing, setIsResizing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [localEndMins, setLocalEndMins] = useState(endMins);
  const [localStartMins, setLocalStartMins] = useState(startMins);

  const currentStart = isMoving ? localStartMins : startMins;
  const currentEnd = isResizing ? localEndMins : (isMoving ? localStartMins + duration : endMins);
  
  const topPos = currentStart * pixelsPerMinute;
  const currentHeight = Math.max((currentEnd - currentStart) * pixelsPerMinute, 15 * pixelsPerMinute);

  return (
    <div 
      ref={blockRef}
      className={`absolute rounded-md shadow-sm border border-primary/20 bg-primary/10 overflow-hidden group transition-colors hover:bg-primary/20 z-10 ${(isResizing || isMoving) ? 'z-20 bg-primary/20 shadow-md ring-1 ring-primary/50' : ''}`}
      style={{
        top: `${topPos}px`,
        height: `${currentHeight}px`,
        left: layout.left,
        width: layout.width,
        cursor: 'grab'
      }}
      onPointerDown={(e) => {
        // Prevent if we are clicking the resize handle or delete button
        if (e.target.closest('.resize-handle') || e.target.closest('button')) return;
        
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsMoving(true);
        const startY = e.clientY;
        let cStart = startMins;
        
        const onMove = (moveEvent) => {
          const deltaY = moveEvent.clientY - startY;
          const deltaMins = deltaY / pixelsPerMinute;
          const snappedDelta = Math.round(deltaMins / 15) * 15;
          cStart = Math.max(0, Math.min(1440 - duration, startMins + snappedDelta));
          setLocalStartMins(cStart);
        };
        
        const onUp = (upEvent) => {
          upEvent.currentTarget.releasePointerCapture(upEvent.pointerId);
          setIsMoving(false);
          if (cStart !== startMins) {
            onUpdate(block._id, { 
              startTime: minutesToTime(cStart), 
              endTime: minutesToTime(cStart + duration) 
            });
          }
          upEvent.currentTarget.onpointermove = null;
          upEvent.currentTarget.onpointerup = null;
        };
        
        e.currentTarget.onpointermove = onMove;
        e.currentTarget.onpointerup = onUp;
      }}
    >
      <div className="p-2 h-full flex flex-col select-none pointer-events-none">
        <div className="flex justify-between items-start pointer-events-auto">
          <p className="font-body-sm text-[13px] font-semibold text-primary truncate leading-tight">{block.title}</p>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(block._id); }}
            className="opacity-0 group-hover:opacity-100 text-primary hover:text-error transition-opacity cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
        <p className="font-label-caps text-[10px] text-primary/70 mt-auto truncate pointer-events-none">
          {minutesToTime(currentStart)} - {minutesToTime(currentEnd)}
        </p>
      </div>

      {/* Resize Handle (Bottom) */}
      <div 
        className="resize-handle absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-primary/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center pointer-events-auto"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          setIsResizing(true);
          const startY = e.clientY;
          let cEnd = endMins;
          
          const onMove = (moveEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const deltaMins = deltaY / pixelsPerMinute;
            const snappedDelta = Math.round(deltaMins / 15) * 15;
            cEnd = Math.max(startMins + 15, Math.min(1440, endMins + snappedDelta));
            setLocalEndMins(cEnd);
          };
          
          const onUp = (upEvent) => {
            upEvent.currentTarget.releasePointerCapture(upEvent.pointerId);
            setIsResizing(false);
            if (cEnd !== endMins) {
              onUpdate(block._id, { endTime: minutesToTime(cEnd) });
            }
            upEvent.currentTarget.onpointermove = null;
            upEvent.currentTarget.onpointerup = null;
          };
          
          e.currentTarget.onpointermove = onMove;
          e.currentTarget.onpointerup = onUp;
        }}
      >
        <div className="w-8 h-1 bg-primary/40 rounded-full pointer-events-none"></div>
      </div>
    </div>
  );
}
