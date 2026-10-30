import React, { useCallback, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface DPadProps {
  onMove: (x: number, y: number) => void;
  externalMoveVector?: { x: number; y: number };
  isLandscape?: boolean;
}

export const DPad: React.FC<DPadProps> = ({ onMove, externalMoveVector, isLandscape = false }) => {
  // Active directions tracking
  const activeKeys = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const [, setRerender] = useState({});

  const updateVector = useCallback(() => {
    let x = 0;
    let y = 0;
    if (activeKeys.current.up) y -= 1;
    if (activeKeys.current.down) y += 1;
    if (activeKeys.current.left) x -= 1;
    if (activeKeys.current.right) x += 1;

    if (x !== 0 && y !== 0) {
      // Normalize diagonals
      x *= 0.7071;
      y *= 0.7071;
    }
    onMove(x, y);
    setRerender({});
  }, [onMove]);

  // Handle pointer down on a specific key
  const handlePointerDown = (dir: 'up' | 'down' | 'left' | 'right') => (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    activeKeys.current[dir] = true;
    updateVector();
  };

  const handlePointerUp = (dir: 'up' | 'down' | 'left' | 'right') => (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    activeKeys.current[dir] = false;
    updateVector();
  };

  const handlePointerCancel = (dir: 'up' | 'down' | 'left' | 'right') => () => {
    activeKeys.current[dir] = false;
    updateVector();
  };

  // Keyboard mirroring: if externalMoveVector is active, highlight buttons
  const isUpActive = activeKeys.current.up || Boolean(externalMoveVector && externalMoveVector.y < -0.2);
  const isDownActive = activeKeys.current.down || Boolean(externalMoveVector && externalMoveVector.y > 0.2);
  const isLeftActive = activeKeys.current.left || Boolean(externalMoveVector && externalMoveVector.x < -0.2);
  const isRightActive = activeKeys.current.right || Boolean(externalMoveVector && externalMoveVector.x > 0.2);

  const btnSize = isLandscape ? 'w-10 h-10' : 'w-11 h-11 sm:w-12 sm:h-12';

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
      {/* 4-Way D-Pad Grid */}
      <div
        className={`relative flex items-center justify-center bg-zinc-900/85 border-2 border-zinc-700/90 rounded-2xl backdrop-blur-md p-1 shadow-2xl ${
          isLandscape ? 'w-28 h-28' : 'w-32 h-32 sm:w-36 sm:h-36'
        }`}
        style={{
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5), inset 0 2px 6px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Center Pivot Deco */}
        <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-700/60 flex items-center justify-center pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
        </div>

        {/* W Button (Lên) */}
        <button
          type="button"
          onPointerDown={handlePointerDown('up')}
          onPointerUp={handlePointerUp('up')}
          onPointerCancel={handlePointerCancel('up')}
          className={`absolute top-1 left-1/2 -translate-x-1/2 ${btnSize} rounded-lg font-pixel text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer shadow-md border-2 active:scale-95 ${
            isUpActive
              ? 'bg-amber-500 border-amber-300 text-zinc-950 translate-y-0.5 shadow-inner'
              : 'bg-zinc-800 border-zinc-600 text-zinc-200 hover:bg-zinc-700 active:bg-amber-600'
          }`}
          title="Di chuyển Lên (W)"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span className="text-[9px]">W</span>
        </button>

        {/* S Button (Xuống) */}
        <button
          type="button"
          onPointerDown={handlePointerDown('down')}
          onPointerUp={handlePointerUp('down')}
          onPointerCancel={handlePointerCancel('down')}
          className={`absolute bottom-1 left-1/2 -translate-x-1/2 ${btnSize} rounded-lg font-pixel text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer shadow-md border-2 active:scale-95 ${
            isDownActive
              ? 'bg-amber-500 border-amber-300 text-zinc-950 -translate-y-0.5 shadow-inner'
              : 'bg-zinc-800 border-zinc-600 text-zinc-200 hover:bg-zinc-700 active:bg-amber-600'
          }`}
          title="Di chuyển Xuống (S)"
        >
          <span className="text-[9px]">S</span>
          <ArrowDown className="w-3.5 h-3.5" />
        </button>

        {/* A Button (Trái) */}
        <button
          type="button"
          onPointerDown={handlePointerDown('left')}
          onPointerUp={handlePointerUp('left')}
          onPointerCancel={handlePointerCancel('left')}
          className={`absolute left-1 top-1/2 -translate-y-1/2 ${btnSize} rounded-lg font-pixel text-xs font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer shadow-md border-2 active:scale-95 ${
            isLeftActive
              ? 'bg-amber-500 border-amber-300 text-zinc-950 translate-x-0.5 shadow-inner'
              : 'bg-zinc-800 border-zinc-600 text-zinc-200 hover:bg-zinc-700 active:bg-amber-600'
          }`}
          title="Di chuyển Trái (A)"
        >
          <ArrowLeft className="w-3 h-3" />
          <span className="text-[9px]">A</span>
        </button>

        {/* D Button (Phải) */}
        <button
          type="button"
          onPointerDown={handlePointerDown('right')}
          onPointerUp={handlePointerUp('right')}
          onPointerCancel={handlePointerCancel('right')}
          className={`absolute right-1 top-1/2 -translate-y-1/2 ${btnSize} rounded-lg font-pixel text-xs font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer shadow-md border-2 active:scale-95 ${
            isRightActive
              ? 'bg-amber-500 border-amber-300 text-zinc-950 -translate-x-0.5 shadow-inner'
              : 'bg-zinc-800 border-zinc-600 text-zinc-200 hover:bg-zinc-700 active:bg-amber-600'
          }`}
          title="Di chuyển Phải (D)"
        >
          <span className="text-[9px]">D</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Subtitle */}
      <div className="mt-1 text-center pointer-events-none">
        <span className="text-[9px] font-pixel text-amber-400 bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-700">
          NÚT A,W,S,D
        </span>
      </div>
    </div>
  );
};
