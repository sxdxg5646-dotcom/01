import React from 'react';
import { Trophy, RotateCcw, Swords, Flame, Award } from 'lucide-react';
import { GameState } from '../game/engine';

interface GameOverModalProps {
  state: GameState;
  onRestart: () => void;
  onNextWave: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ state, onRestart, onNextWave }) => {
  const isVictory = state.status === 'victory';
  const isGameOver = state.status === 'game_over';

  if (!isVictory && !isGameOver) return null;

  const minutes = Math.floor(state.timeElapsed / 60);
  const seconds = Math.floor(state.timeElapsed % 60);
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div
        className={`w-full max-w-md rounded-xl border-4 p-6 shadow-2xl flex flex-col items-center text-center ${
          isVictory
            ? 'bg-slate-900 border-amber-400 shadow-amber-500/20'
            : 'bg-slate-950 border-rose-600 shadow-rose-900/40'
        }`}
      >
        {/* Header Icon */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 border-2 shadow-inner ${
            isVictory
              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
              : 'bg-rose-950/60 border-rose-500 text-rose-500'
          }`}
        >
          {isVictory ? <Trophy className="w-10 h-10 animate-bounce" /> : <Flame className="w-10 h-10" />}
        </div>

        {/* Title */}
        <h2
          className={`font-pixel text-xl sm:text-2xl mb-2 ${
            isVictory ? 'text-amber-300' : 'text-rose-500'
          }`}
        >
          {isVictory ? 'CHIẾN THẮNG QUANG VINH!' : 'BẠN ĐÃ HY SINH!'}
        </h2>

        <p className="font-pixel text-xs text-slate-300 mb-6">
          {isVictory
            ? 'Bạn đã tiêu diệt Ma Vương Hắc Ám và giải cứu vương quốc!'
            : 'Hiệp sĩ đã gục ngã trước bầy quái vật hung ác...'}
        </p>

        {/* Stats Grid */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3 text-left font-pixel text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">ĐIỂM SỐ:</span>
            <span className="text-amber-400 text-sm">{state.player.score}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">QUÁI ĐÃ DIỆT:</span>
            <span className="text-rose-400 text-sm">{state.player.totalKills} con</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">CẤP ĐỘ HIỆP SĨ:</span>
            <span className="text-sky-400 text-sm">Cấp {state.player.level}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">THỜI GIAN CHIẾN ĐẤU:</span>
            <span className="text-emerald-400 text-sm">{timeFormatted}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {isVictory && (
            <button
              type="button"
              onClick={onNextWave}
              className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-pixel text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
            >
              <Award className="w-4 h-4" />
              VÒNG TIẾP THEO (Vòng {state.wave + 1})
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            className={`flex-1 py-3 px-4 rounded-lg font-pixel text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer border ${
              isVictory
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                : 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white border-rose-400'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            CHƠI LẠI TỪ ĐẦU
          </button>
        </div>
      </div>
    </div>
  );
};
