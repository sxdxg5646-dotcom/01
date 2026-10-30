import { Direction, Monster, NPC, Player, Projectile, DropItem } from './types';

/**
 * Pixel Art Sprite Renderer
 * Draws high-contrast 2D retro sprites using crisp pixel rectangles.
 */

// Draw a single pixel block at (x, y) with specified size
export function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, pixelSize: number = 2) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), pixelSize, pixelSize);
}

/**
 * Draws the Player Knight with sword / fire sword and animated red cape
 */
export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
  ctx.save();
  ctx.translate(Math.floor(player.x), Math.floor(player.y));

  // Facing flip
  if (player.facing === 'left') {
    ctx.scale(-1, 1);
  }

  // Hurt flash effect (white/red flicker)
  const isHurt = player.hurtTimer > 0 && Math.floor(player.hurtTimer * 20) % 2 === 0;
  const isInvuln = player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer * 15) % 2 === 0;
  const isStunned = player.stunTimer > 0;

  if (isInvuln && !isHurt) {
    ctx.globalAlpha = 0.55;
  }

  // Dash ghost effect
  if (player.isDashing) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.fillRect(-18, -28, 36, 46);
  }

  const bob = player.state === 'walk' ? Math.sin(player.animTimer * 14) * 2 : Math.sin(player.animTimer * 3) * 1;
  const legOffset = player.state === 'walk' ? Math.sin(player.animTimer * 14) * 4 : 0;

  // Red Cape (behind body)
  const capeColor = isHurt ? '#ffffff' : '#b91c1c';
  const capeLight = isHurt ? '#fca5a5' : '#ef4444';
  const capeWave = Math.sin(player.animTimer * 8) * 3;
  ctx.fillStyle = capeColor;
  ctx.fillRect(-10, -14 + bob, 6, 20);
  ctx.fillStyle = capeLight;
  ctx.fillRect(-14 - (player.state === 'walk' ? 4 : 0), -10 + bob, 6 + capeWave, 18);

  // Shadow under player
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boots & Legs
  const armorColor = isHurt ? '#ffffff' : '#94a3b8';
  const armorDark = isHurt ? '#f87171' : '#475569';
  const armorHighlight = isHurt ? '#fca5a5' : '#e2e8f0';

  // Left leg
  ctx.fillStyle = armorDark;
  ctx.fillRect(-7, 6 + bob - legOffset, 5, 8 + legOffset);
  // Right leg
  ctx.fillStyle = armorColor;
  ctx.fillRect(2, 6 + bob + legOffset, 5, 8 - legOffset);
  // Boots
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-8, 12 + bob - legOffset, 6, 4);
  ctx.fillRect(1, 12 + bob + legOffset, 6, 4);

  // Torso Armor
  ctx.fillStyle = armorColor;
  ctx.fillRect(-7, -8 + bob, 14, 14);
  // Armor plate shadow & highlights
  ctx.fillStyle = armorHighlight;
  ctx.fillRect(-6, -7 + bob, 4, 10);
  ctx.fillStyle = armorDark;
  ctx.fillRect(3, -7 + bob, 3, 12);
  // Gold belt
  ctx.fillStyle = '#eab308';
  ctx.fillRect(-7, 3 + bob, 14, 3);
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(-2, 2 + bob, 4, 5); // Buckle

  // Head & Helmet
  ctx.fillStyle = armorColor;
  ctx.fillRect(-8, -24 + bob, 16, 15);
  ctx.fillStyle = armorHighlight;
  ctx.fillRect(-7, -23 + bob, 4, 6);
  ctx.fillStyle = armorDark;
  ctx.fillRect(3, -23 + bob, 4, 12);

  // Helmet Visor (glowing blue eye slit)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-2, -18 + bob, 10, 4);
  ctx.fillStyle = isHurt ? '#ef4444' : player.weapon === 'fire_sword' ? '#f97316' : '#38bdf8';
  ctx.fillRect(1, -17 + bob, 6, 2);

  // Red Knight Plume / Crest on Helmet
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(-10, -28 + bob, 8, 4);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-12, -26 + bob, 6, 4);
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(-8, -25 + bob, 4, 3);

  // Shoulder pauldrons
  ctx.fillStyle = armorHighlight;
  ctx.fillRect(-10, -8 + bob, 4, 6);
  ctx.fillRect(6, -8 + bob, 4, 6);

  // --- WEAPON RENDERING (4 WEAPONS: sword, fire_sword, greatsword, bow) ---
  const weapon = player.weapon || 'sword';
  const isFireSword = weapon === 'fire_sword';
  const isGreatsword = weapon === 'greatsword';
  const isBow = weapon === 'bow';
  const isAttacking = player.isAttacking;
  const attackProgress = player.attackDuration > 0 ? 1 - player.attackTimer / player.attackDuration : 0;

  if (player.isBowAiming && isBow) {
    // Bow drawing back tension pose (0.5s stand-still windup)
    const aimProgress = Math.min(1, Math.max(0, 1 - (player.bowAimTimer || 0) / 0.5));
    const pullBack = Math.floor(aimProgress * 6);

    ctx.save();
    ctx.translate(6, 0 + bob);

    // Bow wooden curved stave
    ctx.fillStyle = '#78350f';
    ctx.fillRect(8, -14, 3, 28);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(5, -10, 3, 20);

    // Pulled back bowstring (bent line)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(8, -14);
    ctx.lineTo(8 - pullBack, 0);
    ctx.lineTo(8, 14);
    ctx.stroke();

    // Nocked arrow being drawn back
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(8 - pullBack, -1, 14, 2);
    // Arrowhead (gleaming silver)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(22 - pullBack, -2, 4, 4);

    // Tension sparkle at arrow tip
    if (aimProgress > 0.3) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(24 - pullBack, -3, 3, 6);
    }

    ctx.restore();

    // Aiming trajectory dashed line in front of player
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(18, 0 + bob);
    ctx.lineTo(18 + (player.attackRange || 150) * aimProgress, 0 + bob);
    ctx.stroke();
    ctx.restore();
  } else if (isAttacking) {
    if (isBow) {
      // Bow firing pose
      ctx.save();
      ctx.translate(6, 0 + bob);
      // Bow frame
      ctx.fillStyle = '#78350f';
      ctx.fillRect(8, -14, 3, 28);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(5, -10, 3, 20);
      // Bowstring
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(2, -14, 1, 28);
      // Arrow being released
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(4, -1, 14, 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(18, -2, 4, 4);
      ctx.restore();
    } else {
      // Dynamic sword slash animation
      let swingAngle = -Math.PI / 4 + attackProgress * Math.PI * 0.9;
      if (player.attackCombo === 2) {
        swingAngle = Math.PI / 3 - attackProgress * Math.PI * 0.9;
      } else if (player.attackCombo === 3) {
        swingAngle = -Math.PI / 3 + attackProgress * Math.PI * 1.2;
      }

      ctx.save();
      ctx.translate(6, -2 + bob);
      ctx.rotate(swingAngle);

      if (isFireSword) {
        // Blazing Fire Sword Blade (Empowered if isIgniteBuffActive)
        const isEmpowered = player.isIgniteBuffActive;
        ctx.fillStyle = isEmpowered ? '#ef4444' : '#f97316';
        ctx.fillRect(2, -4, 26, 8);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(6, -2, 20, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, -1, 14, 2);
        // Flame tip
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(26, -3, 6, 6);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(30, -2, 4, 4);

        // Guard & Hilt
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-2, -8, 6, 16);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-1, -2, 4, 4);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-7, -2, 5, 4);
      } else if (isGreatsword) {
        // Massive Heavy Greatsword (Kiếm Lớn - 15 Sát thương)
        ctx.fillStyle = '#334155';
        ctx.fillRect(2, -6, 36, 12);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(4, -4, 32, 8);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(6, -2, 28, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(36, -2, 4, 4);
        // Heavy Crossguard
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-3, -12, 7, 24);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-1, -3, 3, 6);
        // Two-handed Hilt & Pommel
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-12, -3, 9, 6);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-15, -4, 3, 8);
      } else {
        // Standard Steel Sword (Kiếm Mặc Định - 8 Sát thương, Combo 3 80% bạo kích)
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(2, -3, 24, 6);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(6, -2, 18, 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(2, 2, 22, 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(26, -1, 4, 3);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-2, -7, 5, 14);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-1, -1, 3, 3);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-7, -2, 5, 4);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(-9, -3, 3, 6);
      }

      ctx.restore();

      // Slash Trail Arc Effect
      ctx.save();
      const slashRadius = (isGreatsword ? player.attackRange * 1.1 : player.attackRange) * 0.75;
      ctx.beginPath();
      const startAngle = player.attackCombo === 2 ? 0.3 : -0.7;
      const endAngle = player.attackCombo === 2 ? -0.8 : 0.8;
      ctx.arc(8, 0, slashRadius, startAngle, endAngle, player.attackCombo === 2);
      ctx.strokeStyle = isFireSword
        ? 'rgba(249, 115, 22, 0.85)'
        : isGreatsword
        ? 'rgba(203, 213, 225, 0.85)'
        : player.attackCombo === 3
        ? 'rgba(250, 204, 21, 0.8)'
        : 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = isGreatsword ? 12 : isFireSword ? 10 : player.attackCombo === 3 ? 8 : 5;
      ctx.stroke();

      // Secondary inner glow
      ctx.beginPath();
      ctx.arc(8, 0, slashRadius + 3, startAngle + 0.1, endAngle - 0.1, player.attackCombo === 2);
      ctx.strokeStyle = isFireSword ? '#fde047' : '#ffffff';
      ctx.lineWidth = isGreatsword ? 4 : 3;
      ctx.stroke();
      ctx.restore();
    }
  } else {
    // Idle / Walking Weapon held
    ctx.save();
    ctx.translate(6, 0 + bob);
    ctx.rotate(0.35 + (player.state === 'walk' ? Math.sin(player.animTimer * 12) * 0.15 : 0));

    if (isBow) {
      // Bow held in hand
      ctx.fillStyle = '#78350f';
      ctx.fillRect(4, -12, 3, 24);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(2, -8, 3, 16);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, -12, 1, 24);
    } else if (isFireSword) {
      // Blazing Fire Sword (glowing hotter if ignite buff active)
      ctx.fillStyle = player.isIgniteBuffActive ? '#ef4444' : '#ea580c';
      ctx.fillRect(2, -3, 20, 6);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(4, -1, 16, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, 0, 10, 1);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(22, -2, 4, 4);

      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, -6, 4, 12);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(1, -1, 2, 2);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-4, -1, 4, 3);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-6, -2, 2, 4);
    } else if (isGreatsword) {
      // Massive Greatsword held at rest
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, -5, 28, 10);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(4, -3, 24, 6);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(6, -1, 20, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(28, -2, 3, 4);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -9, 4, 18);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-8, -2, 8, 4);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-10, -3, 2, 6);
    } else {
      // Standard Steel Blade
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(2, -2, 18, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(4, -1, 14, 1);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(2, 1, 16, 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(20, -1, 3, 2);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, -5, 3, 10);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-4, -1, 4, 3);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-6, -2, 2, 4);
    }

    ctx.restore();
  }


  // Stun dizzy stars above head if stunned
  if (isStunned) {
    const starCount = 3;
    for (let i = 0; i < starCount; i++) {
      const starAngle = player.animTimer * 6 + (i * Math.PI * 2) / starCount;
      const starX = Math.cos(starAngle) * 14;
      const starY = -34 + Math.sin(starAngle) * 5;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(starX - 2, starY - 2, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(starX - 1, starY - 1, 2, 2);
    }
  }

  // Slime "Nhớp Nháp" slow effect (-30% speed)
  if (player.slowTimer > 0) {
    ctx.fillStyle = '#84cc16';
    ctx.fillRect(-10, 14, 20, 3);
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(-8, 16, 6, 2);
    ctx.fillRect(2, 16, 6, 2);

    ctx.save();
    if (player.facing === 'left') {
      ctx.scale(-1, 1);
    }
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#84cc16';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(`🐌 ${player.slowTimer.toFixed(1)}s`, 0, -32);
    ctx.fillText(`🐌 ${player.slowTimer.toFixed(1)}s`, 0, -32);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws a Monster (Slime, Skeleton, Bat, or Boss)
 */
export function drawMonster(ctx: CanvasRenderingContext2D, monster: Monster) {
  ctx.save();
  ctx.translate(Math.floor(monster.x), Math.floor(monster.y));

  if (monster.facing === 'left') {
    ctx.scale(-1, 1);
  }

  const isHurt = monster.hurtTimer > 0 && Math.floor(monster.hurtTimer * 20) % 2 === 0;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  const shadowRadius = monster.isBoss ? 36 : monster.type === 'bat' ? 8 : 12;
  const shadowY = monster.isBoss ? 34 : monster.type === 'bat' ? 18 : 14;
  ctx.ellipse(0, shadowY, shadowRadius, shadowRadius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (monster.type) {
    case 'slime':
      drawSlime(ctx, monster, isHurt);
      break;
    case 'skeleton':
      drawSkeleton(ctx, monster, isHurt);
      break;
    case 'bat':
      drawBat(ctx, monster, isHurt);
      break;
    case 'boss':
      drawBoss(ctx, monster, isHurt);
      break;
  }

  // Burning effect flames on monster if ignited by Fire Sword
  if (monster.burnTimer > 0) {
    const flameCount = monster.isBoss ? 6 : 3;
    for (let i = 0; i < flameCount; i++) {
      const fx = (Math.sin(monster.animTimer * 12 + i) * monster.width) / 2.5;
      const fy = -monster.height / 3 + Math.cos(monster.animTimer * 10 + i) * 6;
      ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#fde047';
      ctx.fillRect(fx - 3, fy - 6, 6, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx - 1, fy - 4, 2, 4);
    }
  }

  // Bleeding effect indicator on monster if affected by Piercing Arrow (x2.5 normal attack damage, 30s)
  if (monster.bleedTimer > 0) {
    const dropCount = monster.isBoss ? 4 : 2;
    for (let i = 0; i < dropCount; i++) {
      const bx = (Math.cos(monster.animTimer * 9 + i * 2) * monster.width) / 2.8;
      const by = (Math.sin(monster.animTimer * 11 + i * 3) * 5) + (monster.height / 5);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(bx - 2, by, 3, 5);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(bx - 1, by + 4, 2, 2);
    }

    // Status label showing remaining bleed time and x2.5 multiplier
    ctx.save();
    if (monster.facing === 'left') {
      ctx.scale(-1, 1);
    }
    const badgeY = monster.isBoss ? -monster.height / 2 - 38 : -monster.height / 2 - 16;
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    const bleedSec = Math.ceil(monster.bleedTimer);
    ctx.strokeText(`🩸x5 (${bleedSec}s)`, 0, badgeY);
    ctx.fillText(`🩸x5 (${bleedSec}s)`, 0, badgeY);
    ctx.restore();
  }

  // Monster Health Bar (Small floating HP bar above head for regular monsters)
  if (monster.hp < monster.maxHp && monster.hp > 0 && !monster.isBoss) {
    const barW = 24;
    const barH = 3;
    const barY = -monster.height / 2 - 8;
    const hpPct = Math.max(0, monster.hp / monster.maxHp);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-barW / 2, barY, barW, barH);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-barW / 2, barY, Math.floor(barW * hpPct), barH);
  }

  // BOSS HEALTH BAR ON HEAD:
  // "Thanh máu của boss sẽ hiển thị trên đầu boss thay vì hiện thị trên màn hình người chơi."
  if (monster.isBoss && monster.hp > 0) {
    const barW = 84;
    const barH = 7;
    const barY = -monster.height / 2 - 28;
    const hpPct = Math.max(0, monster.hp / monster.maxHp);

    ctx.save();
    // Face text always upright regardless of boss facing
    if (monster.facing === 'left') {
      ctx.scale(-1, 1);
    }

    // Boss Name above HP Bar
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f87171';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText('HIỆP SĨ THIẾT GIÁP (TRÙM)', 0, barY - 5);
    ctx.fillText('HIỆP SĨ THIẾT GIÁP (TRÙM)', 0, barY - 5);

    // HP Bar background & border
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-barW / 2 - 2, barY - 1, barW + 4, barH + 2);
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(-barW / 2, barY, barW, barH);
    // Red HP fill
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-barW / 2, barY, Math.floor(barW * hpPct), barH);
    // Top highlight inside bar
    ctx.fillStyle = '#f87171';
    ctx.fillRect(-barW / 2, barY, Math.floor(barW * hpPct), 2);

    // Text inside HP bar
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Math.ceil(monster.hp)}/${monster.maxHp}`, 0, barY + 6);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Cute Green Slime with squish, bounce, windup (lấy đà nén người) & surge attack animation
 */
function drawSlime(ctx: CanvasRenderingContext2D, monster: Monster, isHurt: boolean) {
  const isWindup = monster.attackState === 'windup';
  const isAttacking = monster.attackState === 'attacking';

  let squishX = 1;
  let squishY = 1;
  let offsetX = 0;

  if (isWindup) {
    // Lấy đà: Co người xẹp lép nén lực lại, run rẩy căng thẳng
    const shake = Math.sin(monster.animTimer * 45) * 1.5;
    squishX = 1.45;
    squishY = 0.55;
    offsetX = shake;
  } else if (isAttacking) {
    // Tấn công: Phóng người dài ra và lao về phía trước
    squishX = 0.65;
    squishY = 1.35;
    offsetX = 8;
  } else {
    // Idle / bounce
    const bounce = Math.abs(Math.sin(monster.animTimer * 6));
    squishX = 1 + bounce * 0.2;
    squishY = 1 - bounce * 0.2;
  }

  ctx.save();
  ctx.translate(offsetX, 0);
  ctx.scale(squishX, squishY);

  const bodyColor = isHurt ? '#ffffff' : isWindup ? '#a3e635' : '#22c55e';
  const darkColor = isHurt ? '#ef4444' : isWindup ? '#65a30d' : '#15803d';
  const lightColor = isHurt ? '#fca5a5' : isWindup ? '#fef08a' : '#86efac';

  // Slime body
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-12, -8, 24, 18);
  ctx.fillRect(-10, -12, 20, 4);
  ctx.fillRect(-6, -14, 12, 2);

  // Slime base
  ctx.fillStyle = darkColor;
  ctx.fillRect(-11, 7, 22, 3);
  ctx.fillRect(-8, 9, 16, 2);

  // Slime highlight (gel sheen)
  ctx.fillStyle = lightColor;
  ctx.fillRect(-8, -10, 5, 4);
  ctx.fillRect(-9, -6, 3, 6);

  // Angry/Cute eyes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, -5, 4, 5);
  ctx.fillRect(6, -5, 4, 5);

  // Glowing red pupils (flares brightly when winding up)
  ctx.fillStyle = isWindup ? '#fbbf24' : '#ef4444';
  ctx.fillRect(1, -4, 2, 3);
  ctx.fillRect(7, -4, 2, 3);

  ctx.restore();

  // Windup Telegraph: 60px acid splatter range arc indicator & warning badge
  if (isWindup) {
    ctx.save();
    // 60px attack range fan telegraph on the ground
    ctx.beginPath();
    ctx.arc(0, 0, 60, -0.65, 0.65);
    ctx.lineTo(0, 0);
    ctx.fillStyle = 'rgba(132, 204, 22, 0.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(163, 230, 53, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();

    // Pulse wave at 60px
    const pulseR = 30 + (Math.sin(monster.animTimer * 16) * 0.5 + 0.5) * 30;
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, -0.6, 0.6);
    ctx.strokeStyle = 'rgba(190, 242, 100, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text warning badge
    if (monster.facing === 'left') {
      ctx.scale(-1, 1);
    }
    const warnY = -monster.height / 2 - 20;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a3e635';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    const timeLeft = Math.max(0, monster.windupTimer || 0.8).toFixed(1);
    ctx.strokeText(`⚠️ BẮN NHỚP (${timeLeft}s)`, 0, warnY);
    ctx.fillText(`⚠️ BẮN NHỚP (${timeLeft}s)`, 0, warnY);
    ctx.restore();
  }

  // Attack Animation VFX: Sticky green slime splash bursting forward reaching exactly 60px!
  if (isAttacking) {
    ctx.save();
    // Translucent viscous spray cone extending up to 60px
    ctx.beginPath();
    ctx.moveTo(8, -6);
    ctx.lineTo(58, -16);
    ctx.lineTo(60, 16);
    ctx.lineTo(8, 6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(132, 204, 22, 0.28)';
    ctx.fill();

    // Sticky goo stream
    ctx.fillStyle = '#84cc16';
    ctx.fillRect(8, -8, 16, 16);
    ctx.fillRect(20, -10, 18, 20);
    ctx.fillRect(36, -8, 14, 16);
    // Splatter impact head reaching 54 to 60px
    ctx.fillRect(48, -12, 12, 24);
    ctx.fillRect(54, -8, 6, 16);

    // Bright lime inner highlight
    ctx.fillStyle = '#bef264';
    ctx.fillRect(16, -4, 12, 8);
    ctx.fillRect(30, -5, 14, 10);
    ctx.fillRect(48, -6, 8, 12);

    // Flying acid droplets up to 60px
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(42, -15, 5, 4);
    ctx.fillRect(56, -14, 4, 4);
    ctx.fillRect(44, 13, 5, 4);
    ctx.fillRect(58, 10, 4, 4);
    ctx.fillRect(60, -2, 4, 4);
    ctx.restore();
  }
}

/**
 * Skeleton Swordsman with windup anticipation & blade slash animation
 */
function drawSkeleton(ctx: CanvasRenderingContext2D, monster: Monster, isHurt: boolean) {
  const isWindup = monster.attackState === 'windup';
  const isAttacking = monster.attackState === 'attacking';

  const bob = isWindup ? 0 : Math.sin(monster.animTimer * 8) * 1.5;
  const boneColor = isHurt ? '#ffffff' : '#e2e8f0';
  const boneDark = isHurt ? '#f87171' : '#94a3b8';

  ctx.save();
  if (isWindup) {
    // Lấy đà: Nghiêng mình ra phía sau chuẩn bị chém
    ctx.rotate(-0.18);
  } else if (isAttacking) {
    // Tấn công: Lao người về phía trước
    ctx.translate(6, 1);
  }

  // Legs
  ctx.fillStyle = boneDark;
  ctx.fillRect(-5, 6 + bob, 3, 8);
  ctx.fillRect(2, 6 - bob, 3, 8);

  // Ribcage / Spine
  ctx.fillStyle = boneColor;
  ctx.fillRect(-6, -8 + bob, 12, 12);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-4, -6 + bob, 8, 2);
  ctx.fillRect(-3, -2 + bob, 6, 2);
  ctx.fillRect(-2, 2 + bob, 4, 2);

  // Skull
  ctx.fillStyle = boneColor;
  ctx.fillRect(-7, -22 + bob, 14, 13);
  ctx.fillStyle = boneDark;
  ctx.fillRect(-5, -9 + bob, 10, 3); // Jaw

  // Red Glowing Eyes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-4, -18 + bob, 4, 4);
  ctx.fillRect(1, -18 + bob, 4, 4);
  ctx.fillStyle = isWindup ? '#fbbf24' : '#ef4444';
  ctx.fillRect(-3, -17 + bob, 2, 2);
  ctx.fillRect(2, -17 + bob, 2, 2);

  // Sword Animation with dynamic angles for windup & attack
  ctx.save();
  if (isWindup) {
    // Lấy đà: Giơ kiếm cao lên sau đầu
    ctx.translate(2, -8 + bob);
    ctx.rotate(-1.7);
  } else if (isAttacking) {
    // Tấn công: Chém bổ mạnh kiếm về phía trước
    ctx.translate(10, 2 + bob);
    ctx.rotate(0.9);
  } else {
    // Idle sword
    ctx.translate(6, -4 + bob);
  }

  ctx.fillStyle = '#78350f';
  ctx.fillRect(0, 0, 3, 4);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, -14, 3, 14);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(-2, -2, 7, 2);
  ctx.restore();

  ctx.restore();

  // Windup Telegraph: 80px slash range arc indicator & warning badge
  if (isWindup) {
    ctx.save();
    // 80px attack range arc on the ground
    ctx.beginPath();
    ctx.arc(0, 0, 80, -0.85, 0.85);
    ctx.lineTo(0, 0);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.stroke();

    // Secondary pulse ring at 80px
    const pulseR = 40 + (Math.sin(monster.animTimer * 18) * 0.5 + 0.5) * 40;
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, -0.8, 0.8);
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text warning badge
    if (monster.facing === 'left') {
      ctx.scale(-1, 1);
    }
    const warnY = -monster.height / 2 - 22;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    const timeLeft = Math.max(0, monster.windupTimer || 0.8).toFixed(1);
    ctx.strokeText(`⚠️ CHÉM KIẾM (${timeLeft}s)`, 0, warnY);
    ctx.fillText(`⚠️ CHÉM KIẾM (${timeLeft}s)`, 0, warnY);
    ctx.restore();
  }

  // Attack Animation VFX: Sweeping 80px crimson slash arc with fiery blade trail!
  if (isAttacking) {
    ctx.save();
    // Outer crimson crescent wave cutting at exactly 80px
    ctx.beginPath();
    ctx.arc(4, 0, 80, -0.85, 0.85);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.95)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Bright white core slash edge
    ctx.beginPath();
    ctx.arc(4, 0, 78, -0.75, 0.75);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Mid-slash energy glow (60px)
    ctx.beginPath();
    ctx.arc(4, 0, 60, -0.65, 0.65);
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.45)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Slash thrust speed rays extending out to 80px
    ctx.strokeStyle = 'rgba(254, 202, 202, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, -18);
    ctx.lineTo(76, -30);
    ctx.moveTo(14, 0);
    ctx.lineTo(80, 0);
    ctx.moveTo(12, 18);
    ctx.lineTo(76, 30);
    ctx.stroke();

    // Impact sparks at the edge (80px)
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(76, -20, 4, 4);
    ctx.fillRect(80, -2, 4, 4);
    ctx.fillRect(76, 18, 4, 4);
    ctx.restore();
  }
}

/**
 * Flying Bat Fiend with windup hover & claw dive attack animation
 */
function drawBat(ctx: CanvasRenderingContext2D, monster: Monster, isHurt: boolean) {
  const isWindup = monster.attackState === 'windup';
  const isAttacking = monster.attackState === 'attacking';

  const wingFlap = isWindup ? Math.sin(monster.animTimer * 30) : isAttacking ? 0.3 : Math.sin(monster.animTimer * 16);
  const batBob = Math.sin(monster.animTimer * 8) * 3;
  const shake = isWindup ? Math.sin(monster.animTimer * 40) * 1.5 : 0;

  ctx.save();
  ctx.translate(shake + (isAttacking ? 8 : 0), -6 + batBob + (isAttacking ? 4 : 0));

  const batColor = isHurt ? '#ffffff' : '#312e81';
  const wingColor = isHurt ? '#f87171' : '#4c1d95';

  // Wings (animated angle - tucked when winding up, fully spread on attack)
  ctx.save();
  ctx.fillStyle = wingColor;
  if (isWindup) {
    // Wings tucked close
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(-8, -4);
    ctx.lineTo(-6, 8);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.lineTo(8, -4);
    ctx.lineTo(6, 8);
    ctx.fill();
  } else {
    // Normal / Attacking spread wings
    // Left Wing
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-18, -10 * wingFlap);
    ctx.lineTo(-14, 4);
    ctx.fill();
    // Right Wing
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(18, -10 * wingFlap);
    ctx.lineTo(14, 4);
    ctx.fill();
  }
  ctx.restore();

  // Bat Body
  ctx.fillStyle = batColor;
  ctx.fillRect(-5, -6, 10, 12);
  // Ears
  ctx.fillRect(-5, -10, 3, 4);
  ctx.fillRect(2, -10, 3, 4);

  // Glowing red eyes
  ctx.fillStyle = isWindup ? '#facc15' : '#ef4444';
  ctx.fillRect(-3, -3, 2, 2);
  ctx.fillRect(1, -3, 2, 2);

  // Fangs
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-2, 3, 1, 2);
  ctx.fillRect(1, 3, 1, 2);

  // Sharp Claws extended forward on attack
  if (isAttacking) {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(3, 4, 6, 2);
    ctx.fillRect(5, 7, 6, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 3, 3, 2);
    ctx.fillRect(10, 6, 3, 2);
  }

  ctx.restore();

  // Windup Telegraph: 30px dive claw range arc indicator & warning badge
  if (isWindup) {
    ctx.save();
    // 30px attack range arc
    ctx.beginPath();
    ctx.arc(0, 0, 30, -0.9, 0.9);
    ctx.lineTo(0, 0);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.stroke();

    // Text warning badge
    if (monster.facing === 'left') {
      ctx.scale(-1, 1);
    }
    const warnY = -monster.height / 2 - 18;
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText('⚠️ CÀO (30)', 0, warnY);
    ctx.fillText('⚠️ CÀO (30)', 0, warnY);
    ctx.restore();
  }

  // Attack Animation VFX: 3 Razor Claw scratches reaching exactly 30px!
  if (isAttacking) {
    ctx.save();
    // Claw swipe paths reaching 30px
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(6, -10);
    ctx.lineTo(30, -3);
    ctx.moveTo(4, -2);
    ctx.lineTo(30, 4);
    ctx.moveTo(6, 6);
    ctx.lineTo(28, 11);
    ctx.stroke();

    // Sharp white inner core lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(30, -3);
    ctx.moveTo(8, -1);
    ctx.lineTo(30, 4);
    ctx.moveTo(10, 7);
    ctx.lineTo(28, 11);
    ctx.stroke();

    // Wind shockwave ripple at 30px
    ctx.beginPath();
    ctx.arc(10, 0, 20, -0.6, 0.6);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Blood droplets
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(29, -4, 2, 2);
    ctx.fillRect(30, 3, 2, 2);
    ctx.restore();
  }
}

/**
 * The Boss: "Hiệp Sĩ Thiết Giáp Cầm Búa Khổng Lồ" (Iron Armored Knight with Giant Warhammer)
 * Redesigned per user request:
 * - Full heavy steel armor plate with iron horned greathelm
 * - Giant two-handed warhammer with massive hammerhead
 * - Windup animations for "Rung động" (Slam) and "Hất" (Rock Fling)
 */
function drawBoss(ctx: CanvasRenderingContext2D, boss: Monster, isHurt: boolean) {
  const bob = Math.sin(boss.animTimer * 4) * 2;
  const isEnraged = (boss.bossPhase || 1) >= 2;

  const steelMain = isHurt ? '#ffffff' : '#64748b';
  const steelDark = isHurt ? '#f87171' : '#334155';
  const steelHighlight = isHurt ? '#fca5a5' : '#cbd5e1';
  const ironTrim = isHurt ? '#ef4444' : isEnraged ? '#dc2626' : '#475569';

  // Boss Heavy Plate Boots & Greaves
  ctx.fillStyle = steelDark;
  ctx.fillRect(-20, 16 + bob, 16, 20);
  ctx.fillRect(4, 16 + bob, 16, 20);
  ctx.fillStyle = steelMain;
  ctx.fillRect(-22, 28 + bob, 18, 10);
  ctx.fillRect(2, 28 + bob, 18, 10);
  ctx.fillStyle = steelHighlight;
  ctx.fillRect(-20, 18 + bob, 4, 14);
  ctx.fillRect(4, 18 + bob, 4, 14);

  // Iron Plate Torso & Breastplate
  ctx.fillStyle = steelDark;
  ctx.fillRect(-24, -20 + bob, 48, 38);
  ctx.fillStyle = steelMain;
  ctx.fillRect(-20, -18 + bob, 40, 32);
  ctx.fillStyle = steelHighlight;
  ctx.fillRect(-18, -16 + bob, 8, 28);
  ctx.fillRect(10, -16 + bob, 6, 28);

  // Heavy steel belt with iron skull buckle
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-24, 10 + bob, 48, 6);
  ctx.fillStyle = ironTrim;
  ctx.fillRect(-6, 8 + bob, 12, 10);
  ctx.fillStyle = isEnraged ? '#ef4444' : '#94a3b8';
  ctx.fillRect(-3, 11 + bob, 6, 4);

  // Massive Spiked Shoulder Pauldrons
  ctx.fillStyle = steelDark;
  ctx.fillRect(-34, -26 + bob, 14, 16);
  ctx.fillRect(20, -26 + bob, 14, 16);
  ctx.fillStyle = steelHighlight;
  ctx.fillRect(-32, -28 + bob, 10, 6);
  ctx.fillRect(22, -28 + bob, 10, 6);

  // Iron Greathelm (Mũ giáp sắt)
  ctx.fillStyle = steelDark;
  ctx.fillRect(-16, -46 + bob, 32, 28);
  ctx.fillStyle = steelMain;
  ctx.fillRect(-14, -44 + bob, 28, 24);
  ctx.fillStyle = steelHighlight;
  ctx.fillRect(-12, -42 + bob, 6, 20);

  // Greathelm Visor T-Slit with glowing red eyes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-10, -34 + bob, 20, 6);
  ctx.fillRect(-2, -34 + bob, 4, 14); // Vertical slit
  // Glowing eyes
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-8, -33 + bob, 5, 3);
  ctx.fillRect(3, -33 + bob, 5, 3);

  // Helmet Horns / Iron Crest
  ctx.fillStyle = ironTrim;
  ctx.fillRect(-22, -54 + bob, 8, 14);
  ctx.fillRect(-24, -62 + bob, 6, 10);
  ctx.fillRect(14, -54 + bob, 8, 14);
  ctx.fillRect(18, -62 + bob, 6, 10);

  // --- GIANT WARHAMMER (CÂY BÚA KHỔNG LỒ) ---
  ctx.save();
  ctx.translate(22, -6 + bob);

  let hammerAngle = 0.2;
  if (boss.bossCurrentAction === 'windup_melee') {
    // Raised high trembling overhead ready for the 60 dmg normal strike!
    hammerAngle = -1.55 + Math.sin(boss.animTimer * 24) * 0.12;
  } else if (boss.bossCurrentAction === 'melee_slam') {
    // Smashed directly onto the ground with massive force!
    hammerAngle = 1.45;
  } else if (boss.bossCurrentAction === 'windup_slam') {
    // Raised high above head ready to smash Địa Chấn!
    hammerAngle = -1.6 + Math.sin(boss.animTimer * 10) * 0.15;
  } else if (boss.bossCurrentAction === 'slam') {
    // Smashed directly onto the ground!
    hammerAngle = 1.35;
  } else if (boss.bossCurrentAction === 'windup_fling') {
    // Scraped low along the ground ready to fling rocks
    hammerAngle = 1.6;
  } else if (boss.bossCurrentAction === 'fling') {
    // Follow-through high upward scoop
    hammerAngle = -0.9;
  }

  ctx.rotate(hammerAngle);

  // Long Reinforced Iron Haft / Handle
  ctx.fillStyle = '#3f2e1a';
  ctx.fillRect(-6, -4, 60, 8);
  ctx.fillStyle = '#5c4033';
  ctx.fillRect(-6, -2, 60, 4);
  // Iron wraps / bindings on haft
  ctx.fillStyle = '#475569';
  ctx.fillRect(10, -5, 4, 10);
  ctx.fillRect(26, -5, 4, 10);
  ctx.fillRect(44, -5, 4, 10);

  // Pommel
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-10, -6, 6, 12);

  // Massive Rectangular Steel Hammerhead (Đầu Búa Khổng Lồ)
  ctx.fillStyle = '#1e293b'; // Dark shadow
  ctx.fillRect(50, -22, 28, 44);
  ctx.fillStyle = '#475569'; // Main iron body
  ctx.fillRect(52, -20, 24, 40);
  ctx.fillStyle = '#94a3b8'; // Highlight front & edges
  ctx.fillRect(54, -18, 8, 36);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(72, -18, 4, 36);

  // Spikes & studs on hammerhead
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(76, -10, 6, 6);
  ctx.fillRect(76, 4, 6, 6);
  ctx.fillRect(58, -26, 8, 6); // Top crown spike
  ctx.fillRect(58, 20, 8, 6);  // Bottom spike

  ctx.restore();

  // ==========================================
  // BOSS TELEGRAPHS & ATTACK VFX
  // ==========================================

  // 1. Normal Attack Windup (1.0s warning before 60 dmg strike, 60px range)
  if (boss.bossCurrentAction === 'windup_melee') {
    ctx.save();
    // 60px red danger zone arc in front of the boss
    ctx.beginPath();
    ctx.arc(10, 10, 60, -0.75, 0.75);
    ctx.lineTo(10, 10);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.95)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();

    // Pulsing inner ring
    const pulse = 25 + (Math.sin(boss.animTimer * 20) * 0.5 + 0.5) * 35;
    ctx.beginPath();
    ctx.arc(10, 10, pulse, -0.7, 0.7);
    ctx.strokeStyle = 'rgba(254, 202, 202, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Warning Badge with 0.5s countdown
    if (boss.facing === 'left') {
      ctx.scale(-1, 1);
    }
    const warnY = -boss.height / 2 - 44;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    const timeLeft = Math.max(0, boss.bossActionTimer || 0.5).toFixed(1);
    ctx.strokeText(`⚠️ VUNG BÚA (${timeLeft}s) [30 DMG]`, 0, warnY);
    ctx.fillText(`⚠️ VUNG BÚA (${timeLeft}s) [30 DMG]`, 0, warnY);
    ctx.restore();
  }

  // 2. Normal Attack Melee Slam VFX (Impact burst at 60px)
  if (boss.bossCurrentAction === 'melee_slam') {
    ctx.save();
    // Ground shock crater at 55px forward
    ctx.beginPath();
    ctx.arc(55, 15, 26, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Ground fracture lines
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(55, 15);
    ctx.lineTo(40, 26);
    ctx.moveTo(55, 15);
    ctx.lineTo(72, 22);
    ctx.moveTo(55, 15);
    ctx.lineTo(60, -2);
    ctx.stroke();

    // Crimson and golden spark particles
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(52, 10, 6, 6);
    ctx.fillRect(45, 2, 4, 4);
    ctx.fillRect(66, 8, 4, 4);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(40, 18, 5, 5);
    ctx.fillRect(68, 20, 5, 5);
    ctx.restore();
  }

  // 3. Kĩ năng "Địa chấn" Windup (Bán kính 130px, hiệu ứng mặt đất vỡ và rung rắc)
  if (boss.bossCurrentAction === 'windup_slam') {
    ctx.save();
    // Vòng tròn cảnh báo bán kính đúng 130px per user request
    ctx.beginPath();
    ctx.arc(0, 10, 130, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(234, 88, 12, 0.16)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 5]);
    ctx.stroke();

    // Hiệu ứng mặt đất rung rắc và rạn nứt trước khi đập lan tới 130px
    const jitter = Math.sin(boss.animTimer * 45) * 1.8;
    ctx.strokeStyle = 'rgba(234, 88, 12, 0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8 + jitter * 0.05;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(Math.cos(a) * 45 + jitter, 10 + Math.sin(a) * 45);
      ctx.lineTo(Math.cos(a + 0.15) * 90, 10 + Math.sin(a + 0.15) * 90 + jitter);
      ctx.lineTo(Math.cos(a - 0.1) * 128, 10 + Math.sin(a - 0.1) * 128);
      ctx.stroke();
    }

    // Các mảnh đá vụn rung rắc trong bán kính 130px
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-60 + jitter, -25, 7, 6);
    ctx.fillRect(55 - jitter, 45, 8, 6);
    ctx.fillRect(-40, 65 + jitter, 6, 6);
    ctx.fillRect(70 + jitter, -20, 7, 7);

    // Inner pulsing warning ring
    const ringR = 30 + (Math.sin(boss.animTimer * 20) * 0.5 + 0.5) * 95;
    ctx.beginPath();
    ctx.arc(0, 10, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Warning Badge
    if (boss.facing === 'left') {
      ctx.scale(-1, 1);
    }
    const warnY = -boss.height / 2 - 44;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    const timeLeft = Math.max(0, boss.bossActionTimer || 0.5).toFixed(1);
    ctx.strokeText(`⚠️ ĐỊA CHẤN (${timeLeft}s) [130px - CHOÁNG 1s]`, 0, warnY);
    ctx.fillText(`⚠️ ĐỊA CHẤN (${timeLeft}s) [130px - CHOÁNG 1s]`, 0, warnY);
    ctx.restore();
  }

  // 4. Kĩ năng "Địa chấn" Slam Impact VFX (Mặt đất vỡ nát và rung rắc dữ dội trong 130px)
  if (boss.bossCurrentAction === 'slam') {
    ctx.save();
    // Vòng sóng chấn động chính 130px
    ctx.beginPath();
    ctx.arc(0, 10, 130, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(234, 88, 12, 0.95)';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Vành đất vỡ nứt ngoài cùng
    ctx.beginPath();
    ctx.arc(0, 10, 120, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Các vết nứt đất chằng chịt, vỡ toác lan toả từ tâm ra 130px
    ctx.strokeStyle = '#1c1917'; // Vết nứt đen sâu hoắm
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(Math.cos(a) * 45, 10 + Math.sin(a) * 45);
      ctx.lineTo(Math.cos(a + 0.22) * 88, 10 + Math.sin(a + 0.22) * 88);
      ctx.lineTo(Math.cos(a) * 130, 10 + Math.sin(a) * 130);
      ctx.stroke();
    }

    // Lõi lửa nham thạch rực sáng bên trong khe nứt
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(Math.cos(a) * 45, 10 + Math.sin(a) * 45);
      ctx.lineTo(Math.cos(a + 0.22) * 88, 10 + Math.sin(a + 0.22) * 88);
      ctx.lineTo(Math.cos(a) * 130, 10 + Math.sin(a) * 130);
      ctx.stroke();
    }

    // Các mảng đất đá vỡ vụn bật lên xung quanh
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-85, -40, 14, 10);
    ctx.fillRect(75, -35, 15, 12);
    ctx.fillRect(-65, 60, 13, 9);
    ctx.fillRect(68, 55, 14, 10);
    ctx.fillRect(-25, -88, 12, 9);
    ctx.fillRect(20, 82, 14, 10);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-82, -37, 5, 4);
    ctx.fillRect(77, -32, 6, 5);
    ctx.fillRect(-62, 62, 5, 4);
    ctx.fillRect(70, 57, 5, 4);
    ctx.restore();
  }

  // 5. Kĩ năng "Hất đá" Windup (Chỉ có thông báo tên kĩ năng chứ KHÔNG hiển thị vùng tấn công)
  if (boss.bossCurrentAction === 'windup_fling') {
    ctx.save();
    // Warning Badge: CHỈ HIỂN THỊ THÔNG BÁO TÊN KĨ NĂNG
    if (boss.facing === 'left') {
      ctx.scale(-1, 1);
    }
    const warnY = -boss.height / 2 - 44;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isEnraged ? '#ef4444' : '#f59e0b';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    const flingTitle = '⚠️ HẤT 3 VIÊN ĐÁ! 🪨';
    ctx.strokeText(flingTitle, 0, warnY);
    ctx.fillText(flingTitle, 0, warnY);
    ctx.restore();
  }

  // 6. Kĩ năng "Hất đá" Fling Follow-Through VFX
  if (boss.bossCurrentAction === 'fling') {
    ctx.save();
    // Upward dirt and rubble spray
    ctx.fillStyle = '#78350f';
    ctx.fillRect(20, -15, 8, 8);
    ctx.fillRect(32, -28, 10, 10);
    ctx.fillRect(44, -20, 8, 8);
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(24, -20, 6, 6);
    ctx.fillRect(38, -32, 6, 6);
    ctx.restore();
  }
}

/**
 * Draws the Farmer NPC (Bác Nông Dân)
 * Peasant farmer with straw hat, overalls, pitchfork, and friendly dialogue
 */
export function drawNPC(ctx: CanvasRenderingContext2D, npc: NPC, animTime: number) {
  ctx.save();
  ctx.translate(Math.floor(npc.x), Math.floor(npc.y));

  const bob = Math.sin(animTime * 3) * 1.5;

  // Small cozy wooden fence & carrot patch around the NPC spot
  ctx.fillStyle = '#451a03';
  ctx.fillRect(-38, 14, 4, 14);
  ctx.fillRect(34, 14, 4, 14);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-42, 18, 12, 3);
  ctx.fillRect(30, 18, 12, 3);

  // Carrot tops in soil
  ctx.fillStyle = '#15803d';
  ctx.fillRect(-28, 18, 4, 4);
  ctx.fillRect(-20, 18, 4, 4);
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(-27, 22, 2, 2);
  ctx.fillRect(-19, 22, 2, 2);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boots
  ctx.fillStyle = '#451a03';
  ctx.fillRect(-6, 8 + bob, 4, 8);
  ctx.fillRect(2, 8 + bob, 4, 8);

  // Blue Denim Overalls & Rustic Shirt
  ctx.fillStyle = '#1e3a8a'; // Denim pants
  ctx.fillRect(-7, 0 + bob, 14, 10);
  ctx.fillStyle = '#166534'; // Green rustic shirt
  ctx.fillRect(-8, -12 + bob, 16, 12);
  ctx.fillStyle = '#1e3a8a'; // Overall straps
  ctx.fillRect(-6, -10 + bob, 3, 10);
  ctx.fillRect(3, -10 + bob, 3, 10);

  // Friendly Face
  ctx.fillStyle = '#fbcfe8';
  ctx.fillRect(-6, -22 + bob, 12, 11);
  // Cheerful eyes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-4, -18 + bob, 2, 3);
  ctx.fillRect(2, -18 + bob, 2, 3);
  // Friendly smile
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(-2, -13 + bob, 4, 2);

  // Wide Straw Hat (Nón lá / Mũ rơm)
  ctx.fillStyle = '#ca8a04'; // Brim
  ctx.fillRect(-16, -26 + bob, 32, 5);
  ctx.fillStyle = '#eab308'; // Crown
  ctx.fillRect(-10, -34 + bob, 20, 9);
  ctx.fillStyle = '#fef08a'; // Highlight
  ctx.fillRect(-8, -33 + bob, 8, 4);
  // Red ribbon on hat
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(-10, -27 + bob, 20, 2);

  // Pitchfork in right hand
  ctx.save();
  ctx.translate(10, -10 + bob);
  ctx.fillStyle = '#78350f'; // Pole
  ctx.fillRect(0, -18, 3, 36);
  ctx.fillStyle = '#94a3b8'; // Metal prongs
  ctx.fillRect(-4, -22, 11, 4);
  ctx.fillRect(-4, -28, 2, 6);
  ctx.fillRect(0, -28, 2, 6);
  ctx.fillRect(5, -28, 2, 6);
  ctx.restore();

  // Floating Dialogue Bubble / Prompt
  const promptY = -48 + Math.sin(animTime * 4) * 3;
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = 'center';

  if (npc.isPlayerNear) {
    // Proximity interactive callout
    const boxW = 160;
    const boxH = 20;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-boxW / 2 - 1, promptY - 1, boxW + 2, boxH + 2);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-boxW / 2, promptY, boxW, boxH);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('💬 BÁC NÔNG DÂN [E]', 0, promptY + 13);
  } else {
    // Subtle name label
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText('Bác Nông Dân', 0, promptY + 12);
    ctx.fillStyle = '#facc15';
    ctx.fillText('Bác Nông Dân', 0, promptY + 12);
  }

  ctx.restore();
}

/**
 * Draws Projectiles: Player Fireball, Boss Shockwave, Boss Flying Rocks
 */
export function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile) {
  ctx.save();
  ctx.translate(Math.floor(proj.x), Math.floor(proj.y));

  if (proj.type === 'player_fireball') {
    // Fire Sword Explosive Fireball: Countdown 1.5s
    const pulse = Math.sin(proj.life * 20) * 2;
    const rad = proj.radius + pulse;

    // Outer blazing flame aura
    ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.beginPath();
    ctx.arc(0, 0, rad * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Fireball pixel body
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-rad, -rad, rad * 2, rad * 2);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-rad * 0.6, -rad * 0.6, rad * 1.2, rad * 1.2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-rad * 0.3, -rad * 0.3, rad * 0.6, rad * 0.6);

    // Remaining explosion timer floating indicator
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, proj.life).toFixed(1)}s`, 0, -rad - 4);

  } else if (proj.type === 'rock') {
    // Boss Flung Jagged Rock
    const rot = proj.life * 8;
    ctx.rotate(rot);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-proj.radius + 2, -proj.radius + 2, proj.radius * 2, proj.radius * 2);

    // Jagged Rock body
    ctx.fillStyle = '#475569';
    ctx.fillRect(-proj.radius, -proj.radius, proj.radius * 2, proj.radius * 2);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-proj.radius + 2, -proj.radius + 2, proj.radius * 1.4, proj.radius * 1.4);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-proj.radius + 4, -proj.radius + 4, proj.radius * 0.8, proj.radius * 0.8);

  } else if (proj.type === 'arrow') {
    // Standard Bow Arrow
    const angle = Math.atan2(proj.vy, proj.vx);
    ctx.rotate(angle);
    // Shaft
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-10, -1, 18, 2);
    // Arrowhead
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(8, -3);
    ctx.lineTo(14, 0);
    ctx.lineTo(8, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.fillRect(8, -1, 2, 2);
    // Fletching feathers
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-10, -3, 3, 2);
    ctx.fillRect(-10, 1, 3, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -2, 2, 1);
    ctx.fillRect(-8, 1, 2, 1);
  } else if (proj.type === 'piercing_arrow') {
    // Powerful Piercing Arrow (Skill: Xuyên Phá - 12 dmg)
    const angle = Math.atan2(proj.vy, proj.vx);
    ctx.rotate(angle);
    // Glowing cyan energy aura
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillRect(-18, -4, 34, 8);
    // Energy core shaft
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-14, -2, 24, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-12, -1, 22, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, 0, 16, 1);
    // Diamond piercing tip
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(10, -5);
    ctx.lineTo(19, 0);
    ctx.lineTo(10, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, -2, 5, 4);
    // Energy vanes
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(-14, -5, 4, 3);
    ctx.fillRect(-14, 2, 4, 3);
  } else if (proj.type === 'shockwave') {
    // Ground shockwave spike from hammer slam
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-proj.radius, -proj.radius * 1.5, proj.radius * 2, proj.radius * 3);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-proj.radius * 0.5, -proj.radius, proj.radius, proj.radius * 2);
  } else {
    // Default fireball
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-proj.radius, -proj.radius, proj.radius * 2, proj.radius * 2);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-proj.radius * 0.5, -proj.radius * 0.5, proj.radius, proj.radius);
  }

  ctx.restore();
}

