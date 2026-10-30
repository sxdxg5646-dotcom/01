import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameState } from './game/engine';
import { soundEngine } from './game/audio';
import {
  drawForest,
  drawDropItem,
  drawMonster,
  drawNPC,
  drawPlayer,
  drawProjectile,
} from './game/sprites';
import { Joystick } from './components/Joystick';
import { DPad } from './components/DPad';
import { ActionButtons } from './components/ActionButtons';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { InstructionsModal } from './components/InstructionsModal';
import { FarmerShopModal } from './components/FarmerShopModal';
import { SettingsModal } from './components/SettingsModal';
import { Play, Sword, Trees, Flame, Compass, ShoppingBag, Settings, ZoomIn, ZoomOut } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // React state synced with game state for HUD rendering
  const [hudState, setHudState] = useState<GameState | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFarmerShopOpen, setIsFarmerShopOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Screen Zoom Level (Phóng to / Thu nhỏ màn hình: 0.65x đến 1.8x, mặc định 1.0x)
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('game_zoom_level');
      if (saved) {
        const num = parseFloat(saved);
        if (!isNaN(num) && num >= 0.65 && num <= 1.8) return num;
      }
    }
    return 1.0;
  });

  const handleSetZoomLevel = (zoom: number) => {
    const clamped = Math.max(0.65, Math.min(1.8, Math.round(zoom * 20) / 20));
    setZoomLevel(clamped);
    try {
      localStorage.setItem('game_zoom_level', String(clamped));
    } catch {}
  };

  // Movement Control Mode Setting: 'joystick' or 'wasd'
  const [controlMode, setControlMode] = useState<'joystick' | 'wasd'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('game_control_mode') as 'joystick' | 'wasd') || 'joystick';
    }
    return 'joystick';
  });

  const handleSetControlMode = (mode: 'joystick' | 'wasd') => {
    setControlMode(mode);
    try {
      localStorage.setItem('game_control_mode', mode);
    } catch {}
  };

  // Detect landscape mode
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : true
  );

  // Keyboard keys active tracking
  const keysDown = useRef<{ [key: string]: boolean }>({});
  const joystickVector = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const zoomLevelRef = useRef<number>(zoomLevel);
  zoomLevelRef.current = zoomLevel;

  // Initialize engine with 4X LARGER MAP (2800x1900)
  if (!engineRef.current) {
    engineRef.current = new GameEngine(2800, 1900);
  }

  // Handle Canvas Resizing & Orientation Switching
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const landscapeNow = width > height;
    setIsLandscape(landscapeNow);

    if (engineRef.current) {
      // Keep arena at massive 4x scale (2800x1900)
      engineRef.current.setArenaDimensions(2800, 1900);
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    const checkFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', checkFullscreen);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('fullscreenchange', checkFullscreen);
    };
  }, [handleResize]);

  // Main Render & Update Game Loop
  useEffect(() => {
    let active = true;

    const gameLoop = (time: number) => {
      if (!active) return;
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      const engine = engineRef.current;
      const canvas = canvasRef.current;

      if (engine && canvas && hasStarted) {
        // Compute Keyboard Movement Input
        let kx = 0;
        let ky = 0;
        const kd = keysDown.current;
        if (kd['KeyW'] || kd['ArrowUp']) ky -= 1;
        if (kd['KeyS'] || kd['ArrowDown']) ky += 1;
        if (kd['KeyA'] || kd['ArrowLeft']) kx -= 1;
        if (kd['KeyD'] || kd['ArrowRight']) kx += 1;

        // If joystick active, use joystick input, else use keyboard
        const jx = joystickVector.current.x;
        const jy = joystickVector.current.y;
        const jMag = Math.hypot(jx, jy);

        if (jMag > 0.05) {
          engine.setMoveInput(jx, jy);
        } else if (kx !== 0 || ky !== 0) {
          const kMag = Math.hypot(kx, ky);
          engine.setMoveInput(kx / kMag, ky / kMag);
        } else {
          engine.setMoveInput(0, 0);
        }

        // Update Physics & Entities
        engine.update(dt);
        setHudState({ ...engine.state });

        // Render Frame
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const zoom = zoomLevelRef.current || 1.0;
          ctx.save();
          ctx.scale(dpr * zoom, dpr * zoom);
          ctx.imageSmoothingEnabled = false;

          const viewW = window.innerWidth / zoom;
          const viewH = window.innerHeight / zoom;

          // Camera follow player across the 4x large map with boundary clamping
          const p = engine.state.player;
          const camShake = engine.state.camera;
          const targetCamX = p.x - viewW / 2 + camShake.x;
          const targetCamY = p.y - viewH / 2 + camShake.y;

          const minCamX = 0;
          const maxCamX = Math.max(0, engine.arenaWidth - viewW);
          const minCamY = 0;
          const maxCamY = Math.max(0, engine.arenaHeight - viewH);

          const camX = Math.max(minCamX, Math.min(maxCamX, targetCamX));
          const camY = Math.max(minCamY, Math.min(maxCamY, targetCamY));

          ctx.translate(-Math.floor(camX), -Math.floor(camY));

          // 1. Draw Forest Background: Trees, Grass, Wildflowers (No central circle!)
          drawForest(
            ctx,
            engine.arenaWidth,
            engine.arenaHeight,
            engine.state.timeElapsed,
            engine.state.bossSpawned
          );

          // 2. Draw NPC Farmer (Bác Nông Dân)
          drawNPC(ctx, engine.state.npc, engine.state.timeElapsed);

          // 3. Draw Drops (Potions, Gems)
          engine.state.drops.forEach((drop) => {
            drawDropItem(ctx, drop);
          });

          // 4. Draw Monsters & Boss (Boss has HP bar directly above head)
          engine.state.monsters.forEach((monster) => {
            drawMonster(ctx, monster);
          });

          // 5. Draw Player Knight with red cape and equipped weapon
          drawPlayer(ctx, engine.state.player);

          // 6. Draw Projectiles (Fireball, Arrows, Piercing Arrows, Rocks, Shockwaves)
          engine.state.projectiles.forEach((proj) => {
            drawProjectile(ctx, proj);
          });

          // 7. Draw Particles (Sparks, Flames, Explosion debris)
          engine.state.particles.forEach((part) => {
            ctx.save();
            ctx.globalAlpha = part.alpha;
            ctx.fillStyle = part.color;
            ctx.fillRect(
              Math.floor(part.x - part.size / 2),
              Math.floor(part.y - part.size / 2),
              Math.ceil(part.size),
              Math.ceil(part.size)
            );
            ctx.restore();
          });

          // 8. TẦM NHÌN NGƯỜI CHƠI 350PX (Player Field of View Darkness / Fog of War)
          // "Điều chỉnh tầm nhìn của người chơi xuống 350px"
          ctx.save();
          const visionRadius = 350;
          const innerRadius = 240;

          const visionGrad = ctx.createRadialGradient(
            p.x,
            p.y,
            innerRadius,
            p.x,
            p.y,
            visionRadius
          );
          visionGrad.addColorStop(0, 'rgba(4, 9, 7, 0)');
          visionGrad.addColorStop(0.65, 'rgba(4, 9, 7, 0.45)');
          visionGrad.addColorStop(0.92, 'rgba(4, 9, 7, 0.92)');
          visionGrad.addColorStop(1, 'rgba(4, 9, 7, 0.98)');

          ctx.fillStyle = visionGrad;
          ctx.fillRect(camX - 20, camY - 20, viewW + 40, viewH + 40);

          // Subtle atmospheric boundary ring at 350px
          ctx.beginPath();
          ctx.arc(p.x, p.y, visionRadius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.12)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.restore();

          // 9. Draw Floating Numbers & Stun Notifications
          engine.state.floatingTexts.forEach((ft) => {
            ctx.save();
            ctx.font = `${ft.size}px "Press Start 2P", monospace`;
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(ft.text, Math.floor(ft.x), Math.floor(ft.y));
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, Math.floor(ft.x), Math.floor(ft.y));
            ctx.restore();
          });

          ctx.restore();
        }
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [hasStarted]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      keysDown.current[e.code] = true;

      if (!hasStarted) return;
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'Space' || e.code === 'KeyJ') {
        e.preventDefault();
        engine.triggerAttack();
      } else if (e.code === 'KeyF' || e.code === 'ShiftLeft') {
        e.preventDefault();
        engine.triggerActiveSkill();
      } else if (e.code === 'KeyU' || e.code === 'KeyQ') {
        // "Đổi" kĩ năng khi vũ khí có từ 2 kĩ năng trở lên (Kiếm Lửa)
        e.preventDefault();
        engine.cycleSkill();
      } else if (e.code === 'KeyE') {
        // Mở kho vũ khí nông dân khi lại gần hoặc bấm E
        e.preventDefault();
        setIsFarmerShopOpen((prev) => !prev);
      } else if (e.code === 'Digit1') {
        e.preventDefault();
        engine.equipWeapon('sword');
      } else if (e.code === 'Digit2') {
        e.preventDefault();
        engine.equipWeapon('fire_sword');
      } else if (e.code === 'Digit3') {
        e.preventDefault();
        engine.equipWeapon('greatsword');
      } else if (e.code === 'Digit4') {
        e.preventDefault();
        engine.equipWeapon('bow');
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        if (isFarmerShopOpen) {
          setIsFarmerShopOpen(false);
        } else {
          handleTogglePause();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [hasStarted, isFarmerShopOpen]);

  // Mouse Combat Controls (Chuột trái = Đánh thường, Chuột phải = Dùng kĩ năng)
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!hasStarted) return;
      const engine = engineRef.current;
      if (!engine) return;
      const p = engine.state.player;
      if (p.hp <= 0 || p.stunTimer > 0) return;

      // Tính toạ độ người chơi trên màn hình để nhân vật quay mặt về hướng trỏ chuột
      const zoom = zoomLevelRef.current || 1.0;
      const viewW = window.innerWidth / zoom;
      const camX = Math.max(0, Math.min(engine.arenaWidth - viewW, p.x - viewW / 2 + engine.state.camera.x));
      const playerScreenX = (p.x - camX) * zoom;
      p.facing = e.clientX >= playerScreenX ? 'right' : 'left';

      if (e.button === 0) {
        // Chuột trái: Đánh thường
        engine.triggerAttack();
      } else if (e.button === 2) {
        // Chuột phải: Dùng kĩ năng
        e.preventDefault();
        engine.triggerActiveSkill();
      }
    },
    [hasStarted]
  );

  // Chặn menu chuột phải của trình duyệt trong game
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Audio Handlers
  const handleToggleSound = () => {
    const next = soundEngine.toggleSound();
    setSoundEnabled(next);
  };

  const handleToggleMusic = () => {
    const next = soundEngine.toggleMusic();
    setMusicEnabled(next);
  };

  const handleTogglePause = () => {
    if (!engineRef.current) return;
    const s = engineRef.current.state;
    if (s.status === 'playing') {
      s.status = 'paused';
    } else if (s.status === 'paused') {
      s.status = 'playing';
    }
  };

  // Fullscreen & Orientation Lock Toggle
  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        const screenAny = window.screen as unknown as { orientation?: { lock?: (type: string) => Promise<void> } };
        if (screenAny?.orientation?.lock) {
          await screenAny.orientation.lock('landscape').catch(() => {});
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      // Ignored
    }
  };

  const handleRestart = () => {
    if (!engineRef.current) return;
    engineRef.current.resetGame();
  };

  const handleNextWave = () => {
    if (!engineRef.current) return;
    engineRef.current.nextWave();
  };

  const handleStartGame = () => {
    setHasStarted(true);
    if (engineRef.current) {
      engineRef.current.resetGame();
    }
  };

  const p = hudState?.player;
  const attackCooldownPct = p && p.attackCooldown > 0 ? Math.max(0, p.attackCooldownTimer / p.attackCooldown) : 0;

  // Compute remaining cooldown and total cooldown for current active skill
  let skillCooldownRemaining = 0;
  let skillCooldownTotal = 1.5;

  if (p) {
    if (p.weapon === 'sword') {
      skillCooldownRemaining = p.dashCooldownTimer;
      skillCooldownTotal = 1.5;
    } else if (p.weapon === 'fire_sword') {
      if (p.selectedSkillIndex === 0) {
        skillCooldownRemaining = p.igniteCooldownTimer;
        skillCooldownTotal = 3.0;
      } else {
        skillCooldownRemaining = p.fireballCooldownTimer;
        skillCooldownTotal = 2.0;
      }
    } else if (p.weapon === 'bow') {
      skillCooldownRemaining = p.pierceCooldownTimer;
      skillCooldownTotal = 13.0;
    }
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-pixel select-none touch-none">
      {/* 2D Pixel Forest Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onContextMenu={(e) => e.preventDefault()}
        className="absolute inset-0 block pixel-render cursor-crosshair"
      />

      {/* Start Game Welcome Overlay */}
      {!hasStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative">
            {/* Quick Settings Button on Top-Right */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="absolute top-4 right-4 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-600 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 text-[10px] shadow"
              title="Tùy chỉnh màn hình & điều khiển"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>TÙY CHỈNH</span>
            </button>

            {/* Title Banner */}
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center mb-4 text-emerald-400 shadow-lg">
              <Trees className="w-9 h-9" />
            </div>

            <h1 className="font-pixel text-lg sm:text-2xl text-emerald-300 mb-2 tracking-wide">
              PIXEL KNIGHT: ĐẠI NGÀN
            </h1>
            <p className="font-pixel text-xs text-zinc-300 mb-4">
              4 VŨ KHÍ · KĨ NĂNG ĐỘC ĐÁO · TRÙM HIỆP SĨ BÚA
            </p>

            {/* Quick Screen Zoom Bar directly on the outer menu */}
            <div className="w-full bg-zinc-950/90 border border-zinc-800 rounded-lg p-3 mb-3 text-left">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>PHÓNG TO / THU NHỎ MÀN HÌNH:</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetZoomLevel(Math.max(0.65, Math.round((zoomLevel - 0.1) * 20) / 20))}
                  className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer flex items-center gap-1 text-[10px] active:scale-95"
                  title="Thu nhỏ 10%"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Thu nhỏ</span>
                </button>
                <div className="flex-1 grid grid-cols-4 gap-1">
                  {[
                    { label: '75%', val: 0.75 },
                    { label: '100%', val: 1.0 },
                    { label: '125%', val: 1.25 },
                    { label: '150%', val: 1.5 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => handleSetZoomLevel(preset.val)}
                      className={`py-1 rounded text-[9px] border cursor-pointer transition-all ${
                        Math.abs(zoomLevel - preset.val) < 0.04
                          ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 font-bold shadow'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleSetZoomLevel(Math.min(1.8, Math.round((zoomLevel + 0.1) * 20) / 20))}
                  className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer flex items-center gap-1 text-[10px] active:scale-95"
                  title="Phóng to 10%"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Phóng to</span>
                </button>
              </div>
            </div>

            {/* Mission Briefing */}
            <div className="w-full bg-zinc-950/90 border border-zinc-800 rounded-lg p-3 sm:p-3.5 mb-4 space-y-2 text-left text-xs">
              <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span>Bản đồ rừng đại ngàn: Tầm nhìn 350px quanh người chơi.</span>
              </div>
              <div className="flex items-center gap-2 text-amber-300 text-[11px]">
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span>Gặp Bác Nông Dân [E]: <b>Kiếm Thường, Kiếm Lửa, Kiếm Lớn, Cung</b>.</span>
              </div>
              <div className="flex items-center gap-2 text-sky-400 text-[11px]">
                <Sword className="w-3.5 h-3.5 shrink-0" />
                <span>PC: <b>Chuột trái</b> = Đánh thường, <b>Chuột phải</b> = Kĩ năng, <b>W,A,S,D</b> = Di chuyển.</span>
              </div>
            </div>

            {/* Action Buttons: Play & Settings */}
            <div className="w-full flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleStartGame}
                className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-100 font-pixel text-xs sm:text-sm font-bold shadow-2xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-2 border-emerald-400"
              >
                <Play className="w-4 h-4 fill-zinc-100" />
                BẮT ĐẦU CHIẾN ĐẤU
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-pixel text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-2 border-zinc-600"
                title="Mở bảng cài đặt tùy chỉnh màn hình & điều khiển"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span>TÙY CHỈNH</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game HUD (Only Red HP Bar, Monsters Defeated underneath, Audio & Fullscreen buttons) */}
      {hasStarted && hudState && (
        <>
          <GameHUD
            state={hudState}
            soundEnabled={soundEnabled}
            musicEnabled={musicEnabled}
            isLandscape={isLandscape}
            isFullscreen={isFullscreen}
            onToggleSound={handleToggleSound}
            onToggleMusic={handleToggleMusic}
            onTogglePause={handleTogglePause}
            onToggleFullscreen={handleToggleFullscreen}
            onOpenFarmerShop={() => setIsFarmerShopOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* Quick Movement Control Toggle (Chuyển nhanh giữa Joystick và Nút bấm A,W,S,D) */}
          <div
            className={`fixed z-30 select-none ${
              isLandscape
                ? 'bottom-32 left-3 sm:bottom-36 sm:left-5'
                : 'bottom-40 left-4 sm:bottom-44 sm:left-6'
            }`}
          >
            <div className="bg-zinc-950/90 border border-zinc-700/90 rounded-lg p-0.5 shadow-xl backdrop-blur-md flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => handleSetControlMode('joystick')}
                className={`px-2 py-1 rounded text-[8px] font-pixel transition-all cursor-pointer flex items-center gap-1 ${
                  controlMode === 'joystick'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Dùng Cần Xoay Joystick"
              >
                <span>🕹️</span>
                <span>Cần</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetControlMode('wasd')}
                className={`px-2 py-1 rounded text-[8px] font-pixel transition-all cursor-pointer flex items-center gap-1 ${
                  controlMode === 'wasd'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Dùng Nút Bấm A,W,S,D"
              >
                <span>⌨️</span>
                <span>A,W,S,D</span>
              </button>
            </div>
          </div>

          {/* Virtual Movement Control (Joystick OR WASD D-Pad per user setting) */}
          {controlMode === 'joystick' ? (
            <Joystick
              onMove={(x, y) => {
                joystickVector.current = { x, y };
              }}
              externalMoveVector={hudState.moveVector}
              isLandscape={isLandscape}
            />
          ) : (
            <DPad
              onMove={(x, y) => {
                joystickVector.current = { x, y };
              }}
              externalMoveVector={hudState.moveVector}
              isLandscape={isLandscape}
            />
          )}

          {/* Action Buttons: Đánh (kèm đếm ngược hồi đòn), 1 Nút Kĩ Năng và Nút "Đổi" phía trên (Góc Phải Màn Hình) */}
          <ActionButtons
            onAttack={() => engineRef.current?.triggerAttack()}
            onSkill={() => engineRef.current?.triggerActiveSkill()}
            onCycleSkill={() => engineRef.current?.cycleSkill()}
            weapon={p?.weapon}
            selectedSkillIndex={p?.selectedSkillIndex}
            attackCooldownPct={attackCooldownPct}
            attackCooldownRemaining={p?.attackCooldownTimer || 0}
            attackCooldownTotal={p?.attackCooldown || 0.5}
            skillCooldownRemaining={skillCooldownRemaining}
            skillCooldownTotal={skillCooldownTotal}
            comboStep={p?.attackCombo || 1}
            greatswordHits={p?.greatswordHits || 0}
            isLandscape={isLandscape}
          />

          {/* Farmer Weapon Arsenal Modal */}
          <FarmerShopModal
            isOpen={isFarmerShopOpen}
            onClose={() => setIsFarmerShopOpen(false)}
            currentWeapon={p?.weapon || 'sword'}
            onSelectWeapon={(w) => engineRef.current?.equipWeapon(w)}
          />

          {/* Game Over / Victory Modal */}
          <GameOverModal
            state={hudState}
            onRestart={handleRestart}
            onNextWave={handleNextWave}
          />

          {/* Help Instructions Modal */}
          <InstructionsModal
            isOpen={isHelpOpen}
            onClose={() => setIsHelpOpen(false)}
          />
        </>
      )}

      {/* Settings Modal (Cài đặt Joystick / WASD, Phóng to / Thu nhỏ màn hình, chuột & bàn phím, tầm nhìn) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        controlMode={controlMode}
        onChangeControlMode={handleSetControlMode}
        zoomLevel={zoomLevel}
        onChangeZoomLevel={handleSetZoomLevel}
      />
    </div>
  );
}
