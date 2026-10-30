import React from 'react';
import { X, Settings, Mouse, Gamepad2, Eye, ZoomIn, ZoomOut, Sliders } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  controlMode: 'joystick' | 'wasd';
  onChangeControlMode: (mode: 'joystick' | 'wasd') => void;
  zoomLevel: number;
  onChangeZoomLevel: (zoom: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  controlMode,
  onChangeControlMode,
  zoomLevel,
  onChangeZoomLevel,
}) => {
  if (!isOpen) return null;

  const handleZoomStep = (delta: number) => {
    const next = Math.max(0.65, Math.min(1.8, Math.round((zoomLevel + delta) * 20) / 20));
    onChangeZoomLevel(next);
  };

  const zoomPercent = Math.round(zoomLevel * 100);

  const presets = [
    { label: '75%', value: 0.75, desc: 'Bao quát' },
    { label: '100%', value: 1.0, desc: 'Mặc định' },
    { label: '125%', value: 1.25, desc: 'Gần hơn' },
    { label: '150%', value: 1.5, desc: 'Phóng đại' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-zinc-900 border-4 border-zinc-700 rounded-xl p-5 sm:p-6 shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Title */}
        <h2 className="font-pixel text-sm sm:text-base text-amber-400 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          CÀI ĐẶT TÙY CHỈNH & MÀN HÌNH
        </h2>

        {/* Settings Body */}
        <div className="space-y-4 font-pixel text-xs text-zinc-200">
          {/* SCREEN ZOOM ADJUSTMENT SECTION */}
          <div className="bg-zinc-950/80 border-2 border-emerald-500/40 p-3.5 rounded-lg shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-emerald-400 flex items-center gap-1.5 text-[11px] font-bold">
                <ZoomIn className="w-4 h-4 text-emerald-400" /> PHÓNG TO / THU NHỎ MÀN HÌNH:
              </h3>
              <span className="font-pixel text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                {zoomPercent}%
              </span>
            </div>
            <p className="text-[9px] text-zinc-400 mb-3">
              Thu nhỏ để quan sát chiến trường rộng lớn hơn; phóng to để nhìn rõ từng cử động, chiêu thức của nhân vật và quái.
            </p>

            {/* Zoom Stepper Controls & Slider */}
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleZoomStep(-0.1)}
                className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 transition-all cursor-pointer flex items-center gap-1 active:scale-95 text-[10px]"
                title="Thu nhỏ 10%"
              >
                <ZoomOut className="w-3.5 h-3.5" />
                <span>Thu nhỏ</span>
              </button>

              <input
                type="range"
                min="0.65"
                max="1.75"
                step="0.05"
                value={zoomLevel}
                onChange={(e) => onChangeZoomLevel(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />

              <button
                type="button"
                onClick={() => handleZoomStep(0.1)}
                className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 transition-all cursor-pointer flex items-center gap-1 active:scale-95 text-[10px]"
                title="Phóng to 10%"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Phóng to</span>
              </button>
            </div>

            {/* Zoom Preset Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {presets.map((preset) => {
                const isActive = Math.abs(zoomLevel - preset.value) < 0.04;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => onChangeZoomLevel(preset.value)}
                    className={`py-1.5 px-1 rounded border text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold ring-1 ring-emerald-400/50'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-[10px]">{preset.label}</div>
                    <div className="text-[7px] text-zinc-400">{preset.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Movement Control Mode Selection */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-lg">
            <h3 className="text-zinc-300 mb-2 flex items-center gap-1.5 text-[11px]">
              <Gamepad2 className="w-4 h-4 text-amber-400" /> CHẾ ĐỘ NÚT DI CHUYỂN:
            </h3>
            <p className="text-[9px] text-zinc-400 mb-2.5">
              Chọn điều khiển bằng cần xoay Joystick hoặc cụm nút bấm A, W, S, D trên màn hình.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeControlMode('joystick')}
                className={`p-2.5 rounded-lg border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  controlMode === 'joystick'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span className="text-xl">🕹️</span>
                <span className="font-bold text-[10px]">CẦN JOYSTICK</span>
                <span className="text-[8px] text-zinc-400">Xoay 360 độ</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeControlMode('wasd')}
                className={`p-2.5 rounded-lg border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  controlMode === 'wasd'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span className="text-xl">⌨️</span>
                <span className="font-bold text-[10px]">NÚT A, W, S, D</span>
                <span className="text-[8px] text-zinc-400">4 nút điều hướng</span>
              </button>
            </div>
          </div>

          {/* PC Controls Info: Mouse & Keyboard */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-lg">
            <h3 className="text-sky-400 mb-2 flex items-center gap-1.5 text-[11px]">
              <Mouse className="w-4 h-4 text-sky-400" /> ĐIỀU KHIỂN CHUỘT & BÀN PHÍM (PC):
            </h3>
            <ul className="space-y-2 text-[10px] text-zinc-300">
              <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1">
                <span>🖱️ <b className="text-white">Chuột Trái / Phím Space (J):</b></span>
                <span className="text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800">ĐÁNH THƯỜNG</span>
              </li>
              <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1">
                <span>🖱️ <b className="text-white">Chuột Phải / Phím F (Shift):</b></span>
                <span className="text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">DÙNG KĨ NĂNG</span>
              </li>
              <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1">
                <span>⌨️ <b className="text-white">Phím W, A, S, D / Mũi Tên:</b></span>
                <span className="text-zinc-300">Di chuyển nhân vật</span>
              </li>
              <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1">
                <span>⌨️ <b className="text-white">Phím U / Q:</b></span>
                <span className="text-zinc-300">Đổi kĩ năng (Kiếm Lửa)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>⌨️ <b className="text-white">Phím E / Nút [KHO]:</b></span>
                <span className="text-zinc-300">Gặp Bác Nông Dân đổi vũ khí</span>
              </li>
            </ul>
          </div>

          {/* Vision Info */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-emerald-400 font-bold">TẦM NHÌN NGƯỜI CHƠI</div>
                <div className="text-[8px] text-zinc-400">Rừng sâu sương mù bao phủ</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-white bg-emerald-950 px-2 py-1 rounded border border-emerald-700">
              350 PX
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-pixel text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer text-center border border-zinc-500"
        >
          LƯU & ĐÓNG CÀI ĐẶT
        </button>
      </div>
    </div>
  );
};