/**
 * Draws Item Drops (Potion, EXP Gem)
 */
export function drawDropItem(ctx: CanvasRenderingContext2D, item: DropItem) {
  ctx.save();
  ctx.translate(Math.floor(item.x), Math.floor(item.y + item.bob));

  // Glow
  const glowColor = item.type === 'potion' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(56, 189, 248, 0.35)';
  ctx.fillStyle = glowColor;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();

  if (item.type === 'potion') {
    // Red Health Potion Bottle
    ctx.fillStyle = '#78350f'; // Cork
    ctx.fillRect(-2, -8, 4, 3);
    ctx.fillStyle = '#94a3b8'; // Glass neck
    ctx.fillRect(-3, -5, 6, 2);
    // Bottle flask
    ctx.fillStyle = '#ef4444'; // Red liquid
    ctx.fillRect(-6, -3, 12, 10);
    ctx.fillStyle = '#f87171';
    ctx.fillRect(-4, -1, 4, 6);
    // Glass highlight
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, -2, 2, 4);
  } else {
    // Cyan EXP Gem Diamond
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -3, 3, 3);
  }

  ctx.restore();
}

/**
 * Draws Forest Background across 4x map size:
 * Lush grass, swaying grass tufts, wildflowers, trees, and NO central circle!
 */
