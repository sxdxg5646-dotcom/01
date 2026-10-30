import React, { useCallback, useEffect, useRef, useState } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  externalMoveVector?: { x: number; y: number };
  isLandscape?: boolean;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove, externalMoveVector, isLandscape = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  // In landscape mode on smaller mobile screens, adjust base radius for better thumb ergonomics
  const radius = isLandscape ? 44 : 52;
  const touchIdRef = useRef<number | null>(null);

  const updateKnob = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist <= radius) {
      setKnobPos({ x: dx, y: dy });
      onMove(dx / radius, dy / radius);
    } else {
      const angle = Math.atan2(dy, dx);
      const clampedX = Math.cos(angle) * radius;
      const clampedY = Math.sin(angle) * radius;
      setKnobPos({ x: clampedX, y: clampedY });
      onMove(clampedX / radius, clampedY / radius);
    }
  }, [onMove, radius]);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsDragging(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onMove(0, 0);
        break;
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateKnob(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || touchIdRef.current !== null) return;
      updateKnob(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (!isDragging || touchIdRef.current !== null) return;
      setIsDragging(false);
      setKnobPos({ x: 0, y: 0 });
      onMove(0, 0);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onMove, updateKnob]);

  // Visual mirroring for keyboard input if not touch dragging
  const displayPos = isDragging
    ? knobPos
    : externalMoveVector && (externalMoveVector.x !== 0 || externalMoveVector.y !== 0)
    ? { x: externalMoveVector.x * radius * 0.75, y: externalMoveVector.y * radius * 0.75 }
    : { x: 0, y: 0 };

  return (
    <div
      className={`fixed z-30 select-none touch-none ${
        isLandscape
          ? 'bottom-3 left-3 sm:bottom-5 sm:left-5'
          : 'bottom-5 left-5 sm:bottom-6 sm:left-6'
      }`}
      style={{
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Simple Gray Joystick Base - reduced patterns */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        className={`relative rounded-full bg-zinc-800/80 backdrop-blur-sm border-2 border-zinc-600/80 flex items-center justify-center cursor-pointer active:scale-95 transition-transform ${
          isLandscape ? 'w-28 h-28' : 'w-32 h-32 sm:w-36 sm:h-36'
        }`}
        style={{
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4), inset 0 2px 6px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Simple inner reference circle without clutter */}
        <div
          className={`rounded-full border border-zinc-700/60 pointer-events-none ${
            isLandscape ? 'w-14 h-14' : 'w-16 h-16'
          }`}
        />

        {/* Minimalist Gray Thumb Knob */}
        <div
          className={`absolute rounded-full border border-zinc-400/90 bg-zinc-500 shadow-md pointer-events-none flex items-center justify-center transition-all ${
            isLandscape ? 'w-12 h-12' : 'w-14 h-14'
          } ${isDragging ? 'bg-zinc-400 scale-105' : 'duration-75'}`}
          style={{
            transform: `translate(${displayPos.x}px, ${displayPos.y}px)`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.25)',
          }}
        >
          {/* Subtle center dot */}
          <div className="w-3 h-3 rounded-full bg-zinc-300/70" />
        </div>
      </div>

      {/* Simple Clean Subtitle */}
      <div className="mt-1 text-center pointer-events-none">
        <span className="text-[9px] font-pixel text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-700">
          W,A,S,D
        </span>
      </div>
    </div>
  );
};
