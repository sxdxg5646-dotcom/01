import { soundEngine } from './audio';
import {
  Camera,
  Direction,
  DropItem,
  FloatingText,
  Monster,
  MonsterType,
  NPC,
  Particle,
  Player,
  Projectile,
} from './types';

export interface GameState {
  player: Player;
  monsters: Monster[];
  projectiles: Projectile[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  drops: DropItem[];
  npc: NPC;
  camera: Camera;
  
  // Progression
  killsToBoss: number; // 5 monsters required
  bossSpawned: boolean;
  bossDefeated: boolean;
  bossWarningTimer: number; // For the "TRÙM XUẤT HIỆN" banner animation
  wave: number;
  
  // Game Status
  status: 'playing' | 'boss_alert' | 'game_over' | 'victory' | 'paused';
  timeElapsed: number;
  
  // Input
  moveVector: { x: number; y: number };
}

export class GameEngine {
  public static readonly SPEED_SCALE: number = 1.9; // Scale factor so stat 100 moves at a fast, responsive 190 px/s
  public state: GameState;
  // Map is made 4x larger (previously ~1400x950 -> now 2800x1900, area = 4x!)
  public arenaWidth: number = 2800;
  public arenaHeight: number = 1900;
  private spawnTimer: number = 0;
  private nextEntityId: number = 1;
  private dashedHitMonsterIds: Set<string> = new Set();

  constructor(width: number = 2800, height: number = 1900) {
    this.arenaWidth = width;
    this.arenaHeight = height;
    this.state = this.createInitialState();
  }

  public setArenaDimensions(width: number, height: number) {
    this.arenaWidth = Math.max(2600, width);
    this.arenaHeight = Math.max(1800, height);
  }

  public createInitialState(): GameState {
    const player: Player = {
      x: 520,
      y: 480,
      vx: 0,
      vy: 0,
      speed: 100,
      width: 24,
      height: 32,
      radius: 14,
      facing: 'right',
      state: 'idle',
      
      hp: 200,
      maxHp: 200,
      invulnerableTimer: 0,
      hurtTimer: 0,
      stunTimer: 0,
      slowTimer: 0,
      
      // Default Weapon: Kiếm Thường (20 Sát thương, hồi đòn 0.5s, tầm đánh 100, tốc độ 100)
      weapon: 'sword',
      attackPower: 20,
      isAttacking: false,
      attackTimer: 0,
      attackDuration: 0.18,
      attackCooldown: 0.5,
      attackCooldownTimer: 0,
      attackCombo: 1,
      attackAngle: 0,
      attackRange: 100,

      // Fire Sword "Cháy" buff
      isIgniteBuffActive: false,

      // Selected skill index for current weapon
      selectedSkillIndex: 0,

      // Skill Cooldowns
      dashCooldownTimer: 0,
      igniteCooldownTimer: 0,
      fireballCooldownTimer: 0,
      pierceCooldownTimer: 0,
      
      // Dash: hồi chiêu 1.5s, lướt ngắn gây 15 sát thương
      isDashing: false,
      dashTimer: 0,
      dashDuration: 0.22,
      dashSpeed: 520,

      // Kiếm Lớn tích lũy đòn đánh
      greatswordHits: 0,
      
      level: 1,
      exp: 0,
      maxExp: 100,
      kills: 0,
      totalKills: 0,
      score: 0,
      coins: 20,
      
      animFrame: 0,
      animTimer: 0,
    };

    const npc: NPC = {
      id: 'npc_farmer',
      x: 400,
      y: 380,
      width: 24,
      height: 32,
      radius: 28,
      name: 'Bác Nông Dân',
      role: 'farmer',
      isPlayerNear: false,
      dialogueText: 'Chào hiệp sĩ! Ta có đủ kho vũ khí: Kiếm Mặc Định, Kiếm Lửa, Kiếm Lớn và Cung Tên!',
    };

    return {
      player,
      monsters: [],
      projectiles: [],
      particles: [],
      floatingTexts: [],
      drops: [],
      npc,
      camera: { x: 0, y: 0, shakeTime: 0, shakeMagnitude: 0 },
      killsToBoss: 12, // 12 quái vật để triệu hồi Boss per user request
      bossSpawned: false,
      bossDefeated: false,
      bossWarningTimer: 0,
      wave: 1,
      status: 'playing',
      timeElapsed: 0,
      moveVector: { x: 0, y: 0 },
    };
  }

  public resetGame() {
    this.state = this.createInitialState();
    // Spawn initial monsters spread across the huge forest map
    for (let i = 0; i < 5; i++) {
      this.spawnMonster();
    }
  }

  public nextWave() {
    const oldPlayer = this.state.player;
    this.state = this.createInitialState();
    this.state.wave += 1;
    this.state.player = {
      ...oldPlayer,
      hp: oldPlayer.maxHp,
      kills: 0,
    };
    for (let i = 0; i < 6; i++) {
      this.spawnMonster();
    }
  }

