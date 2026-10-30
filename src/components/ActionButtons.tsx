import React from 'react';
import { Sword, Zap, Flame, Crosshair, RefreshCw } from 'lucide-react';
import { WeaponType } from '../game/types';

interface ActionButtonsProps {
  onAttack: () => void;
  onSkill: () => void;
  onCycleSkill?: () => void;
  weapon?: WeaponType;
  selectedSkillIndex?: number;
  attackCooldownPct: number;
  attackCooldownRemaining?: number;
  attackCooldownTotal?: number;
  skillCooldownRemaining: number;
  skillCooldownTotal: number;
  comboStep: number;
  greatswordHits?: number;
  isLandscape?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onAttack,
  onSkill,
  onCycleSkill,
  weapon = 'sword',
  selectedSkillIndex = 0,
  attackCooldownPct,
  attackCooldownRemaining = 0,
  attackCooldownTotal = 0.5,
  skillCooldownRemaining,
  skillCooldownTotal,
  comboStep,
  greatswordHits = 0,
  isLandscape = false,
}) => {
  // Check if weapon has multiple skills (Kiếm Lửa has 2 skills: "Cháy" and "Cầu Lửa")
  const hasMultipleSkills = weapon === 'fire_sword';

  // Determine current active skill label, icon, and details
  let skillName = 'LƯỚT';
  let skillIcon: React.ReactNode = <Zap className={`${isLandscape ? 'w-5 h-5' : 'w-6 h-6'} text-zinc-200`} />;
  let skillKey = '[F]';
  let isSkillDisabled = false;

  if (weapon === 'sword') {
    skillName = 'LƯỚT';
    skillIcon = <Zap className={`${isLandscape ? 'w-5 h-5' : 'w-6 h-6'} text-zinc-200`} />;
    skillKey = '[F]';
  } else if (weapon === 'fire_sword') {
    if (selectedSkillIndex === 0) {
      skillName = 'CHÉM LỬA';
      skillIcon = <Flame className={`${isLandscape ? 'w-5 h-5' : 'w-6 h-6'} text-orange-400`} />;
      skillKey = '[F]';
    } else {
      skillName = 'CẦU LỬA';
      skillIcon = <Flame className={`${isLandscape ? 'w-5 h-5' : 'w-6 h-6'} text-amber-400`} />;
      skillKey = '[F]';
    }
  } else if (weapon === 'bow') {
    skillName = 'ĐIỂM YẾU';
    skillIcon = <Crosshair className={`${isLandscape ? 'w-5 h-5' : 'w-6 h-6'} text-cyan-300`} />;
    skillKey = '[F]';
  } else if (weapon === 'greatsword') {
    skillName = 'KHÔNG';
    skillIcon = null;
    skillKey = '';
    isSkillDisabled = true;
  }

  const isSkillOnCooldown = skillCooldownRemaining > 0;
  const attackBtnLabel = weapon === 'bow' ? 'BẮN' : 'ĐÁNH';

  return (
    <div
      className={`fixed z-30 select-none touch-none flex items-end ${
        isLandscape
          ? 'bottom-3 right-3 sm:bottom-4 sm:right-5 gap-2.5'
          : 'bottom-4 right-4 sm:bottom-5 sm:right-6 gap-3'
      }`}
      style={{
        paddingRight: 'env(safe-area-inset-right, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* LEFT COLUMN: Optional "ĐỔI" Button (on top) + Single SKILL Button (below) */}
      <div className="flex flex-col items-center gap-1.5">
        {/* Nút "Đổi" nhỏ hơn xuất hiện bên trên nút kĩ năng khi vũ khí có từ 2 kĩ năng trở lên */}
        {hasMultipleSkills ? (
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              onCycleSkill?.();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              onCycleSkill?.();
            }}
            className="w-13 h-7 sm:w-14 sm:h-8 rounded bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-600 text-zinc-200 flex items-center justify-center gap-1 text-[9px] font-pixel shadow transition-all active:scale-95 cursor-pointer"
            title="Đổi kĩ năng khác (U)"
          >
            <RefreshCw className="w-3 h-3 text-zinc-300 animate-none" />
            <span>ĐỔI [U]</span>
          </button>
        ) : (
          /* Placeholder height keep alignment */
          <div className="h-7 sm:h-8" />
        )}

        {/* 1 NÚT KĨ NĂNG DUY NHẤT (Màu xám đơn giản, giảm họa tiết) */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              if (!isSkillDisabled && !isSkillOnCooldown) onSkill();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              if (!isSkillDisabled && !isSkillOnCooldown) onSkill();
            }}
            disabled={isSkillDisabled || isSkillOnCooldown}
            className={`relative rounded-full border-2 border-zinc-600 bg-zinc-800 text-zinc-200 shadow-md flex items-center justify-center transition-all active:scale-95 ${
              isLandscape ? 'w-13 h-13' : 'w-14 h-14 sm:w-15 sm:h-15'
            } ${
              isSkillDisabled || isSkillOnCooldown
                ? 'opacity-40 cursor-not-allowed bg-zinc-900'
                : 'cursor-pointer hover:bg-zinc-700 active:bg-zinc-600'
            }`}
            title={`Kĩ năng: ${skillName}`}
          >
            {isSkillOnCooldown && (
              <div className="absolute inset-0 rounded-full bg-zinc-950/85 flex items-center justify-center font-pixel text-[10px] text-zinc-100">
                {skillCooldownRemaining.toFixed(1)}s
              </div>
            )}
            {skillIcon}
          </button>
          <span className="mt-1 text-[8px] sm:text-[9px] font-pixel text-zinc-300 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-700">
            {skillName} {skillKey}
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: PRIMARY ATTACK BUTTON (Màu xám đơn giản, giảm họa tiết) */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            onAttack();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            onAttack();
          }}
          disabled={attackCooldownPct > 0}
          className={`relative rounded-full border-2 border-zinc-500 bg-zinc-700 text-zinc-100 shadow-lg flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 hover:bg-zinc-600 active:bg-zinc-500 ${
            isLandscape ? 'w-18 h-18' : 'w-20 h-20 sm:w-22 sm:h-22'
          } ${attackCooldownPct > 0 ? 'opacity-80' : ''}`}
          title="Tấn công (Space / J)"
        >
          {/* Countdown timer overlay for normal attack */}
          {attackCooldownRemaining > 0 && (
            <div className="absolute inset-0 rounded-full bg-zinc-950/85 flex flex-col items-center justify-center font-pixel text-zinc-100 z-10 pointer-events-none">
              <span className="text-[11px] sm:text-xs font-bold text-amber-300 drop-shadow">
                {attackCooldownRemaining.toFixed(1)}s
              </span>
              <span className="text-[7px] text-zinc-400">HỒI</span>
            </div>
          )}

          {/* Lần đánh hiển thị trên nút đánh thường:
              - Kiếm mặc định: hiển thị lần đánh từ 1 đến 3
              - Kiếm lửa: không hiển thị lần đánh
              - Kiếm lớn: hiển thị lần đánh từ 1 đến 10
          */}
          {weapon === 'sword' && (
            <div className="absolute -top-1.5 right-0.5 px-1.5 py-0.5 rounded-full bg-zinc-950/95 border border-sky-400 flex items-center justify-center text-[8px] sm:text-[9px] font-pixel text-sky-300 font-bold shadow-md z-10">
              {comboStep}/3
            </div>
          )}

          {weapon === 'greatsword' && (
            <div className="absolute -top-1.5 right-0.5 px-1.5 py-0.5 rounded-full bg-zinc-950/95 border border-amber-400 flex items-center justify-center text-[8px] sm:text-[9px] font-pixel text-amber-300 font-bold shadow-md z-10">
              {((greatswordHits % 10) + 1)}/10
            </div>
          )}

          <Sword className={`${isLandscape ? 'w-6 h-6' : 'w-7 h-7'} text-zinc-100 transform -rotate-45`} />
          <span className="text-[10px] font-pixel text-zinc-100 tracking-wider mt-0.5 font-bold">
            {attackBtnLabel}
          </span>
        </button>
        <span className="mt-1 text-[8px] sm:text-[9px] font-pixel text-zinc-400 bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-700">
          SPACE / J
        </span>
      </div>
    </div>
  );
};