export function drawForest(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  animTime: number,
  bossSummoned: boolean
) {
  // Deep lush forest ground
  ctx.fillStyle = '#14381e';
  ctx.fillRect(0, 0, width, height);

  const tileSize = 48;
  const cols = Math.ceil(width / tileSize) + 1;
  const rows = Math.ceil(height / tileSize) + 1;

  // 1. Draw Grass Tiles with pixel noise & dirt paths across whole map
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const tileX = c * tileSize;
      const tileY = r * tileSize;

      const seed = (c * 7919 + r * 65537) % 100;

      // Natural grass color variations
      if (seed < 40) {
        ctx.fillStyle = '#184424';
      } else if (seed < 70) {
        ctx.fillStyle = '#153b20';
      } else if (seed < 90) {
        ctx.fillStyle = '#1c4e2a';
      } else {
        ctx.fillStyle = '#3f2e1a'; // Dirt patch
      }
      ctx.fillRect(tileX, tileY, tileSize, tileSize);

      // Pixel grass blades / tufts within tile
      if (seed % 3 === 0) {
        ctx.fillStyle = '#226335';
        ctx.fillRect(tileX + 10, tileY + 12, 3, 5);
        ctx.fillRect(tileX + 14, tileY + 10, 3, 7);
      }
      if (seed % 5 === 0) {
        ctx.fillStyle = '#112b17';
        ctx.fillRect(tileX + 28, tileY + 30, 4, 4);
      }

      // Wildflowers & Forest Mushrooms (deterministic by seed)
      if (seed === 7 || seed === 23) {
        // Yellow buttercups
        ctx.fillStyle = '#facc15';
        ctx.fillRect(tileX + 16, tileY + 20, 3, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tileX + 17, tileY + 19, 1, 1);
      } else if (seed === 41 || seed === 63) {
        // Red wild berry flower
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(tileX + 22, tileY + 14, 3, 3);
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(tileX + 23, tileY + 13, 1, 1);
      } else if (seed === 55 || seed === 83) {
        // Forest Mushroom (red cap with white dots)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(tileX + 20, tileY + 28, 2, 4);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(tileX + 18, tileY + 25, 6, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tileX + 19, tileY + 26, 1, 1);
        ctx.fillRect(tileX + 22, tileY + 26, 1, 1);
      } else if (seed === 12 || seed === 76) {
        // Mossy forest pebble
        ctx.fillStyle = '#475569';
        ctx.fillRect(tileX + 8, tileY + 34, 8, 5);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(tileX + 9, tileY + 33, 4, 2);
      }
    }
  }

  // 2. Animated swaying tall grass clumps across the huge map
  const clumpCols = Math.floor(width / 320);
  const clumpRows = Math.floor(height / 280);

  for (let cc = 0; cc < clumpCols; cc++) {
    for (let cr = 0; cr < clumpRows; cr++) {
      const cx = cc * 320 + 120 + ((cc * 17 + cr * 31) % 80);
      const cy = cr * 280 + 100 + ((cc * 23 + cr * 19) % 80);
      const sway = Math.sin(animTime * 3 + cc + cr) * 3;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(cx + sway, cy - 10, 2, 10);
      ctx.fillRect(cx + 3 + sway * 0.7, cy - 14, 2, 14);
      ctx.fillRect(cx + 6 + sway * 1.2, cy - 8, 2, 8);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(cx, cy - 4, 8, 4);
    }
  }

  // (NOTE: Central Circle has been completely removed per user request: "Xóa bỏ vòng tròn ở giữa map.")

  // 3. Draw Trees along perimeter and across the 4x large forest
  // Border trees
  const borderSpacing = 160;
  // Top & Bottom
  for (let x = 60; x < width - 40; x += borderSpacing) {
    const isOak = (Math.floor(x / borderSpacing)) % 2 === 0;
    drawPixelTree(ctx, x, 65, isOak ? 'oak' : 'pine', 1.1, animTime);
    drawPixelTree(ctx, x, height - 65, isOak ? 'pine' : 'oak', 1.1, animTime);
  }
  // Left & Right
  for (let y = 160; y < height - 120; y += borderSpacing) {
    const isOak = (Math.floor(y / borderSpacing)) % 2 === 0;
    drawPixelTree(ctx, 65, y, isOak ? 'pine' : 'oak', 1.1, animTime);
    drawPixelTree(ctx, width - 65, y, isOak ? 'oak' : 'pine', 1.1, animTime);
  }

  // Decorative interior trees spread nicely across 4x map (excluding near starting center 1300-1500, 900-1100)
  const interiorTrees = [
    { x: 380, y: 360, type: 'oak' as const, scale: 1.15 },
    { x: 680, y: 520, type: 'pine' as const, scale: 1.1 },
    { x: 1040, y: 380, type: 'oak' as const, scale: 1.2 },
    { x: 1800, y: 440, type: 'pine' as const, scale: 1.1 },
    { x: 2200, y: 380, type: 'oak' as const, scale: 1.2 },
    { x: 500, y: 1100, type: 'pine' as const, scale: 1.1 },
    { x: 860, y: 1300, type: 'oak' as const, scale: 1.25 },
    { x: 2000, y: 1150, type: 'oak' as const, scale: 1.2 },
    { x: 2350, y: 1350, type: 'pine' as const, scale: 1.1 },
    { x: 640, y: 1650, type: 'oak' as const, scale: 1.15 },
    { x: 1200, y: 1600, type: 'pine' as const, scale: 1.1 },
    { x: 1750, y: 1650, type: 'oak' as const, scale: 1.2 },
    { x: 2200, y: 1620, type: 'pine' as const, scale: 1.1 },
  ];

  interiorTrees.forEach((tree) => {
    if (tree.x < width && tree.y < height) {
      drawPixelTree(ctx, tree.x, tree.y, tree.type, tree.scale, animTime);
    }
  });

  // 4. Fireflies (Đom đóm bay lập lòe trong rừng)
  const fireflyCount = 28;
  for (let i = 0; i < fireflyCount; i++) {
    const fx = ((i * 197 + animTime * 22) % (width - 160)) + 80;
    const fy = ((i * 151 + Math.sin(animTime * 1.5 + i) * 35) % (height - 160)) + 80;
    const pulse = Math.sin(animTime * 4 + i * 2);

    if (pulse > -0.2) {
      const glowColor = bossSummoned ? 'rgba(239, 68, 68, 0.4)' : 'rgba(163, 230, 53, 0.35)';
      const coreColor = bossSummoned ? '#f87171' : '#bef264';

      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(fx, fy, 6 + pulse * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = coreColor;
      ctx.fillRect(fx - 1, fy - 1, 3, 3);
    }
  }
}

