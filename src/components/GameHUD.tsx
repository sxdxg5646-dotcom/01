import React from 'react';
import { Volume2, VolumeX, Music, Pause, Play, Maximize2, Minimize2, ShoppingBag, Settings } from 'lucide-react';
import { GameState } from '../game/engine';

interface GameHUDProps {
  state: GameState;
  soundEnabled: boolean;
  musicEnabled: boolean;
  isLandscape: boolean;
  isFullscreen: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onTogglePause: () => void;
  onToggleFullscreen: () => void;
  onOpenFarmerShop: () => void;
  onOpenSettings: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  state,
  soundEnabled,
  musicEnabled,
  isFullscreen,
  onToggleSound,
  onToggleMusic,
  onTogglePause,
  onToggleFullscreen,
  onOpenFarmerShop,
  onOpenSettings,
}) => {
  const { player, bossSpawned, killsToBoss, bossWarningTimer, status, npc } = state;

  const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const isStunned = player.stunTimer > 0;

  const weaponLabels: Record<string, { name: string; icon: string }> = {
    sword: { name: 'Kiếm Mặc Định (8 DMG)', icon: '⚔️' },
    fire_sword: { name: 'Kiếm Lửa (5 DMG + Đốt)', icon: '🔥' },
    greatsword: { name: 'Kiếm Lớn (15 DMG)', icon: '🗡️' },
    bow: { name: 'Cung Tên (3 DMG)', icon: '🏹' },
  };

  const currentWp = weaponLabels[player.weapon] || weaponLabels.sword;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-2 sm:p-3 select-none"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)',
        paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 6px)',
        paddingRight: 'calc(env(safe-area-inset-right, 0px) + 6px)',
      }}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between w-full gap-2">
        {/* Left: Player Red HP Bar & Monsters Defeated Counter underneath */}
        <div className="flex flex-col bg-zinc-900/90 border border-zinc-700 rounded-lg p-2 shadow-lg backdrop-blur-sm pointer-events-auto w-52 sm:w-60">
          {/* Red HP Bar ONLY (EXP removed per user request) */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="font-pixel text-[9px] text-red-500 font-bold shrink-0">HP</span>
            <div className="flex-1 h-3.5 bg-zinc-950 border border-zinc-700 rounded overflow-hidden relative shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-150"
                style={{ width: `${hpPct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-pixel text-[8px] text-white font-bold drop-shadow">
                {Math.ceil(player.hp)}/{player.maxHp}
              </span>
            </div>
          </div>

          {/* Stun alert badge if player is stunned by Boss */}
          {isStunned && (
            <div className="mb-1 text-[8px] font-pixel text-yellow-300 bg-yellow-950/80 px-1 py-0.5 rounded border border-yellow-600 text-center animate-pulse">
              BỊ CHOÁNG! ({player.stunTimer.toFixed(1)}s)
            </div>
          )}

          {/* Monsters Defeated Counter directly under HP */}
          <div className="pt-1 border-t border-zinc-800 flex items-center justify-between">
            <span className="font-pixel text-[9px] sm:text-[10px] text-zinc-200">
              {bossSpawned ? (
                <span className="text-rose-400 font-bold">{killsToBoss}/{killsToBoss} quái vật (Trùm xuất hiện!)</span>
              ) : (
                <span className="text-amber-300 font-bold">
                  {player.kills}/{killsToBoss} quái vật đã tiêu diệt
                </span>
              )}
            </span>
          </div>

          {/* Current Weapon indicator & quick open shop button */}
          <div className="mt-1.5 pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[8px] font-pixel text-zinc-300">
            <span className="truncate pr-1">
              {currentWp.icon} {currentWp.name}
            </span>
            <button
              type="button"
              onClick={onOpenFarmerShop}
              className="text-[8px] font-pixel text-amber-400 hover:text-amber-300 underline cursor-pointer shrink-0"
              title="Mở kho vũ khí nông dân"
            >
              [KHO]
            </button>
          </div>
        </div>

        {/* NPC Farmer Proximity Interactive Callout */}
        {npc.isPlayerNear && (
          <div className="flex-1 max-w-sm px-2 flex flex-col items-center pointer-events-auto">
            <div className="w-full bg-zinc-950/95 border-2 border-amber-500 rounded-lg p-2.5 shadow-2xl backdrop-blur-md flex flex-col items-center text-center animate-bounce-subtle">
              <span className="font-pixel text-[9px] sm:text-[10px] text-amber-300 mb-1">
                🌾 Bác Nông Dân: "Cậu muốn đổi vũ khí nào?"
              </span>
              <p className="font-pixel text-[8px] text-zinc-400 mb-2">
                Kiếm Mặc Định · Kiếm Lửa · Kiếm Lớn · Cung Tên
              </p>
              <button
                type="button"
                onClick={onOpenFarmerShop}
                className="py-1.5 px-3 rounded bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-zinc-950 font-pixel text-[9px] font-bold shadow transition-transform active:scale-95 cursor-pointer border border-amber-400 flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>CHỌN VŨ KHÍ [E]</span>
              </button>
            </div>
          </div>
        )}

        {/* Top-Right: Minimal small utility buttons only */}
        <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-700 p-1 rounded-lg shadow-lg backdrop-blur-sm pointer-events-auto">
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình / Màn hình ngang'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-zinc-300" /> : <Maximize2 className="w-3.5 h-3.5 text-zinc-300" />}
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-zinc-300" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
          </button>

          <button
            type="button"
            onClick={onToggleMusic}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
            title={musicEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
          >
            <Music className={`w-3.5 h-3.5 ${musicEnabled ? 'text-amber-400' : 'text-zinc-500'}`} />
          </button>

          <button
            type="button"
            onClick={onTogglePause}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
            title={status === 'paused' ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {status === 'paused' ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-zinc-300" />}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded hover:bg-zinc-800 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            title="Cài đặt điều khiển (Joystick / A,W,S,D)"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dramatic Boss Summon Warning Banner */}
      {bossWarningTimer > 0 && (
        <div className="w-full flex justify-center items-center my-auto pointer-events-none">
          <div className="bg-red-950/90 border-y-2 border-red-600 w-full py-3 px-4 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md animate-pulse">
            <h2 className="font-pixel text-sm sm:text-lg text-red-400 tracking-wider flex items-center gap-2">
              <span>⚠️</span> CẢNH BÁO: TRÙM XUẤT HIỆN! <span>⚠️</span>
            </h2>
            <p className="font-pixel text-[10px] sm:text-xs text-amber-300 mt-1">
              HIỆP SĨ THIẾT GIÁP CẦM BÚA KHỔNG LỒ ĐÃ XUẤT HIỆN TRONG RỪNG!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
