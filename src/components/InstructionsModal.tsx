import React from 'react';
import { X, Sword, Navigation, Flame, Skull, ShieldCheck } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-900 border-4 border-zinc-700 rounded-xl p-5 sm:p-6 shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Title */}
        <h2 className="font-pixel text-sm sm:text-base text-amber-400 mb-3 flex items-center gap-2">
          <Sword className="w-5 h-5 text-amber-400" />
          HƯỚNG DẪN CHIẾN ĐẤU & KHO VŨ KHÍ
        </h2>

        {/* Instructions Body */}
        <div className="space-y-3 font-pixel text-xs text-zinc-200">
          {/* Controls */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-2.5 rounded-lg">
            <h3 className="text-zinc-300 mb-1.5 flex items-center gap-1.5 text-[11px]">
              <Navigation className="w-3.5 h-3.5 text-zinc-400" /> CƠ CHẾ NÚT & ĐIỀU KHIỂN:
            </h3>
            <ul className="space-y-1.5 text-[10px] text-zinc-300">
              <li>• <b className="text-amber-300">Cài đặt Di chuyển:</b> Chuyển đổi linh hoạt giữa <b className="text-white">Cần Joystick</b> và <b className="text-white">Nút bấm A, W, S, D</b> (bấm nút chuyển nhanh phía trên cần điều khiển hoặc nút ⚙️ Cài đặt).</li>
              <li>• <b className="text-sky-300">Chuột trên Máy Tính:</b>
                <span className="block pl-3 text-zinc-300">
                  - <b className="text-rose-400">Chuột Trái:</b> Đánh thường theo hướng trỏ chuột (hoặc phím <b className="text-zinc-200">Space / J</b>).
                </span>
                <span className="block pl-3 text-zinc-300">
                  - <b className="text-amber-400">Chuột Phải:</b> Kích hoạt kĩ năng theo hướng trỏ chuột (hoặc phím <b className="text-zinc-200">F / Shift</b>).
                </span>
              </li>
              <li>• <b className="text-white">Nút "Đổi":</b> Xuất hiện khi vũ khí có từ 2 kĩ năng (Kiếm Lửa) để chuyển đổi chiêu thức (phím <b className="text-zinc-200">U / Q</b>).</li>
              <li>• <b className="text-emerald-400">Tầm nhìn:</b> Giới hạn <b className="text-white">350px</b> quanh người chơi trong rừng đại ngàn sâu thẳm.</li>
            </ul>
          </div>

          {/* 4 Weapons */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-2.5 rounded-lg">
            <h3 className="text-amber-400 mb-1.5 flex items-center gap-1.5 text-[11px]">
              <Flame className="w-3.5 h-3.5 text-orange-400" /> 4 VŨ KHÍ TẠI BÁC NÔNG DÂN [E]:
            </h3>
            <ul className="space-y-1.5 text-[10px] text-zinc-300">
              <li>• <b className="text-sky-300">Kiếm Thường:</b> 20 dmg, tốc độ đánh 0.5s. Đòn thứ 3 có 40% chí mạng 160 dmg. Kĩ năng "Lướt" (hồi 1.5s): lao tới không gây sát thương. Tầm đánh 100, tốc độ di chuyển 100 (190 px/s). Hiển thị đòn 1 đến 3.</li>
              <li>• <b className="text-orange-400">Kiếm Lửa:</b> 5 dmg, tốc độ đánh 1.2s, đốt 5 HP/s trong 3s. Kĩ năng 1 "Chém Lửa" (hồi 3s): đòn kế 20 dmg + Cháy lớn 35 HP/s trong 4s. Kĩ năng 2 "Cầu Lửa" (hồi 2s): nổ sau 0.8s gây 40 dmg + Cháy lớn 35 HP/s trong 2s. Tầm đánh 90, tốc độ 95. Không hiển thị lần đánh.</li>
              <li>• <b className="text-slate-300">Kiếm Lớn:</b> 100 dmg, tốc độ đánh 1.8s. Mỗi 10 cú chém được cộng 10 sát thương (tối đa +50 dmg). Tầm đánh 120, tốc độ di chuyển 85. Hiển thị đòn 1 đến 10.</li>
              <li>• <b className="text-emerald-400">Cung:</b> Bắn tên 8 dmg, tốc độ đánh 0.8s, tầm đánh 150px, tốc độ 100. <b className="text-amber-300">Khi bắn sẽ đứng im trong 0.5s lấy đà</b> rồi mới bắn ra mũi tên. Kĩ năng "Nhắm Điểm Yếu" (hồi 13s): bắn xuyên thấu 50 dmg, gây <b className="text-red-400">Yếu Đuối 10s</b> làm quái nhận gấp 5 lần sát thương từ bắn thường (40 dmg)!</li>
            </ul>
          </div>

          {/* Monsters */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-2.5 rounded-lg">
            <h3 className="text-emerald-400 mb-1.5 flex items-center gap-1.5 text-[11px]">
              <Skull className="w-3.5 h-3.5 text-emerald-400" /> QUÁI VẬT (CÓ LẤY ĐÀ & TẦM PHÁT HIỆN):
            </h3>
            <ul className="space-y-1.5 text-[10px] text-zinc-300">
              <li>• <b className="text-slate-200">Người Xương:</b> Tầm phát hiện 200px. 250 HP, 10 dmg, tốc độ đánh 0.5s, tầm đánh 80, tốc độ 90. Cảnh báo lấy đà 0.8s (quạt đỏ 80px).</li>
              <li>• <b className="text-green-400">Slime:</b> Tầm phát hiện 180px. 350 HP, 3 dmg, tốc độ đánh 1.5s, tầm đánh 60, tốc độ 75. Cảnh báo lấy đà 0.8s, gây "Nhớp Nháp" -30% tốc chạy trong 3s!</li>
              <li>• <b className="text-indigo-400">Dơi:</b> Tầm phát hiện 450px (tai thính săn mồi từ xa). 120 HP, 5 dmg, tốc độ đánh 0.3s, tầm đánh 30, tốc độ 110. Hồi 2 HP mỗi khi cào trúng!</li>
            </ul>
          </div>

          {/* Boss */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-2.5 rounded-lg">
            <h3 className="text-rose-400 mb-1.5 flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" /> TRÙM HIỆP SĨ THIẾT GIÁP CẦM BÚA (3000 HP):
            </h3>
            <ul className="space-y-1 text-[10px] text-zinc-300">
              <li>• <b className="text-white">Đánh thường:</b> 30 sát thương mỗi 4s (<b className="text-amber-400">lấy đà 0.5s trước khi đánh</b>), tầm đánh 60, tốc độ di chuyển 60.</li>
              <li>• <b className="text-amber-400">Chiêu "Địa chấn" (hồi 7s):</b> Đứng im lấy đà 0.5s, đập búa tạo vùng đất nứt 130px gây 30 sát thương + choáng 1s, đồng thời bắn ra 6 viên đá bay vòng tròn gây 40 sát thương và choáng 1.2s. Khi đá trúng người chơi, trùm tăng tốc lên 90 trong 0.8s!</li>
              <li>• <b className="text-sky-300">Chiêu "Hất đá" (hồi 6s):</b> Dùng búa hất 3 viên đá về phía trước gây 40 sát thương và choáng 1.2s (chỉ báo tên chiêu). Khi đá trúng người chơi, trùm tăng tốc lên 90 trong 0.8s!</li>
              <li>• <b className="text-rose-400">Cuồng Nộ (&le; 1000 HP):</b> Tốc độ di chuyển tăng lên 80, thời gian hồi đòn đánh thường giảm xuống còn 3 giây!</li>
            </ul>
          </div>
        </div>

        {/* Understand Button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-pixel text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer text-center border border-zinc-500"
        >
          ĐÃ HIỂU - BẮT ĐẦU VÀO RỪNG!
        </button>
      </div>
    </div>
  );
};