/**
 * Procedural Pixel Art Tree Renderer
 * Draws an Oak or Pine tree with wooden trunk, layered foliage, and soft ground shadow.
 */
function drawPixelTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: 'oak' | 'pine',
  scale: number = 1.0,
  animTime: number = 0
) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));
  ctx.scale(scale, scale);

  // Subtle wind sway on leaves
  const windSway = Math.sin(animTime * 2 + x * 0.01) * 1.5;

  // Ground Shadow under tree
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  const shadowRadius = type === 'oak' ? 28 : 22;
  ctx.ellipse(0, 8, shadowRadius, shadowRadius * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  if (type === 'oak') {
    // 1. Broad Oak Trunk & Roots
    ctx.fillStyle = '#451a03'; // Dark bark
    ctx.fillRect(-7, -10, 14, 20);
    // Tree roots
    ctx.fillRect(-11, 4, 6, 6);
    ctx.fillRect(5, 4, 6, 6);
    // Bark highlight & texture
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-4, -8, 4, 16);
    ctx.fillStyle = '#291002';
    ctx.fillRect(1, -8, 4, 16);

    // 2. Multi-layered Pixel Canopy
    ctx.save();
    ctx.translate(windSway, 0);

    // Base dark foliage layer
    ctx.fillStyle = '#14532d';
    ctx.fillRect(-28, -48, 56, 38);
    ctx.fillRect(-22, -54, 44, 8);
    ctx.fillRect(-32, -38, 64, 22);

    // Mid green layer
    ctx.fillStyle = '#166534';
    ctx.fillRect(-24, -46, 48, 30);
    ctx.fillRect(-18, -52, 36, 8);
    ctx.fillRect(-26, -34, 52, 16);

    // Highlights (top and left light source)
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-20, -50, 20, 12);
    ctx.fillRect(-24, -40, 16, 14);
    ctx.fillRect(2, -44, 14, 10);

    // Brightest leaf tip pixels
    ctx.fillStyle = '#86efac';
    ctx.fillRect(-18, -48, 8, 4);
    ctx.fillRect(-22, -36, 6, 4);

    ctx.restore();

  } else {
    // Pine / Evergreen Tree
    // 1. Trunk
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-4, -4, 8, 14);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-3, -3, 3, 12);

    // 2. Conical Stepped Triangular Canopy
    ctx.save();
    ctx.translate(windSway * 0.8, 0);

    // Bottom layer
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(-22, -22, 44, 18);
    ctx.fillStyle = '#047857';
    ctx.fillRect(-18, -20, 36, 12);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-14, -18, 14, 6);

    // Middle layer
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(-17, -36, 34, 16);
    ctx.fillStyle = '#047857';
    ctx.fillRect(-14, -34, 28, 10);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-11, -32, 12, 5);

    // Top tier & pointed tip
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(-11, -48, 22, 14);
    ctx.fillRect(-6, -56, 12, 10);
    ctx.fillRect(-2, -60, 4, 6);
    ctx.fillStyle = '#047857';
    ctx.fillRect(-8, -46, 16, 10);
    ctx.fillRect(-4, -54, 8, 8);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-6, -44, 8, 5);

    ctx.restore();
  }

  ctx.restore();
}

// Keep drawArena as alias to drawForest for seamless compatibility
export const drawArena = drawForest;