  // --- WEAPON & NPC INTERACTION ---
  public equipWeapon(weapon: 'sword' | 'fire_sword' | 'greatsword' | 'bow') {
    const p = this.state.player;
    p.weapon = weapon;
    p.selectedSkillIndex = 0;
    p.isIgniteBuffActive = false;
    p.attackCombo = 1;
    p.attackCooldownTimer = 0;

    if (weapon === 'sword') {
      p.attackPower = 20;
      p.attackCooldown = 0.5;
      p.attackRange = 100;
      p.speed = 100;
    } else if (weapon === 'fire_sword') {
      p.attackPower = 5;
      p.attackCooldown = 1.2;
      p.attackRange = 90;
      p.speed = 95;
    } else if (weapon === 'greatsword') {
      const stacks = Math.min(5, Math.floor((p.greatswordHits || 0) / 10));
      p.attackPower = 100 + stacks * 10;
      p.attackCooldown = 1.8;
      p.attackRange = 120;
      p.speed = 85;
    } else if (weapon === 'bow') {
      p.attackPower = 8;
      p.attackCooldown = 0.8;
      p.attackRange = 150; // Giảm tầm đánh của cung xuống 150px per user request
      p.speed = 100;
    }

    soundEngine.playLevelUp();
    this.addCameraShake(0.2, 4);

    const weaponTitles: Record<string, string> = {
      sword: 'KIẾM THƯỜNG ⚔️',
      fire_sword: 'KIẾM LỬA 🔥',
      greatsword: 'KIẾM LỚN 🗡️',
      bow: 'CUNG TÊN 🏹',
    };

    this.addFloatingText(p.x, p.y - 45, `ĐÃ TRANG BỊ: ${weaponTitles[weapon]}`, '#facc15', 15);

    // Sparks
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 100 + 30;
      this.state.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: weapon === 'fire_sword' ? '#f97316' : weapon === 'bow' ? '#38bdf8' : '#e2e8f0',
        size: Math.random() * 3 + 2,
        life: 0.4,
        maxLife: 0.4,
        alpha: 1,
      });
    }
  }

  // Legacy helper
  public equipFireSword() {
    this.equipWeapon('fire_sword');
  }

  // Toggles / Cycles through skills when weapon has multiple skills (e.g. Kiếm Lửa)
  public cycleSkill() {
    const p = this.state.player;
    if (p.weapon === 'fire_sword') {
      p.selectedSkillIndex = p.selectedSkillIndex === 0 ? 1 : 0;
      soundEngine.playTalk();
      const name = p.selectedSkillIndex === 0 ? 'KĨ NĂNG: CHÉM LỬA 🔥' : 'KĨ NĂNG: CẦU LỬA 💥';
      this.addFloatingText(p.x, p.y - 35, `ĐỔI THÀNH: ${name}`, '#f97316', 13);
    }
  }

  // Helper for applying burn damage over time (mất 5Hp hoặc 15/25Hp mỗi 1 giây kéo dài trong X giây)
  public applyBurn(monster: Monster, duration: number, damagePerTick: number = 5) {
    monster.burnTimer = Math.max(monster.burnTimer, duration);
    monster.burnDamagePerTick = Math.max(monster.burnDamagePerTick || 0, damagePerTick);
    if (monster.burnTickTimer <= 0) {
      monster.burnTickTimer = 1.0;
    }
  }

  // Helper for applying bleed status (quái vật nhận gấp 5 lần sát thương với mỗi đòn đánh thường, kéo dài 5 giây)
  public applyBleed(monster: Monster, duration: number = 5.0, multiplier: number = 5.0) {
    monster.bleedTimer = Math.max(monster.bleedTimer || 0, duration);
    monster.bleedMultiplier = multiplier;
  }

  // --- INPUT HANDLERS ---
  public setMoveInput(x: number, y: number) {
    this.state.moveVector = { x, y };
  }

  public triggerAttack() {
    const p = this.state.player;
    if (p.isAttacking || p.attackCooldownTimer > 0 || p.stunTimer > 0 || p.state === 'dead' || this.state.status === 'paused') {
      return;
    }

    // 1. CUNG (Bow): Bắn mũi tên từ xa gây 8 sát thương, đứng im lấy đà trong 0.5s trước khi bắn tên
    // Đánh thường sẽ luôn bay đến mục tiêu gần nhất trong 150px
    if (p.weapon === 'bow') {
      if (p.isBowAiming) return;
      p.isBowAiming = true;
      p.bowAimTimer = 0.5; // Đứng im trong 0,5 giây sau đó mới bắn ra mũi tên
      p.state = 'attack';
      p.vx = 0;
      p.vy = 0;
      return;
    }

    // 2. MELEE WEAPONS (Sword, Fire Sword, Greatsword)
    p.isAttacking = true;
    p.state = 'attack';
    p.attackTimer = p.attackDuration;

    if (p.weapon === 'greatsword') {
      p.greatswordHits = (p.greatswordHits || 0) + 1;
      const stacks = Math.min(5, Math.floor(p.greatswordHits / 10));
      p.attackPower = 100 + stacks * 10;
      p.attackCooldown = 1.8;
      if (p.greatswordHits % 10 === 0 && p.greatswordHits <= 50) {
        soundEngine.playLevelUp();
        this.addFloatingText(p.x, p.y - 45, `KIẾM LỚN TIẾN HÓA! [${stacks}/5] (+10 DMG)`, '#facc15', 14);
      }
    }

    p.attackCombo = p.attackCombo >= 3 ? 1 : p.attackCombo + 1;
    soundEngine.playSlash(p.attackCombo);

    this.checkPlayerAttackHit();
  }

  /**
   * Fires the bow arrow after 0.5s windup stand-still
   */
  public executeBowShot() {
    const p = this.state.player;
    if (p.state === 'dead' || this.state.status === 'paused') return;

    p.isAttacking = true;
    p.state = 'attack';
    p.attackTimer = 0.18;
    p.attackCooldownTimer = 0.8; // Hồi nút tấn công 0.8s sau khi bắn

    soundEngine.playBowShoot();

    // Find nearest active monster within 150px
    const bowRange = p.attackRange || 150; // Giảm tầm đánh của cung xuống 150px
    let nearestMonster: Monster | null = null;
    let minDist = bowRange;
    this.state.monsters.forEach((m) => {
      if (m.hp > 0) {
        const d = Math.hypot(m.x - p.x, m.y - p.y);
        if (d <= minDist) {
          minDist = d;
          nearestMonster = m;
        }
      }
    });

    const speed = 480;
    let dirX: number;
    let dirY: number;
    // Bay tối đa 150px
    const maxLife = bowRange / speed;
    let lifeDuration = maxLife;

    if (nearestMonster) {
      // Target found within 150px! Fly towards target
      const target = nearestMonster as Monster;
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      dirX = dx / dist;
      dirY = dy / dist;
      p.facing = dirX >= 0 ? 'right' : 'left';
      lifeDuration = Math.min(maxLife, (dist + 24) / speed);
    } else {
      // No target found within 150px: flies in facing direction up to 150px and disappears!
      dirX = p.facing === 'right' ? 1 : -1;
      dirY = 0;
      lifeDuration = maxLife;
    }

    this.state.projectiles.push({
      id: `arrow_${this.nextEntityId++}`,
      x: p.x + dirX * 18,
      y: p.y - 1,
      vx: dirX * speed,
      vy: dirY * speed,
      radius: 6,
      damage: 8, // 8 sát thương bắn thường
      color: '#cbd5e1',
      life: lifeDuration,
      maxLife: lifeDuration,
      isEnemy: false,
      type: 'arrow',
    });
  }

  /**
   * Main unified skill trigger method:
   * Triggers the active skill based on the current weapon and selectedSkillIndex
   */
  public triggerActiveSkill() {
    const p = this.state.player;
    if (p.stunTimer > 0 || p.state === 'dead' || this.state.status === 'paused') {
      return;
    }

    if (p.weapon === 'sword') {
      // Kiếm thường: Kĩ năng là "Lướt" (hồi chiêu 1.5s, lao về phía trước không gây sát thương)
      this.triggerDash();
    } else if (p.weapon === 'fire_sword') {
      if (p.selectedSkillIndex === 0) {
        // Kiếm lửa: Kĩ năng "Chém lửa" (hồi chiêu 3s, cường hóa đòn đánh tiếp theo 20 dmg + cháy lớn 35 HP/s trong 4s)
        this.triggerIgniteSkill();
      } else {
        // Kiếm lửa: Kĩ năng "Cầu lửa" (hồi chiêu 2s, nổ sau 0.8s gây 40 dmg + cháy lớn 35 HP/s trong 2s)
        this.triggerFireballSkill();
      }
    } else if (p.weapon === 'bow') {
      // Cung: Kĩ năng "Nhắm điểm yếu" (hồi chiêu 13s, bắn mũi tên xuyên thấu 50 dmg + yếu đuối x5 trong 10s)
      this.triggerPiercingArrowSkill();
    }
  }

  /**
   * Kiếm thường - Kĩ năng: "Lướt"
   * Lao về phía trước 1 đoạn ngắn không gây sát thương, thời gian hồi chiêu 1,5 giây
   */
  public triggerDash() {
    const p = this.state.player;
    if (p.isDashing || p.dashCooldownTimer > 0 || p.stunTimer > 0 || p.state === 'dead' || this.state.status === 'paused') {
      return;
    }

    p.isDashing = true;
    p.dashTimer = p.dashDuration;
    p.dashCooldownTimer = 1.5; // hồi chiêu 1.5s per user request
    p.invulnerableTimer = p.dashDuration + 0.05;
    p.state = 'dash';
    this.dashedHitMonsterIds.clear();
    soundEngine.playDash();

    // Dash trail particles
    for (let i = 0; i < 10; i++) {
      this.state.particles.push({
        x: p.x + (Math.random() - 0.5) * 16,
        y: p.y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        color: '#38bdf8',
        size: Math.random() * 3 + 2,
        life: 0.25,
        maxLife: 0.25,
        alpha: 1,
      });
    }
  }

  /**
   * Kiếm lửa - Kĩ năng 1: "Chém lửa"
   * Cường hóa đòn đánh thường tiếp theo gây 20 sát thương và hiệu ứng "cháy lớn" khiến quái mất 35Hp mỗi giây trong 4 giây, hồi chiêu 3 giây.
   */
  public triggerIgniteSkill() {
    const p = this.state.player;
    if (p.igniteCooldownTimer > 0 || p.stunTimer > 0 || p.state === 'dead' || this.state.status === 'paused') {
      return;
    }

    p.igniteCooldownTimer = 3.0; // 3 giây hồi chiêu per user request
    p.isIgniteBuffActive = true;
    soundEngine.playLevelUp();
    this.addFloatingText(p.x, p.y - 35, 'CƯỜNG HÓA CHÉM LỬA! 🔥 (Đòn kế: 20 dmg + Cháy lớn)', '#ef4444', 13);

    // Blazing aura particles around player
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 70 + 20;
      this.state.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color: Math.random() > 0.5 ? '#ef4444' : '#f97316',
        size: Math.random() * 4 + 2,
        life: 0.45,
        maxLife: 0.45,
        alpha: 1,
        type: 'flame',
      });
    }
  }

  /**
   * Kiếm lửa - Kĩ năng 2: "Cầu lửa"
   * Bắn cầu lửa về phía trước và phát nổ sau 0,8 giây gây 40 sát thương và hiệu ứng "cháy lớn" làm quái mất 35Hp mỗi giây trong 2 giây, hồi chiêu 2 giây.
   */
  public triggerFireballSkill() {
    const p = this.state.player;
    if (p.fireballCooldownTimer > 0 || p.stunTimer > 0 || p.state === 'dead' || this.state.status === 'paused') {
      return;
    }

    p.fireballCooldownTimer = 2.0; // hồi chiêu 2 giây per user request
    soundEngine.playBossFireball();

    const dirX = p.facing === 'right' ? 1 : -1;
    const speed = 270;

    this.state.projectiles.push({
      id: `fireball_${this.nextEntityId++}`,
      x: p.x + dirX * 22,
      y: p.y - 2,
      vx: dirX * speed,
      vy: 0,
      radius: 12,
      damage: 40, // 40 sát thương nổ lan per user request
      color: '#ea580c',
      life: 0.8, // phát nổ sau 0.8 giây per user request
      maxLife: 0.8,
      isEnemy: false,
      type: 'player_fireball',
      isExplosive: true,
      explodeRadius: 135,
      burnDuration: 2.0, // đốt 2 giây
      burnDamagePerTick: 35, // mất 35Hp mỗi 1 giây
    });

    this.addFloatingText(p.x, p.y - 35, 'CẦU LỬA! (Nổ sau 0.8s) 💥', '#ea580c', 13);
  }

  /**
   * Cung - Kĩ năng: "Nhắm điểm yếu"
   * Bắn 1 mũi tên về phía trước gây 50 sát thương cho những quái vật mũi tên đi qua khiến chúng nhận hiệu ứng "yếu đuối" làm chúng nhận gấp 5 lần sát thương từ bắn thường trong 10 giây, hồi chiêu 13 giây.
   */
  public triggerPiercingArrowSkill() {
    const p = this.state.player;
    if (p.pierceCooldownTimer > 0 || p.stunTimer > 0 || p.state === 'dead' || this.state.status === 'paused') {
      return;
    }

    p.pierceCooldownTimer = 13.0; // 13 giây hồi chiêu per user request
    soundEngine.playPierceShoot();

    // Target nearest active monster
    let targetX = p.facing === 'right' ? p.x + 300 : p.x - 300;
    let targetY = p.y;
    let minDist = Infinity;

    this.state.monsters.forEach((m) => {
      if (m.hp > 0) {
        const d = Math.hypot(m.x - p.x, m.y - p.y);
        if (d < minDist) {
          minDist = d;
          targetX = m.x;
          targetY = m.y;
        }
      }
    });

    const dx = targetX - p.x;
    const dy = targetY - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Face towards shot
    p.facing = dirX >= 0 ? 'right' : 'left';

    const speed = 520;
    this.state.projectiles.push({
      id: `pierce_${this.nextEntityId++}`,
      x: p.x + dirX * 20,
      y: p.y - 2,
      vx: dirX * speed,
      vy: dirY * speed,
      radius: 8,
      damage: 50, // 50 sát thương per user request
      color: '#38bdf8',
      life: 2.8,
      maxLife: 2.8,
      isEnemy: false,
      type: 'piercing_arrow',
      pierceCount: 6,
      hitMonsterIds: [],
    });

    this.addFloatingText(p.x, p.y - 35, 'NHẮM ĐIỂM YẾU! 🏹 (-50 DMG)', '#38bdf8', 14);
  }

  // --- SPAWNING LOGIC ---
  public spawnMonster(forceType?: MonsterType) {
    if (this.state.bossSpawned) return;

    let type: MonsterType = forceType || 'slime';
    if (!forceType) {
      const rand = Math.random();
      if (rand < 0.5) type = 'slime';
      else if (rand < 0.8) type = 'skeleton';
      else type = 'bat';
    }

    const p = this.state.player;
    let spawnX = 0;
    let spawnY = 0;
    let distance = 0;

    let attempts = 0;
    do {
      spawnX = 100 + Math.random() * (this.arenaWidth - 200);
      spawnY = 100 + Math.random() * (this.arenaHeight - 200);
      distance = Math.hypot(spawnX - p.x, spawnY - p.y);
      attempts++;
    } while (distance < 280 && attempts < 15);

    const waveMult = 1 + (this.state.wave - 1) * 0.25;

    let monster: Monster;
    if (type === 'slime') {
      // Slime: 350 HP, sát thương 3, hồi tấn công 1.5s, tầm đánh 60, tốc độ 75
      monster = {
        id: `monster_${this.nextEntityId++}`,
        type: 'slime',
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 0,
        speed: 75 * waveMult,
        width: 24,
        height: 20,
        radius: 12,
        facing: spawnX < p.x ? 'right' : 'left',
        hp: 350 * waveMult,
        maxHp: 350 * waveMult,
        hurtTimer: 0,
        burnTimer: 0,
        burnTickTimer: 0,
        burnDamagePerTick: 5,
        burnDamageTimer: 0,
        bleedTimer: 0,
        bleedMultiplier: 1.0,
        detectionRange: 180, // Quái slime: tầm phát hiện 180px per user request
        isAggro: false,
        wanderTimer: Math.random() * 2,
        wanderVx: 0,
        wanderVy: 0,
        damage: 3 * waveMult,
        attackRange: 60,
        attackCooldown: 1.5,
        attackCooldownTimer: 0,
        isAttacking: false,
        attackTimer: 0,
        attackState: 'idle',
        windupTimer: 0,
        windupDuration: 0.80, // Tăng thời gian cảnh báo lên 0.8 giây
        attackAnimTimer: 0,
        isBoss: false,
        animFrame: 0,
        animTimer: Math.random() * 5,
      };
    } else if (type === 'skeleton') {
      // Skeleton Swordsman: 250 HP, sát thương 10, hồi tấn công 0.5s, tầm đánh 80, tốc độ 90
      monster = {
        id: `monster_${this.nextEntityId++}`,
        type: 'skeleton',
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 0,
        speed: 90 * waveMult,
        width: 24,
        height: 32,
        radius: 14,
        facing: spawnX < p.x ? 'right' : 'left',
        hp: 250 * waveMult,
        maxHp: 250 * waveMult,
        hurtTimer: 0,
        burnTimer: 0,
        burnTickTimer: 0,
        burnDamagePerTick: 5,
        burnDamageTimer: 0,
        bleedTimer: 0,
        bleedMultiplier: 1.0,
        detectionRange: 200, // Quái xương: tầm phát hiện 200px per user request
        isAggro: false,
        wanderTimer: Math.random() * 2,
        wanderVx: 0,
        wanderVy: 0,
        damage: 10 * waveMult,
        attackRange: 80,
        attackCooldown: 0.5,
        attackCooldownTimer: 0,
        isAttacking: false,
        attackTimer: 0,
        attackState: 'idle',
        windupTimer: 0,
        windupDuration: 0.80, // Tăng thời gian cảnh báo lên 0.8 giây
        attackAnimTimer: 0,
        isBoss: false,
        animFrame: 0,
        animTimer: Math.random() * 5,
      };
    } else { // Bat
      // Bat: 120 HP, sát thương 5, hồi tấn công 0.3s, tầm đánh 30, tốc độ 110, hút 2 HP khi đánh trúng
      monster = {
        id: `monster_${this.nextEntityId++}`,
        type: 'bat',
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 0,
        speed: 110 * waveMult,
        width: 20,
        height: 18,
        radius: 10,
        facing: spawnX < p.x ? 'right' : 'left',
        hp: 120 * waveMult,
        maxHp: 120 * waveMult,
        hurtTimer: 0,
        burnTimer: 0,
        burnTickTimer: 0,
        burnDamagePerTick: 5,
        burnDamageTimer: 0,
        bleedTimer: 0,
        bleedMultiplier: 1.0,
        detectionRange: 450, // Quái dơi: tầm phát hiện 450px per user request
        isAggro: false,
        wanderTimer: Math.random() * 2,
        wanderVx: 0,
        wanderVy: 0,
        damage: 5 * waveMult,
        attackRange: 30,
        attackCooldown: 0.3,
        attackCooldownTimer: 0,
        isAttacking: false,
        attackTimer: 0,
        attackState: 'idle',
        windupTimer: 0,
        windupDuration: 0.18,
        attackAnimTimer: 0,
        isBoss: false,
        animFrame: 0,
        animTimer: Math.random() * 5,
      };
    }

    this.state.monsters.push(monster);
  }

  /**
   * Spawns the Iron Armored Knight Boss with Giant Warhammer at a RANDOM location
   * Boss có 1200 máu, sát thương 30, thời gian hồi tấn công 2.0s
   */
  public spawnBoss() {
    this.state.bossSpawned = true;
    this.state.bossWarningTimer = 3.0;
    this.state.status = 'boss_alert';

    soundEngine.playBossRoar();
    this.addCameraShake(0.6, 9);

    const waveMult = 1 + (this.state.wave - 1) * 0.35;

    // Randomize Boss spawn location across the 4x forest map
    const p = this.state.player;
    let bossX = 0;
    let bossY = 0;
    let attempts = 0;
    do {
      bossX = 200 + Math.random() * (this.arenaWidth - 400);
      bossY = 200 + Math.random() * (this.arenaHeight - 400);
      attempts++;
    } while (Math.hypot(bossX - p.x, bossY - p.y) < 320 && attempts < 25);

    const boss: Monster = {
      id: `boss_${this.nextEntityId++}`,
      type: 'boss',
      x: bossX,
      y: bossY,
      vx: 0,
      vy: 0,
      speed: 60 * waveMult,
      width: 64,
      height: 72,
      radius: 36,
      facing: bossX > p.x ? 'left' : 'right',
      hp: 3000 * waveMult,
      maxHp: 3000 * waveMult,
      hurtTimer: 0,
      burnTimer: 0,
      burnTickTimer: 0,
      burnDamagePerTick: 5,
      burnDamageTimer: 0,
      bleedTimer: 0,
      bleedMultiplier: 1.0,
      detectionRange: 800, // Boss detects player from far away
      isAggro: true,
      wanderTimer: 0,
      wanderVx: 0,
      wanderVy: 0,
      damage: 30 * waveMult,
      attackRange: 60,
      attackCooldown: 4.0,
      attackCooldownTimer: 2.0,
      isAttacking: false,
      attackTimer: 0,
      isBoss: true,
      bossPhase: 1,
      bossActionTimer: 0,
      bossCurrentAction: 'idle',
      bossSlamCooldown: 3.5,  // Hồi chiêu 7s sau lần dùng đầu
      bossFlingCooldown: 5.0, // Hồi chiêu 6s sau lần dùng đầu
      speedBuffTimer: 0,
      animFrame: 0,
      animTimer: 0,
    };

    this.state.monsters.push(boss);

    // Summoning particles at boss spawn location
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 150 + 40;
      this.state.particles.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
        size: Math.random() * 4 + 3,
        life: 1.2,
        maxLife: 1.2,
        alpha: 1,
        type: 'flame',
      });
    }
  }

  public addCameraShake(duration: number, magnitude: number) {
    this.state.camera.shakeTime = duration;
    this.state.camera.shakeMagnitude = magnitude;
  }

  // --- COMBAT HITBOX CHECKS ---
  private checkPlayerAttackHit() {
    const p = this.state.player;
    const isCombo3 = p.attackCombo === 3;
    let damage = p.attackPower;
    let isCrit = false;

    // 1. KIẾM THƯỜNG: Sát thương 20, tốc độ đánh 0,5 giây. Mỗi đòn đánh thứ 3 có tỉ lệ 40% chí mạng gây 160 sát thương.
    if (p.weapon === 'sword') {
      p.attackCooldown = 0.5;
      if (isCombo3) {
        if (Math.random() < 0.4) {
          isCrit = true;
          damage = 160;
        } else {
          damage = 20;
        }
      } else {
        damage = 20;
      }
    }
    // 2. KIẾM LỬA: Sát thương 5, tốc độ đánh 1,2 giây. Đốt mất 5 HP/s trong 3 giây. Kĩ năng "Chém lửa": đòn kế 20 dmg + cháy lớn mất 35 HP/s trong 4s
    else if (p.weapon === 'fire_sword') {
      p.attackCooldown = 1.2;
      if (p.isIgniteBuffActive) {
        damage = 20;
        p.isIgniteBuffActive = false; // consume buff
      } else {
        damage = 5;
      }
    }
    // 3. KIẾM LỚN: Sát thương 100, tốc độ đánh 1,8 giây. Mỗi 10 cú chém được cộng 10 sát thương (tối đa 50 sát thương, max 150 DMG)
    else if (p.weapon === 'greatsword') {
      const stacks = Math.min(5, Math.floor((p.greatswordHits || 0) / 10));
      damage = 100 + stacks * 10;
      p.attackCooldown = 1.8;
    }

    const hitRadius = p.attackRange * (p.weapon === 'greatsword' ? 1.25 : isCombo3 ? 1.15 : 1.0);
    let hitAny = false;

    this.state.monsters.forEach((monster) => {
      const dx = monster.x - p.x;
      const dy = monster.y - p.y;
      const dist = Math.hypot(dx, dy);

      const inFront = (p.facing === 'right' && dx >= -15) || (p.facing === 'left' && dx <= 15);

      if (dist < hitRadius + monster.radius && inFront) {
        hitAny = true;

        // Check if monster has Bleed / Weakness effect from Piercing Arrow:
        // "làm chúng nhận gấp 5 lần sát thương từ bắn thường trong 10 giây"
        const isBleeding = monster.bleedTimer > 0;
        const finalDamage = isBleeding ? Math.round(damage * (monster.bleedMultiplier || 5.0)) : damage;

        monster.hp -= finalDamage;
        monster.hurtTimer = 0.25;

        // Fire Sword burn application
        if (p.weapon === 'fire_sword') {
          // If was empowered hit, burn 4s with 35 HP/s (cháy lớn), otherwise burn 3s with 5 HP/s (đốt)
          const isEmpowered = damage === 20;
          if (isEmpowered) {
            this.applyBurn(monster, 4.0, 35);
          } else {
            this.applyBurn(monster, 3.0, 5);
          }
        }

        const kbAngle = Math.atan2(dy, dx);
        const kbForce = monster.isBoss ? 40 : p.weapon === 'greatsword' ? 220 : 150;
        monster.x += Math.cos(kbAngle) * (kbForce * 0.1);
        monster.y += Math.sin(kbAngle) * (kbForce * 0.1);

        const sparkColor = isBleeding ? '#ef4444' : p.weapon === 'fire_sword' ? '#f97316' : isCrit ? '#facc15' : '#38bdf8';
        this.addSparks(monster.x, monster.y, sparkColor);

        let label = `-${finalDamage}`;
        if (isCrit) label += ' BỘC PHÁT! ⚡';
        else if (p.weapon === 'fire_sword') label += damage === 20 ? ' CHÁY LỚN! 🔥' : ' 🔥';
        else if (p.weapon === 'greatsword') label += ' TRẢM! 🗡️';

        if (isBleeding) {
          label += ' 🩸(x5)';
        }

        this.addFloatingText(
          monster.x,
          monster.y - 20,
          label,
          isBleeding ? '#ef4444' : isCrit ? '#facc15' : p.weapon === 'fire_sword' ? '#f97316' : '#ffffff',
          isCrit ? 16 : 13
        );

        if (monster.hp <= 0) {
          this.handleMonsterDeath(monster);
        }
      }
    });

    if (hitAny) {
      soundEngine.playHit();
      this.addCameraShake(0.12, isCrit ? 5 : p.weapon === 'greatsword' ? 4 : 2);
    }
  }

  private handleMonsterDeath(monster: Monster) {
    const isBoss = monster.isBoss;
    soundEngine.playEnemyDeath(isBoss);

    this.state.player.totalKills += 1;
    this.state.player.score += isBoss ? 2500 : 100;
    this.state.player.coins += isBoss ? 50 : 5;

    const particleCount = isBoss ? 60 : 16;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isBoss ? 240 : 120) + 20;
      this.state.particles.push({
        x: monster.x,
        y: monster.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: isBoss
          ? ['#64748b', '#cbd5e1', '#f59e0b', '#dc2626'][Math.floor(Math.random() * 4)]
          : monster.type === 'slime'
          ? '#22c55e'
          : monster.type === 'skeleton'
          ? '#e2e8f0'
          : '#6366f1',
        size: Math.random() * 4 + 2,
        life: 0.7,
        maxLife: 0.7,
        alpha: 1,
      });
    }

    if (isBoss) {
      this.state.bossDefeated = true;
      this.state.status = 'victory';
      soundEngine.playVictory();
      this.addCameraShake(0.8, 10);
      this.addFloatingText(monster.x, monster.y - 40, 'TRÙM ĐÃ BỊ HẠ GỤC!', '#22c55e', 20);
      return;
    }

    // Regular monster death progression (0/5)
    if (!this.state.bossSpawned) {
      this.state.player.kills += 1;

      if (this.state.player.kills >= this.state.killsToBoss) {
        this.spawnBoss();
      }
    }

    // Drop loot
    if (Math.random() < 0.4 || this.state.player.hp < 40) {
      this.state.drops.push({
        id: `drop_${this.nextEntityId++}`,
        type: 'potion',
        x: monster.x + (Math.random() - 0.5) * 20,
        y: monster.y + (Math.random() - 0.5) * 20,
        radius: 10,
        value: 30,
        life: 25,
        bob: 0,
      });
    }
  }

  // --- PARTICLES & FLOATING TEXTS ---
  public addSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 90 + 30;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 1,
        life: 0.25,
        maxLife: 0.25,
        alpha: 1,
      });
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string, size: number = 14) {
    this.state.floatingTexts.push({
      id: `ft_${this.nextEntityId++}`,
      x,
      y,
      text,
      color,
      life: 0.9,
      maxLife: 0.9,
      vy: -40,
      size,
    });
  }

  // --- CORE GAME UPDATE LOOP ---
  public update(dt: number) {
    if (this.state.status === 'paused') return;

    this.state.timeElapsed += dt;

    // Camera shake update
    if (this.state.camera.shakeTime > 0) {
      this.state.camera.shakeTime -= dt;
      const mag = this.state.camera.shakeMagnitude;
      this.state.camera.x = (Math.random() - 0.5) * 2 * mag;
      this.state.camera.y = (Math.random() - 0.5) * 2 * mag;
    } else {
      this.state.camera.x = 0;
      this.state.camera.y = 0;
    }

    // Boss warning banner timer
    if (this.state.bossWarningTimer > 0) {
      this.state.bossWarningTimer -= dt;
      if (this.state.bossWarningTimer <= 0 && this.state.status === 'boss_alert') {
        this.state.status = 'playing';
      }
    }

    // Player update
    this.updatePlayer(dt);

    // NPC Farmer update
    this.updateNPC(dt);

    // Monster spawning across 4x map (up to 8 monsters until boss)
    if (!this.state.bossSpawned) {
      this.spawnTimer += dt;
      if (this.spawnTimer > 2.0 && this.state.monsters.length < 8) {
        this.spawnMonster();
        this.spawnTimer = 0;
      }
    }

    // Update monsters
    this.updateMonsters(dt);

    // Update projectiles (including 1.5s exploding fireballs and boss rocks)
    this.updateProjectiles(dt);

    // Update drops
    this.updateDrops(dt);

    // Update particles
    this.updateParticles(dt);

    // Update floating texts
    this.updateFloatingTexts(dt);
  }

  private updatePlayer(dt: number) {
    const p = this.state.player;
    if (p.state === 'dead') return;

    p.animTimer += dt;

    // Timers
    if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;
    if (p.hurtTimer > 0) p.hurtTimer -= dt;
    if (p.slowTimer > 0) p.slowTimer -= dt;
    if (p.attackCooldownTimer > 0) p.attackCooldownTimer -= dt;
    if (p.dashCooldownTimer > 0) p.dashCooldownTimer -= dt;
    if (p.igniteCooldownTimer > 0) p.igniteCooldownTimer -= dt;
    if (p.fireballCooldownTimer > 0) p.fireballCooldownTimer -= dt;
    if (p.pierceCooldownTimer > 0) p.pierceCooldownTimer -= dt;

    // Stun status check (Boss Hammer Slam 1.0s or Rock 0.8s)
    if (p.stunTimer > 0) {
      p.stunTimer -= dt;
      p.state = 'stunned';
      p.vx = 0;
      p.vy = 0;
      p.isAttacking = false;
      p.isDashing = false;
      p.isBowAiming = false;
      p.bowAimTimer = 0;
      return; // Cannot move while stunned
    }

    // Bow Aiming stand-still: "khi người chơi dùng cung bắn mũi tên sẽ bị đứng im trong 0,5 giây sau đó mới bắn ra mũi tên"
    if (p.isBowAiming) {
      p.bowAimTimer = (p.bowAimTimer || 0) - dt;
      p.state = 'attack';
      p.vx = 0;
      p.vy = 0;

      // Optional face towards movement input if pressed
      let mx = this.state.moveVector.x;
      if (Math.abs(mx) > 0.15) {
        p.facing = mx > 0 ? 'right' : 'left';
      }

      if (p.bowAimTimer <= 0) {
        p.isBowAiming = false;
        p.bowAimTimer = 0;
        this.executeBowShot();
      }

      p.x = Math.max(30, Math.min(this.arenaWidth - 30, p.x));
      p.y = Math.max(40, Math.min(this.arenaHeight - 40, p.y));
      return;
    }

    // Attack state
    if (p.isAttacking) {
      p.attackTimer -= dt;
      if (p.attackTimer <= 0) {
        p.isAttacking = false;
        p.attackCooldownTimer = p.attackCooldown;
        p.state = 'idle';
      }
    }

    // Dash state: Lao về phía trước 1 đoạn ngắn KHÔNG gây sát thương
    if (p.isDashing) {
      p.dashTimer -= dt;
      if (p.dashTimer <= 0) {
        p.isDashing = false;
        p.state = 'idle';
      }
    }

    // Movement calculation
    let mx = this.state.moveVector.x;
    let my = this.state.moveVector.y;
    const mag = Math.hypot(mx, my);

    if (mag > 0.08) {
      if (mag > 1) {
        mx /= mag;
        my /= mag;
      }

      if (mx > 0.15) p.facing = 'right';
      else if (mx < -0.15) p.facing = 'left';

      let currentSpeed = p.isDashing ? p.dashSpeed : p.speed * GameEngine.SPEED_SCALE;
      // Slime "nhớp nháp" debuff: giảm 30% tốc độ di chuyển trong 3 giây
      if (p.slowTimer > 0 && !p.isDashing) {
        currentSpeed *= 0.70;
      }

      p.vx = mx * currentSpeed;
      p.vy = my * currentSpeed;

      if (!p.isAttacking && !p.isDashing) {
        p.state = 'walk';
      }
    } else {
      p.vx = 0;
      p.vy = 0;
      if (!p.isAttacking && !p.isDashing) {
        p.state = 'idle';
      }
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Arena boundary clamp across 4x map
    p.x = Math.max(30, Math.min(this.arenaWidth - 30, p.x));
    p.y = Math.max(40, Math.min(this.arenaHeight - 40, p.y));
  }

  private updateNPC(_dt: number) {
    const p = this.state.player;
    const npc = this.state.npc;
    const dist = Math.hypot(p.x - npc.x, p.y - npc.y);
    npc.isPlayerNear = dist < 85;
  }

  private updateMonsters(dt: number) {
    const p = this.state.player;

    for (let i = this.state.monsters.length - 1; i >= 0; i--) {
      const m = this.state.monsters[i];
      if (m.hp <= 0) {
        this.state.monsters.splice(i, 1);
        continue;
      }

      m.animTimer += dt;
      if (m.hurtTimer > 0) m.hurtTimer -= dt;
      if (m.attackCooldownTimer > 0) m.attackCooldownTimer -= dt;

      // Handle Burning DoT: "mất 5Hp hoặc 15/25Hp mỗi 1 giây kéo dài trong X giây"
      if (m.burnTimer > 0) {
        m.burnTimer -= dt;
        m.burnTickTimer -= dt;
        if (m.burnTickTimer <= 0) {
          m.burnTickTimer = 1.0; // Tick every 1.0 second per user request!
          const burnDmg = m.burnDamagePerTick || 5; // 5 HP or 15/25 HP damage
          m.hp -= burnDmg;
          m.hurtTimer = 0.2;
          this.addFloatingText(m.x, m.y - 15, `-${burnDmg} 🔥`, '#f97316', 12);
          this.addSparks(m.x, m.y, '#f97316');
          if (m.hp <= 0) {
            this.handleMonsterDeath(m);
            continue;
          }
        }
      }

      // Handle Bleeding Status: "nhận gấp 5 lần sát thương với mỗi đòn đánh thường trong 5 giây"
      if (m.bleedTimer > 0) {
        m.bleedTimer -= dt;
        if (m.bleedTimer <= 0) {
          m.bleedTimer = 0;
          m.bleedMultiplier = 1.0;
        } else if (Math.random() < 0.1) {
          // Occasional small blood droplet particle falling
          this.state.particles.push({
            x: m.x + (Math.random() - 0.5) * m.width * 0.6,
            y: m.y + (Math.random() - 0.5) * m.height * 0.4,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * 20 + 10,
            color: '#dc2626',
            size: Math.random() * 2 + 1,
            life: 0.25,
            maxLife: 0.25,
            alpha: 0.8,
          });
        }
      }

      // Distance to player
      const dx = p.x - m.x;
      const dy = p.y - m.y;
      const dist = Math.hypot(dx, dy);

      if (m.isBoss) {
        m.facing = dx >= 0 ? 'right' : 'left';
        this.updateBossAI(m, p, dt, dist, dx, dy);
      } else {
        // MONSTER WINDUP (LẤY ĐÀ) & ATTACK ANIMATION STATE MACHINE:
        // "quái sẽ có lấy đà rồi mới tấn công, thêm hoạt ảnh tấn công của quái"
        if (m.attackState === 'windup') {
          m.windupTimer = (m.windupTimer || 0) - dt;
          m.facing = dx >= 0 ? 'right' : 'left';

          if (m.windupTimer <= 0) {
            // Lấy đà xong -> tung đòn tấn công!
            m.attackState = 'attacking';
            m.attackAnimTimer = m.type === 'skeleton' ? 0.16 : m.type === 'slime' ? 0.22 : 0.12;

            // Kiểm tra người chơi có nằm trong tầm đánh tại khoảnh khắc ra đòn không
            const strikeDist = Math.hypot(p.x - m.x, p.y - m.y);
            if (strikeDist <= (m.attackRange || 60) + p.radius + 6) {
              this.damagePlayer(m.damage);

              // Slime: gây hiệu ứng "nhớp nháp" khiến người chơi giảm 30% tốc độ di chuyển trong 3 giây
              if (m.type === 'slime') {
                p.slowTimer = 3.0;
                this.addFloatingText(p.x, p.y - 42, 'NHỚP NHÁP! 🐌 (-30% TỐC ĐỘ 3s)', '#84cc16', 13);
                this.addSparks(p.x, p.y, '#84cc16');
              }

              // Dơi: mỗi đòn đánh trúng dơi sẽ hồi 2Hp
              if (m.type === 'bat') {
                const oldHp = m.hp;
                m.hp = Math.min(m.maxHp, m.hp + 2);
                if (m.hp > oldHp) {
                  this.addFloatingText(m.x, m.y - 25, '+2 HP 🩸', '#22c55e', 12);
                  this.addSparks(m.x, m.y, '#22c55e');
                }
              }
            }

            m.attackCooldownTimer = m.attackCooldown;
          }
        } else if (m.attackState === 'attacking') {
          m.attackAnimTimer = (m.attackAnimTimer || 0) - dt;
          // Lao nhẹ về phía trước trong lúc vung đòn
          const lungeSpeed = m.speed * GameEngine.SPEED_SCALE * 0.7;
          m.x += (dx / (dist || 1)) * lungeSpeed * dt;
          m.y += (dy / (dist || 1)) * lungeSpeed * dt;

          if (m.attackAnimTimer <= 0) {
            m.attackState = 'idle';
          }
        } else {
          // IDLE / DI CHUYỂN
          if (dist <= m.detectionRange) {
            // Phát hiện người chơi! Đuổi theo
            m.isAggro = true;
            m.facing = dx >= 0 ? 'right' : 'left';

            // Khi vào tầm đánh và hết hồi chiêu: QUÁI BẮT ĐẦU LẤY ĐÀ (WINDUP)!
            const range = m.attackRange || (m.type === 'skeleton' ? 80 : m.type === 'slime' ? 60 : 30);
            if (dist <= range && m.attackCooldownTimer <= 0) {
              m.attackState = 'windup';
              m.windupDuration = (m.type === 'skeleton' || m.type === 'slime') ? 0.80 : 0.18;
              m.windupTimer = m.windupDuration;
            } else {
              // Tiếp cận người chơi
              if (dist > m.radius + p.radius) {
                const moveX = (dx / dist) * m.speed * GameEngine.SPEED_SCALE;
                const moveY = (dy / dist) * m.speed * GameEngine.SPEED_SCALE;
                m.x += moveX * dt;
                m.y += moveY * dt;
              }
            }
          } else {
            // Quái vật tự di chuyển ngẫu nhiên khi không phát hiện người chơi
            m.isAggro = false;
            m.wanderTimer -= dt;

            if (m.wanderTimer <= 0) {
              if (Math.random() < 0.45) {
                m.wanderVx = 0;
                m.wanderVy = 0;
              } else {
                const wanderAngle = Math.random() * Math.PI * 2;
                const wanderSpeed = m.speed * GameEngine.SPEED_SCALE * 0.45;
                m.wanderVx = Math.cos(wanderAngle) * wanderSpeed;
                m.wanderVy = Math.sin(wanderAngle) * wanderSpeed;
                m.facing = m.wanderVx >= 0 ? 'right' : 'left';
              }
              m.wanderTimer = 1.5 + Math.random() * 2.5;
            }

            m.x += m.wanderVx * dt;
            m.y += m.wanderVy * dt;
          }
        }
      }

      // Clamp to arena
      m.x = Math.max(m.radius, Math.min(this.arenaWidth - m.radius, m.x));
      m.y = Math.max(m.radius, Math.min(this.arenaHeight - m.radius, m.y));
    }
  }

  /**
   * Boss AI: Hiệp Sĩ Thiết Giáp Cầm Búa Khổng Lồ
   * - Máu: 3000 HP.
   * - Đánh thường: 30 sát thương, tầm đánh 60, thời gian đánh thường 4s (lấy đà 0.5s), tốc độ di chuyển 60.
   * - Kĩ năng "Địa chấn" (hồi chiêu 7s): Đứng im lấy đà 0.5s, đập búa tạo vùng đất nứt 130px gây 30 sát thương và choáng 1s,
   *   đồng thời bắn ra 6 viên đá bay theo vòng tròn gây 40 sát thương và choáng 1.2s. Khi đá trúng người chơi, boss tăng tốc lên 90 trong 0.8s.
   * - Kĩ năng "Hất đá" (hồi chiêu 6s): Dùng búa hất 3 viên đá về phía trước gây 40 sát thương và choáng 1.2s. Khi đá trúng người chơi, boss tăng tốc lên 90 trong 0.8s.
   * - Cuồng nộ (khi còn <= 1000 HP): Tốc độ di chuyển tăng lên 80, thời gian đánh thường giảm xuống 3s.
   */
  private updateBossAI(boss: Monster, p: Player, dt: number, dist: number, dx: number, dy: number) {
    const waveMult = 1 + (this.state.wave - 1) * 0.35;

    // Check Enraged state when HP <= 1000
    if (boss.hp <= 1000 * waveMult && boss.bossPhase === 1) {
      boss.bossPhase = 2;
      boss.attackCooldown = 3.0; // Thời gian đánh thường giảm xuống 3 giây
      boss.speed = (boss.speedBuffTimer && boss.speedBuffTimer > 0) ? 90 * waveMult : 80 * waveMult; // Tốc độ di chuyển tăng lên 80
      soundEngine.playBossRoar();
      this.addCameraShake(0.6, 9);
      this.addFloatingText(boss.x, boss.y - 60, 'TRÙM CUỒNG NỘ! 🔥 (TỐC ĐỘ 80, ĐÁNH 3s)', '#ef4444', 18);
    }

    // Handle speedBuffTimer: "khi người chơi bị ném đá trúng boss sẽ tăng tốc lên 90 trong 0,8 giây"
    if (boss.speedBuffTimer && boss.speedBuffTimer > 0) {
      boss.speedBuffTimer -= dt;
      if (boss.speedBuffTimer <= 0) {
        boss.speedBuffTimer = 0;
        const baseSpeed = boss.bossPhase === 2 ? 80 : 60;
        boss.speed = baseSpeed * waveMult;
      }
    }

    // Decrement cooldown and action timers
    if (boss.bossActionTimer && boss.bossActionTimer > 0) boss.bossActionTimer -= dt;
    if (boss.bossSlamCooldown && boss.bossSlamCooldown > 0) boss.bossSlamCooldown -= dt;
    if (boss.bossFlingCooldown && boss.bossFlingCooldown > 0) boss.bossFlingCooldown -= dt;

    // Is boss in middle of any windup or active attack animation?
    const isWindingUp =
      boss.bossCurrentAction === 'windup_melee' ||
      boss.bossCurrentAction === 'melee_slam' ||
      boss.bossCurrentAction === 'windup_slam' ||
      boss.bossCurrentAction === 'slam' ||
      boss.bossCurrentAction === 'windup_fling' ||
      boss.bossCurrentAction === 'fling';

    // Handle windup expiration -> trigger attacks
    if ((boss.bossActionTimer || 0) <= 0) {
      if (boss.bossCurrentAction === 'windup_melee') {
        // Lấy đà 0.5 giây kết thúc -> TUNG ĐÒN ĐÁNH THƯỜNG 30 DMG!
        boss.bossCurrentAction = 'melee_slam';
        boss.bossActionTimer = 0.25;
        soundEngine.playBossSlam();
        this.addCameraShake(0.35, 7);

        // Check if player is within attackRange (60px) at the moment hammer strikes
        if (dist <= (boss.attackRange || 60) + p.radius + 8) {
          this.damagePlayer(boss.damage); // 30 sát thương
          this.addSparks(p.x, p.y, '#ef4444');
          this.addFloatingText(p.x, p.y - 25, `-${Math.round(boss.damage)} TRẢM BÚA! 💥`, '#ef4444', 16);
        }

        boss.attackCooldownTimer = boss.attackCooldown; // hồi 4.0s (hoặc 3.0s khi cuồng nộ)
      } else if (boss.bossCurrentAction === 'windup_slam') {
        // Execute Địa chấn
        this.executeBossGroundSlam(boss, p, dist);
      } else if (boss.bossCurrentAction === 'windup_fling') {
        // Execute Hất đá
        this.executeBossRockFling(boss, p, dx, dy);
      } else if (
        boss.bossCurrentAction === 'melee_slam' ||
        boss.bossCurrentAction === 'slam' ||
        boss.bossCurrentAction === 'fling'
      ) {
        boss.bossCurrentAction = 'idle';
      }
    }

    // AI decision when idle
    if (boss.bossCurrentAction === 'idle') {
      // 1. Prioritize skill "Địa chấn" (cooldown 7s, lấy đà đứng im 0.5s)
      if ((boss.bossSlamCooldown || 0) <= 0) {
        boss.bossCurrentAction = 'windup_slam';
        boss.bossActionTimer = 0.5; // Đứng im lấy đà trong 0,5 giây per user request
        this.addFloatingText(boss.x, boss.y - 45, '⚠️ ĐỊA CHẤN (0.5s)!', '#ef4444', 15);
      }
      // 2. Skill "Hất đá" (cooldown 6s)
      else if ((boss.bossFlingCooldown || 0) <= 0) {
        boss.bossCurrentAction = 'windup_fling';
        boss.bossActionTimer = 0.5; // Windup preparation
        this.addFloatingText(boss.x, boss.y - 45, '⚠️ HẤT 3 VIÊN ĐÁ! 🪨', '#f59e0b', 15);
      }
      // 3. Normal Melee Attack: 30 sát thương, tầm đánh 60, hồi 4s (hoặc 3s khi cuồng nộ), lấy đà 0.5s
      else if (dist <= (boss.attackRange || 60) + p.radius + 8 && boss.attackCooldownTimer <= 0) {
        boss.bossCurrentAction = 'windup_melee';
        boss.bossActionTimer = 0.5; // Boss sẽ lấy đà 0,5 giây sau đó đánh thường per user request
        this.addFloatingText(boss.x, boss.y - 45, '⚠️ VUNG BÚA (0.5s)!', '#dc2626', 15);
      }
    }

    // Movement: Approach player only when not performing any windup/strike
    if (!isWindingUp && dist > (boss.attackRange || 60)) {
      boss.x += (dx / dist) * boss.speed * GameEngine.SPEED_SCALE * dt;
      boss.y += (dy / dist) * boss.speed * GameEngine.SPEED_SCALE * dt;
    }
  }

  /**
   * Kĩ năng: "Địa chấn"
   * Đứng im lấy đà trong 0,5 giây sau đó đập búa xuống đất tạo vùng đất nứt 130px gây 30 sát thương và choáng 1 giây
   * cùng với tạo ra 6 viên đá bay ra theo vòng tròn gây 40 sát thương và choáng 1,2 giây nếu trúng.
   * Khi người chơi bị ném đá trúng boss sẽ tăng tốc lên 90 trong 0,8 giây hồi chiêu 7 giây.
   */
  private executeBossGroundSlam(boss: Monster, p: Player, dist: number) {
    boss.bossCurrentAction = 'slam';
    boss.bossActionTimer = 0.45;
    boss.bossSlamCooldown = 7.0; // Hồi chiêu 7 giây per user request!

    soundEngine.playBossSlam();
    this.addCameraShake(0.8, 14); // Rung rắc mạnh toàn màn hình

    // Bán kính vùng đất nứt = 130px per user request
    const slamRadius = 130;

    // Mặt đất vỡ và đá vụn bắn tung toé trong bán kính 130px
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 130;
      this.state.particles.push({
        x: boss.x + (Math.random() - 0.5) * 24,
        y: boss.y + 10 + (Math.random() - 0.5) * 18,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() < 0.5 ? '#78350f' : Math.random() < 0.7 ? '#451a03' : '#ea580c',
        size: 3 + Math.random() * 5,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        alpha: 1,
      });
    }

    // Shockwave ripple radiating outward up to 130px
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      this.state.projectiles.push({
        id: `shock_${this.nextEntityId++}`,
        x: boss.x,
        y: boss.y + 10,
        vx: Math.cos(angle) * 180,
        vy: Math.sin(angle) * 180,
        radius: 12,
        damage: 30, // Gây 30 sát thương
        color: '#f59e0b',
        life: 0.72, // 180 * 0.72 = ~130px
        maxLife: 0.72,
        isEnemy: true,
        type: 'shockwave',
        stunDuration: 1.0, // Choáng trong 1 giây
      });
    }

    // 6 viên đá bay ra theo vòng tròn gây 40 sát thương và choáng 1,2 giây nếu trúng
    for (let i = 0; i < 6; i++) {
      const rockAngle = (i * Math.PI * 2) / 6;
      const rockSpeed = 260;
      this.state.projectiles.push({
        id: `rock_${this.nextEntityId++}`,
        x: boss.x + Math.cos(rockAngle) * 24,
        y: boss.y + 10 + Math.sin(rockAngle) * 24,
        vx: Math.cos(rockAngle) * rockSpeed,
        vy: Math.sin(rockAngle) * rockSpeed,
        radius: 14,
        damage: 40, // 40 sát thương
        color: '#78350f',
        life: 3.5,
        maxLife: 3.5,
        isEnemy: true,
        type: 'rock',
        stunDuration: 1.2, // Choáng 1.2 giây
      });
    }

    // If player is within 130px slam radius: 30 damage + 1.0s STUN!
    if (dist <= slamRadius) {
      this.damagePlayer(30);
      p.stunTimer = 1.0; // Làm choáng 1 giây
      p.state = 'stunned';
      soundEngine.playStun();
      this.addFloatingText(p.x, p.y - 35, '-30 ĐỊA CHẤN! (CHOÁNG 1.0s) 💫', '#facc15', 16);
    }
  }

  /**
   * Kĩ năng: "Hất đá"
   * Boss dùng búa hất 3 viên đá về phía trước gây 40 sát thương và choáng 1,2 giây,
   * khi người chơi bị ném đá trúng boss sẽ tăng tốc lên 90 trong 0,8 giây hồi chiêu 6 giây.
   */
  private executeBossRockFling(boss: Monster, _p: Player, dx: number, dy: number) {
    boss.bossCurrentAction = 'fling';
    boss.bossActionTimer = 0.35;
    boss.bossFlingCooldown = 6.0; // Hồi chiêu 6 giây per user request

    soundEngine.playRockSmash();
    this.addCameraShake(0.35, 7);

    const baseAngle = Math.atan2(dy, dx);
    const count = 3; // Hất 3 viên đá về phía trước
    const damage = 40; // 40 sát thương
    const stun = 1.2; // Choáng 1.2 giây
    const spread = 0.28;

    for (let i = 0; i < count; i++) {
      const offset = (i - Math.floor(count / 2)) * spread;
      const angle = baseAngle + offset;
      const speed = 280;

      this.state.projectiles.push({
        id: `rock_${this.nextEntityId++}`,
        x: boss.x + Math.cos(angle) * 32,
        y: boss.y + Math.sin(angle) * 32,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 14,
        damage,
        color: '#64748b',
        life: 3.5,
        maxLife: 3.5,
        isEnemy: true,
        type: 'rock',
        stunDuration: stun,
      });
    }
  }

  private updateProjectiles(dt: number) {
    const p = this.state.player;

    for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
      const proj = this.state.projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      // Trail particles
      if (Math.random() < 0.45) {
        this.state.particles.push({
          x: proj.x,
          y: proj.y,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          color: proj.type === 'rock' ? '#64748b' : proj.color,
          size: proj.type === 'rock' ? 4 : 3,
          life: 0.22,
          maxLife: 0.22,
          alpha: 1,
        });
      }

      // 1. PLAYER ARROW (Cung tên - Đòn thường 5 sát thương, nhận x5 sát thương nếu quái đang chảy máu)
      if (proj.type === 'arrow' && !proj.isEnemy) {
        let hitMonster = false;
        for (const monster of this.state.monsters) {
          if (monster.hp > 0) {
            const dist = Math.hypot(monster.x - proj.x, monster.y - proj.y);
            if (dist < proj.radius + monster.radius + 6) {
              hitMonster = true;

              // Check if monster has Bleed effect (x5 damage from normal attacks)
              const isBleeding = monster.bleedTimer > 0;
              const mult = isBleeding ? (monster.bleedMultiplier || 5.0) : 1;
              const finalDamage = Math.round(proj.damage * mult); // 5 * 5 = 25 dmg

              monster.hp -= finalDamage;
              monster.hurtTimer = 0.2;
              soundEngine.playHit();

              if (isBleeding) {
                this.addSparks(monster.x, monster.y, '#ef4444');
                this.addFloatingText(monster.x, monster.y - 18, `-${finalDamage} 🏹🩸 (x5)`, '#ef4444', 14);
              } else {
                this.addSparks(monster.x, monster.y, '#cbd5e1');
                this.addFloatingText(monster.x, monster.y - 18, `-${finalDamage} 🏹`, '#cbd5e1', 13);
              }

              if (monster.hp <= 0) {
                this.handleMonsterDeath(monster);
              }
              break;
            }
          }
        }
        if (hitMonster) {
          this.state.projectiles.splice(i, 1);
          continue;
        }
      }

      // 2. PLAYER PIERCING ARROW (Cung tên - Kĩ năng Xuyên phá 32 sát thương + Hiệu ứng Chảy máu 5 giây x5 dmg)
      // "Chiêu xuyên phá sẽ khiến quái vật bị chúng nhận hiệu ứng chảy máu làm chúng nhận gấp 5 lần sát thương với mỗi đòn đánh thường kéo dài hiệu ứng trong 5 giây"
      if (proj.type === 'piercing_arrow' && !proj.isEnemy) {
        if (!proj.hitMonsterIds) proj.hitMonsterIds = [];
        let shouldDespawn = false;

        for (const monster of this.state.monsters) {
          if (monster.hp > 0 && !proj.hitMonsterIds.includes(monster.id)) {
            const dist = Math.hypot(monster.x - proj.x, monster.y - proj.y);
            if (dist < proj.radius + monster.radius + 8) {
              proj.hitMonsterIds.push(monster.id);
              monster.hp -= proj.damage;
              monster.hurtTimer = 0.25;
              soundEngine.playHit();
              this.addCameraShake(0.12, 3);
              this.addSparks(monster.x, monster.y, '#38bdf8');

              // Apply 10s Bleed/Weakness effect: nhận gấp 5 lần sát thương từ bắn thường trong 10 giây
              this.applyBleed(monster, 10.0, 5.0);

              // Floating texts for pierce hit and weakness affliction
              this.addFloatingText(monster.x, monster.y - 20, `-${proj.damage} NHẮM ĐIỂM YẾU! 🏹`, '#38bdf8', 14);
              this.addFloatingText(monster.x, monster.y - 36, 'YẾU ĐUỐI 10s! 🩸 (x5 Bắn Thường)', '#ef4444', 12);

              // Burst of blood particles
              for (let b = 0; b < 14; b++) {
                const bAngle = Math.random() * Math.PI * 2;
                const bSpeed = Math.random() * 80 + 30;
                this.state.particles.push({
                  x: monster.x,
                  y: monster.y,
                  vx: Math.cos(bAngle) * bSpeed,
                  vy: Math.sin(bAngle) * bSpeed,
                  color: Math.random() > 0.4 ? '#dc2626' : '#991b1b',
                  size: Math.random() * 3 + 2,
                  life: 0.35,
                  maxLife: 0.35,
                  alpha: 1,
                });
              }

              if (monster.hp <= 0) {
                this.handleMonsterDeath(monster);
              }

              proj.pierceCount = (proj.pierceCount || 1) - 1;
              if (proj.pierceCount <= 0) {
                shouldDespawn = true;
                break;
              }
            }
          }
        }

        if (shouldDespawn) {
          this.state.projectiles.splice(i, 1);
          continue;
        }
      }

      // 3. PLAYER FIREBALL (Kiếm Lửa - Kĩ năng Cầu lửa):
      // "bắn cầu lửa về phía trước và phát nổ sau 0,8 giây gây 40 sát thương và hiệu ứng 'cháy lớn' làm quái mất 35Hp mỗi giây trong 2 giây, hồi chiêu 2 giây."
      if (proj.type === 'player_fireball') {
        if (proj.life <= 0) {
          // DETONATE FIREBALL EXPLOSION!
          soundEngine.playExplosion();
          this.addCameraShake(0.35, 7);

          const expRadius = proj.explodeRadius || 135;

          // Explosion particles
          for (let k = 0; k < 25; k++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 160 + 40;
            this.state.particles.push({
              x: proj.x,
              y: proj.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color: ['#ea580c', '#facc15', '#ef4444', '#78350f'][Math.floor(Math.random() * 4)],
              size: Math.random() * 5 + 3,
              life: 0.5,
              maxLife: 0.5,
              alpha: 1,
              type: 'flame',
            });
          }

          // AoE Splash Damage & Burn: 40 damage + cháy lớn 2 giây (mất 35Hp mỗi 1s)
          this.state.monsters.forEach((monster) => {
            const mDist = Math.hypot(monster.x - proj.x, monster.y - proj.y);
            if (mDist <= expRadius) {
              monster.hp -= proj.damage;
              monster.hurtTimer = 0.3;
              this.applyBurn(monster, proj.burnDuration || 2.0, proj.burnDamagePerTick || 35);
              this.addFloatingText(monster.x, monster.y - 25, `-${proj.damage} CẦU LỬA NỔ! 💥`, '#ea580c', 15);

              if (monster.hp <= 0) {
                this.handleMonsterDeath(monster);
              }
            }
          });

          this.state.projectiles.splice(i, 1);
          continue;
        }
      }

      // 2. ENEMY PROJECTILE COLLISION (Shockwaves and Flying Rocks)
      if (proj.isEnemy && p.state !== 'dead') {
        const dist = Math.hypot(p.x - proj.x, p.y - proj.y);
        if (dist < proj.radius + p.radius) {
          this.damagePlayer(proj.damage);

          // Apply Stun if projectile has stunDuration (Rocks = 1.2s, Shockwave = 1.0s)
          if (proj.stunDuration && proj.stunDuration > 0) {
            p.stunTimer = proj.stunDuration;
            p.state = 'stunned';
            soundEngine.playStun();
            this.addFloatingText(p.x, p.y - 35, `CHOÁNG ${proj.stunDuration}s! 💫`, '#facc15', 15);
          }

          // Khi người chơi bị ném đá trúng: boss sẽ tăng tốc lên 90 trong 0,8 giây
          if (proj.type === 'rock') {
            const boss = this.state.monsters.find((m) => m.isBoss && m.hp > 0);
            if (boss) {
              const waveMult = 1 + (this.state.wave - 1) * 0.35;
              boss.speed = 90 * waveMult;
              boss.speedBuffTimer = 0.8;
              this.addFloatingText(boss.x, boss.y - 50, 'TRÙM TĂNG TỐC 90! ⚡ (0.8s)', '#facc15', 14);
            }
          }

          this.state.projectiles.splice(i, 1);
          continue;
        }
      }

      // Out of bounds or dead
      if (
        proj.life <= 0 ||
        proj.x < 0 ||
        proj.x > this.arenaWidth ||
        proj.y < 0 ||
        proj.y > this.arenaHeight
      ) {
        this.state.projectiles.splice(i, 1);
      }
    }
  }

  private updateDrops(dt: number) {
    const p = this.state.player;

    for (let i = this.state.drops.length - 1; i >= 0; i--) {
      const drop = this.state.drops[i];
      drop.life -= dt;
      drop.bob = Math.sin(this.state.timeElapsed * 6 + i) * 3;

      const dist = Math.hypot(p.x - drop.x, p.y - drop.y);

      if (dist < drop.radius + p.radius + 12) {
        soundEngine.playPickup(drop.type);
        if (drop.type === 'potion') {
          const healAmount = drop.value;
          p.hp = Math.min(p.maxHp, p.hp + healAmount);
          this.addFloatingText(p.x, p.y - 25, `+${healAmount} HP`, '#22c55e', 15);
        } else {
          p.coins += 5;
          this.addFloatingText(p.x, p.y - 25, '+5 VÀNG', '#facc15', 13);
        }

        this.state.drops.splice(i, 1);
        continue;
      }

      if (drop.life <= 0) {
        this.state.drops.splice(i, 1);
      }
    }
  }

  private damagePlayer(amount: number) {
    const p = this.state.player;
    if (p.invulnerableTimer > 0 || p.state === 'dead') return;

    p.hp -= amount;
    p.hurtTimer = 0.2;
    p.invulnerableTimer = 0.65;
    soundEngine.playPlayerHurt();
    this.addCameraShake(0.2, 5);

    this.addFloatingText(p.x, p.y - 30, `-${amount}`, '#ef4444', 15);

    if (p.hp <= 0) {
      p.hp = 0;
      p.state = 'dead';
      this.state.status = 'game_over';
      soundEngine.playGameOver();
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const part = this.state.particles[i];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.life -= dt;
      part.alpha = Math.max(0, part.life / part.maxLife);

      if (part.life <= 0) {
        this.state.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.state.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.state.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;

      if (ft.life <= 0) {
        this.state.floatingTexts.splice(i, 1);
      }
    }
  }
}
