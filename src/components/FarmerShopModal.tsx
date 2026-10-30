import React from 'react';
import { WeaponType } from '../game/types';
import { Sword, Flame, Crosshair, X, Shield, Zap } from 'lucide-react';

interface FarmerShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeapon: WeaponType;
  onSelectWeapon: (weapon: WeaponType) => void;
}

interface WeaponOption {
  type: WeaponType;
  name: string;
  tag: string;
  damage: number;
  cooldown: number;
  icon: React.ReactNode;
  accentColor: string;
  description: string;
  skills: { name: string; desc: string; cd: string }[];
}

export const FarmerShopModal: React.FC<FarmerShopModalProps> = ({
  isOpen,
  onClose,
  currentWeapon,
  onSelectWeapon,
}) => {
  if (!isOpen) return null;

  const weapons: WeaponOption[] = [
    {
      type: 'sword',
      name: 'Kiếm Thường',
      tag: 'Vũ khí cơ bản',
      damage: 20,
      cooldown: 0.5,
      icon: <Sword className="w-5 h-5 text-sky-400" />,
      accentColor: 'border-sky-500/60 bg-sky-950/20',
      description: 'Mỗi đòn đánh thứ 3 có 40% chí mạng gây 160 sát thương. Nút đánh hiển thị lần đánh từ 1 đến 3. Tầm đánh 100, tốc độ 100.',
      skills: [
        {
          name: 'Lướt',
          desc: 'Lao về phía trước 1 đoạn ngắn không gây sát thương, né tránh đòn đánh nguy hiểm.',
          cd: '1.5s',
        },
      ],
    },
    {
      type: 'fire_sword',
      name: 'Kiếm Lửa',
      tag: 'Vũ khí ma thuật',
      damage: 5,
      cooldown: 1.2,
      icon: <Flame className="w-5 h-5 text-orange-400" />,
      accentColor: 'border-orange-500/60 bg-orange-950/20',
      description: 'Đánh trúng đốt quái mất 5 HP/s trong 3s. Nút đánh không hiển thị lần đánh. Tầm đánh 90, tốc độ 95.',
      skills: [
        {
          name: 'Chém Lửa',
          desc: 'Cường hóa đòn đánh thường kế gây 20 sát thương và Cháy Lớn mất 35 HP/s trong 4s.',
          cd: '3.0s',
        },
        {
          name: 'Cầu Lửa',
          desc: 'Bắn cầu lửa phát nổ sau 0.8s gây 40 sát thương và Cháy Lớn mất 35 HP/s trong 2s.',
          cd: '2.0s',
        },
      ],
    },
    {
      type: 'greatsword',
      name: 'Kiếm Lớn',
      tag: 'Trọng vũ khí',
      damage: 100,
      cooldown: 1.8,
      icon: <Shield className="w-5 h-5 text-slate-300" />,
      accentColor: 'border-slate-500/60 bg-slate-900/40',
      description: 'Mỗi 10 cú chém cộng 10 sát thương (tối đa +50 dmg). Tầm đánh 120, tốc độ 85. Nút đánh hiển thị đòn 1 đến 10.',
      skills: [
        {
          name: 'Nội tại Trảm Lực',
          desc: 'Mỗi 10 đòn đánh chém trúng: vĩnh viễn tăng +10 DMG (cộng tối đa 50 DMG, sát thương lên tới 150 DMG).',
          cd: 'Nội tại',
        },
      ],
    },
    {
      type: 'bow',
      name: 'Cung Tên',
      tag: 'Bắn từ xa',
      damage: 8,
      cooldown: 0.8,
      icon: <Crosshair className="w-5 h-5 text-emerald-400" />,
      accentColor: 'border-emerald-500/60 bg-emerald-950/20',
      description: 'Đứng im 0.5s lấy đà trước khi bắn tên 150px gây 8 sát thương. Nếu quái đang có hiệu ứng yếu đuối, nhận x5 sát thương (40 dmg)!',
      skills: [
        {
          name: 'Nhắm Điểm Yếu',
          desc: 'Bắn 1 mũi tên xuyên thấu gây 50 sát thương và hiệu ứng Yếu Đuối 10s: quái nhận gấp 5 lần sát thương từ bắn thường!',
          cd: '13.0s',
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-2 border-zinc-700 rounded-lg shadow-2xl p-4 sm:p-6 text-zinc-100 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-amber-950 border border-amber-600 flex items-center justify-center text-xl">
              👨‍🌾
            </div>
            <div>
              <h2 className="font-pixel text-sm sm:text-base text-amber-400 tracking-wide">
                KHO VŨ KHÍ BÁC NÔNG DÂN
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Hãy chọn vũ khí thích hợp nhất để tiêu diệt lũ quái vật và khiêu chiến Trùm!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Đóng (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Weapon Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {weapons.map((w) => {
            const isEquipped = currentWeapon === w.type;

            return (
              <div
                key={w.type}
                className={`relative flex flex-col justify-between p-3 rounded border transition-all ${w.accentColor} ${
                  isEquipped ? 'ring-2 ring-amber-400 bg-zinc-800/90' : 'hover:border-zinc-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-zinc-900 border border-zinc-700">
                        {w.icon}
                      </div>
                      <span className="font-pixel text-xs text-zinc-100 font-bold">
                        {w.name}
                      </span>
                    </div>
                    {isEquipped && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-pixel bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        ĐANG DÙNG
                      </span>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-3 text-[10px] text-zinc-300 font-pixel my-1 bg-zinc-950/60 px-2 py-1 rounded">
                    <span>SÁT THƯƠNG: <strong className="text-amber-400">{w.damage}</strong></span>
                    <span>HỒI ĐÒN: <strong className="text-zinc-200">{w.cooldown}s</strong></span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
                    {w.description}
                  </p>

                  {/* Skills Section */}
                  <div className="border-t border-zinc-800/80 pt-1.5 space-y-1">
                    {w.skills.map((s, idx) => (
                      <div key={idx} className="text-[10px] text-zinc-300 bg-zinc-900/70 p-1.5 rounded">
                        <div className="flex items-center justify-between font-pixel text-[9px] text-amber-300 mb-0.5">
                          <span className="flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" /> {s.name}
                          </span>
                          <span className="text-zinc-400 text-[8px]">Hồi: {s.cd}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-tight">
                          {s.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equip Button */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectWeapon(w.type);
                    onClose();
                  }}
                  disabled={isEquipped}
                  className={`mt-2.5 w-full py-1.5 rounded font-pixel text-[10px] tracking-wider transition-all cursor-pointer ${
                    isEquipped
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-zinc-950 font-bold shadow'
                  }`}
                >
                  {isEquipped ? 'ĐÃ TRANG BỊ' : 'TRANG BỊ NGAY'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-[10px] text-zinc-400">
          <span>Phím tắt: Bấm [E] để mở kho khi lại gần bác nông dân</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 font-pixel text-[9px] cursor-pointer"
          >
            ĐÓNG [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
