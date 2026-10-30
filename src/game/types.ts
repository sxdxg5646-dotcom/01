export type Direction = 'left' | 'right';

export interface Vector2D {
  x: number;
  y: number;
}

export type PlayerState = 'idle' | 'walk' | 'attack' | 'dash' | 'hurt' | 'dead' | 'stunned';

export type WeaponType = 'sword' | 'fire_sword' | 'greatsword' | 'bow';

export type SkillId = 'dash' | 'ignite' | 'fireball' | 'piercing_arrow';

export interface SkillConfig {
  id: SkillId;
  name: string;
  cooldown: number; // in seconds
  description: string;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  width: number;
  height: number;
  radius: number;
  facing: Direction;
  state: PlayerState;
  
  // Health
  hp: number;
  maxHp: number;
  invulnerableTimer: number;
  hurtTimer: number;
  stunTimer: number; // Stun duration in seconds
  slowTimer: number; // Slime "nhớp nháp" -30% speed for 3s

  // Weapon & Combat
  weapon: WeaponType;
  attackPower: number;
  isAttacking: boolean;
  attackTimer: number;
  attackDuration: number;
  attackCooldown: number;
  attackCooldownTimer: number;
  attackCombo: number; // 1, 2, 3
  attackAngle: number;
  attackRange: number;

  // Next attack empowered buff (for Fire Sword "Cháy" skill)
  isIgniteBuffActive: boolean;

  // Selected skill index for current weapon (if weapon has multiple skills)
  selectedSkillIndex: number;

  // Skill Cooldown Timers
  dashCooldownTimer: number;        // Kiếm thường: 1.5s
  igniteCooldownTimer: number;      // Kiếm lửa chiêu "Cháy": 3.0s
  fireballCooldownTimer: number;    // Kiếm lửa chiêu "Cầu lửa": 2.5s
  pierceCooldownTimer: number;      // Cung chiêu "Xuyên phá": 2.5s

  // Dash properties (Kiếm thường)
  isDashing: boolean;
  dashTimer: number;
  dashDuration: number;
  dashSpeed: number;

  // Kiếm Lớn đòn đánh tích lũy: mỗi đòn thứ 10 tăng 3 sát thương (tối đa +30) và giảm 0.1s hồi đánh (tối đa -1.0s)
  greatswordHits: number;

  // Stats
  level: number;
  exp: number;
  maxExp: number;
  kills: number; // Kills towards boss (0/5)
  totalKills: number;
  score: number;
  coins: number;

  // Bow charging / aiming windup (đứng im trong 0.5s trước khi bắn)
  isBowAiming?: boolean;
  bowAimTimer?: number;

  // Animation
  animFrame: number;
  animTimer: number;
}

export type MonsterType = 'slime' | 'skeleton' | 'bat' | 'boss';

export interface Monster {
  id: string;
  type: MonsterType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  width: number;
  height: number;
  radius: number;
  facing: Direction;
  
  // Health
  hp: number;
  maxHp: number;
  hurtTimer: number;
  
  // Burning Status (Hiệu ứng đốt: mất 6 hoặc 15 HP mỗi 1 giây)
  burnTimer: number;      // Remaining duration in seconds
  burnTickTimer: number;  // Interval countdown (every 1.0s)
  burnDamagePerTick: number;
  burnDamageTimer?: number;

  // Bleed Status (Hiệu ứng chảy máu: nhận gấp 5 lần sát thương với mỗi đòn đánh thường, kéo dài 5 giây)
  bleedTimer: number;
  bleedMultiplier: number;

  // AI Behavior (Detection range & Random wandering)
  detectionRange: number;
  isAggro: boolean;
  wanderTimer: number;
  wanderVx: number;
  wanderVy: number;
  
  // Combat
  damage: number;
  attackRange: number; // Tầm đánh: skeleton 100, slime 80, bat 60
  attackCooldown: number;
  attackCooldownTimer: number;
  isAttacking: boolean;
  attackTimer: number;
  attackState?: 'idle' | 'windup' | 'attacking';
  windupTimer?: number;
  windupDuration?: number;
  attackAnimTimer?: number;

  // Boss specific (Iron Armored Knight with Giant Warhammer)
  isBoss: boolean;
  bossPhase?: number; // 1 or 2
  bossActionTimer?: number;
  bossCurrentAction?: 'idle' | 'windup_melee' | 'melee_slam' | 'windup_slam' | 'slam' | 'windup_fling' | 'fling';
  bossSlamCooldown?: number;  // Địa Chấn: 7s
  bossFlingCooldown?: number; // Hất Đá: 6s (hoặc 4s khi cuồng nộ)
  speedBuffTimer?: number;    // Tăng tốc lên 90 trong 0.8s khi đá ném trúng người chơi
  bossWarningLine?: { startX: number; startY: number; endX: number; endY: number; timer: number } | null;

  // Animation
  animFrame: number;
  animTimer: number;
}

export interface NPC {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  name: string;
  role: 'farmer';
  isPlayerNear: boolean;
  dialogueText: string;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  life: number;
  maxLife: number;
  isEnemy: boolean;
  type: 'fireball' | 'shockwave' | 'magic' | 'rock' | 'player_fireball' | 'arrow' | 'piercing_arrow';
  
  // Explosive properties (for Fire Sword fireball: nổ sau 0.8s)
  isExplosive?: boolean;
  explodeRadius?: number;
  burnDuration?: number;
  burnDamagePerTick?: number;

  // Stun effect (for Boss rocks: 0.8s, shockwave: 1.0s)
  stunDuration?: number;

  // Piercing penetration counter (for Piercing Arrow)
  pierceCount?: number;
  hitMonsterIds?: string[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  type?: 'pixel' | 'smoke' | 'spark' | 'slash_arc' | 'flame' | 'rock' | 'fire_trail' | 'feather';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  size: number;
}

export interface DropItem {
  id: string;
  type: 'potion' | 'gem';
  x: number;
  y: number;
  radius: number;
  value: number;
  life: number;
  bob: number;
}

export interface Camera {
  x: number;
  y: number;
  shakeTime: number;
  shakeMagnitude: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
}
