import React, { useEffect, useRef, useState, useCallback } from 'react';
import './SpaceShooter.css';

// DEBUG: Verify file is loaded

// Helper to resolve public assets (Vite serves public/ folder at root)
const asset = (path) => `/${path.replace(/^\//, '')}`;

// ============= WEB AUDIO SOUND SYSTEM =============
class SoundSystem {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.initialized = false;
    this.musicPlaying = false;
    this.musicNodes = [];
    this.masterVolume = 0.5;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.6;
  }
  
  setMasterVolume(value) {
    this.masterVolume = value;
    if (this.masterGain) {
      this.masterGain.gain.value = value;
    }
  }
  
  setMusicVolume(value) {
    this.musicVolume = value;
    if (this.musicGain) {
      this.musicGain.gain.value = value;
    }
  }
  
  setSfxVolume(value) {
    this.sfxVolume = value;
    if (this.sfxGain) {
      this.sfxGain.gain.value = value;
    }
  }
  
  init() {
    if (this.initialized) return;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.audioContext.destination);
      
      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = 0.3;
      this.musicGain.connect(this.masterGain);
      
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.masterGain);
      
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }
  
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  // Suspend audio context (for pausing game)
  suspend() {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }
  
  // Laser/bullet shot sound
  playShoot(pitch = 1) {
    if (!this.initialized) return;
    try {
      const shootSound = new Audio('/main-weapons.wav');
      shootSound.volume = 0.25 * this.sfxVolume;
      shootSound.playbackRate = pitch;
      shootSound.play().catch(() => {});
    } catch (e) {}
  }
  
  // Enemy shoot sound (distinct from player)
  playEnemyShoot() {
    if (!this.initialized) return;
    try {
      const enemyGunSound = new Audio('/enemy-guns.mp3');
      enemyGunSound.volume = 0.2;
      enemyGunSound.play().catch(() => {});
    } catch (e) {}
  }
  
  // Shield hit sound (sci-fi energy absorption)
  playShieldHit() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // High-frequency shimmer
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2000, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1500, now);
    osc2.frequency.exponentialRampToValueAtTime(400, now + 0.2);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.value = 5;
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.2);
    osc2.stop(now + 0.2);
  }
  
  // Missile launch sound
  playMissile() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const noise = this.createNoise(0.15);
    const gain = ctx.createGain();
    const noiseGain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    noiseGain.gain.setValueAtTime(0.1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    noise.connect(noiseGain);
    gain.connect(this.sfxGain);
    noiseGain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }
  
  // Wave cannon charge sound
  playWaveCannonCharge() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.6);
  }
  
  // Wave cannon fire sound
  playWaveCannonFire() {
    if (!this.initialized) return;
    try {
      const waveCannonSound = new Audio('/power-weapons.wav');
      waveCannonSound.volume = this.sfxGain.gain.value;
      waveCannonSound.play().catch(() => {});
    } catch (e) {
      // Fallback to synthesized sound if audio file fails
      const ctx = this.audioContext;
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const noise = this.createNoise(0.4);
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(100, now);
      osc1.frequency.exponentialRampToValueAtTime(50, now + 0.4);
      
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(150, now);
      osc2.frequency.exponentialRampToValueAtTime(30, now + 0.4);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.4);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      osc1.connect(filter);
      osc2.connect(filter);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    }
  }
  
  // Explosion sounds (different sizes)
  playExplosion(size = 'normal') {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const duration = size === 'boss' ? 0.8 : size === 'large' ? 0.5 : 0.25;
    const volume = size === 'boss' ? 0.4 : size === 'large' ? 0.3 : 0.2;
    const startFreq = size === 'boss' ? 150 : size === 'large' ? 200 : 300;
    
    // Noise burst
    const noise = this.createNoise(duration);
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(startFreq * 10, now);
    filter.frequency.exponentialRampToValueAtTime(startFreq, now + duration);
    
    noiseGain.gain.setValueAtTime(volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    
    // Low thump
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + duration * 0.5);
    
    oscGain.gain.setValueAtTime(volume * 0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.5);
    
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + duration);
  }
  
  // Weapon Level Up sound - epic ascending fanfare
  playWeaponLevelUp(level = 2) {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Base frequency increases with level
    const baseFreq = 300 + level * 50;
    const notes = [1, 1.25, 1.5, 1.75, 2]; // Ascending arpeggio
    
    notes.forEach((mult, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = baseFreq * mult;
      
      const startTime = now + i * 0.06;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
    
    // Add a shimmering high-frequency layer
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(baseFreq * 4, now);
    shimmer.frequency.exponentialRampToValueAtTime(baseFreq * 6, now + 0.4);
    shimmerGain.gain.setValueAtTime(0.05, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.sfxGain);
    shimmer.start(now);
    shimmer.stop(now + 0.4);
  }
  
  // Power-up pickup sound
  playPowerup(rarity = 'common') {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const baseFreq = rarity === 'legendary' ? 600 : rarity === 'rare' ? 500 : 400;
    const notes = rarity === 'legendary' ? [1, 1.25, 1.5, 2] : rarity === 'rare' ? [1, 1.25, 1.5] : [1, 1.5];
    
    notes.forEach((mult, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = baseFreq * mult;
      
      const startTime = now + i * 0.08;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }
  
  // Dash sound
  playDash() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }
  
  // Player hit sound
  playHit() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.3);
  }
  
  // Player ship destroyed sound
  playPlayerDestroy() {
    if (!this.initialized) return;
    try {
      const destroySound = new Audio('/user-ship-destroy.wav');
      destroySound.volume = 0.5 * this.sfxVolume;
      destroySound.play().catch(() => {});
    } catch (e) {}
  }
  
  // Menu select sound
  playMenuSelect() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 600;
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }
  
  // Menu navigate sound
  playMenuMove() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 400;
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.05);
  }
  
  // UI sparkle sound for button clicks, confirmations, selections
  playUISparkle() {
    try {
      const sparkleSound = new Audio(asset('mixkit-fairy-magic-sparkle-871.mp3'));
      sparkleSound.volume = this.sfxVolume * this.masterVolume * 0.5;
      sparkleSound.play().catch(() => {});
    } catch (e) {}
  }
  
  // Graze sound - quick high-pitched zing for near-misses
  playGraze() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(4000, now + 0.03);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.05);
  }
  
  // Bomb activation sound - powerful screen-clearing effect
  playBomb() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Deep bass rumble
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(80, now);
    bass.frequency.exponentialRampToValueAtTime(30, now + 0.8);
    bassGain.gain.setValueAtTime(0.4, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    bass.connect(bassGain);
    bassGain.connect(this.sfxGain);
    bass.start(now);
    bass.stop(now + 1.0);
    
    // High sweep
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(800, now);
    sweep.frequency.exponentialRampToValueAtTime(100, now + 0.5);
    sweepGain.gain.setValueAtTime(0.15, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    sweep.connect(sweepGain);
    sweepGain.connect(this.sfxGain);
    sweep.start(now);
    sweep.stop(now + 0.6);
    
    // White noise burst
    const bufferSize = ctx.sampleRate * 0.3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
  }
  
  // Bullet cancel sound - satisfying pop when bullets become points
  playBulletCancel() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }
  
  // Boss warning sound
  playBossWarning() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.value = 150;
      
      const startTime = now + i * 0.3;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.15);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.2);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    }
  }
  
  // Combo hit sound - rising pitch based on combo count
  playComboHit(comboCount) {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Pitch rises with combo, capped at 2x
    const pitchMult = Math.min(2, 1 + comboCount * 0.08);
    const volume = Math.min(0.25, 0.1 + comboCount * 0.015);
    
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440 * pitchMult, now);
    osc.frequency.exponentialRampToValueAtTime(880 * pitchMult, now + 0.08);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(660 * pitchMult, now);
    osc2.frequency.exponentialRampToValueAtTime(1320 * pitchMult, now + 0.06);
    
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.1);
    osc2.stop(now + 0.1);
  }
  
  // Critical hit sound - satisfying impact
  playCriticalHit() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Impact thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    // High ring
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(2400, now + 0.05);
    
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(this.sfxGain);
    gain2.connect(this.sfxGain);
    
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.15);
    osc2.stop(now + 0.1);
  }
  
  // Electric/laser beam sustain sound
  playElectricZap() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.setValueAtTime(120, now + 0.05);
    osc.frequency.setValueAtTime(80, now + 0.1);
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(2000, now);
    osc2.frequency.linearRampToValueAtTime(500, now + 0.15);
    
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 10;
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.15);
    osc2.stop(now + 0.15);
  }
  
  // Enemy death sound (distinct, satisfying pop)
  playEnemyDeath() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Pop sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    
    // Crackle overlay
    const noise = this.createNoise(0.08);
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 2000;
    
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    osc.connect(gain);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    gain.connect(this.sfxGain);
    noiseGain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.12);
  }
  
  // Whoosh sound for fast movement/dash trails
  playWhoosh() {
    if (!this.initialized) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const noise = this.createNoise(0.2);
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.2);
    filter.Q.value = 2;
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
  }
  
  // Create white noise
  createNoise(duration) {
    const ctx = this.audioContext;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.start(ctx.currentTime);
    return source;
  }
  
  // Background music (procedural chiptune)
  startMusic() {
    if (!this.initialized || this.musicPlaying) return;
    this.musicPlaying = true;
    
    const ctx = this.audioContext;
    
    // Simple bass line pattern (notes in Hz)
    const bassNotes = [110, 110, 146.83, 146.83, 130.81, 130.81, 98, 98];
    let bassIndex = 0;
    
    // Arpeggio pattern
    const arpNotes = [220, 277.18, 329.63, 440, 329.63, 277.18];
    let arpIndex = 0;
    
    const playBass = () => {
      if (!this.musicPlaying) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      
      osc.type = 'square';
      osc.frequency.value = bassNotes[bassIndex];
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      osc.connect(gain);
      gain.connect(this.musicGain);
      
      osc.start(now);
      osc.stop(now + 0.2);
      
      bassIndex = (bassIndex + 1) % bassNotes.length;
      this.musicNodes.push(setTimeout(playBass, 250));
    };
    
    const playArp = () => {
      if (!this.musicPlaying) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      
      osc.type = 'triangle';
      osc.frequency.value = arpNotes[arpIndex];
      
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      osc.connect(gain);
      gain.connect(this.musicGain);
      
      osc.start(now);
      osc.stop(now + 0.1);
      
      arpIndex = (arpIndex + 1) % arpNotes.length;
      this.musicNodes.push(setTimeout(playArp, 125));
    };
    
    // Add a kick drum
    const playKick = () => {
      if (!this.musicPlaying) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      osc.connect(gain);
      gain.connect(this.musicGain);
      
      osc.start(now);
      osc.stop(now + 0.1);
      
      this.musicNodes.push(setTimeout(playKick, 500));
    };
    
    playBass();
    setTimeout(playArp, 62);
    setTimeout(playKick, 125);
  }
  
  stopMusic() {
    this.musicPlaying = false;
    this.musicNodes.forEach(id => clearTimeout(id));
    this.musicNodes = [];
  }
}

// Global sound instance
const soundSystem = new SoundSystem();

// ============= GAME CONSTANTS =============
const GAME_WIDTH = 1400;
const GAME_HEIGHT = 500;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 30;
const PLAYER_HITBOX_RADIUS = 4; // Precise hitbox for bullet hell - much smaller than sprite
const BULLET_WIDTH = 15;
const BULLET_HEIGHT = 4;
const MISSILE_WIDTH = 20;
const MISSILE_HEIGHT = 8;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 30;
const BOSS_WIDTH = 120;
const BOSS_HEIGHT = 80;
const POWERUP_SIZE = 25;
const FORCE_SIZE = 20;
const PLAYER_SPEED = 6;
const BULLET_SPEED = 10;
const MISSILE_SPEED = 8;
const ENEMY_SPEED = 3;
const SPAWN_RATE = 1500; // ms between enemy spawns
const BASE_FIRE_RATE = 250; // ms between shots
const POWERUP_DROP_CHANCE = 0.3; // 30% chance to drop power-up
const ENEMY_FIRE_RATE = 1200; // ms between enemy shots (faster!)
const ENEMY_BULLET_SPEED = 6;
const ENEMY_BULLET_WIDTH = 12;
const ENEMY_BULLET_HEIGHT = 4;
const WAVE_CANNON_MAX_CHARGE = 100; // Full charge
const WAVE_CANNON_CHARGE_RATE = 2; // Per frame
const DASH_DISTANCE = 80; // How far the dash moves
const DASH_COOLDOWN = 60; // Frames before can dash again (~1 second)
const DASH_DURATION = 8; // Frames of invincibility during dash

// Power-up types with rarity system
const POWERUP_TYPES = {
  // Common power-ups (55% of drops)
  RAPID_FIRE: { color: '#ffff00', icon: '⚡', name: 'Rapid Fire', rarity: 'common', glowColor: '#ffaa00', description: 'Increases fire rate' },
  MISSILES: { color: '#ff6600', icon: '💥', name: 'Missiles', rarity: 'common', glowColor: '#ff3300', description: 'Homing missiles' },
  SHIELD: { color: '#00ffff', icon: '🛡️', name: 'Shield', rarity: 'common', glowColor: '#0088ff', description: '+3 shield hits' },
  REPAIR: { color: '#00ff00', icon: '🩹', name: 'Repair', rarity: 'common', glowColor: '#00cc00', description: 'Restore 1 life' },
  SCORE_BONUS: { color: '#ffd700', icon: '⭐', name: 'Score Bonus', rarity: 'common', glowColor: '#ffaa00', description: '+500 points' },
  // Rare power-ups (25% of drops)
  FORCE: { color: '#ff00ff', icon: '🔮', name: 'Force Pod', rarity: 'rare', glowColor: '#aa00ff', description: 'Attach Force Pod' },
  OPTION: { color: '#00ff88', icon: '🛸', name: 'Option', rarity: 'rare', glowColor: '#00aa44', description: 'Add satellite drone' },
  SPEED: { color: '#00ffaa', icon: '⚡', name: 'Speed Boost', rarity: 'rare', glowColor: '#00ddff', description: '+25% speed' },
  PIERCING: { color: '#ff8800', icon: '«', name: 'Piercing', rarity: 'rare', glowColor: '#ff6600', description: 'Bullets pierce enemies' },
  DOUBLE_SCORE: { color: '#ffff88', icon: '×2', name: 'Double Score', rarity: 'rare', glowColor: '#ffee00', description: '2x score for 20s' },
  RICOCHET: { color: '#88ffff', icon: '🔄', name: 'Ricochet', rarity: 'rare', glowColor: '#44ddff', description: 'Bullets bounce' },
  // Legendary power-ups (15% of drops)
  SPREAD: { color: '#ff0066', icon: '✳', name: 'Spread Shot', rarity: 'legendary', glowColor: '#ff0044', description: 'Multi-directional fire' },
  MAGNET: { color: '#ffff00', icon: '🧲', name: 'Magnet', rarity: 'legendary', glowColor: '#ffcc00', description: 'Attract power-ups' },
  MEGA_BOMB: { color: '#ff4400', icon: '💣', name: 'Mega Bomb', rarity: 'legendary', glowColor: '#ff2200', description: 'Clear all enemies' },
  INVINCIBILITY: { color: '#ffffff', icon: '✨', name: 'Invincibility', rarity: 'legendary', glowColor: '#ffffaa', description: 'Immune for 8 seconds' },
  LASER_BEAM: { color: '#ff00aa', icon: '«', name: 'Laser Beam', rarity: 'legendary', glowColor: '#ff0088', description: 'Powerful beam attack' },
  CHAIN_LIGHTNING: { color: '#00aaff', icon: '⚡', name: 'Chain Lightning', rarity: 'legendary', glowColor: '#0088ff', description: 'Lightning chains enemies' },
  // Ultra power-ups (5% of drops - very rare!)
  BLACK_HOLE: { color: '#4400aa', icon: '⚫', name: 'Black Hole', rarity: 'ultra', glowColor: '#6600ff', description: 'Sucks in all enemies' },
  TIME_WARP: { color: '#8800ff', icon: '⏰', name: 'Time Warp', rarity: 'ultra', glowColor: '#aa00ff', description: 'Slow motion for 10s' },
  CLONE: { color: '#00ffff', icon: '👥', name: 'Clone', rarity: 'ultra', glowColor: '#00ddff', description: 'Shadow clone mimics you' },
  NUCLEAR: { color: '#ff0000', icon: '☢', name: 'Nuclear', rarity: 'ultra', glowColor: '#ff4400', description: 'Devastating explosion' },
  PHOENIX: { color: '#ff8800', icon: '🔥', name: 'Phoenix', rarity: 'ultra', glowColor: '#ffaa00', description: 'Auto-revive on death' }
};

const SpaceShooter = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('brand'); // brand, cinematic, splash, menu, playing, paused, gameOver, checkpoint, victory
  const [brandFadingOut, setBrandFadingOut] = useState(false);
  const [cinematicFadingOut, setCinematicFadingOut] = useState(false);
  const [splashFadingOut, setSplashFadingOut] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('spaceShooterHighScore')) || 0;
  });
  const [gameBeaten, setGameBeaten] = useState(() => {
    return localStorage.getItem('nebulaXGameBeaten') === 'true';
  });
  const [gameMode, setGameMode] = useState('campaign'); // campaign, survival, bossRush, timeAttack, practice
  const [showChallenges, setShowChallenges] = useState(false);
  const [showPracticeMode, setShowPracticeMode] = useState(false);
  // Practice Mode settings
  const [practiceSettings, setPracticeSettings] = useState({
    startWave: 1,
    infiniteLives: true,
    invincible: false,
    maxPower: false,    // Start with max weapon level
    slowBullets: false, // Enemy bullets move 50% slower
    showHitboxes: false // Show player/enemy hitboxes for learning
  });
  const practiceSettingsRef = useRef({
    startWave: 1,
    infiniteLives: true,
    invincible: false,
    maxPower: false,
    slowBullets: false,
    showHitboxes: false
  });
  const highestWaveReachedRef = useRef(() => {
    const saved = localStorage.getItem('nebulaXHighestWave');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [bossActive, setBossActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPauseControls, setShowPauseControls] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [settingsTab, setSettingsTab] = useState('audio'); // audio', 'profile', 'controls'
  
  // Default user settings
  const DEFAULT_USER_SETTINGS = {
    masterVolume: 50,
    musicVolume: 30,
    sfxVolume: 60,
    playerName: 'PILOT',
    avatar: 0,
    avatarColor: '#00ff88', // Custom avatar accent color
    difficulty: 'normal', // easy, normal, hard
    performanceMode: false, // Reduced visual effects for better performance
    showFPS: false // Display FPS counter
  };
  
  // User settings with localStorage persistence
  const [userSettings, setUserSettings] = useState(() => {
    const saved = localStorage.getItem('nebulaXUserSettings');
    if (saved) {
      // Merge saved settings with defaults to handle new properties
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_USER_SETTINGS, ...parsed };
    }
    return DEFAULT_USER_SETTINGS;
  });
  
  // Difficulty settings
  const DIFFICULTY_SETTINGS = {
    easy: { 
      label: 'EASY', 
      description: 'Slower enemies, more lives',
      enemySpeedMult: 0.7, 
      enemyHealthMult: 0.7, 
      playerLives: 5,
      color: '#00ff88'
    },
    normal: { 
      label: 'NORMAL', 
      description: 'Balanced challenge',
      enemySpeedMult: 1.0, 
      enemyHealthMult: 1.0, 
      playerLives: 3,
      color: '#ffff00'
    },
    hard: { 
      label: 'HARD', 
      description: 'Faster enemies, fewer lives',
      enemySpeedMult: 1.3, 
      enemyHealthMult: 1.3, 
      playerLives: 2,
      color: '#ff4444'
    }
  };
  
  // Avatar options with rarity tiers
  const AVATAR_OPTIONS = [
    // Common (8)
    { id: 0, icon: '\ud83d\udc68\u200d\ud83d\ude80', name: 'Astronaut', rarity: 'common' },
    { id: 1, icon: '\ud83d\udc68\u200d\u2708\ufe0f', name: 'Commander', rarity: 'common' },
    { id: 2, icon: '\ud83c\udfae', name: 'Gamer', rarity: 'common' },
    { id: 3, icon: '\u2b50', name: 'Star', rarity: 'common' },
    { id: 4, icon: '\ud83d\ude80', name: 'Rocket', rarity: 'common' },
    { id: 5, icon: '\ud83d\udef8', name: 'UFO', rarity: 'common' },
    { id: 6, icon: '\ud83c\udfaf', name: 'Target', rarity: 'common' },
    { id: 7, icon: '\u2728', name: 'Spark', rarity: 'common' },
    // Uncommon (8)
    { id: 8, icon: '\ud83e\udd16', name: 'Android', rarity: 'uncommon' },
    { id: 9, icon: '\ud83e\udd8a', name: 'Fox', rarity: 'uncommon' },
    { id: 10, icon: '\ud83d\udc3a', name: 'Wolf', rarity: 'uncommon' },
    { id: 11, icon: '\ud83e\udd85', name: 'Eagle', rarity: 'uncommon' },
    { id: 12, icon: '\ud83d\udc31', name: 'Cat', rarity: 'uncommon' },
    { id: 13, icon: '\ud83e\udd81', name: 'Lion', rarity: 'uncommon' },
    { id: 14, icon: '\ud83d\udc2f', name: 'Tiger', rarity: 'uncommon' },
    { id: 15, icon: '\ud83e\udd87', name: 'Bat', rarity: 'uncommon' },
    // Rare (8)
    { id: 16, icon: '\ud83d\udc7d', name: 'Alien', rarity: 'rare' },
    { id: 17, icon: '\ud83d\udc7e', name: 'Invader', rarity: 'rare' },
    { id: 18, icon: '\ud83d\udc09', name: 'Dragon', rarity: 'rare' },
    { id: 19, icon: '\ud83d\udd25', name: 'Inferno', rarity: 'rare' },
    { id: 20, icon: '\u2744\ufe0f', name: 'Frost', rarity: 'rare' },
    { id: 21, icon: '\ud83c\udf0a', name: 'Wave', rarity: 'rare' },
    { id: 22, icon: '\ud83d\udc7b', name: 'Phantom', rarity: 'rare' },
    { id: 23, icon: '\ud83e\udd84', name: 'Unicorn', rarity: 'rare' },
    // Epic (8)
    { id: 24, icon: '\u2620\ufe0f', name: 'Reaper', rarity: 'epic' },
    { id: 25, icon: '\ud83d\udc79', name: 'Demon', rarity: 'epic' },
    { id: 26, icon: '\ud83e\udd16', name: 'Cyborg', rarity: 'epic' },
    { id: 27, icon: '\u26a1', name: 'Thunder', rarity: 'epic' },
    { id: 28, icon: '\ud83c\udf00', name: 'Cyclone', rarity: 'epic' },
    { id: 29, icon: '\ud83d\udc80', name: 'Skull', rarity: 'epic' },
    { id: 30, icon: '\ud83c\udf83', name: 'Pumpkin', rarity: 'epic' },
    { id: 31, icon: '\ud83e\udd96', name: 'Rex', rarity: 'epic' },
    // Legendary (12)
    { id: 32, icon: '\ud83c\udf1f', name: 'Nova', rarity: 'legendary' },
    { id: 33, icon: '\ud83c\udf0c', name: 'Cosmos', rarity: 'legendary' },
    { id: 34, icon: '\ud83d\udd31', name: 'Poseidon', rarity: 'legendary' },
    { id: 35, icon: '\ud83d\udc51', name: 'Overlord', rarity: 'legendary' },
    { id: 36, icon: '\ud83d\udc8e', name: 'Diamond', rarity: 'legendary' },
    { id: 37, icon: '\ud83c\udf08', name: 'Prism', rarity: 'legendary' },
    { id: 38, icon: '\ud83d\udd2e', name: 'Oracle', rarity: 'legendary' },
    { id: 39, icon: '\ud83d\udc51', name: 'Royalty', rarity: 'legendary' },
    { id: 40, icon: '\ud83d\udc0d', name: 'Serpent', rarity: 'legendary' },
    { id: 41, icon: '\ud83d\udd25', name: 'Phoenix', rarity: 'legendary' },
    { id: 42, icon: '\u2728', name: 'Celestial', rarity: 'legendary' },
    { id: 43, icon: '\u2b50', name: 'Stardust', rarity: 'legendary' },
    // Mythic - Ultra Rare (6)
    { id: 44, icon: '\ud83c\udf11', name: 'Void', rarity: 'mythic' },
    { id: 45, icon: '\u267e\ufe0f', name: 'Eternal', rarity: 'mythic' },
    { id: 46, icon: '\ud83d\udc41\ufe0f', name: 'Omniscient', rarity: 'mythic' },
    { id: 47, icon: '\u267e\ufe0f', name: 'Infinite', rarity: 'mythic' },
    { id: 48, icon: '\ud83c\udf1e', name: 'Radiant', rarity: 'mythic' },
    { id: 49, icon: '\ud83c\udf20', name: 'Transcendent', rarity: 'mythic' }
  ];

  // Avatar color options - expanded with more variety
  const AVATAR_COLORS = [
    // Basic Colors
    { id: 'green', color: '#00ff88', name: 'Neon Green', glow: 'rgba(0, 255, 136, 0.6)' },
    { id: 'cyan', color: '#00ffff', name: 'Cyan', glow: 'rgba(0, 255, 255, 0.6)' },
    { id: 'blue', color: '#4488ff', name: 'Electric Blue', glow: 'rgba(68, 136, 255, 0.6)' },
    { id: 'purple', color: '#aa44ff', name: 'Violet', glow: 'rgba(170, 68, 255, 0.6)' },
    { id: 'pink', color: '#ff44aa', name: 'Hot Pink', glow: 'rgba(255, 68, 170, 0.6)' },
    { id: 'red', color: '#ff4444', name: 'Crimson', glow: 'rgba(255, 68, 68, 0.6)' },
    { id: 'orange', color: '#ff8800', name: 'Blaze', glow: 'rgba(255, 136, 0, 0.6)' },
    { id: 'gold', color: '#ffaa00', name: 'Gold', glow: 'rgba(255, 170, 0, 0.6)' },
    { id: 'yellow', color: '#ffff00', name: 'Solar', glow: 'rgba(255, 255, 0, 0.6)' },
    { id: 'white', color: '#ffffff', name: 'White', glow: 'rgba(255, 255, 255, 0.6)' },
    { id: 'silver', color: '#aabbcc', name: 'Silver', glow: 'rgba(170, 187, 204, 0.6)' },
    // Special Gradients
    { id: 'rainbow', color: 'linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0088ff, #8800ff)', name: 'Rainbow', glow: 'rgba(255, 255, 255, 0.4)', special: true },
    { id: 'plasma', color: 'linear-gradient(135deg, #ff00ff, #00ffff)', name: 'Plasma', glow: 'rgba(255, 0, 255, 0.5)', special: true },
    { id: 'aurora', color: 'linear-gradient(135deg, #00ff88, #00ffff, #8844ff)', name: 'Aurora', glow: 'rgba(0, 255, 200, 0.5)', special: true },
    { id: 'sunset', color: 'linear-gradient(135deg, #ff4444, #ff8800, #ffaa00)', name: 'Sunset', glow: 'rgba(255, 136, 0, 0.5)', special: true },
    { id: 'ocean', color: 'linear-gradient(135deg, #0044ff, #00aaff, #00ffff)', name: 'Ocean', glow: 'rgba(0, 170, 255, 0.5)', special: true },
    { id: 'inferno', color: 'linear-gradient(135deg, #ff0000, #ff4400, #ffff00)', name: 'Inferno', glow: 'rgba(255, 100, 0, 0.6)', special: true },
    { id: 'toxic', color: 'linear-gradient(135deg, #00ff00, #88ff00, #ffff00)', name: 'Toxic', glow: 'rgba(136, 255, 0, 0.5)', special: true },
    { id: 'void', color: 'linear-gradient(135deg, #220033, #440066, #660099)', name: 'Void', glow: 'rgba(102, 0, 153, 0.6)', special: true }
  ];
  
  // Rank titles based on high score
  const getRankTitle = (score) => {
    if (score >= 100000) return { title: 'LEGENDARY ACE', color: '#ffaa00', icon: '\ud83c\udfc6' };
    if (score >= 50000) return { title: 'ELITE PILOT', color: '#aa44ff', icon: '\u2b50' };
    if (score >= 25000) return { title: 'VETERAN', color: '#4488ff', icon: '\ud83c\udfaf' };
    if (score >= 10000) return { title: 'COMMANDER', color: '#00ff88', icon: '\u2b50' };
    if (score >= 5000) return { title: 'CAPTAIN', color: '#00ffff', icon: '\ud83d\ude80' };
    if (score >= 1000) return { title: 'PILOT', color: '#88ff88', icon: '\ud83d\udc68\u200d\u2708\ufe0f' };
    return { title: 'CADET', color: '#888888', icon: '\ud83c\udf96\ufe0f' };
  };
  
  // Achievements system
  const ACHIEVEMENTS = [
    // Score achievements
    { id: 'score_1k', name: 'FIRST BLOOD', description: 'Score 1,000 points', icon: '\ud83d\udcaa', category: 'score', requirement: 1000, type: 'score' },
    { id: 'score_5k', name: 'SHARPSHOOTER', description: 'Score 5,000 points', icon: '\ud83c\udfaf', category: 'score', requirement: 5000, type: 'score' },
    { id: 'score_10k', name: 'ACE PILOT', description: 'Score 10,000 points', icon: '\u2b50', category: 'score', requirement: 10000, type: 'score' },
    { id: 'score_25k', name: 'VETERAN', description: 'Score 25,000 points', icon: '\ud83c\udf96\ufe0f', category: 'score', requirement: 25000, type: 'score' },
    { id: 'score_50k', name: 'ELITE', description: 'Score 50,000 points', icon: '\ud83c\udfc6', category: 'score', requirement: 50000, type: 'score' },
    { id: 'score_100k', name: 'LEGENDARY', description: 'Score 100,000 points', icon: '\ud83c\udfc6', category: 'score', requirement: 100000, type: 'score' },
    
    // Kill achievements
    { id: 'kills_10', name: 'HUNTER', description: 'Destroy 10 enemies', icon: '\ud83d\udd2b', category: 'combat', requirement: 10, type: 'kills' },
    { id: 'kills_50', name: 'DESTROYER', description: 'Destroy 50 enemies', icon: '\ud83d\udca5', category: 'combat', requirement: 50, type: 'kills' },
    { id: 'kills_100', name: 'ANNIHILATOR', description: 'Destroy 100 enemies', icon: '\u2694\ufe0f', category: 'combat', requirement: 100, type: 'kills' },
    { id: 'kills_500', name: 'EXTERMINATOR', description: 'Destroy 500 enemies', icon: '\ud83d\udd25', category: 'combat', requirement: 500, type: 'kills' },
    { id: 'kills_1000', name: 'GENOCIDE', description: 'Destroy 1,000 enemies', icon: '\u2620\ufe0f', category: 'combat', requirement: 1000, type: 'kills' },
    
    // Boss achievements
    { id: 'boss_1', name: 'BOSS SLAYER', description: 'Defeat your first boss', icon: '\u2694\ufe0f', category: 'combat', requirement: 1, type: 'bosses' },
    { id: 'boss_5', name: 'BOSS HUNTER', description: 'Defeat 5 bosses', icon: '\ud83d\udc51', category: 'combat', requirement: 5, type: 'bosses' },
    { id: 'boss_10', name: 'BOSS MASTER', description: 'Defeat 10 bosses', icon: '\ud83c\udfc6', category: 'combat', requirement: 10, type: 'bosses' },
    
    // Wave achievements
    { id: 'wave_5', name: 'SURVIVOR', description: 'Reach wave 5', icon: '\ud83d\udee1\ufe0f', category: 'progress', requirement: 5, type: 'wave' },
    { id: 'wave_10', name: 'ENDURANCE', description: 'Reach wave 10', icon: '\ud83c\udf96\ufe0f', category: 'progress', requirement: 10, type: 'wave' },
    { id: 'wave_20', name: 'UNSTOPPABLE', description: 'Reach wave 20', icon: '\ud83d\udd25', category: 'progress', requirement: 20, type: 'wave' },
    
    // Powerup achievements
    { id: 'powerups_10', name: 'COLLECTOR', description: 'Collect 10 power-ups', icon: '\ud83d\udce6', category: 'items', requirement: 10, type: 'powerups' },
    { id: 'powerups_50', name: 'HOARDER', description: 'Collect 50 power-ups', icon: '\ud83d\udce6', category: 'items', requirement: 50, type: 'powerups' },
    { id: 'powerups_100', name: 'POWER JUNKIE', description: 'Collect 100 power-ups', icon: '\u26a1', category: 'items', requirement: 100, type: 'powerups' },
    
    // Special achievements
    { id: 'shield_max', name: 'FORTRESS', description: 'Get max shields (9)', icon: '\ud83d\udee1\ufe0f', category: 'special', requirement: 9, type: 'maxShield' },
    { id: 'laser_unlock', name: 'LASER MASTER', description: 'Unlock laser beam (\u22653 rapid)', icon: '\ud83d\udd2b', category: 'special', requirement: 3, type: 'rapidLevel' },
    { id: 'games_10', name: 'DEDICATED', description: 'Play 10 games', icon: '\ud83c\udfae', category: 'special', requirement: 10, type: 'gamesPlayed' },
    { id: 'games_50', name: 'ADDICTED', description: 'Play 50 games', icon: '\ud83d\udc96', category: 'special', requirement: 50, type: 'gamesPlayed' },
  ];
  
  // Game statistics for achievements
  const [gameStats, setGameStats] = useState(() => {
    const saved = localStorage.getItem('nebulaXGameStats');
    return saved ? JSON.parse(saved) : {
      totalKills: 0,
      totalBossesDefeated: 0,
      totalPowerupsCollected: 0,
      highestWave: 0,
      gamesPlayed: 0,
      maxShieldReached: 0,
      maxRapidLevel: 0
    };
  });
  
  // Unlocked achievements
  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    const saved = localStorage.getItem('nebulaXAchievements');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Achievement notification queue
  const [achievementNotification, setAchievementNotification] = useState(null);
  const achievementQueueRef = useRef([]);
  
  // Refs for real-time tracking during gameplay
  const sessionStatsRef = useRef({ kills: 0, bosses: 0, powerups: 0 });
  
  const [selectedShip, setSelectedShip] = useState(() => {
    return parseInt(localStorage.getItem('nebulaXSelectedShip')) || 0;
  });
  const [shipParts, setShipParts] = useState(() => {
    const saved = localStorage.getItem('nebulaXShipParts');
    return saved ? JSON.parse(saved) : { booster: 0, wings: 0, shield: 0, trail: 0 };
  });
  const showCustomizeRef = useRef(false);
  const selectedShipRef = useRef(0);
  const shipPartsRef = useRef({ booster: 0, wings: 0, shield: 0, trail: 0 });
  
  // Ship part options
  const BOOSTER_OPTIONS = [
    { name: 'STANDARD', description: 'Default engine', size: 1, flameLength: 1 },
    { name: 'EXTENDED', description: 'Longer exhaust', size: 1.2, flameLength: 1.5 },
    { name: 'DUAL CORE', description: 'Twin boosters', size: 1, flameLength: 1.3, dual: true },
    { name: 'MEGA THRUST', description: 'Maximum power', size: 1.5, flameLength: 2 },
    { name: 'PLASMA JET', description: 'Blue plasma flames', size: 1.3, flameLength: 1.8, color: '#00aaff', coreColor: '#ffffff' },
    { name: 'INFERNO', description: 'Burning hot exhaust', size: 1.4, flameLength: 2.2, color: '#ff4400', coreColor: '#ffff00' },
    { name: 'VOID DRIVE', description: 'Dark energy propulsion', size: 1.2, flameLength: 1.5, color: '#8800ff', coreColor: '#ff00ff' },
    { name: 'QUANTUM', description: 'Unstable particles', size: 1.3, flameLength: 1.7, color: '#00ffaa', coreColor: '#ffffff', particles: true },
    { name: 'TRI-CORE', description: 'Triple exhaust ports', size: 1.1, flameLength: 1.4, triple: true }
  ];
  
  const WING_OPTIONS = [
    { name: 'STANDARD', description: 'Default wings', length: 1, angle: 1 },
    { name: 'EXTENDED', description: 'Longer reach', length: 1.4, angle: 1 },
    { name: 'SWEPT', description: 'Aggressive angle', length: 1.1, angle: 1.4 },
    { name: 'DELTA', description: 'Maximum span', length: 1.6, angle: 1.2 },
    { name: 'RAZOR', description: 'Sharp angular design', length: 1.2, angle: 1.6, style: 'razor' },
    { name: 'PHANTOM', description: 'Stealth profile', length: 0.8, angle: 0.8, style: 'stealth' },
    { name: 'VALKYRIE', description: 'Double wing layer', length: 1.3, angle: 1.1, style: 'double' },
    { name: 'TALON', description: 'Curved predator wings', length: 1.5, angle: 1.3, style: 'curved' }
  ];
  
  const SHIELD_OPTIONS = [
    { name: 'HEXAGON', description: 'Segmented shield', style: 'hexagon', color: '#00ffff', glowColor: '#0088ff' },
    { name: 'BUBBLE', description: 'Smooth sphere', style: 'bubble', color: '#00ff88', glowColor: '#00aa44' },
    { name: 'PLASMA', description: 'Fiery barrier', style: 'plasma', color: '#ff8800', glowColor: '#ff4400' },
    { name: 'VOID', description: 'Dark energy', style: 'void', color: '#aa00ff', glowColor: '#6600aa' },
    { name: 'PRISMATIC', description: 'Rainbow shift', style: 'prismatic', color: '#ffffff', glowColor: '#ffaaff' },
    { name: 'HARDLIGHT', description: 'Solid holographic', style: 'hardlight', color: '#ffff00', glowColor: '#ff8800' },
    { name: 'CRYO', description: 'Frozen barrier', style: 'cryo', color: '#88ffff', glowColor: '#4488ff' },
    { name: 'NOVA', description: 'Stellar energy', style: 'nova', color: '#ff4488', glowColor: '#ff0044' },
    { name: 'MATRIX', description: 'Digital grid', style: 'matrix', color: '#00ff00', glowColor: '#008800' }
  ];
  
  // Engine trail particle options
  const TRAIL_OPTIONS = [
    { name: 'NONE', description: 'No trail', enabled: false, color: '#ffffff', particleCount: 0 },
    { name: 'PLASMA', description: 'Blue plasma trail', enabled: true, color: '#00aaff', secondColor: '#0044ff', style: 'plasma', particleCount: 2 },
    { name: 'FIRE', description: 'Burning exhaust', enabled: true, color: '#ff6600', secondColor: '#ff0000', style: 'fire', particleCount: 3 },
    { name: 'ELECTRIC', description: 'Lightning sparks', enabled: true, color: '#ffff00', secondColor: '#88ff00', style: 'electric', particleCount: 2 },
    { name: 'ICE', description: 'Frozen crystals', enabled: true, color: '#88ffff', secondColor: '#ffffff', style: 'ice', particleCount: 2 },
    { name: 'RAINBOW', description: 'Chromatic shift', enabled: true, color: 'rainbow', secondColor: 'rainbow', style: 'rainbow', particleCount: 2 },
    { name: 'SHADOW', description: 'Dark energy', enabled: true, color: '#8800ff', secondColor: '#220044', style: 'shadow', particleCount: 2 },
    { name: 'STARDUST', description: 'Sparkling particles', enabled: true, color: '#ffff88', secondColor: '#ffffff', style: 'stardust', particleCount: 4 },
    { name: 'QUANTUM', description: 'Flickering reality', enabled: true, color: '#00ffaa', secondColor: '#ff00aa', style: 'quantum', particleCount: 3 },
    { name: 'SAKURA', description: 'Cherry blossom petals', enabled: true, color: '#ffaacc', secondColor: '#ff88aa', style: 'sakura', particleCount: 3 },
    { name: 'TOXIC', description: 'Radioactive glow', enabled: true, color: '#88ff00', secondColor: '#44aa00', style: 'toxic', particleCount: 2 },
    { name: 'NEBULA', description: 'Cosmic gas clouds', enabled: true, color: '#ff44ff', secondColor: '#4444ff', style: 'nebula', particleCount: 3 }
  ];
  
  // Enhanced particle system
  const engineTrailRef = useRef([]);
  const impactParticlesRef = useRef([]);
  const sparkParticlesRef = useRef([]);
  const debrisParticlesRef = useRef([]);
  
  // Particle pool limits for performance
  const PARTICLE_LIMITS = {
    engineTrail: 120,
    impact: 150,
    spark: 100,
    debris: 80
  };
  
  // Ship designs for customization
  const SHIP_DESIGNS = [
    {
      name: 'NEBULA - X',
      description: 'Prototype Flagship',
      lore: 'The legendary flagship of the fleet. Four massive cannons. Ultimate firepower.',
      stats: { speed: 3, firepower: 5, defense: 3, special: 4 },
      colors: {
        body: ['#4488ff', '#2266dd', '#1144aa', '#002288'],
        shadow: '#001144',
        wing: '#3366cc',
        wingHighlight: '#5588ee',
        wingDark: '#224499',
        glow: '#00aaff',
        cockpit: ['#ffffff', '#88ddff', '#44aadd'],
        accent: '#ff4400' // Orange accent for guns
      }
    },
    {
      name: 'PHOENIX',
      description: 'Assault Class',
      lore: 'Born from fire. Maximum aggression with devastating weapons.',
      stats: { speed: 2, firepower: 5, defense: 2, special: 3 },
      colors: {
        body: ['#ff8844', '#dd6622', '#bb4400', '#882200'],
        shadow: '#441100',
        wing: '#dd5500',
        wingHighlight: '#ff7722',
        wingDark: '#aa3300',
        glow: '#ff6600',
        cockpit: ['#ffff88', '#ffcc00', '#aa8800']
      }
    },
    {
      name: 'PHANTOM',
      description: 'Stealth Interceptor',
      lore: 'Silent and deadly. Strike before they know you\'re there.',
      stats: { speed: 5, firepower: 2, defense: 2, special: 4 },
      colors: {
        body: ['#8888ff', '#6666dd', '#4444aa', '#222288'],
        shadow: '#111144',
        wing: '#5555cc',
        wingHighlight: '#7777ee',
        wingDark: '#333399',
        glow: '#8888ff',
        cockpit: ['#ffaaff', '#dd66dd', '#aa44aa']
      }
    },
    {
      name: 'CRIMSON',
      description: 'Heavy Gunship',
      lore: 'Unstoppable force. Heavy armor meets heavy firepower.',
      stats: { speed: 1, firepower: 4, defense: 5, special: 2 },
      colors: {
        body: ['#ff4466', '#dd2244', '#aa1133', '#880022'],
        shadow: '#440011',
        wing: '#cc2244',
        wingHighlight: '#ee4466',
        wingDark: '#991133',
        glow: '#ff4466',
        cockpit: ['#88ffff', '#44dddd', '#22aaaa']
      }
    },
    {
      name: 'SPECTRE',
      description: 'Elite Squadron',
      lore: 'Ghost protocol engaged. The enemy sees nothing.',
      stats: { speed: 4, firepower: 3, defense: 3, special: 4 },
      colors: {
        body: ['#ffffff', '#cccccc', '#999999', '#666666'],
        shadow: '#333333',
        wing: '#aaaaaa',
        wingHighlight: '#dddddd',
        wingDark: '#777777',
        glow: '#ffffff',
        cockpit: ['#88ff88', '#44dd44', '#22aa22']
      }
    },
    {
      name: 'NEBULA',
      description: 'Prototype X-Class',
      lore: 'Experimental tech. Unknown limits. Maximum potential.',
      stats: { speed: 4, firepower: 4, defense: 2, special: 5 },
      colors: {
        body: ['#ff44ff', '#cc22cc', '#9900aa', '#660088'],
        shadow: '#330044',
        wing: '#aa22aa',
        wingHighlight: '#dd44dd',
        wingDark: '#880088',
        glow: '#ff44ff',
        cockpit: ['#44ffff', '#22cccc', '#118888']
      }
    },
    {
      name: 'THUNDER',
      description: 'Electric Assault',
      lore: 'Channels pure electricity. Enemies feel the storm.',
      stats: { speed: 3, firepower: 5, defense: 2, special: 4 },
      ability: 'chainLightning', // Shots chain to nearby enemies
      colors: {
        body: ['#ffff44', '#dddd00', '#aaaa00', '#888800'],
        shadow: '#444400',
        wing: '#cccc00',
        wingHighlight: '#ffff66',
        wingDark: '#999900',
        glow: '#ffff00',
        cockpit: ['#88ffff', '#44ddff', '#2288aa']
      }
    },
    {
      name: 'GLACIER',
      description: 'Cryo Fighter',
      lore: 'Absolute zero. Freeze your enemies in their tracks.',
      stats: { speed: 2, firepower: 3, defense: 4, special: 4 },
      ability: 'freezeShot', // Chance to slow enemies
      colors: {
        body: ['#88ffff', '#44ddff', '#22aadd', '#1188aa'],
        shadow: '#004466',
        wing: '#44ccff',
        wingHighlight: '#88eeff',
        wingDark: '#2299cc',
        glow: '#00ffff',
        cockpit: ['#ffffff', '#ddffff', '#aaddee']
      }
    },
    {
      name: 'SOLAR',
      description: 'Stellar Cruiser',
      lore: 'Powered by a miniature sun. Blinding power.',
      stats: { speed: 3, firepower: 4, defense: 3, special: 4 },
      ability: 'solarFlare', // Periodic damage pulse
      colors: {
        body: ['#ffaa44', '#ff8800', '#dd6600', '#aa4400'],
        shadow: '#552200',
        wing: '#ff7700',
        wingHighlight: '#ffcc44',
        wingDark: '#cc5500',
        glow: '#ffaa00',
        cockpit: ['#ffff88', '#ffee44', '#ddbb22']
      }
    },
    {
      name: 'WRAITH',
      description: 'Phase Shifter',
      lore: 'Exists between dimensions. Now you see it, now you don\'t.',
      stats: { speed: 5, firepower: 2, defense: 3, special: 5 },
      ability: 'phaseShift', // Brief invincibility on dash
      colors: {
        body: ['#666688', '#444466', '#333355', '#222244'],
        shadow: '#111122',
        wing: '#555577',
        wingHighlight: '#7777aa',
        wingDark: '#333355',
        glow: '#8888ff',
        cockpit: ['#ff88ff', '#dd44dd', '#aa22aa']
      }
    },
    {
      name: 'BERSERKER',
      description: 'Rage Engine',
      lore: 'Damage increases as health decreases. High risk, high reward.',
      stats: { speed: 3, firepower: 4, defense: 2, special: 5 },
      ability: 'berserk', // More damage at low health
      colors: {
        body: ['#ff2222', '#cc0000', '#990000', '#660000'],
        shadow: '#330000',
        wing: '#aa0000',
        wingHighlight: '#ff4444',
        wingDark: '#770000',
        glow: '#ff0000',
        cockpit: ['#ffff44', '#ffcc00', '#aa8800']
      }
    },
    {
      name: 'GUARDIAN',
      description: 'Defense Matrix',
      lore: 'Impenetrable shield technology. The ultimate defense.',
      stats: { speed: 2, firepower: 2, defense: 5, special: 4 },
      ability: 'shieldBoost', // Shield regenerates faster
      colors: {
        body: ['#44ff88', '#22cc66', '#119944', '#006622'],
        shadow: '#003311',
        wing: '#22aa55',
        wingHighlight: '#66ff99',
        wingDark: '#118844',
        glow: '#00ff66',
        cockpit: ['#88ffff', '#44cccc', '#228888']
      }
    },
    {
      name: 'TEMPEST',
      description: 'Storm Rider',
      lore: 'Rides the cosmic winds. Unmatched maneuverability.',
      stats: { speed: 5, firepower: 3, defense: 2, special: 4 },
      ability: 'windDash', // Faster dash cooldown
      colors: {
        body: ['#88aaff', '#6688dd', '#4466bb', '#224499'],
        shadow: '#112244',
        wing: '#5577cc',
        wingHighlight: '#99bbff',
        wingDark: '#335599',
        glow: '#6699ff',
        cockpit: ['#ffffff', '#ddddff', '#aaaaee']
      }
    },
    {
      name: 'OMEGA',
      description: 'Ultimate Fighter',
      lore: 'The pinnacle of technology. Reserved for ace pilots only.',
      stats: { speed: 4, firepower: 4, defense: 4, special: 5 },
      ability: 'omegaStrike', // Special attack charges faster
      colors: {
        body: ['#ffcc00', '#ddaa00', '#bb8800', '#996600'],
        shadow: '#443300',
        wing: '#cc9900',
        wingHighlight: '#ffdd44',
        wingDark: '#997700',
        glow: '#ffcc00',
        cockpit: ['#ff88ff', '#dd44dd', '#aa22aa']
      }
    }
  ];
  
  const [menuSelection, setMenuSelection] = useState(0); // 0 = Start, 1 = Continue (if save), 2 = Customize, 3 = Controls
  const [pauseSelection, setPauseSelection] = useState(0); // 0 = Resume, 1 = Restart, 2 = Controls, 3 = Main Menu
  const [checkpointSelection, setCheckpointSelection] = useState(0); // 0 = Continue, 1 = Save, 2 = Customize, 3 = Quit
  const [checkpointStats, setCheckpointStats] = useState({ wave: 0, score: 0, lives: 0, bonusPoints: 0 });
  const [saveFeedback, setSaveFeedback] = useState(false);
  
  // Victory screen state
  const victoryRef = useRef({
    active: false,
    phase: 'story', // story', 'credits'
    timer: 0,
    scrollY: 0,
    storyIndex: 0,
    fadeAlpha: 0
  });
  
  // Checkpoint transition state
  const checkpointTransitionRef = useRef({
    active: false,
    phase: 'none', // explosions', 'fade', 'complete'
    timer: 0,
    fadeAlpha: 0,
    pendingCheckpoint: null, // Stores checkpoint data during transition
    explosionTimer: 0
  });
  
  const menuSelectionRef = useRef(0);
  const showSettingsRef = useRef(false);
  const showPauseControlsRef = useRef(false);
  const pauseSelectionRef = useRef(0);
  const checkpointSelectionRef = useRef(0);
  const gameStateRef = useRef(gameState);

  // Game state refs (to avoid stale closures in game loop)
  const playerRef = useRef({ x: 50, y: GAME_HEIGHT / 2 - PLAYER_HEIGHT / 2, vx: 0, vy: 0, tilt: 0 });
  const bulletsRef = useRef([]);
  const bulletTrailsRef = useRef([]); // Glowing trails behind bullets
  const missileTrailsRef = useRef([]); // Smoke trails behind missiles
  const missilesRef = useRef([]);
  const enemiesRef = useRef([]);
  const enemyBulletsRef = useRef([]);
  const powerupsRef = useRef([]);
  const explosionsRef = useRef([]);
  const explosionSpriteRef = useRef(null); // Explosion sprite sheet
  const explosionSpriteLoadedRef = useRef(false);
  const pickupEffectsRef = useRef([]);
  const floatingTextsRef = useRef([]);
  const specialEffectsRef = useRef([]); // Special visual effects
  const muzzleFlashRef = useRef({ active: false, timer: 0, x: 0, y: 0 }); // Muzzle flash effect
  const hitFlashRef = useRef({ active: false, timer: 0 }); // Screen hit flash
  const levelFadeRef = useRef({ active: false, fadeIn: true, alpha: 1, showText: 'campaign' }); // campaign, survival, bossRush, timeAttack
  const gameModeRef = useRef('campaign'); // Current game mode: 'campaign', 'survival', 'bossRush', 'timeAttack', 'practice'
  const challengeStatsRef = useRef({
    survivalTime: 0,        // Survival mode: total time survived
    bossesDefeated: 0,      // Boss Rush: bosses beaten
    timeAttackTime: 0,      // Time Attack: time to complete all waves
    startTime: 0            // Start timestamp for timing modes
  });
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const starsRef = useRef([]);
  const waveRef = useRef(1);
  const waveKillsRef = useRef(0);
  const waveKillsNeededRef = useRef(10);
  const bossRef = useRef(null);
  const bossActiveRef = useRef(false);
  const miniBossRef = useRef(null); // Mini-boss: elite enemy mid-wave
  const miniBossSpawnedRef = useRef(false); // Track if mini-boss was spawned this wave
  const carrierRef = useRef(null); // Giant space carrier that drops enemies
  const lastCarrierSpawnRef = useRef(0); // Cooldown for carrier spawns
  const lastSpawnRef = useRef(0); // Last enemy spawn timestamp
  const waveStartTimeRef = useRef(0); // Wave start time for grace period
  const graceWarningShownRef = useRef(false); // Grace period warning shown flag
  const WAVE_GRACE_PERIOD = 10000; // 10 seconds grace period at wave start
  const waveCannonChargeRef = useRef(0);
  const isChargingRef = useRef(false);
  const forceRef = useRef(null); // Force pod: { x, y, attached: 'front'|'back'|null, power, split }
  const forceLastShotRef = useRef(0);
  const forceBulletsRef = useRef([]);
  const electricityRef = useRef([]); // Lightning bolts from powered Force
  const lastElectricityRef = useRef(0);
  const playerLaserRef = useRef({ charging: false, charge: 0, firing: false, duration: 0 }); // Player laser beam
  const screenShakeRef = useRef({ intensity: 0, duration: 0 }); // Screen shake effect
  const dashRef = useRef({ active: false, cooldown: 0, direction: { x: 0, y: 0 }, timer: 0 }); // Dash mechanic
  
  // Graze System - reward near-misses
  const grazeRef = useRef({
    count: 0,           // Total graze count this life
    meter: 0,           // Builds special attack (0-100)
    lastGrazeTime: 0,   // Prevent multiple grazes per bullet
    displayTimer: 0,    // Show graze effect timer
    combo: 0,           // Current graze combo
    comboTimer: 0       // Combo timeout
  });
  
  // Kill Chain Combo System - visible multiplier for consecutive kills
  const killChainRef = useRef({
    count: 0,           // Current kill chain
    timer: 0,           // Frames until chain breaks (180 = 3 seconds at 60fps)
    multiplier: 1.0,    // Score multiplier (1.0 to 5.0)
    x: GAME_WIDTH / 2,  // Display position
    y: 100,
    pulseTimer: 0       // Visual pulse on new kill
  });
  const KILL_CHAIN_TIMEOUT = 180; // 3 seconds to get next kill
  const KILL_CHAIN_MULTIPLIER_STEP = 0.2; // +0.2x per kill
  const GRAZE_RADIUS = 20;        // Distance for graze detection
  const GRAZE_METER_MAX = 100;    // Max graze meter
  const GRAZE_METER_GAIN = 3;     // Meter gained per graze
  const GRAZE_SCORE = 50;         // Base score per graze
  const GRAZE_COOLDOWN = 100;     // ms between grazes per bullet
  
  // Bomb System - screen-clearing emergency attack
  const bombRef = useRef({
    stock: 3,           // Current bomb count
    maxStock: 3,        // Maximum bombs
    active: false,      // Bomb currently exploding
    timer: 0,           // Animation timer
    x: 0, y: 0          // Explosion center
  });
  const BOMB_DURATION = 90;       // Frames of bomb animation
  const BOMB_INVINCIBILITY = 120; // Player invincibility during/after bomb
  
  // Animation frame for game loop
  const animationFrameRef = useRef(null);
  
  // Weapon Level System - progressive weapon upgrades
  const weaponLevelRef = useRef({
    level: 1,           // Current weapon level (1-5)
    xp: 0,              // XP towards next level
    maxXP: 100,         // XP needed to level up
    levelUpTimer: 0     // Visual feedback timer
  });
  
  // Weapon level definitions - each level has unique properties
  const WEAPON_LEVELS = {
    1: { 
      name: 'BASIC', 
      color: '#ffff00', 
      bulletCount: 1, 
      damage: 1, 
      bulletSize: 1, 
      fireRateBonus: 0,
      description: 'Single shot'
    },
    2: { 
      name: 'TWIN', 
      color: '#88ff00', 
      bulletCount: 2, 
      damage: 1, 
      bulletSize: 1, 
      fireRateBonus: 0.1,
      description: 'Double shot'
    },
    3: { 
      name: 'TRIPLE', 
      color: '#00ffff', 
      bulletCount: 3, 
      damage: 1.2, 
      bulletSize: 1.1, 
      fireRateBonus: 0.2,
      description: 'Triple spread'
    },
    4: { 
      name: 'QUAD', 
      color: '#ff88ff', 
      bulletCount: 4, 
      damage: 1.5, 
      bulletSize: 1.2, 
      fireRateBonus: 0.3,
      description: 'Quad cannon'
    },
    5: { 
      name: 'MAX POWER', 
      color: '#ff4400', 
      bulletCount: 5, 
      damage: 2, 
      bulletSize: 1.3, 
      fireRateBonus: 0.5,
      description: 'Ultimate weapon',
      special: 'piercing' // Level 5 bullets pierce
    }
  };
  const WEAPON_XP_PER_POWERUP = 35;  // XP gained per power-up
  const WEAPON_XP_PER_KILL = 2;      // XP gained per enemy kill
  const WEAPON_DEATH_PENALTY = 1;    // Levels lost on death (minimum level 1)
  
  // Bullet Cancel tracking
  const bulletCancelRef = useRef({
    particles: [],      // { x, y, timer, points }
    totalCanceled: 0    // Stats tracking
  });
  
  const menuMusicRef = useRef(null); // Menu background music
  const gameMusicRef = useRef(null); // Gameplay background music
  const bossSpawnSoundRef = useRef(null); // Boss spawn ambient sound
  const currentTrackIndexRef = useRef(0); // Current track in the playlist
  
  // Performance tracking refs
  const fpsRef = useRef({ frames: 0, lastTime: 0, fps: 60 });
  const userSettingsRef = useRef(null); // Sync ref for settings access in game loop
  const starGradientsRef = useRef(new Map()); // Cache star gradients for performance
  
  // Gameplay music tracks (cycled during normal gameplay)
  const GAMEPLAY_TRACKS = [
    'The_Fallout.mp3',
    'Strange_Dealings_Afoot.mp3',
    'Cooler_Heads_Prevail.mp3',
    'Figuring_it_All_Out.mp3',
    'Spooky_Loop.mp3'
  ];
  const BOSS_MUSIC = 'Boss_Battle_Loop_1.mp3';
  const CHECKPOINT_BOSS_MUSIC = 'At_the_End_of_All_Things.mp3';
  
  // Environmental hazards
  const hazardsRef = useRef({
    asteroids: [],      // { x, y, size, rotation, rotationSpeed, vx, vy, health }
    laserBarriers: [],  // { y, width, active, timer, warningTimer }
    gravityWells: []    // { x, y, radius, strength, pulsePhase }
  });
  const lastHazardSpawnRef = useRef(0);
  
  const FORCE_FIRE_RATE = 400; // ms between shots
  const FORCE_BULLET_SPEED = 10;
  const FORCE_MAX_POWER = 100; // Power needed to split
  const FORCE_POWER_GAIN = 0.5; // Power gained per frame when killing
  
  // Force upgrade levels and abilities
  const FORCE_LEVELS = {
    1: { name: 'BASIC', color: '#ff8800', damage: 1, bulletCount: 1, electricDamage: 0.5 },
    2: { name: 'DUAL', color: '#ffaa00', damage: 1.5, bulletCount: 2, electricDamage: 1 },
    3: { name: 'TRI-BEAM', color: '#ffff00', damage: 2, bulletCount: 3, electricDamage: 1.5 },
    4: { name: 'QUAD', color: '#88ff00', damage: 2.5, bulletCount: 4, electricDamage: 2 },
    5: { name: 'OMEGA', color: '#00ffff', damage: 3, bulletCount: 5, electricDamage: 3, special: 'homing' }
  };
  
  // Formation group tracking
  const formationsRef = useRef({}); // { groupId: { pattern, enemies: [], bonus, name } }
  const nextFormationIdRef = useRef(1);
  const lastFormationSpawnRef = useRef(0);
  const formationBonusDisplayRef = useRef([]); // { x, y, text, timer }
  
  // Flyby formation system - enemies that animate in before attacking
  const flybyFormationsRef = useRef([]); // Array of flyby groups
  const lastFlybySpawnRef = useRef(0);
  
  // Flyby path patterns - bezier curves and animation paths
  const FLYBY_PATTERNS = {
    loopIn: {
      name: 'LOOP SQUADRON',
      // Path points: enemies enter from right, loop around, then attack
      getPath: (index, total) => ({
        startX: GAME_WIDTH + 50 + index * 40,
        startY: -50,
        // Control points for bezier curve
        cp1x: GAME_WIDTH - 100,
        cp1y: GAME_HEIGHT / 2 - 100,
        cp2x: 100,
        cp2y: GAME_HEIGHT / 2,
        cp3x: GAME_WIDTH / 2,
        cp3y: GAME_HEIGHT + 50,
        // Loop back
        cp4x: GAME_WIDTH - 50,
        cp4y: GAME_HEIGHT / 2 + 100,
        endX: GAME_WIDTH + 100,
        endY: GAME_HEIGHT / 3 + (index - total/2) * 40
      }),
      duration: 180, // frames for full path
      attackDelay: 60, // frames after path before shooting
      enemyCount: 5,
      spacing: 8, // frame delay between each enemy
      color: '#ff4488',
      bonus: 600
    },
    diveAndRise: {
      name: 'DIVE BOMBERS',
      getPath: (index, total) => ({
        startX: GAME_WIDTH + 50 + index * 30,
        startY: -30 - index * 20,
        cp1x: GAME_WIDTH / 2,
        cp1y: GAME_HEIGHT - 50,
        cp2x: 50,
        cp2y: GAME_HEIGHT / 2,
        endX: GAME_WIDTH + 100,
        endY: 100 + (index - total/2) * 35
      }),
      duration: 150,
      attackDelay: 45,
      enemyCount: 4,
      spacing: 12,
      color: '#44ff88',
      bonus: 500
    },
    sineWave: {
      name: 'WAVE RIDERS',
      getPath: (index, total) => ({
        startX: GAME_WIDTH + 50,
        startY: GAME_HEIGHT / 2 + (index - total/2) * 50,
        amplitude: 80,
        frequency: 2,
        endX: -50,
        waveType: 'sine'
      }),
      duration: 200,
      attackDelay: 80,
      enemyCount: 6,
      spacing: 15,
      color: '#8844ff',
      bonus: 700
    },
    spiralIn: {
      name: 'SPIRAL ATTACK',
      getPath: (index, total) => ({
        centerX: GAME_WIDTH / 2 + 200,
        centerY: GAME_HEIGHT / 2,
        startAngle: (index / total) * Math.PI * 2,
        startRadius: 300,
        endRadius: 100 + index * 20,
        spiralType: 'inward'
      }),
      duration: 180,
      attackDelay: 40,
      enemyCount: 8,
      spacing: 5,
      color: '#ffaa00',
      bonus: 900
    },
    crossScreen: {
      name: 'CROSS FIRE',
      getPath: (index, total) => {
        const isTop = index % 2 === 0;
        return {
          startX: GAME_WIDTH + 50,
          startY: isTop ? 50 + (index/2) * 40 : GAME_HEIGHT - 50 - (Math.floor(index/2)) * 40,
          cp1x: GAME_WIDTH / 2,
          cp1y: GAME_HEIGHT / 2,
          endX: -50,
          endY: isTop ? GAME_HEIGHT - 100 - (index/2) * 30 : 100 + (Math.floor(index/2)) * 30
        };
      },
      duration: 160,
      attackDelay: 50,
      enemyCount: 6,
      spacing: 10,
      color: '#ff8800',
      bonus: 650
    }
  };

  // Formation patterns - each defines relative positions
  const FORMATION_PATTERNS = {
    vShape: {
      name: 'V-FORMATION',
      positions: [
        { x: 0, y: 0 },
        { x: -40, y: -30 },
        { x: -40, y: 30 },
        { x: -80, y: -60 },
        { x: -80, y: 60 }
      ],
      bonus: 500,
      color: '#ffff00'
    },
    line: {
      name: 'LINE ATTACK',
      positions: [
        { x: 0, y: 0 },
        { x: -50, y: 0 },
        { x: -100, y: 0 },
        { x: -150, y: 0 }
      ],
      bonus: 400,
      color: '#00ffff'
    },
    diamond: {
      name: 'DIAMOND SQUAD',
      positions: [
        { x: 0, y: 0 },
        { x: -40, y: -40 },
        { x: -40, y: 40 },
        { x: -80, y: 0 }
      ],
      bonus: 600,
      color: '#ff00ff'
    },
    wave: {
      name: 'WAVE ASSAULT',
      positions: [
        { x: 0, y: 0 },
        { x: -30, y: -25 },
        { x: -60, y: 0 },
        { x: -90, y: 25 },
        { x: -120, y: 0 },
        { x: -150, y: -25 }
      ],
      bonus: 750,
      color: '#ff8800'
    },
    arrow: {
      name: 'ARROW HEAD',
      positions: [
        { x: 0, y: 0 },
        { x: -35, y: -25 },
        { x: -35, y: 25 },
        { x: -70, y: -50 },
        { x: -70, y: 50 },
        { x: -70, y: 0 }
      ],
      bonus: 800,
      color: '#88ff00'
    }
  };
  
  // Gamepad support
  const gamepadRef = useRef(null);
  const gamepadButtonsRef = useRef({
    shoot: false,
    missile: false,
    force: false,
    wavecannon: false,
    laser: false,
    dash: false,
    polarity: false,
    pause: false,
    start: false,
    menuUp: false,
    menuDown: false,
    menuLeft: false,
    menuRight: false,
    menuSelect: false,
    menuBack: false,
    stickUp: false,
    stickDown: false,
    stickLeft: false,
    stickRight: false,
    skipCinematic: false
  });
  const lastMissileRef = useRef(0);
  const lastForceToggleRef = useRef(0);
  const lastDashRef = useRef(0);
  const gamepadVibrationRef = useRef({ light: 0, heavy: 0 });
  
  // Player upgrades
  const upgradesRef = useRef({
    rapidFire: 0, // 0-3 levels
    missiles: false,
    shield: false,
    shieldHits: 0,
    shieldRechargeTimer: 0, // Timer for shield recharge
    shieldMaxHits: 9, // Maximum shield capacity
    speedBoost: 0, // 0-3 levels
    spreadShot: false,
    magnet: false,
    magnetTimer: 0,
    // New power-up effects
    piercing: false,
    piercingTimer: 0,
    doubleScore: false,
    doubleScoreTimer: 0,
    ricochet: false,
    ricochetTimer: 0,
    invincible: false,
    invincibleTimer: 0,
    laserBeam: false,
    laserBeamTimer: 0,
    chainLightning: false,
    chainLightningTimer: 0,
    timeWarp: false,
    timeWarpTimer: 0,
    phoenix: false // Auto-revive flag
  });
  
  // Refs for ultra power-up effects
  const blackHoleRef = useRef(null);
  const cloneRef = useRef(null);
  
  // Shield visual effects
  const shieldEffectsRef = useRef({
    impacts: [], // { x, y, angle, intensity, timer }
    hexSegments: [1,1,1,1,1,1], // 6 hexagonal segments (1 = active, 0 = damaged)
    pulseIntensity: 0, // Flash on hit
    rotationAngle: 0, // Rotating elements
    chargeParticles: [] // Charging particles when recharging
  });
  
  // Ship ability effects tracking
  const shipAbilityRef = useRef({
    // chainLightning (THUNDER) - shots chain to nearby enemies
    chainLightningChance: 0.25, // 25% chance to chain
    
    // freezeShot (GLACIER) - chance to slow enemies
    freezeChance: 0.2, // 20% chance to freeze
    freezeDuration: 120, // 2 seconds at 60fps
    
    // solarFlare (SOLAR) - periodic damage pulse
    solarFlareTimer: 0,
    solarFlareInterval: 300, // Every 5 seconds
    solarFlareRadius: 150,
    
    // phaseShift (WRAITH) - brief invincibility on dash
    phaseShiftActive: false,
    phaseShiftTimer: 0,
    phaseShiftDuration: 30, // 0.5 seconds
    
    // berserk (BERSERKER) - more damage at low health
    berserkMultiplier: 1,
    
    // shieldBoost (GUARDIAN) - faster shield regen
    shieldRegenBoost: 2, // 2x faster regen
    
    // windDash (TEMPEST) - faster movement
    windDashBoost: 1.3, // 30% faster
    
    // omegaStrike (OMEGA) - special charges faster
    omegaChargeBoost: 1.5 // 50% faster charge
  });

  // === NEW FEATURES ===
  
  // Polarity System (Ikaruga-style)
  const [polarity, setPolarity] = useState('light'); // light' or dark'
  const polarityRef = useRef('light');
  const polarityAbsorbedRef = useRef(0); // Absorbed bullets build special attack
  const POLARITY_MAX_ABSORB = 100;
  
  // Chain Combo Scoring
  const chainRef = useRef({ count: 0, type: null, timer: 0, multiplier: 1 });
  const chainDisplayRef = useRef([]); // { x, y, text, multiplier, timer }
  const CHAIN_MULTIPLIERS = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600];
  
  // Score Multiplier with Decay
  const scoreMultiplierRef = useRef(1.0);
  const multiplierDecayTimerRef = useRef(0);
  const MULTIPLIER_MAX = 10.0;
  const MULTIPLIER_DECAY_RATE = 0.002; // How fast multiplier decays per frame
  const MULTIPLIER_DECAY_DELAY = 90; // Frames before decay starts (1.5 seconds)
  const MULTIPLIER_BOOST_PER_KILL = 0.15; // Multiplier gained per kill
  
  // Speed Settings (4 levels)
  const [speedSetting, setSpeedSetting] = useState(2); // 1-4, default 2
  const speedSettingRef = useRef(2);
  const SPEED_LEVELS = [3, 5, 7, 9]; // Actual speed values
  
  // Keyboard input tracking
  const keysRef = useRef({});
  const prevKeysRef = useRef({});
  
  // Player invincibility timer (frames)
  const playerInvincibleRef = useRef(0);
  const playerSpawnGlowRef = useRef(0); // Spawn animation glow timer
  
  // Shooting cooldown
  const lastShotRef = useRef(0);
  
  // Option Satellites (Gradius-style)
  const optionsRef = useRef([]); // Array of { x, y, historyIndex }
  const playerHistoryRef = useRef([]); // Trail of player positions
  const MAX_OPTIONS = 4;
  const OPTION_TRAIL_DELAY = 15; // Frames of delay between options

  // Branching Paths
  const [showBranchChoice, setShowBranchChoice] = useState(false);
  const [branchOptions, setBranchOptions] = useState([]);
  const [branchSelection, setBranchSelection] = useState(0);
  const branchSelectionRef = useRef(0);
  
  // Zone/Path definitions for branching
  const ZONE_PATHS = {
    1: { name: 'SECTOR ALPHA', theme: 'asteroid', color: '#666666' },
    2: { name: 'NEBULA CORE', theme: 'nebula', color: '#ff44ff' },
    3: { name: 'ICE FIELDS', theme: 'ice', color: '#44ffff' },
    4: { name: 'FIRE SECTOR', theme: 'fire', color: '#ff4400' },
    5: { name: 'VOID ZONE', theme: 'void', color: '#440088' },
    6: { name: 'TECH FORTRESS', theme: 'tech', color: '#00ff00' }
  };
  const currentZoneRef = useRef(1);

  // Initialize stars for parallax background (3 layers)
  useEffect(() => {
    const stars = [];
    // Far layer - small, slow stars
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        speed: 0.3 + Math.random() * 0.4,
        size: 0.5 + Math.random() * 1,
        layer: 'far',
        brightness: 0.3 + Math.random() * 0.2
      });
    }
    // Mid layer - medium stars
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        speed: 1 + Math.random() * 1,
        size: 1 + Math.random() * 1.5,
        layer: 'mid',
        brightness: 0.5 + Math.random() * 0.3
      });
    }
    // Near layer - large, fast stars (streaks)
    for (let i = 0; i < 25; i++) {
      stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        speed: 3 + Math.random() * 3,
        size: 1.5 + Math.random() * 1.5,
        layer: 'near',
        brightness: 0.7 + Math.random() * 0.3,
        length: 5 + Math.random() * 10 // Streak length
      });
    }
    starsRef.current = stars;
  }, []);
  
  // Play gameplay music helper
  const playGameMusic = useCallback((trackName, loop = true) => {
    // Stop current game music if playing
    if (gameMusicRef.current) {
      gameMusicRef.current.pause();
      gameMusicRef.current = null;
    }
    
    gameMusicRef.current = new Audio(asset(trackName));
    gameMusicRef.current.loop = loop;
    gameMusicRef.current.volume = 0.35;
    
    // When track ends (if not looping), play next track
    if (!loop) {
      gameMusicRef.current.onended = () => {
        currentTrackIndexRef.current = (currentTrackIndexRef.current + 1) % GAMEPLAY_TRACKS.length;
        playGameMusic(GAMEPLAY_TRACKS[currentTrackIndexRef.current], false);
      };
    }
    
    gameMusicRef.current.play().catch(() => {});
  }, []);
  
  // Switch to boss music
  const playBossMusic = useCallback((isCheckpointBoss = false) => {
    const track = isCheckpointBoss ? CHECKPOINT_BOSS_MUSIC : BOSS_MUSIC;
    playGameMusic(track, true);
  }, [playGameMusic]);
  
  // Resume normal gameplay music
  const resumeGameplayMusic = useCallback(() => {
    playGameMusic(GAMEPLAY_TRACKS[currentTrackIndexRef.current], false);
  }, [playGameMusic]);

  // Sync refs with state
  useEffect(() => {
    gameStateRef.current = gameState;
    
    // Handle menu music
    if (gameState === 'menu' || gameState === 'splash') {
      // Stop game music
      if (gameMusicRef.current) {
        gameMusicRef.current.pause();
        gameMusicRef.current = null;
      }
      // Stop boss spawn sound if still playing
      if (bossSpawnSoundRef.current) {
        bossSpawnSoundRef.current.pause();
        bossSpawnSoundRef.current = null;
      }
      // Start menu music if not already playing
      if (!menuMusicRef.current) {
        menuMusicRef.current = new Audio(asset('Under_Cover_of_the_Myst.mp3'));
        menuMusicRef.current.loop = true;
        menuMusicRef.current.volume = 0.3;
      }
      if (menuMusicRef.current.paused) {
        menuMusicRef.current.play().catch(() => {});
      }
    } else if (gameState === 'playing') {
      // Stop menu music when playing
      if (menuMusicRef.current && !menuMusicRef.current.paused) {
        menuMusicRef.current.pause();
        menuMusicRef.current.currentTime = 0;
      }
      // Resume gameplay music if it was paused (e.g., after unpausing)
      if (gameMusicRef.current && gameMusicRef.current.paused) {
        gameMusicRef.current.play().catch(() => {});
      } else if (!gameMusicRef.current) {
        // Start new gameplay music if none exists
        resumeGameplayMusic();
      }
    } else if (gameState === 'paused') {
      // Pause game music when game is paused
      if (gameMusicRef.current && !gameMusicRef.current.paused) {
        gameMusicRef.current.pause();
      }
    } else if (gameState === 'checkpoint') {
      // Stop game music at checkpoint
      if (gameMusicRef.current) {
        gameMusicRef.current.pause();
        gameMusicRef.current = null;
      }
      // Stop menu music if playing
      if (menuMusicRef.current && !menuMusicRef.current.paused) {
        menuMusicRef.current.pause();
        menuMusicRef.current.currentTime = 0;
      }
      // Play spooky loop at checkpoint
      try {
        const checkpointMusic = new Audio(asset('Spooky_Loop.mp3'));
        checkpointMusic.loop = true;
        checkpointMusic.volume = 0.5;
        checkpointMusic.play().catch(() => {});
        gameMusicRef.current = checkpointMusic;
      } catch (e) {}
    } else if (gameState === 'gameOver') {
      // Stop all music on game over
      if (gameMusicRef.current) {
        gameMusicRef.current.pause();
        gameMusicRef.current = null;
      }
      if (menuMusicRef.current && !menuMusicRef.current.paused) {
        menuMusicRef.current.pause();
        menuMusicRef.current.currentTime = 0;
      }
    } else {
      // Stop menu music when leaving menu/splash
      if (menuMusicRef.current && !menuMusicRef.current.paused) {
        menuMusicRef.current.pause();
        menuMusicRef.current.currentTime = 0;
      }
    }
  }, [gameState, resumeGameplayMusic]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    menuSelectionRef.current = menuSelection;
  }, [menuSelection]);

  useEffect(() => {
    showSettingsRef.current = showSettings;
  }, [showSettings]);

  // Save user settings to localStorage and apply volume changes
  useEffect(() => {
    localStorage.setItem('nebulaXUserSettings', JSON.stringify(userSettings));
    
    // Sync to ref for game loop access
    userSettingsRef.current = userSettings;
    
    // Apply volume settings to sound system
    soundSystem.setMasterVolume(userSettings.masterVolume / 100);
    soundSystem.setMusicVolume(userSettings.musicVolume / 100);
    soundSystem.setSfxVolume(userSettings.sfxVolume / 100);
    
    // Also update gameMusicRef volume if it exists
    if (gameMusicRef.current) {
      gameMusicRef.current.volume = (userSettings.musicVolume / 100) * (userSettings.masterVolume / 100);
    }
    if (menuMusicRef.current) {
      menuMusicRef.current.volume = (userSettings.musicVolume / 100) * (userSettings.masterVolume / 100);
    }
  }, [userSettings]);

  useEffect(() => {
    showPauseControlsRef.current = showPauseControls;
  }, [showPauseControls]);

  useEffect(() => {
    pauseSelectionRef.current = pauseSelection;
  }, [pauseSelection]);

  useEffect(() => {
    checkpointSelectionRef.current = checkpointSelection;
  }, [checkpointSelection]);

  useEffect(() => {
    showCustomizeRef.current = showCustomize;
  }, [showCustomize]);

  useEffect(() => {
    selectedShipRef.current = selectedShip;
    localStorage.setItem('nebulaXSelectedShip', selectedShip.toString());
  }, [selectedShip]);

  useEffect(() => {
    shipPartsRef.current = shipParts;
    localStorage.setItem('nebulaXShipParts', JSON.stringify(shipParts));
  }, [shipParts]);

  // Save game stats to localStorage
  useEffect(() => {
    localStorage.setItem('nebulaXGameStats', JSON.stringify(gameStats));
  }, [gameStats]);

  // Save unlocked achievements to localStorage
  useEffect(() => {
    localStorage.setItem('nebulaXAchievements', JSON.stringify(unlockedAchievements));
  }, [unlockedAchievements]);

  // Achievement notification display timer
  useEffect(() => {
    if (achievementNotification) {
      const timer = setTimeout(() => {
        setAchievementNotification(null);
        // Check if there are more in the queue
        if (achievementQueueRef.current.length > 0) {
          const next = achievementQueueRef.current.shift();
          setAchievementNotification(next);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [achievementNotification]);

  // Check and unlock achievements
  const checkAchievements = useCallback((currentScore, currentWave, currentShield, currentRapidLevel) => {
    const newUnlocks = [];
    
    ACHIEVEMENTS.forEach(achievement => {
      // Skip if already unlocked
      if (unlockedAchievements.includes(achievement.id)) return;
      
      let unlocked = false;
      
      switch (achievement.type) {
        case 'score':
          unlocked = currentScore >= achievement.requirement;
          break;
        case 'kills':
          unlocked = (gameStats.totalKills + sessionStatsRef.current.kills) >= achievement.requirement;
          break;
        case 'bosses':
          unlocked = (gameStats.totalBossesDefeated + sessionStatsRef.current.bosses) >= achievement.requirement;
          break;
        case 'wave':
          unlocked = currentWave >= achievement.requirement;
          break;
        case 'powerups':
          unlocked = (gameStats.totalPowerupsCollected + sessionStatsRef.current.powerups) >= achievement.requirement;
          break;
        case 'maxShield':
          unlocked = currentShield >= achievement.requirement;
          break;
        case 'rapidLevel':
          unlocked = currentRapidLevel >= achievement.requirement;
          break;
        case 'gamesPlayed':
          unlocked = gameStats.gamesPlayed >= achievement.requirement;
          break;
        default:
          break;
      }
      
      if (unlocked) {
        newUnlocks.push(achievement.id);
        // Queue notification
        achievementQueueRef.current.push(achievement);
      }
    });
    
    if (newUnlocks.length > 0) {
      setUnlockedAchievements(prev => [...prev, ...newUnlocks]);
      // Show first notification if not already showing one
      if (!achievementNotification && achievementQueueRef.current.length > 0) {
        const first = achievementQueueRef.current.shift();
        setAchievementNotification(first);
        soundSystem.playPowerup('legendary'); // Play special sound for achievement
      }
    }
  }, [unlockedAchievements, gameStats, achievementNotification]);

  // Save session stats to persistent game stats when game ends
  const saveSessionStats = useCallback(() => {
    const updatedStats = {
      ...gameStats,
      totalKills: gameStats.totalKills + sessionStatsRef.current.kills,
      totalBossesDefeated: gameStats.totalBossesDefeated + sessionStatsRef.current.bosses,
      totalPowerupsCollected: gameStats.totalPowerupsCollected + sessionStatsRef.current.powerups
    };
    setGameStats(updatedStats);
    localStorage.setItem('nebulaXGameStats', JSON.stringify(updatedStats));
    
    // Final achievement check with updated stats
    checkAchievements(
      scoreRef.current,
      waveRef.current,
      upgradesRef.current.shieldHits,
      upgradesRef.current.rapidFire
    );
    
    // Reset session stats
    sessionStatsRef.current = { kills: 0, bosses: 0, powerups: 0 };
  }, [gameStats, checkAchievements]);

  // Handle game over with stats saving
  const handleGameOver = useCallback(() => {
    // Check for Phoenix auto-revive
    if (upgradesRef.current.phoenix) {
      upgradesRef.current.phoenix = false; // Use up Phoenix
      setLives(1);
      livesRef.current = 1;
      playerInvincibleRef.current = 300; // 5 seconds invincibility
      
      // Phoenix revival effect
      floatingTextsRef.current.push({
        x: playerRef.current.x + PLAYER_WIDTH / 2,
        y: playerRef.current.y - 40,
        text: '🔥 PHOENIX REVIVAL 🔥',
        color: '#ff8800',
        lifetime: 180,
        vy: -1,
        scale: 2
      });
      
      // Flash effect
      pickupEffectsRef.current.push({
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
        color: '#ff8800',
        lifetime: 30,
        type: 'flash'
      });
      
      triggerScreenShake(15, 30);
      return; // Don't actually game over
    }
    
    // Don't save high scores in practice mode
    if (gameModeRef.current !== 'practice') {
      if (scoreRef.current > parseInt(localStorage.getItem('spaceShooterHighScore') || 0)) {
        localStorage.setItem('spaceShooterHighScore', scoreRef.current);
        setHighScore(scoreRef.current);
      }
    }
    soundSystem.stopMusic();
    saveSessionStats();
    setGameState('gameOver');
  }, [saveSessionStats]);

  // Sync new feature refs
  useEffect(() => {
    polarityRef.current = polarity;
  }, [polarity]);

  useEffect(() => {
    speedSettingRef.current = speedSetting;
  }, [speedSetting]);

  useEffect(() => {
    branchSelectionRef.current = branchSelection;
  }, [branchSelection]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.code] = true;
      
      // Brand screen - any key to continue
      if (gameStateRef.current === 'brand') {
        soundSystem.init();
        soundSystem.resume();
        setGameState('cinematic');
        gameStateRef.current = 'cinematic';
        return;
      }
      
      // Cinematic screen - any key to skip
      if (gameStateRef.current === 'cinematic') {
        setGameState('splash');
        gameStateRef.current = 'splash';
        return;
      }
      
      // Splash screen - any key to continue
      if (gameStateRef.current === 'splash') {
        setGameState('menu');
        return;
      }
      
      // Pause with Escape
      if (e.code === 'Escape' && gameStateRef.current === 'playing') {
        setGameState('paused');
        // Pause all audio
        soundSystem.suspend();
        if (gameMusicRef.current && !gameMusicRef.current.paused) {
          gameMusicRef.current.pause();
        }
      } else if (e.code === 'Escape' && gameStateRef.current === 'paused') {
        setGameState('playing');
        // Resume all audio
        soundSystem.resume();
        if (gameMusicRef.current) {
          gameMusicRef.current.play().catch(() => {});
        }
      }
      
      // Start/Restart with Enter
      if (e.code === 'Enter') {
        if (gameStateRef.current === 'menu' || gameStateRef.current === 'gameOver') {
          startGame();
        }
      }
      
      // Fire missile with M key
      if (e.code === 'KeyM' && gameStateRef.current === 'playing' && upgradesRef.current.missiles) {
        e.preventDefault();
        soundSystem.playMissile();
        const player = playerRef.current;
        missilesRef.current.push({
          x: player.x + PLAYER_WIDTH,
          y: player.y + PLAYER_HEIGHT / 2 - MISSILE_HEIGHT / 2,
          target: null
        });
      }
      
      // BOMB with B key - screen-clearing emergency attack
      if (e.code === 'KeyB' && gameStateRef.current === 'playing') {
        e.preventDefault();
        const bomb = bombRef.current;
        if (bomb.stock > 0 && !bomb.active) {
          // Activate bomb!
          bomb.stock--;
          bomb.active = true;
          bomb.timer = BOMB_DURATION;
          bomb.x = playerRef.current.x + PLAYER_WIDTH / 2;
          bomb.y = playerRef.current.y + PLAYER_HEIGHT / 2;
          
          // Play bomb sound
          soundSystem.playBomb();
          
          // Full invincibility during bomb
          playerInvincibleRef.current = BOMB_INVINCIBILITY;
          
          // Screen shake
          triggerScreenShake(25, 60);
          
          // Cancel ALL enemy bullets and convert to points
          const canceledBullets = enemyBulletsRef.current.length;
          enemyBulletsRef.current.forEach(bullet => {
            const points = 10;
            bulletCancelRef.current.particles.push({
              x: bullet.x,
              y: bullet.y,
              timer: 30,
              points: points
            });
            scoreRef.current += points;
          });
          bulletCancelRef.current.totalCanceled += canceledBullets;
          enemyBulletsRef.current = [];
          
          // Damage/destroy all enemies
          enemiesRef.current = enemiesRef.current.filter(enemy => {
            const ew = enemy.width || ENEMY_WIDTH;
            const eh = enemy.height || ENEMY_HEIGHT;
            createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, 'normal', true);
            scoreRef.current += enemy.points * 2;
            waveKillsRef.current++;
            return false; // Remove all enemies
          });
          
          setScore(scoreRef.current);
          
          // Visual feedback
          floatingTextsRef.current.push({
            x: bomb.x,
            y: bomb.y - 50,
            text: '💥 BOMB! 💥',
            color: '#ff4400',
            timer: 60,
            vy: -1,
            scale: 1.5
          });
          
          if (canceledBullets > 0) {
            soundSystem.playBulletCancel();
            floatingTextsRef.current.push({
              x: bomb.x,
              y: bomb.y,
              text: '#00ffff',
              timer: 60,
              vy: -2
            });
          }
        }
      }
      
      // Toggle Force pod attachment with F key
      if (e.code === 'KeyF' && gameStateRef.current === 'playing' && forceRef.current) {
        e.preventDefault();
        const force = forceRef.current;
        if (force.attached === 'front') {
          force.attached = 'back';
          force.returning = false; // Already attached
        } else if (force.attached === 'back') {
          force.attached = null; // Detach
          force.returning = false;
        } else {
          // Start returning to front position
          force.targetAttachment = 'front';
          force.returning = true;
        }
      }
      
      // Toggle Polarity with C key (Ikaruga-style)
      if (e.code === 'KeyC' && gameStateRef.current === 'playing') {
        e.preventDefault();
        setPolarity(prev => prev === 'light' ? 'dark' : 'light');
      }
      
      // Adjust Speed with [ and ] keys
      if (e.code === 'BracketLeft' && gameStateRef.current === 'playing') {
        e.preventDefault();
        setSpeedSetting(prev => Math.max(1, prev - 1));
      }
      if (e.code === 'BracketRight' && gameStateRef.current === 'playing') {
        e.preventDefault();
        setSpeedSetting(prev => Math.min(4, prev + 1));
      }
      
      // Force Shield ability with G key (level 4+)
      if (e.code === 'KeyG' && gameStateRef.current === 'playing' && forceRef.current) {
        e.preventDefault();
        const force = forceRef.current;
        const forceLevel = force.level || 1;
        // Require level 4+ and not already active
        if (forceLevel >= 4 && !force.shieldActive && force.power >= 50) {
          force.shieldActive = true;
          force.shieldTimer = 180; // 3 seconds of shield
          force.power -= 50; // Costs power
          playerInvincibleRef.current = Math.max(playerInvincibleRef.current, 180);
          soundSystem.playElectricZap();
          
          // Visual feedback
          floatingTextsRef.current.push({
            x: force.x,
            y: force.y - 30,
            text: '',
            color: '#00ffff',
            lifetime: 60,
            vy: -1
          });
        }
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGame = useCallback(() => {
    // Initialize audio and start music
    soundSystem.init();
    soundSystem.resume();
    soundSystem.startMusic();
    
    playerRef.current = { x: 50, y: GAME_HEIGHT / 2 - PLAYER_HEIGHT / 2, vx: 0, vy: 0, tilt: 0 };
    playerSpawnGlowRef.current = 90; // 1.5 second spawn glow animation
    
    // Play ship spawn sound
    try {
      const spawnSound = new Audio(asset('mixkit-spell-of-healing-876.wav'));
      spawnSound.volume = 0.5;
      spawnSound.play().catch(() => {});
    } catch (e) {}
    
    bulletsRef.current = [];
    missilesRef.current = [];
    enemiesRef.current = [];
    enemyBulletsRef.current = [];
    powerupsRef.current = [];
    explosionsRef.current = [];
    pickupEffectsRef.current = [];
    floatingTextsRef.current = [];
    bulletTrailsRef.current = [];
    missileTrailsRef.current = [];
    engineTrailRef.current = [];
    impactParticlesRef.current = [];
    sparkParticlesRef.current = [];
    debrisParticlesRef.current = [];
    formationsRef.current = {};
    formationBonusDisplayRef.current = [];
    lastFormationSpawnRef.current = 0;
    nextFormationIdRef.current = 1;
    flybyFormationsRef.current = [];
    lastFlybySpawnRef.current = 0;
    lastSpawnRef.current = 0;
    waveStartTimeRef.current = performance.now(); // Start grace period
    graceWarningShownRef.current = false; // Reset warning flag
    lastShotRef.current = 0;
    playerInvincibleRef.current = 0;
    waveRef.current = 1;
    waveKillsRef.current = 0;
    waveKillsNeededRef.current = 10;
    bossRef.current = null;
    bossActiveRef.current = false;
    miniBossRef.current = null;
    miniBossSpawnedRef.current = false;
    waveCannonChargeRef.current = 0;
    isChargingRef.current = false;
    forceRef.current = null;
    forceBulletsRef.current = [];
    forceLastShotRef.current = 0;
    electricityRef.current = [];
    lastElectricityRef.current = 0;
    playerLaserRef.current = { charging: false, charge: 0, firing: false, duration: 0 };
    hazardsRef.current = { asteroids: [], laserBarriers: [], gravityWells: [] };
    lastHazardSpawnRef.current = 0;
    // Reset graze system
    grazeRef.current = { count: 0, meter: 0, lastGrazeTime: 0, displayTimer: 0, combo: 0, comboTimer: 0 };
    // Reset bomb system
    bombRef.current = { stock: 3, maxStock: 3, active: false, timer: 0, x: 0, y: 0 };
    // Reset weapon level
    weaponLevelRef.current = { level: 1, xp: 0, maxXP: 100, levelUpTimer: 0 };
    // Reset bullet cancel particles
    bulletCancelRef.current = { particles: [], totalCanceled: 0 };
    upgradesRef.current = {
      rapidFire: 0,
      missiles: false,
      shield: false,
      shieldHits: 0,
      shieldRechargeTimer: 0,
      shieldMaxHits: 9,
      speedBoost: 0, // Stacks up to 3
      spreadShot: false,
      magnet: false,
      magnetTimer: 0,
      // New power-up effects
      piercing: false,
      piercingTimer: 0,
      doubleScore: false,
      doubleScoreTimer: 0,
      ricochet: false,
      ricochetTimer: 0,
      invincible: false,
      invincibleTimer: 0,
      laserBeam: false,
      laserBeamTimer: 0,
      chainLightning: false,
      chainLightningTimer: 0,
      timeWarp: false,
      timeWarpTimer: 0,
      phoenix: false
    };
    // Reset ultra power-up effects
    blackHoleRef.current = null;
    cloneRef.current = null;
    // Reset shield effects
    shieldEffectsRef.current = {
      impacts: [],
      hexSegments: [1,1,1,1,1,1],
      pulseIntensity: 0,
      rotationAngle: 0,
      chargeParticles: []
    };
    // Reset new features
    polarityRef.current = 'light';
    polarityAbsorbedRef.current = 0;
    chainRef.current = { count: 0, type: null, timer: 0, multiplier: 1 };
    chainDisplayRef.current = null;
    scoreMultiplierRef.current = 1.0;
    multiplierDecayTimerRef.current = 0;
    optionsRef.current = [];
    playerHistoryRef.current = [];
    currentZoneRef.current = null;
    setPolarity('light');
    setSpeedSetting(2);
    setShowBranchChoice(false);
    setScore(0);
    setLives(3);
    setWave(1);
    setBossActive(false);
    miniBossRef.current = null;
    miniBossSpawnedRef.current = false;
    livesRef.current = 3;
    scoreRef.current = 0;
    
    // Initialize challenge mode settings
    gameModeRef.current = gameMode;
    challengeStatsRef.current = {
      survivalTime: 0,
      bossesDefeated: 0,
      timeAttackTime: 0,
      startTime: Date.now()
    };
    
    // Mode-specific initialization
    if (gameMode === 'survival') {
      // Survival: Start at wave 5, infinite waves, 1 life
      waveRef.current = 5;
      setWave(5);
      livesRef.current = 1;
      setLives(1);
    } else if (gameMode === 'bossRush') {
      // Boss Rush: Only boss fights, start at wave 5
      waveRef.current = 5;
      setWave(5);
      waveKillsRef.current = 999; // Skip to boss immediately
      waveKillsNeededRef.current = 0;
    } else if (gameMode === 'timeAttack') {
      // Time Attack: Race through waves 1-10
      waveRef.current = 1;
      setWave(1);
    } else if (gameMode === 'practice') {
      // Practice Mode: Use practice settings
      const ps = practiceSettingsRef.current;
      waveRef.current = ps.startWave;
      setWave(ps.startWave);
      waveKillsNeededRef.current = 10 + (ps.startWave * 5);
      
      // Infinite lives in practice mode
      if (ps.infiniteLives) {
        livesRef.current = 99;
        setLives(99);
      }
      
      // Start with max weapon power
      if (ps.maxPower) {
        weaponLevelRef.current = { level: 5, xp: 0, maxXP: 100, levelUpTimer: 60 };
        upgradesRef.current.rapidFire = 3;
        upgradesRef.current.spreadShot = true;
        upgradesRef.current.missiles = true;
      }
      
      // Invincibility toggle
      if (ps.invincible) {
        playerInvincibleRef.current = 999999;
      }
    }
    
    // Reset session stats for this game
    sessionStatsRef.current = { kills: 0, bosses: 0, powerups: 0 };
    
    // Increment games played
    setGameStats(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1 }));
    
    // Start with fade from black effect
    levelFadeRef.current = { 
      active: true, 
      fadeIn: true, 
      alpha: 1, 
      showText: gameMode === 'survival' ? 5 : (gameMode === 'bossRush' ? 5 : 1),
      timer: 120 // 2 seconds at 60fps
    };
    
    setGameState('playing');
    gameStateRef.current = 'playing';
  }, [gameMode]);

  // Save game to localStorage
  const saveGame = useCallback(() => {
    const saveData = {
      wave: waveRef.current,
      score: scoreRef.current,
      lives: livesRef.current,
      upgrades: { ...upgradesRef.current },
      hasForcePod: forceRef.current !== null && forceRef.current.active,
      forcePower: forceRef.current ? forceRef.current.power : 0,
      timestamp: Date.now()
    };
    localStorage.setItem('nebulaXSaveGame', JSON.stringify(saveData));
    
    // Also update high score if needed (but not in practice mode)
    if (gameModeRef.current !== 'practice' && scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      localStorage.setItem('spaceShooterHighScore', scoreRef.current.toString());
    }
    
    // Show save feedback
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  }, [highScore]);

  // Load game from localStorage
  const loadGame = useCallback(() => {
    const saveDataStr = localStorage.getItem('nebulaXSaveGame');
    if (!saveDataStr) return false;
    
    try {
      const saveData = JSON.parse(saveDataStr);
      
      // Reset everything first
      playerRef.current = { x: 50, y: GAME_HEIGHT / 2 - PLAYER_HEIGHT / 2, vx: 0, vy: 0, tilt: 0 };
      bulletsRef.current = [];
      missilesRef.current = [];
      enemiesRef.current = [];
      enemyBulletsRef.current = [];
      powerupsRef.current = [];
      explosionsRef.current = [];
      pickupEffectsRef.current = [];
      floatingTextsRef.current = [];
      bulletTrailsRef.current = [];
      missileTrailsRef.current = [];
      engineTrailRef.current = [];
      impactParticlesRef.current = [];
      sparkParticlesRef.current = [];
      debrisParticlesRef.current = [];
      lastSpawnRef.current = 0;
      lastShotRef.current = 0;
      playerInvincibleRef.current = 60; // Brief invincibility on load
      bossRef.current = null;
      bossActiveRef.current = false;
      waveCannonChargeRef.current = 0;
      isChargingRef.current = false;
      electricityRef.current = [];
      lastElectricityRef.current = 0;
      playerLaserRef.current = { charging: false, charge: 0, firing: false, duration: 0 };
      
      // Load saved data
      waveRef.current = saveData.wave || 1;
      scoreRef.current = saveData.score || 0;
      livesRef.current = saveData.lives || 3;
      waveKillsRef.current = 0;
      waveKillsNeededRef.current = 10 + (waveRef.current * 5);
      
      upgradesRef.current = saveData.upgrades || {
        rapidFire: 0,
        missiles: false,
        shield: false,
        shieldHits: 0,
        shieldRechargeTimer: 0,
        shieldMaxHits: 9
      };
      // Ensure shieldMaxHits is always set
      if (!upgradesRef.current.shieldMaxHits) {
        upgradesRef.current.shieldMaxHits = 9;
      }
      if (upgradesRef.current.shieldRechargeTimer === undefined) {
        upgradesRef.current.shieldRechargeTimer = 0;
      }
      
      // Restore Force pod if had one
      if (saveData.hasForcePod) {
        forceRef.current = {
          x: playerRef.current.x + PLAYER_WIDTH + FORCE_SIZE / 2 + 5,
          y: playerRef.current.y + PLAYER_HEIGHT / 2,
          attached: 'front',
          active: true,
          power: saveData.forcePower || 0,
          split: saveData.forcePower >= FORCE_MAX_POWER,
          splitY: 25,
          splitAngle: 0
        };
      } else {
        forceRef.current = null;
      }
      forceBulletsRef.current = [];
      forceLastShotRef.current = 0;
      
      setScore(scoreRef.current);
      setLives(livesRef.current);
      setWave(waveRef.current);
      setBossActive(false);
      
      // Trigger fade from black for level intro
      levelFadeRef.current = { 
        active: true, 
        fadeIn: true, 
        alpha: 1, 
        showText: 'playing'
      };
      
      return true;
    } catch (e) {
      console.error('Failed to load save:', e);
      return false;
    }
  }, []);

  // Check if save game exists
  const hasSaveGame = useCallback(() => {
    return localStorage.getItem('nebulaXSaveGame') !== null;
  }, []);

  // Load explosion sprite sheet
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      explosionSpriteRef.current = img;
      explosionSpriteLoadedRef.current = true;
    };
    img.src = '/explosion2.png';
  }, []);

  // Trigger screen shake
  const triggerScreenShake = useCallback((intensity, duration) => {
    // Only apply shake if it's stronger than current shake
    if (intensity > screenShakeRef.current.intensity) {
      screenShakeRef.current = { intensity, duration };
    }
  }, []);

  // Create shield impact effect
  const createShieldImpact = useCallback((impactX, impactY) => {
    const player = playerRef.current;
    const centerX = player.x + PLAYER_WIDTH / 2;
    const centerY = player.y + PLAYER_HEIGHT / 2;
    const angle = Math.atan2(impactY - centerY, impactX - centerX);
    
    // Add impact ripple
    shieldEffectsRef.current.impacts.push({
      x: impactX,
      y: impactY,
      angle: angle,
      intensity: 1.0,
      timer: 30,
      radius: 20
    });
    
    // Flash the shield
    shieldEffectsRef.current.pulseIntensity = 1.0;
    
    // Damage a hex segment based on impact angle
    const segmentIndex = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 6) % 6;
    if (shieldEffectsRef.current.hexSegments[segmentIndex] > 0) {
      shieldEffectsRef.current.hexSegments[segmentIndex] = Math.max(0, 
        shieldEffectsRef.current.hexSegments[segmentIndex] - 0.3);
    }
    
    // Add scatter particles
    for (let i = 0; i < 8; i++) {
      const particleAngle = angle + (Math.random() - 0.5) * 1.2;
      shieldEffectsRef.current.chargeParticles.push({
        x: impactX,
        y: impactY,
        vx: Math.cos(particleAngle) * (3 + Math.random() * 4),
        vy: Math.sin(particleAngle) * (3 + Math.random() * 4),
        life: 20 + Math.random() * 15,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#00ffff' : '#ffffff'
      });
    }
    
    // Play shield hit sound
    soundSystem.playShieldHit && soundSystem.playShieldHit();
  }, []);
  
  // Start checkpoint transition - smoothly transitions to checkpoint screen
  const startCheckpointTransition = useCallback((boss, completedWave) => {
    // Calculate bonus points
    const liveBonus = livesRef.current * 500;
    const waveBonus = completedWave * 200;
    const bonusTotal = liveBonus + waveBonus;
    
    // Store pending checkpoint data
    checkpointTransitionRef.current = {
      active: true,
      phase: 'explosions',
      timer: 0,
      fadeAlpha: 0,
      pendingCheckpoint: {
        wave: completedWave,
        score: scoreRef.current + bonusTotal,
        lives: livesRef.current,
        bonusPoints: bonusTotal
      },
      explosionTimer: 0,
      bossX: boss.x + boss.width / 2,
      bossY: boss.y + boss.height / 2,
      bossWidth: boss.width,
      bossHeight: boss.height
    };
    
    // Make player invincible during transition
    playerInvincibleRef.current = 300; // 5 seconds of invincibility
    
    // Clear enemy bullets to avoid cheap deaths during transition
    enemyBulletsRef.current = [];
    
    // Stop current game/boss music during checkpoint transition
    if (gameMusicRef.current) {
      gameMusicRef.current.pause();
      gameMusicRef.current = null;
    }
    
    // Play epic boss death sound
    try {
      const bossDeathSound = new Audio(asset('mixkit-explosion-hit-1704.mp3'));
      bossDeathSound.volume = 0.7;
      bossDeathSound.play().catch(() => {});
    } catch (e) {}
    
    // Play level complete sound
    try {
      const levelCompleteSound = new Audio(asset('mixkit-completion-of-a-level-2063.wav'));
      levelCompleteSound.volume = 0.6;
      levelCompleteSound.play().catch(() => {});
    } catch (e) {}
    
    triggerScreenShake(15, 40);
  }, []);

  // Create impact particles when bullets hit enemies
  const createImpactParticles = useCallback((x, y, color = '#ffaa00', count = 6) => {
    const perfMode = userSettingsRef.current?.performanceMode;
    if (perfMode && Math.random() > 0.5) return; // Skip some impacts in perf mode
    
    const actualCount = perfMode ? Math.ceil(count * 0.5) : count;
    for (let i = 0; i < actualCount; i++) {
      const angle = (i / actualCount) * Math.PI * 2;
      const speed = 3 + Math.random() * 4; // Increased speed
      impactParticlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 2.5, // Larger size
        lifetime: 20 + Math.random() * 12, // Longer lifetime
        maxLifetime: 32,
        color: color,
        brightness: 1.2 // Brighter
      });
    }
    
    // Limit impact particles
    if (impactParticlesRef.current.length > PARTICLE_LIMITS.impact) {
      impactParticlesRef.current = impactParticlesRef.current.slice(-PARTICLE_LIMITS.impact);
    }
  }, []);

  // Create spark particles for special effects
  const createSparkParticles = useCallback((x, y, count = 4, spreadAngle = Math.PI * 2) => {
    const perfMode = userSettingsRef.current?.performanceMode;
    if (perfMode && Math.random() > 0.6) return;
    
    const actualCount = perfMode ? Math.ceil(count * 0.6) : count;
    for (let i = 0; i < actualCount; i++) {
      const angle = Math.random() * spreadAngle - spreadAngle / 2;
      const speed = 5 + Math.random() * 5; // Increased speed
      sparkParticlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // More upward bias
        size: 1.5 + Math.random() * 1.5, // Larger
        lifetime: 25 + Math.random() * 18, // Longer
        maxLifetime: 43,
        color: Math.random() > 0.3 ? '#ffffff' : '#ffff88',
        trailLength: 4
      });
    }
    
    // Limit spark particles
    if (sparkParticlesRef.current.length > PARTICLE_LIMITS.spark) {
      sparkParticlesRef.current = sparkParticlesRef.current.slice(-PARTICLE_LIMITS.spark);
    }
  }, []);

  // Helper function for AABB collision detection
  const checkCollision = useCallback((rect1, rect2) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  // Create explosion effect
  const createExplosion = useCallback((x, y, size = 'normal', useSprite = false) => {
    // Play explosion sound
    if (size === 'boss') {
      // Play boss destruction sound
      try {
        const bossDeathSound = new Audio(asset('mixkit-explosion-hit-1704.mp3'));
        bossDeathSound.volume = 0.7;
        bossDeathSound.play().catch(() => {});
      } catch (e) {}
    } else if (size === 'large' || size === 'heavy' || size === 'missile') {
      soundSystem.playExplosion('large');
    } else if (size !== 'small') {
      // Play the mixkit explosive impact sound for normal enemy destruction
      try {
        const explosionSound = new Audio('/mixkit-explosive-impact-from-afar-2758.mp3');
        explosionSound.volume = 0.25;
        explosionSound.play().catch(() => {});
      } catch (e) {}
    }
    
    // Trigger screen shake based on explosion size
    if (size === 'boss') {
      triggerScreenShake(12, 30); // Big shake for boss
    } else if (size === 'large' || size === 'heavy') {
      triggerScreenShake(6, 15); // Medium shake
    } else if (size === 'missile') {
      triggerScreenShake(4, 10); // Small shake
    }
    
    // Use sprite-based explosion for enemies (when sprite is available)
    const shouldUseSprite = useSprite && explosionSpriteLoadedRef.current;
    
    // Performance mode reduces particle counts
    const perfMode = userSettingsRef.current?.performanceMode;
    // Also reduce particles during boss battles for better performance
    const bossBattleReduction = bossActiveRef.current ? 0.6 : 1;
    const particleMultiplier = (perfMode ? 0.5 : 1) * bossBattleReduction;
    
    // Always add flying debris particles for visual enhancement
    let debrisCount = size === 'boss' ? 20 : size === 'heavy' ? 12 : size === 'large' ? 10 : size === 'small' ? 4 : 8;
    debrisCount = Math.ceil(debrisCount * particleMultiplier);
    const debrisColors = ['#ffff00', '#ff8800', '#ff4400', '#ffffff', '#ffcc00'];
    
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (size === 'boss' ? 6 : size === 'heavy' ? 4 : 3) + Math.random() * 5;
      const debrisSize = size === 'boss' ? 3 + Math.random() * 4 : 1.5 + Math.random() * 2.5;
      
      pickupEffectsRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: debrisColors[Math.floor(Math.random() * debrisColors.length)],
        size: debrisSize,
        lifetime: 20 + Math.floor(Math.random() * 20),
        type: 'debris',
        gravity: 0.1 + Math.random() * 0.1, // Slight downward pull
        spin: (Math.random() - 0.5) * 0.3
      });
    }
    
    // Add spark trails
    let sparkCount = size === 'boss' ? 15 : size === 'heavy' ? 8 : size === 'large' ? 6 : size === 'small' ? 2 : 5;
    sparkCount = Math.ceil(sparkCount * particleMultiplier);
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (size === 'boss' ? 8 : 5) + Math.random() * 6;
      
      pickupEffectsRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#ffffff',
        size: 1 + Math.random() * 2,
        lifetime: 15 + Math.floor(Math.random() * 15),
        type: 'spark',
        trail: [] // Will store previous positions for trail effect
      });
    }
    
    if (shouldUseSprite) {
      // Sprite-based explosion with 8 frames - BIGGER sizes!
      let spriteSize;
      switch (size) {
        case 'small': spriteSize = 56; break;
        case 'normal': spriteSize = 80; break;
        case 'heavy': spriteSize = 110; break;
        case 'boss': spriteSize = 180; break;
        default: spriteSize = 80;
      }
      const explosion = {
        x,
        y,
        isSprite: true,
        frame: 0,
        totalFrames: 8,
        frameTimer: 0,
        frameDelay: size === 'boss' ? 4 : 3,
        spriteSize: spriteSize,
        lifetime: size === 'boss' ? 32 : 24,
        maxLifetime: size === 'boss' ? 32 : 24,
        startTime: Date.now(),
        particles: []
      };
      explosionsRef.current.push(explosion);
      
      // For boss explosions, add multiple sprite explosions for massive effect
      if (size === 'boss') {
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6;
          const dist = 40 + Math.random() * 30;
          const delay = i * 3;
          setTimeout(() => {
            explosionsRef.current.push({
              x: x + Math.cos(angle) * dist,
              y: y + Math.sin(angle) * dist,
              isSprite: true,
              frame: 0,
              totalFrames: 8,
              frameTimer: 0,
              frameDelay: 3,
              spriteSize: 100 + Math.random() * 40,
              lifetime: 24,
              particles: []
            });
            // Add more debris for each secondary explosion
            for (let j = 0; j < 5; j++) {
              const debrisAngle = Math.random() * Math.PI * 2;
              const debrisSpeed = 3 + Math.random() * 4;
              pickupEffectsRef.current.push({
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                vx: Math.cos(debrisAngle) * debrisSpeed,
                vy: Math.sin(debrisAngle) * debrisSpeed,
                color: debrisColors[Math.floor(Math.random() * debrisColors.length)],
                size: 2 + Math.random() * 2,
                lifetime: 15 + Math.floor(Math.random() * 15),
                type: 'debris',
                gravity: 0.1,
                spin: (Math.random() - 0.5) * 0.3
              });
            }
          }, delay * 16);
        }
      }
      return;
    }
    
    const isMissile = size === 'missile';
    const isBoss = size === 'boss';
    const particleCount = isBoss ? 50 : isMissile ? 35 : size === 'large' ? 25 : size === 'small' ? 8 : 15;
    const explosion = {
      x,
      y,
      particles: [],
      lifetime: isBoss ? 60 : isMissile ? 45 : size === 'small' ? 15 : 30,
      isPlayerExplosion: size === 'large',
      isMissileExplosion: isMissile,
      isBossExplosion: isBoss,
      isSprite: false
    };
    
    // Boss explosions are intense multi-color
    const colors = isBoss
      ? ['#ff0000', '#ff4400', '#ff8800', '#ffcc00', '#ffffff', '#00ffff', '#ff00ff']
      : isMissile
        ? ['#ff2200', '#ff4400', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00', '#ffffff']
        : size === 'large' 
          ? ['#00ff88', '#00ffff', '#ffffff', '#88ffaa']
          : ['#ff4444', '#ff8800', '#ffff00', '#ffffff'];
    
    // Main explosion particles - more and bigger for bosses
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = isBoss
        ? 4 + Math.random() * 8
        : isMissile 
          ? 2 + Math.random() * 6 
          : size === 'large' ? 3 + Math.random() * 4 : size === 'small' ? 1.5 + Math.random() * 2.5 : 2.5 + Math.random() * 3.5;
      explosion.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: isBoss
          ? 6 + Math.random() * 12
          : isMissile 
            ? 4 + Math.random() * 8
            : size === 'large' ? 3 + Math.random() * 6 : size === 'small' ? 2 + Math.random() * 3 : 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        decay: isBoss ? 0.94 : isMissile ? 0.92 + Math.random() * 0.05 : 1
      });
    }
    
    // Add extra fire ring particles for missile explosions
    if (isMissile) {
      // Inner fast particles
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 5;
        explosion.particles.push({
          x: 0,
          y: 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 3,
          color: '#ffffff',
          decay: 0.88
        });
      }
      // Smoke particles (slower, larger, darker)
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        explosion.particles.push({
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5, // Rise slightly
          size: 8 + Math.random() * 10,
          color: '#332211',
          isSmoke: true,
          decay: 0.96
        });
      }
    }
    
    // Add embers/cinders that float upward for all non-small explosions
    if (size !== 'small') {
      const emberCount = isBoss ? 12 : isMissile ? 8 : 5;
      for (let i = 0; i < emberCount; i++) {
        pickupEffectsRef.current.push({
          x: x + (Math.random() - 0.5) * 30,
          y: y + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -0.5 - Math.random() * 1.5, // Float upward
          color: Math.random() > 0.5 ? '#ff6600' : '#ffcc00',
          size: 1.5 + Math.random() * 2,
          lifetime: 40 + Math.floor(Math.random() * 30),
          type: 'ember',
          flicker: Math.random() * Math.PI * 2
        });
      }
    }
    
    explosionsRef.current.push(explosion);
  }, []);

  // Spawn power-up at enemy position
  const spawnPowerup = useCallback((x, y) => {
    console.log('[SPAWN POWERUP] Called at position:', x, y);
    // Rarity-based spawning with 4 tiers
    const roll = Math.random();
    let selectedType;
    
    if (roll < 0.05) {
      // 5% ultra (super rare!)
      const ultraTypes = Object.entries(POWERUP_TYPES)
        .filter(([_, config]) => config.rarity === 'ultra')
        .map(([type]) => type);
      selectedType = ultraTypes[Math.floor(Math.random() * ultraTypes.length)];
    } else if (roll < 0.20) {
      // 15% legendary
      const legendaryTypes = Object.entries(POWERUP_TYPES)
        .filter(([_, config]) => config.rarity === 'legendary')
        .map(([type]) => type);
      selectedType = legendaryTypes[Math.floor(Math.random() * legendaryTypes.length)];
    } else if (roll < 0.45) {
      // 25% rare
      const rareTypes = Object.entries(POWERUP_TYPES)
        .filter(([_, config]) => config.rarity === 'rare')
        .map(([type]) => type);
      selectedType = rareTypes[Math.floor(Math.random() * rareTypes.length)];
    } else {
      // 55% common
      const commonTypes = Object.entries(POWERUP_TYPES)
        .filter(([_, config]) => config.rarity === 'common')
        .map(([type]) => type);
      selectedType = commonTypes[Math.floor(Math.random() * commonTypes.length)];
    }
    
    powerupsRef.current.push({
      x,
      y,
      vx: -1.5,
      vy: (Math.random() - 0.5) * 1.5,
      type: selectedType,
      bobOffset: Math.random() * Math.PI * 2,
      spawnTime: Date.now(),
      rotation: 0
    });
    console.log('[SPAWN POWERUP] Created', selectedType, 'Total powerups:', powerupsRef.current.length);
  }, []);

  // Create pickup effect (ring burst + particles) - enhanced for rarity
  const createPickupEffect = useCallback((x, y, color, powerupName, rarity = 'common') => {
    const isRare = rarity === 'rare';
    const isLegendary = rarity === 'legendary';
    const isUltra = rarity === 'ultra';
    
    // Ring burst effect - bigger for rarer items
    const maxRadius = isUltra ? 150 : isLegendary ? 100 : isRare ? 80 : 60;
    pickupEffectsRef.current.push({
      x,
      y,
      color: isUltra ? '#ff00ff' : color,
      radius: 10,
      maxRadius,
      lifetime: isUltra ? 45 : isLegendary ? 30 : 20,
      type: 'ring'
    });
    
    // Extra rings for rare/legendary/ultra
    if (isRare || isLegendary || isUltra) {
      pickupEffectsRef.current.push({
        x,
        y,
        color: '#ffffff',
        radius: 5,
        maxRadius: maxRadius * 0.7,
        lifetime: 15,
        type: 'ring'
      });
    }
    
    // Double rings for ultra
    if (isUltra) {
      pickupEffectsRef.current.push({
        x,
        y,
        color: '#ffff00',
        radius: 15,
        maxRadius: maxRadius * 1.2,
        lifetime: 35,
        type: 'ring'
      });
    }
    
    // Sparkle particles - more for rarer items
    const particleCount = isUltra ? 36 : isLegendary ? 24 : isRare ? 18 : 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = (isUltra ? 7 : isLegendary ? 5 : isRare ? 4 : 3) + Math.random() * 2;
      pickupEffectsRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: isUltra ? (i % 3 === 0 ? '#ff00ff' : i % 3 === 1 ? '#00ffff' : '#ffff00') : (i % 2 === 0 ? color : '#ffffff'),
        size: (isUltra ? 7 : isLegendary ? 5 : isRare ? 4 : 3) + Math.random() * 3,
        lifetime: isUltra ? 60 : isLegendary ? 40 : 25,
        type: 'sparkle'
      });
    }
    
    // Screen flash for legendary and ultra
    if (isLegendary || isUltra) {
      pickupEffectsRef.current.push({
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
        color: isUltra ? '#ff00ff' : color,
        lifetime: isUltra ? 20 : 10,
        type: 'flash'
      });
    }
    
    // Floating text - with rarity indicator
    const rarityPrefix = isUltra ? '⭐ ULTRA ⭐' : isLegendary ? '⚙' : isRare ? '✦' : '';
    floatingTextsRef.current.push({
      x,
      y,
      text: rarityPrefix + powerupName,
      color: isUltra ? '#ff00ff' : isLegendary ? '#ffff00' : isRare ? '#00ffff' : color,
      lifetime: isUltra ? 120 : isLegendary ? 90 : 60,
      vy: -2,
      scale: isUltra ? 1.5 : isLegendary ? 1.3 : isRare ? 1.15 : 1
    });
  }, []);

  const spawnEnemy = useCallback(() => {
    // Play spawn alert sound occasionally (not every enemy to avoid noise)
    // DISABLED temporarily - audio file path issue
    /*
    if (Math.random() < 0.15) {
      try {
        const spawnSound = new Audio(asset('mixkit-technology-alert-transition-3121.mp3'));
        spawnSound.volume = 0.2;
        spawnSound.play().catch(() => {});
      } catch (e) {}
    }
    */
    
    // Chance for enemy to come from behind increases with wave
    const waveNum = waveRef.current;
    const behindChance = Math.min(0.40, 0.10 + waveNum * 0.03); // 10% at wave 1, up to 40%
    const comesFromBehind = Math.random() < behindChance;
    
    // Chance for turret increases with wave (starts wave 2)
    const turretChance = waveNum >= 2 ? Math.min(0.2, 0.05 + (waveNum - 2) * 0.02) : 0;
    const isTurret = !comesFromBehind && Math.random() < turretChance;
    
    // Chance for heavy enemy (starts wave 3)
    const heavyChance = waveNum >= 3 ? Math.min(0.25, 0.08 + (waveNum - 3) * 0.03) : 0;
    const isHeavy = !comesFromBehind && !isTurret && Math.random() < heavyChance;
    
    // Chance for shielded enemy (starts wave 4)
    const shieldedChance = waveNum >= 4 ? Math.min(0.15, 0.05 + (waveNum - 4) * 0.02) : 0;
    const isShielded = !comesFromBehind && !isTurret && !isHeavy && Math.random() < shieldedChance;
    
    // Chance for cloaked enemy (starts wave 5)
    const cloakedChance = waveNum >= 5 ? Math.min(0.12, 0.04 + (waveNum - 5) * 0.015) : 0;
    const isCloaked = !comesFromBehind && !isTurret && !isHeavy && !isShielded && Math.random() < cloakedChance;
    
    // Chance for suicide bomber (starts wave 3)
    const bomberChance = waveNum >= 3 ? Math.min(0.1, 0.03 + (waveNum - 3) * 0.015) : 0;
    const isSuicideBomber = !comesFromBehind && !isTurret && !isHeavy && !isShielded && !isCloaked && Math.random() < bomberChance;
    
    // Chance for spiral shooter (starts wave 4)
    const spiralChance = waveNum >= 4 ? Math.min(0.1, 0.03 + (waveNum - 4) * 0.015) : 0;
    const isSpiral = !comesFromBehind && !isTurret && !isHeavy && !isShielded && !isCloaked && !isSuicideBomber && Math.random() < spiralChance;
    
    // Chance for wave shooter (starts wave 5)
    const waveChance = waveNum >= 5 ? Math.min(0.1, 0.03 + (waveNum - 5) * 0.012) : 0;
    const isWaveShooter = !comesFromBehind && !isTurret && !isHeavy && !isShielded && !isCloaked && !isSuicideBomber && !isSpiral && Math.random() < waveChance;
    
    // Chance for sniper (starts wave 6)
    const sniperChance = waveNum >= 6 ? Math.min(0.08, 0.02 + (waveNum - 6) * 0.01) : 0;
    const isSniper = !isTurret && !isHeavy && !isShielded && !isCloaked && !isSuicideBomber && !isSpiral && !isWaveShooter && Math.random() < sniperChance;
    
    // Chance for sniper from behind (starts wave 7) - rare and dangerous!
    const sniperBehindChance = waveNum >= 7 ? Math.min(0.10, 0.03 + (waveNum - 7) * 0.012) : 0;
    const isSniperFromBehind = !isSniper && comesFromBehind && Math.random() < sniperBehindChance;
    
    // Chance for shielder support ship (starts wave 6) - cloaked ship that provides shields to other enemies
    // Shielders can also come from behind!
    const shielderChance = waveNum >= 6 ? Math.min(0.12, 0.03 + (waveNum - 6) * 0.015) : 0;
    const isShielder = !isTurret && !isHeavy && !isShielded && !isCloaked && !isSuicideBomber && !isSpiral && !isWaveShooter && !isSniper && !isSniperFromBehind && Math.random() < shielderChance;
    const isShielderFromBehind = isShielder && comesFromBehind;
    
    // Chance for healer drone (starts wave 7) - repairs nearby enemies
    const healerChance = waveNum >= 7 ? Math.min(0.08, 0.02 + (waveNum - 7) * 0.01) : 0;
    const isHealer = !isTurret && !isHeavy && !isShielded && !isCloaked && !isSuicideBomber && !isSpiral && !isWaveShooter && !isSniper && !isSniperFromBehind && !isShielder && Math.random() < healerChance;
    
    // Chance for teleporter (starts wave 8) - blinks around unpredictably
    const teleporterChance = waveNum >= 8 ? Math.min(0.08, 0.02 + (waveNum - 8) * 0.01) : 0;
    const isTeleporter = !isTurret && !isHeavy && !isShielded && !isCloaked && !isSuicideBomber && !isSpiral && !isWaveShooter && !isSniper && !isSniperFromBehind && !isShielder && !isHealer && Math.random() < teleporterChance;
    
    // Chance for splitter (starts wave 6) - splits into smaller enemies when destroyed
    const splitterChance = waveNum >= 6 ? Math.min(0.10, 0.03 + (waveNum - 6) * 0.012) : 0;
    const isSplitter = !isTurret && !isHeavy && !isShielded && !isCloaked && !isSuicideBomber && !isSpiral && !isWaveShooter && !isSniper && !isSniperFromBehind && !isShielder && !isHealer && !isTeleporter && Math.random() < splitterChance;
    
    // Chance for magnetic mine (starts wave 5) - slow homing projectile-like enemy
    const mineChance = waveNum >= 5 ? Math.min(0.12, 0.04 + (waveNum - 5) * 0.015) : 0;
    const isMine = !isTurret && !isHeavy && !isShielded && !isCloaked && !isSuicideBomber && !isSpiral && !isWaveShooter && !isSniper && !isSniperFromBehind && !isShielder && !isHealer && !isTeleporter && !isSplitter && Math.random() < mineChance;
    
    // Elite variant chance (any enemy can become elite after wave 4)
    const eliteChance = waveNum >= 4 ? Math.min(0.15, 0.03 + (waveNum - 4) * 0.02) : 0;
    const isElite = Math.random() < eliteChance;
    
    // Determine enemy type
    let type = 'normal';
    const typeRoll = Math.random();
    if (isTurret) {
      type = 'turret';
    } else if (isHeavy) {
      type = 'heavy';
    } else if (isShielded) {
      type = 'shielded';
    } else if (isCloaked) {
      type = 'cloaked';
    } else if (isSuicideBomber) {
      type = 'bomber';
    } else if (isSpiral) {
      type = 'spiral';
    } else if (isWaveShooter) {
      type = 'wave';
    } else if (isSniper || isSniperFromBehind) {
      type = 'sniper';
    } else if (isShielder) {
      type = 'shielder';
    } else if (isHealer) {
      type = 'healer';
    } else if (isTeleporter) {
      type = 'teleporter';
    } else if (isSplitter) {
      type = 'splitter';
    } else if (isMine) {
      type = 'mine';
    } else if (comesFromBehind) {
      type = 'ambush'; // Special type for behind enemies
    } else if (typeRoll > 0.7) {
      type = 'fast';
    }
    
    const enemy = {
      x: comesFromBehind ? -ENEMY_WIDTH : GAME_WIDTH,
      y: Math.random() * (GAME_HEIGHT - ENEMY_HEIGHT),
      type: type,
      health: 1,
      lastShot: Date.now() + Math.random() * ENEMY_FIRE_RATE,
      fromBehind: comesFromBehind || isSniperFromBehind || isShielderFromBehind,
      polarity: Math.random() > 0.5 ? 'light' : 'dark', // Random polarity for each enemy
      isElite: isElite, // Elite enemies are tougher with special effects
      damageFlash: 0 // Visual feedback when hit
    };
    
    // Apply elite bonuses
    if (isElite && type !== 'mine') {
      enemy.health = (enemy.health || 1) + 2; // +2 health
      enemy.points = Math.floor((enemy.points || 10) * 1.5); // 50% more points
      enemy.isElite = true;
    }
    
    if (enemy.type === 'turret') {
      // Turret spawns in right half of screen at a fixed position
      enemy.x = GAME_WIDTH * 0.6 + Math.random() * (GAME_WIDTH * 0.35);
      enemy.y = 30 + Math.random() * (GAME_HEIGHT - 60);
      enemy.speed = 0; // Static - doesn't move
      enemy.points = 50; // Worth more since harder to avoid
      enemy.canShoot = true;
      enemy.health = 2; // Tougher
      enemy.angle = Math.PI; // Aiming angle (starts facing left)
      enemy.lastShot = Date.now() + 500 + Math.random() * 1000; // Delay before first shot
    } else if (enemy.type === 'heavy') {
      // Heavy enemy - bigger, tougher, shoots cannons
      enemy.speed = ENEMY_SPEED * 0.6; // Slower but menacing
      enemy.points = 75; // Worth a lot
      enemy.canShoot = true;
      enemy.health = 4; // Very tough
      enemy.isCannon = true; // Shoots cannon projectiles
      enemy.lastShot = Date.now() + 800 + Math.random() * 500;
      enemy.width = ENEMY_WIDTH * 1.5; // 50% bigger
      enemy.height = ENEMY_HEIGHT * 1.5;
    } else if (enemy.type === 'shielded') {
      // Shielded enemy - has a protective barrier
      enemy.speed = ENEMY_SPEED * 0.8;
      enemy.points = 60;
      enemy.canShoot = true;
      enemy.health = 2;
      enemy.shield = 3; // Shield absorbs 3 hits
      enemy.maxShield = 3;
      enemy.shieldFlash = 0; // Visual feedback when hit
    } else if (enemy.type === 'cloaked') {
      // Cloaked enemy - invisible until close or attacking
      enemy.speed = ENEMY_SPEED * 1.1;
      enemy.points = 45;
      enemy.canShoot = true;
      enemy.health = 1;
      enemy.cloaked = true;
      enemy.cloakAlpha = 0.1; // Nearly invisible
      enemy.revealTimer = 0; // Timer for reveal after shooting
    } else if (enemy.type === 'bomber') {
      // Suicide bomber - rushes player and explodes
      enemy.speed = ENEMY_SPEED * 2.0; // Very fast
      enemy.points = 35;
      enemy.canShoot = false;
      enemy.health = 1;
      enemy.isBomber = true;
      enemy.explosionRadius = 80;
      enemy.pulsePhase = 0;
    } else if (enemy.type === 'spiral') {
      // Spiral shooter - fires bullets in rotating spiral pattern
      enemy.speed = ENEMY_SPEED * 0.5; // Slow, focused on attack
      enemy.points = 55;
      enemy.canShoot = true;
      enemy.health = 3;
      enemy.spiralAngle = 0; // Current spiral rotation
      enemy.spiralSpeed = 0.15; // Rotation speed per shot
      enemy.burstCount = 8; // Bullets per spiral burst
      enemy.attackCooldown = 0;
      enemy.lastShot = Date.now() + 1000;
    } else if (enemy.type === 'wave') {
      // Wave shooter - fires sinusoidal wave bullets
      enemy.speed = ENEMY_SPEED * 0.7;
      enemy.points = 50;
      enemy.canShoot = true;
      enemy.health = 2;
      enemy.wavePhase = 0;
      enemy.waveAmplitude = 3; // How much bullets curve
      enemy.attackCooldown = 0;
      enemy.lastShot = Date.now() + 800;
    } else if (enemy.type === 'sniper') {
      // Sniper - aims precisely at player with targeting laser
      enemy.speed = ENEMY_SPEED * 0.4; // Very slow, careful
      enemy.points = enemy.fromBehind ? 85 : 65; // Worth more from behind
      enemy.canShoot = true;
      enemy.health = 2;
      enemy.targeting = false; // Aiming phase
      enemy.targetTimer = 0; // Time spent targeting
      enemy.targetDuration = enemy.fromBehind ? 70 : 90; // Faster aim from behind (more dangerous)
      enemy.targetAngle = enemy.fromBehind ? 0 : Math.PI; // Aim direction (0 = right, PI = left)
      enemy.lastShot = Date.now() + 1500;
      // Position sniper from behind on left side
      if (enemy.fromBehind) {
        enemy.x = -ENEMY_WIDTH;
      }
    } else if (enemy.type === 'shielder') {
      // Shielder - cloaked support ship that generates shields for nearby enemies
      enemy.speed = ENEMY_SPEED * 0.5; // Slow, stays back
      enemy.points = 100; // High priority target
      enemy.canShoot = false; // Doesn't attack, only supports
      enemy.health = 3;
      enemy.cloaked = true;
      enemy.cloakAlpha = 0.15; // Nearly invisible
      enemy.revealTimer = 0;
      enemy.shieldRange = 150; // Range to provide shields
      enemy.shieldCooldown = 0;
      enemy.shieldInterval = 180; // Apply shields every 3 seconds
      enemy.shieldPulse = 0; // Visual pulse effect
      enemy.shieldedTargets = []; // Track which enemies have been shielded
      enemy.spawnInvulnerable = true; // Invulnerable when spawning
      enemy.spawnInvulnerableTimer = 300; // 5 seconds at 60fps
    } else if (enemy.type === 'healer') {
      // Healer drone - repairs nearby damaged enemies
      enemy.speed = ENEMY_SPEED * 0.6; // Slow, stays back
      enemy.points = 120; // High priority target
      enemy.canShoot = false; // Doesn't attack, only heals
      enemy.health = 2;
      enemy.healRange = 120; // Range to heal allies
      enemy.healCooldown = 0;
      enemy.healInterval = 90; // Heal every 1.5 seconds
      enemy.healAmount = 1; // Restore 1 health per tick
      enemy.healPulse = 0; // Visual effect
      enemy.healBeam = null; // Active heal beam target
    } else if (enemy.type === 'teleporter') {
      // Teleporter - blinks around unpredictably
      enemy.speed = ENEMY_SPEED * 0.4; // Slow between teleports
      enemy.points = 80;
      enemy.canShoot = true;
      enemy.health = 2;
      enemy.teleportCooldown = 0;
      enemy.teleportInterval = 120 + Math.random() * 60; // 2-3 seconds
      enemy.teleportCharging = false;
      enemy.teleportCharge = 0;
      enemy.teleportFlash = 0; // Visual effect
      enemy.lastTeleportX = 0;
      enemy.lastTeleportY = 0;
    } else if (enemy.type === 'splitter') {
      // Splitter - splits into smaller enemies when destroyed
      enemy.speed = ENEMY_SPEED * 0.7;
      enemy.points = 40;
      enemy.canShoot = true;
      enemy.health = 3;
      enemy.width = ENEMY_WIDTH * 1.3;
      enemy.height = ENEMY_HEIGHT * 1.3;
      enemy.splitCount = 2; // Spawns 2 mini enemies on death
      enemy.isSplitter = true;
      enemy.splitPhase = 0; // Visual pulsing
    } else if (enemy.type === 'mine') {
      // Magnetic mine - slowly homes toward player
      enemy.speed = ENEMY_SPEED * 0.3; // Very slow
      enemy.points = 25;
      enemy.canShoot = false;
      enemy.health = 1;
      enemy.isMine = true;
      enemy.explosionRadius = 100;
      enemy.magnetStrength = 0.02; // How strongly it homes
      enemy.armingTime = 60; // Frames before it can explode (1 second)
      enemy.armed = false;
      enemy.pulsePhase = 0;
      enemy.width = ENEMY_WIDTH * 0.8;
      enemy.height = ENEMY_HEIGHT * 0.8;
    } else if (enemy.type === 'fast') {
      enemy.speed = ENEMY_SPEED * 1.5;
      enemy.points = 20;
      enemy.canShoot = false;
    } else if (enemy.type === 'ambush') {
      enemy.speed = ENEMY_SPEED * 1.2; // Slightly faster
      enemy.points = 30; // Worth more points
      enemy.canShoot = true;
      enemy.health = 1;
    } else {
      enemy.speed = ENEMY_SPEED;
      enemy.points = 10;
      enemy.canShoot = true;
    }
    
    // Apply elite bonuses after type-specific setup
    if (enemy.isElite) {
      enemy.health = (enemy.health || 1) + 2;
      enemy.points = Math.floor((enemy.points || 10) * 1.5);
    }
    
    // All enemies get spawn invulnerability (3 seconds)
    if (!enemy.spawnInvulnerable) {
      enemy.spawnInvulnerable = true;
      enemy.spawnInvulnerableTimer = 180; // 3 seconds at 60fps
    }
    
    enemiesRef.current.push(enemy);
  }, []);

  // Spawn a formation group of enemies
  const spawnFormation = useCallback(() => {
    const patternKeys = Object.keys(FORMATION_PATTERNS);
    const patternKey = patternKeys[Math.floor(Math.random() * patternKeys.length)];
    const pattern = FORMATION_PATTERNS[patternKey];
    
    const groupId = nextFormationIdRef.current++;
    const baseY = 80 + Math.random() * (GAME_HEIGHT - 160); // Keep formation on screen
    const waveNum = waveRef.current;
    
    // Create the formation group
    formationsRef.current[groupId] = {
      pattern: patternKey,
      name: pattern.name,
      bonus: pattern.bonus + (waveNum * 50), // Bonus scales with wave
      color: pattern.color,
      totalCount: pattern.positions.length,
      aliveCount: pattern.positions.length
    };
    
    // Spawn each enemy in the formation
    pattern.positions.forEach((pos, index) => {
      // Formation enemies share polarity (either all light or all dark)
      const formationPolarity = Math.random() > 0.5 ? 'light' : 'dark';
      const enemy = {
        x: GAME_WIDTH + pos.x,
        y: Math.max(20, Math.min(GAME_HEIGHT - 40, baseY + pos.y)),
        type: 'formation',
        health: 1,
        lastShot: Date.now() + 1000 + Math.random() * 500,
        fromBehind: false,
        speed: ENEMY_SPEED * 0.8, // Formations move slightly slower to keep shape
        points: 15,
        canShoot: index === 0, // Only leader can shoot
        formationId: groupId,
        formationIndex: index,
        formationOffset: pos, // Keep track of relative position
        polarity: formationPolarity,
        spawnInvulnerable: true,
        spawnInvulnerableTimer: 180 // 3 seconds at 60fps
      };
      
      enemiesRef.current.push(enemy);
    });
  }, []);

  // Spawn a flyby formation - enemies that animate in before attacking
  const spawnFlybyFormation = useCallback(() => {
    const patternKeys = Object.keys(FLYBY_PATTERNS);
    const patternKey = patternKeys[Math.floor(Math.random() * patternKeys.length)];
    const pattern = FLYBY_PATTERNS[patternKey];
    
    const groupId = `flyby_${Date.now()}`;
    const waveNum = waveRef.current;
    const formationPolarity = Math.random() > 0.5 ? 'light' : 'dark';
    
    // Create the flyby group
    const flybyGroup = {
      id: groupId,
      pattern: patternKey,
      name: pattern.name,
      bonus: pattern.bonus + (waveNum * 30),
      color: pattern.color,
      enemies: [],
      totalCount: pattern.enemyCount,
      aliveCount: pattern.enemyCount,
      phase: 'entering', // entering' | attacking'
      attackTimer: 0
    };
    
    // Create enemies with path data
    for (let i = 0; i < pattern.enemyCount; i++) {
      const pathData = pattern.getPath(i, pattern.enemyCount);
      
      const enemy = {
        x: pathData.startX || GAME_WIDTH + 50,
        y: pathData.startY || GAME_HEIGHT / 2,
        type: 'flyby',
        health: 1 + Math.floor(waveNum / 5), // Health scales with wave
        lastShot: Date.now() + 5000, // Won't shoot during flyby
        fromBehind: false,
        speed: 0, // Movement controlled by path
        points: 20,
        canShoot: false, // Disabled during flyby
        flybyGroupId: groupId,
        flybyIndex: i,
        pathData: pathData,
        pathProgress: -i * pattern.spacing, // Stagger start times
        pathDuration: pattern.duration,
        attackDelay: pattern.attackDelay,
        polarity: formationPolarity,
        invincible: true, // Invincible during flyby animation
        glowColor: pattern.color,
        spawnInvulnerable: true,
        spawnInvulnerableTimer: 180 // 3 seconds at 60fps
      };
      
      flybyGroup.enemies.push(enemy);
      enemiesRef.current.push(enemy);
    }
    
    flybyFormationsRef.current.push(flybyGroup);
    
    // Announce the formation
    floatingTextsRef.current.push({
      x: GAME_WIDTH / 2,
      y: 80,
      text: pattern.name,
      color: pattern.color,
      lifetime: 90,
      vy: -0.5,
      scale: 1.3
    });
  }, []);

  // Mini-boss enemy types for variety
  const MINI_BOSS_TYPES = {
    gunship: {
      name: 'GUNSHIP',
      color: '#ff4400',
      health: 15,
      points: 200,
      width: 80,
      height: 50,
      speed: 1.5,
      attackPattern: 'spread', // Fires spread shots
      description: 'Fires wide spread shots'
    },
    bomber: {
      name: 'BOMBER',
      color: '#ffaa00',
      health: 20,
      points: 250,
      width: 90,
      height: 60,
      speed: 1.0,
      attackPattern: 'bombs', // Drops bombs that explode
      description: 'Drops explosive bombs'
    },
    hunter: {
      name: 'HUNTER',
      color: '#ff00ff',
      health: 12,
      points: 180,
      width: 60,
      height: 45,
      speed: 2.5,
      attackPattern: 'chase', // Fast, homes in on player
      description: 'Aggressively pursues player'
    },
    sentinel: {
      name: 'SENTINEL',
      color: '#00ffff',
      health: 25,
      points: 300,
      width: 70,
      height: 70,
      speed: 0.8,
      attackPattern: 'laser', // Fires laser beams
      description: 'Fires piercing laser beams'
    },
    swarm: {
      name: 'SWARM LORD',
      color: '#88ff00',
      health: 18,
      points: 350,
      width: 85,
      height: 55,
      speed: 1.2,
      attackPattern: 'spawn', // Spawns small drones
      description: 'Spawns drone swarms'
    },
    // New mini-boss types for variety
    sniper: {
      name: 'DEADEYE',
      color: '#ff0088',
      health: 14,
      points: 220,
      width: 75,
      height: 40,
      speed: 1.8,
      attackPattern: 'snipe', // Locks on then fires precise shots
      description: 'Locks onto player, fires precise shots'
    },
    juggernaut: {
      name: 'JUGGERNAUT',
      color: '#888888',
      health: 35,
      points: 400,
      width: 100,
      height: 80,
      speed: 0.5,
      attackPattern: 'barrage', // Slow but fires massive volleys
      description: 'Slow tank, massive bullet volleys'
    },
    phantom: {
      name: 'PHANTOM',
      color: '#9966ff',
      health: 10,
      points: 280,
      width: 65,
      height: 50,
      speed: 2.0,
      attackPattern: 'teleport', // Teleports around, fires from multiple positions
      description: 'Teleports and ambushes'
    },
    pulsar: {
      name: 'PULSAR',
      color: '#ffff00',
      health: 16,
      points: 260,
      width: 70,
      height: 70,
      speed: 1.0,
      attackPattern: 'pulse', // Fires expanding ring shots
      description: 'Fires expanding pulse rings'
    },
    berserker: {
      name: 'BERSERKER',
      color: '#ff2200',
      health: 22,
      points: 320,
      width: 85,
      height: 55,
      speed: 1.3,
      attackPattern: 'berserk', // Gets faster and more aggressive as health drops
      description: 'Enrages when damaged'
    }
  };

  // Mini-boss modifiers that add variety to each encounter
  const MINI_BOSS_MODIFIERS = {
    armored: {
      name: 'ARMORED',
      color: '#aaaaaa',
      healthMult: 1.5,
      speedMult: 0.8,
      pointsMult: 1.3,
      effect: 'armor' // Takes reduced damage
    },
    swift: {
      name: 'SWIFT',
      color: '#00ff88',
      healthMult: 0.8,
      speedMult: 1.6,
      pointsMult: 1.2,
      effect: 'speed' // Faster attacks
    },
    shielded: {
      name: 'SHIELDED',
      color: '#00aaff',
      healthMult: 1.0,
      speedMult: 1.0,
      pointsMult: 1.4,
      effect: 'shield' // Has regenerating shield
    },
    enraged: {
      name: 'ENRAGED',
      color: '#ff0000',
      healthMult: 0.9,
      speedMult: 1.2,
      pointsMult: 1.25,
      effect: 'rage' // Attacks faster, more bullets
    },
    phasing: {
      name: 'PHASING',
      color: '#cc88ff',
      healthMult: 0.85,
      speedMult: 1.0,
      pointsMult: 1.35,
      effect: 'phase' // Periodically becomes invulnerable
    },
    vampiric: {
      name: 'VAMPIRIC',
      color: '#880000',
      healthMult: 1.1,
      speedMult: 1.0,
      pointsMult: 1.4,
      effect: 'vampire' // Heals when hitting player
    }
  };

  // Spawn a mini-boss (elite enemy mid-wave)
  const spawnMiniBoss = useCallback(() => {
    const waveNum = waveRef.current;
    const typeKeys = Object.keys(MINI_BOSS_TYPES);
    const typeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
    const mbType = MINI_BOSS_TYPES[typeKey];
    
    // Chance for modifier increases with wave (30% at wave 3, up to 80% at wave 10+)
    const modifierChance = Math.min(0.8, 0.3 + (waveNum - 2) * 0.06);
    const hasModifier = waveNum >= 4 && Math.random() < modifierChance;
    const modifierKeys = Object.keys(MINI_BOSS_MODIFIERS);
    const modifierKey = hasModifier ? modifierKeys[Math.floor(Math.random() * modifierKeys.length)] : null;
    const modifier = modifierKey ? MINI_BOSS_MODIFIERS[modifierKey] : null;
    
    // Scale with wave
    const healthScale = 1 + (waveNum - 2) * 0.15; // Starts at wave 2
    const pointsScale = 1 + (waveNum - 2) * 0.1;
    
    // Apply modifier multipliers
    const modHealthMult = modifier ? modifier.healthMult : 1;
    const modSpeedMult = modifier ? modifier.speedMult : 1;
    const modPointsMult = modifier ? modifier.pointsMult : 1;
    
    const finalHealth = Math.floor(mbType.health * healthScale * modHealthMult);
    const finalSpeed = mbType.speed * modSpeedMult;
    const finalPoints = Math.floor(mbType.points * pointsScale * modPointsMult);
    
    // Determine display name and color
    const displayName = modifier ? `${modifier.name} ${mbType.name}` : mbType.name;
    const displayColor = modifier ? modifier.color : mbType.color;
    
    const miniBoss = {
      x: GAME_WIDTH + 20,
      y: GAME_HEIGHT / 2 - mbType.height / 2,
      targetY: GAME_HEIGHT / 2 - mbType.height / 2,
      width: mbType.width,
      height: mbType.height,
      health: finalHealth,
      maxHealth: finalHealth,
      points: finalPoints,
      type: typeKey,
      name: displayName,
      baseColor: mbType.color,
      color: displayColor,
      speed: finalSpeed,
      attackPattern: mbType.attackPattern,
      polarity: Math.random() > 0.5 ? 'light' : 'dark',
      entered: false,
      phaseTimer: 0,
      lastShot: Date.now(),
      attackCooldown: modifier?.effect === 'rage' ? 500 : 800, // Enraged attacks faster
      spawnedDrones: [], // For swarm type
      warningTimer: 60, // Flash warning before appearing
      // Modifier properties
      modifier: modifierKey,
      modifierEffect: modifier?.effect || null,
      armorReduction: modifier?.effect === 'armor' ? 0.5 : 0, // 50% damage reduction
      modShield: modifier?.effect === 'shield' ? 30 : 0,
      modShieldMax: modifier?.effect === 'shield' ? 30 : 0,
      modShieldRegenDelay: 0,
      phaseInvulnTimer: 0, // For phasing modifier
      phaseInvulnCooldown: 0,
      vampireHealAmount: modifier?.effect === 'vampire' ? 2 : 0,
      // Type-specific properties
      sniperLockTimer: 0, // For snipe attack
      sniperLocked: false,
      sniperTargetX: 0,
      sniperTargetY: 0,
      teleportCooldown: 0, // For phantom
      teleportFlashTimer: 0,
      pulsePhase: 0, // For pulsar
      berserkMultiplier: 1, // For berserker - increases as health drops
      barragePhase: 0, // For juggernaut
      // Regeneration properties
      regenerating: false,
      regenTimer: 0,
      regenDuration: 600, // 10 seconds at 60fps
      regenShield: 0,
      regenShieldMax: 50,
      hasRegenerated: false,
      regenThreshold: 0.35, // Trigger regen at 35% health
      regenSpawnedSnipers: 0,
      regenSpawnedSentinel: false,
      regenSpawnedShielder: false
    };
    
    miniBossRef.current = miniBoss;
    miniBossSpawnedRef.current = true;
    
    // Show mini-boss name with modifier
    floatingTextsRef.current.push({
      x: GAME_WIDTH - 120,
      y: 60,
      text: displayName,
      color: displayColor,
      lifetime: 120,
      vy: 0,
      scale: 1.2
    });
  }, []);

  // Gamepad vibration helper
  const triggerGamepadVibration = useCallback((weak = 0.5, strong = 0.5, duration = 100) => {
    const gamepad = gamepadRef.current;
    if (gamepad?.vibrationActuator) {
      gamepad.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: duration,
        weakMagnitude: Math.min(1, weak),
        strongMagnitude: Math.min(1, strong)
      }).catch(() => {}); // Silently fail if vibration not supported
    }
  }, []);

  // Main game loop and rendering effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const render = (ctx, timestamp) => {
      // DEBUG: Log render call to verify new code is running
      if (Math.random() < 0.01) { // Log 1% of frames to avoid spam
      }
      
      // Apply screen shake
      ctx.save();
      if (screenShakeRef.current.duration > 0) {
        const shake = screenShakeRef.current;
        const offsetX = (Math.random() - 0.5) * shake.intensity * 2;
        const offsetY = (Math.random() - 0.5) * shake.intensity * 2;
        ctx.translate(offsetX, offsetY);
        shake.duration--;
        shake.intensity *= 0.9; // Decay intensity
      }
      
      // Clear canvas
      ctx.fillStyle = '#0a0a20';
      ctx.fillRect(-10, -10, GAME_WIDTH + 20, GAME_HEIGHT + 20);

      // Draw parallax stars (layered) - optimized
      const perfMode = userSettingsRef.current?.performanceMode;
      starsRef.current.forEach(star => {
        if (star.layer === 'near') {
          // Near stars - draw as streaks
          ctx.globalAlpha = star.brightness;
          if (perfMode) {
            // Performance mode: simple rectangle, no gradient
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(star.x, star.y, star.length, star.size * 0.6);
          } else {
            // Quality mode: use gradient (creates new one each frame due to x position change)
            const gradient = ctx.createLinearGradient(star.x, star.y, star.x + star.length, star.y);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(star.x, star.y, star.length, star.size * 0.6);
          }
        } else if (star.layer === 'mid') {
          // Mid layer - regular stars with slight twinkle
          if (perfMode) {
            // Performance mode: skip twinkle calculation
            ctx.globalAlpha = star.brightness;
          } else {
            const twinkle = 0.9 + Math.sin(timestamp * 0.005 + star.x) * 0.1;
            ctx.globalAlpha = star.brightness * twinkle;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(star.x, star.y, star.size, star.size);
        } else {
          // Far layer - dim, small dots
          ctx.globalAlpha = star.brightness;
          ctx.fillStyle = '#8888aa';
          ctx.fillRect(star.x, star.y, star.size, star.size);
        }
      });
      ctx.globalAlpha = 1;
      
      // ========== DRAW ENVIRONMENTAL HAZARDS ==========
      const hazards = hazardsRef.current;
      
      // Draw gravity wells (behind everything)
      hazards.gravityWells.forEach(well => {
        // Guard against non-finite values
        if (!isFinite(well.x) || !isFinite(well.y) || !isFinite(well.radius) || well.radius <= 0) return;
        
        ctx.save();
        
        const pulse = Math.sin(well.pulsePhase) * 0.3 + 0.7;
        
        if (perfMode) {
          // Performance mode: simplified gravity well rendering
          // Single ring instead of 3
          ctx.globalAlpha = 0.3 * pulse;
          ctx.strokeStyle = '#aa00ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(well.x, well.y, well.radius * 0.8, 0, Math.PI * 2);
          ctx.stroke();
          
          // Simple core
          ctx.globalAlpha = 0.6 * pulse;
          ctx.fillStyle = '#220044';
          ctx.beginPath();
          ctx.arc(well.x, well.y, well.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
          
          // Center
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(well.x, well.y, well.radius * 0.15, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Quality mode: full effects
          // Outer distortion ring
          for (let ring = 3; ring >= 1; ring--) {
            const ringRadius = well.radius * (0.5 + ring * 0.3);
            const ringAlpha = 0.15 * pulse / ring;
            
            ctx.globalAlpha = ringAlpha;
            ctx.strokeStyle = `hsl(${270 + ring * 20}, 80%, 50%)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(well.x, well.y, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
          
          // Core gradient
          const safeRadius = Math.max(1, well.radius);
          const gradient = ctx.createRadialGradient(well.x, well.y, 0, well.x, well.y, safeRadius);
          gradient.addColorStop(0, `rgba(20, 0, 50, ${0.9 * pulse})`);
          gradient.addColorStop(0.3, `rgba(80, 0, 120, ${0.5 * pulse})`);
          gradient.addColorStop(0.6, `rgba(100, 50, 150, ${0.2 * pulse})`);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.globalAlpha = 1;
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Swirling particles effect
          ctx.globalAlpha = 0.7 * pulse;
          for (let i = 0; i < 8; i++) {
            const angle = well.pulsePhase * 2 + (i / 8) * Math.PI * 2;
            const dist = well.radius * 0.4 + Math.sin(well.pulsePhase * 3 + i) * well.radius * 0.2;
            const px = well.x + Math.cos(angle) * dist;
            const py = well.y + Math.sin(angle) * dist;
            
            ctx.fillStyle = '#aa66ff';
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Center singularity
          ctx.globalAlpha = 1;
          ctx.shadowColor = '#8800ff';
          ctx.shadowBlur = 20 * pulse;
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(well.x, well.y, well.radius * 0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        
        // Warning indicator (always show)
        ctx.fillStyle = '#ff00ff';
        ctx.font = "8px \"Press Start 2P\", monospace";
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(well.pulsePhase * 3);
        ctx.fillText('GRAVITY', well.x, well.y - well.radius - 10);
        
        ctx.restore();
      });
      
      // Draw laser barriers
      hazards.laserBarriers.forEach(barrier => {
        ctx.save();
        
        const barrierX = GAME_WIDTH - barrier.width;
        
        if (barrier.warningTimer > 0) {
          // Warning indicator
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(barrier.warningTimer * 0.3);
          ctx.fillStyle = '#ff0000';
          ctx.font = "10px \"Press Start 2P\", monospace";
          ctx.textAlign = 'center';
          ctx.fillText('? LASER ?', GAME_WIDTH - 60, barrier.y - 15);
          
          // Warning line
          ctx.strokeStyle = '#ff4444';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(GAME_WIDTH - 120, barrier.y);
          ctx.lineTo(GAME_WIDTH, barrier.y);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (barrier.width > 0) {
          // Laser beam
          const beamHeight = barrier.active ? 8 : 4;
          
          // Outer glow
          ctx.shadowColor = barrier.active ? '#ff0000' : '#ff6600';
          ctx.shadowBlur = barrier.active ? 25 : 15;
          
          // Beam gradient
          const beamGrad = ctx.createLinearGradient(barrierX, barrier.y, GAME_WIDTH, barrier.y);
          beamGrad.addColorStop(0, 'rgba(255,0,0,0)');
          beamGrad.addColorStop(0.1, barrier.active ? '#ff0000' : '#ff6600');
          beamGrad.addColorStop(0.9, barrier.active ? '#ff4444' : '#ffaa00');
          beamGrad.addColorStop(1, barrier.active ? '#ffffff' : '#ffff00');
          
          ctx.fillStyle = beamGrad;
          ctx.fillRect(barrierX, barrier.y - beamHeight / 2, barrier.width, beamHeight);
          
          // Core
          if (barrier.active) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(barrierX + barrier.width * 0.1, barrier.y - 1, barrier.width * 0.8, 2);
          }
          
          // Emitter at edge
          ctx.fillStyle = '#444444';
          ctx.fillRect(GAME_WIDTH - 10, barrier.y - 15, 10, 30);
          ctx.fillStyle = barrier.active ? '#ff0000' : '#ff6600';
          ctx.beginPath();
          ctx.arc(GAME_WIDTH - 5, barrier.y, 8, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.shadowBlur = 0;
        }
        
        ctx.restore();
      });
      
      // Draw asteroids
      hazards.asteroids.forEach(asteroid => {
        // Guard against non-finite values
        if (!isFinite(asteroid.x) || !isFinite(asteroid.y) || !isFinite(asteroid.size) || asteroid.size <= 0) return;
        
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation);
        
        // Giant asteroid warning glow
        if (asteroid.isGiant) {
          ctx.globalAlpha = 0.3;
          const glowGradient = ctx.createRadialGradient(0, 0, asteroid.size * 0.8, 0, 0, asteroid.size * 1.3);
          glowGradient.addColorStop(0, 'rgba(255, 100, 0, 0.3)');
          glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(0, 0, asteroid.size * 1.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        
        // Asteroid body - irregular polygon
        const numPoints = asteroid.isGiant ? 12 : 8;
        const points = [];
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          // Use asteroid's rotation as seed for consistent shape
          const variation = 0.7 + Math.sin(angle * 3 + asteroid.rotationSpeed * 100) * 0.3;
          const r = asteroid.size * variation;
          points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
        }
        
        // Shadow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(points[0].x + 4, points[0].y + 4);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x + 4, points[i].y + 4);
        }
        ctx.closePath();
        ctx.fill();
        
        // Main body gradient
        ctx.globalAlpha = 1;
        const gradient = ctx.createRadialGradient(-asteroid.size * 0.3, -asteroid.size * 0.3, 0, 0, 0, asteroid.size);
        if (asteroid.isGiant) {
          // Darker, more menacing colors for giant asteroids
          gradient.addColorStop(0, '#997755');
          gradient.addColorStop(0.5, '#664433');
          gradient.addColorStop(1, '#442211');
        } else {
          gradient.addColorStop(0, '#888888');
          gradient.addColorStop(0.5, '#555555');
          gradient.addColorStop(1, '#333333');
        }
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Edge highlight
        ctx.strokeStyle = asteroid.isGiant ? '#886644' : '#666666';
        ctx.lineWidth = asteroid.isGiant ? 3 : 2;
        ctx.stroke();
        
        // Craters (more for giant asteroids)
        ctx.fillStyle = asteroid.isGiant ? '#1a1108' : '#2a2a2a';
        ctx.beginPath();
        ctx.arc(-asteroid.size * 0.2, asteroid.size * 0.1, asteroid.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(asteroid.size * 0.3, -asteroid.size * 0.2, asteroid.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        if (asteroid.isGiant) {
          ctx.beginPath();
          ctx.arc(-asteroid.size * 0.15, -asteroid.size * 0.25, asteroid.size * 0.18, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(asteroid.size * 0.1, asteroid.size * 0.25, asteroid.size * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Health indicator for damaged asteroids
        const maxHealth = asteroid.isGiant ? Math.floor(asteroid.size / 5) + 10 : Math.floor(asteroid.size / 10) + 1;
        if (asteroid.health < maxHealth) {
          ctx.fillStyle = '#ff6600';
          const crackCount = maxHealth - asteroid.health;
          for (let i = 0; i < crackCount; i++) {
            ctx.strokeStyle = asteroid.isGiant ? '#ff8800' : '#ff4400';
            ctx.lineWidth = asteroid.isGiant ? 2 : 1;
            ctx.beginPath();
            const startAngle = (i / crackCount) * Math.PI * 2;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(startAngle) * asteroid.size * 0.8, Math.sin(startAngle) * asteroid.size * 0.8);
            ctx.stroke();
          }
        }
        
        ctx.restore();
      });

      // Draw explosions
      explosionsRef.current.forEach(explosion => {
        // Guard against non-finite coordinates
        if (!isFinite(explosion.x) || !isFinite(explosion.y)) return;
        
        // Calculate lifetime progress for animations
        const age = (Date.now() - (explosion.startTime || Date.now())) / 16.67; // frames at 60fps
        const maxLifetime = explosion.maxLifetime || 30;
        const remainingLifetime = Math.max(0, maxLifetime - age);
        const alpha = remainingLifetime / maxLifetime;
        
        // Handle sprite-based explosions
        if (explosion.isSprite && explosionSpriteRef.current) {
          const sprite = explosionSpriteRef.current;
          const frameWidth = sprite.width / explosion.totalFrames;
          const frameHeight = sprite.height;
          const currentFrame = Math.min(Math.floor(age / (explosion.frameDelay || 3)), explosion.totalFrames - 1);
          const srcX = currentFrame * frameWidth;
          const srcY = 0;
          const destSize = explosion.spriteSize;
          
          ctx.save();
          
          // Add screen flash for big explosions
          if (explosion.spriteSize > 100 && currentFrame < 2) {
            ctx.globalAlpha = 0.15 * (1 - currentFrame / 2);
            ctx.fillStyle = '#ffff88';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
          }
          
          // Add expanding shockwave ring for large explosions
          if (explosion.spriteSize > 80 && currentFrame < 5 && !perfMode) {
            const shockwaveProgress = currentFrame / 5;
            const shockwaveRadius = destSize * 0.3 + (destSize * 0.8 * shockwaveProgress);
            ctx.save();
            ctx.globalAlpha = (1 - shockwaveProgress) * 0.6;
            ctx.strokeStyle = explosion.spriteSize > 150 ? '#ffaa00' : '#ff6600';
            ctx.lineWidth = 4 - (shockwaveProgress * 3);
            ctx.shadowColor = '#ff8800';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, shockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
          
          // Add glow/heat distortion effect behind sprite
          if (!perfMode && currentFrame < 6) {
            const glowSize = destSize * (1 + currentFrame * 0.15);
            const glowAlpha = (6 - currentFrame) / 6 * 0.4;
            ctx.save();
            const gradient = ctx.createRadialGradient(
              explosion.x, explosion.y, 0,
              explosion.x, explosion.y, glowSize * 0.6
            );
            gradient.addColorStop(0, `rgba(255, 220, 100, ${glowAlpha})`);
            gradient.addColorStop(0.3, `rgba(255, 140, 40, ${glowAlpha * 0.7})`);
            gradient.addColorStop(0.6, `rgba(255, 80, 0, ${glowAlpha * 0.4})`);
            gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, glowSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          
          // Draw sprite - centered and clean
          ctx.save();
          ctx.globalAlpha = 1;
          
          // Draw sprite centered at explosion position
          ctx.drawImage(
            sprite,
            srcX, srcY, frameWidth, frameHeight,
            explosion.x - destSize / 2, explosion.y - destSize / 2,
            destSize, destSize
          );
          
          ctx.restore(); // Restore main context
          return; // Skip particle rendering for sprite explosions
        }
        
        // Draw shockwave ring for larger explosions
        if (!perfMode && (explosion.isMissileExplosion || explosion.isPlayerExplosion)) {
          const ringProgress = 1 - alpha;
          const ringRadius = 20 + ringProgress * 40;
          ctx.save();
          ctx.globalAlpha = alpha * 0.6;
          ctx.strokeStyle = explosion.isMissileExplosion ? '#ff8844' : '#44aaff';
          ctx.lineWidth = 3 - ringProgress * 2;
          ctx.beginPath();
          ctx.arc(explosion.x, explosion.y, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        
        // Draw missile explosion glow (skip complex gradient in performance mode)
        if (explosion.isMissileExplosion && explosion.lifetime > 20 && !perfMode) {
          const glowSize = 30 + (45 - explosion.lifetime) * 2;
          const glowAlpha = (explosion.lifetime - 20) / 25;
          const gradient = ctx.createRadialGradient(
            explosion.x, explosion.y, 0,
            explosion.x, explosion.y, glowSize
          );
          gradient.addColorStop(0, `rgba(255, 220, 150, ${glowAlpha * 0.9})`);
          gradient.addColorStop(0.2, `rgba(255, 180, 80, ${glowAlpha * 0.7})`);
          gradient.addColorStop(0.4, `rgba(255, 100, 0, ${glowAlpha * 0.5})`);
          gradient.addColorStop(0.7, `rgba(255, 50, 0, ${glowAlpha * 0.2})`);
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(explosion.x, explosion.y, glowSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Draw smoke particles first (behind fire)
        explosion.particles.forEach(p => {
          if (p.isSmoke) {
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(explosion.x + p.x, explosion.y + p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        
        // Draw fire/normal particles with enhanced glow
        explosion.particles.forEach(p => {
          if (!p.isSmoke) {
            ctx.globalAlpha = alpha;
            
            // Add glow for all explosions (skip in performance mode)
            if (!perfMode) {
              ctx.shadowColor = p.color;
              ctx.shadowBlur = explosion.isMissileExplosion ? 12 : 6;
            }
            
            // Animated particle size
            const sizeMultiplier = 0.5 + alpha * 0.5;
            const particleSize = p.size * sizeMultiplier;
            
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(explosion.x + p.x, explosion.y + p.y, particleSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner bright core for larger particles
            if (particleSize > 3 && alpha > 0.5) {
              ctx.globalAlpha = alpha * 0.8;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(explosion.x + p.x, explosion.y + p.y, particleSize * 0.4, 0, Math.PI * 2);
              ctx.fill();
            }
            
            ctx.shadowBlur = 0;
          }
        });
      });
      ctx.globalAlpha = 1;

      // Draw pickup effects
      pickupEffectsRef.current.forEach(effect => {
        ctx.globalAlpha = effect.lifetime / 25;
        
        if (effect.type === 'flash') {
          // Screen flash effect for legendary pickups
          ctx.globalAlpha = effect.lifetime / 10 * 0.3;
          ctx.fillStyle = effect.color;
          ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        } else if (effect.type === 'ring') {
          // Expanding ring
          ctx.strokeStyle = effect.color;
          ctx.lineWidth = 3;
          ctx.shadowColor = effect.color;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (effect.type === 'sparkle') {
          // Sparkle particles
          ctx.fillStyle = effect.color;
          ctx.shadowColor = effect.color;
          ctx.shadowBlur = 10;
          
          // Draw star shape
          ctx.save();
          ctx.translate(effect.x, effect.y);
          ctx.rotate(effect.lifetime * 0.2);
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * effect.size, Math.sin(angle) * effect.size);
          }
          ctx.stroke();
          ctx.restore();
          ctx.shadowBlur = 0;
        } else if (effect.type === 'debris') {
          // Flying debris particles
          ctx.save();
          ctx.translate(effect.x, effect.y);
          ctx.rotate(effect.rotation || 0);
          ctx.fillStyle = effect.color;
          ctx.shadowColor = effect.color;
          ctx.shadowBlur = 5;
          
          // Draw irregular debris shape
          ctx.beginPath();
          const size = effect.size;
          ctx.moveTo(-size, -size * 0.5);
          ctx.lineTo(size * 0.5, -size);
          ctx.lineTo(size, size * 0.3);
          ctx.lineTo(-size * 0.3, size);
          ctx.closePath();
          ctx.fill();
          
          ctx.shadowBlur = 0;
          ctx.restore();
        } else if (effect.type === 'spark') {
          // Spark particles with trail
          ctx.strokeStyle = effect.color;
          ctx.lineWidth = effect.size;
          ctx.lineCap = 'round';
          ctx.shadowColor = '#ffff88';
          ctx.shadowBlur = 8;
          
          // Draw trail
          if (effect.trail && effect.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(effect.trail[0].x, effect.trail[0].y);
            for (let i = 1; i < effect.trail.length; i++) {
              ctx.lineTo(effect.trail[i].x, effect.trail[i].y);
            }
            ctx.lineTo(effect.x, effect.y);
            ctx.stroke();
          }
          
          // Draw spark head
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (effect.type === 'ember') {
          // Floating ember particles with glow
          const flickerAlpha = 0.7 + Math.sin(effect.flicker * 3) * 0.3;
          ctx.globalAlpha = (effect.lifetime / 40) * flickerAlpha;
          ctx.fillStyle = effect.color;
          ctx.shadowColor = effect.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
      ctx.globalAlpha = 1;

      // Draw floating texts
      floatingTextsRef.current.forEach(text => {
        // Fade based on remaining lifetime - full fade over entire lifetime for smoother effect
        const fadeStart = text.flash ? 90 : 30; // Flash warnings fade over longer period
        let alpha = Math.min(1, text.lifetime / fadeStart);
        
        // Flash effect for danger warnings
        if (text.flash) {
          alpha *= (Math.sin(Date.now() / 100) + 1) / 2 * 0.5 + 0.5; // Pulsing flash
        }
        
        ctx.globalAlpha = alpha;
        
        // Scale for rare/legendary pickups
        const textScale = text.scale || 1;
        const fontSize = Math.floor(14 * textScale);
        
        ctx.save();
        ctx.translate(text.x, text.y);
        ctx.scale(textScale, textScale);
        
        ctx.fillStyle = text.color;
        ctx.font = `bold ${fontSize}px "Press Start 2P", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text shadow/glow - stronger for scaled text
        ctx.shadowColor = text.color;
        ctx.shadowBlur = 10 * textScale;
        ctx.fillText(text.text, 0, 0);
        
        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeText(text.text, 0, 0);
        ctx.shadowBlur = 0;
        
        ctx.restore();
      });
      ctx.globalAlpha = 1;
      
      // Draw formation bonus texts
      formationBonusDisplayRef.current.forEach(bonus => {
        const alpha = Math.min(1, bonus.timer / 30);
        const scale = 1 + (90 - bonus.timer) * 0.005; // Grow slightly as it fades
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(bonus.x, bonus.y);
        ctx.scale(scale, scale);
        
        // Glowing background effect
        ctx.shadowColor = bonus.color;
        ctx.shadowBlur = 15;
        
        // Main text
        ctx.font = "bold 12px \"Press Start 2P\", monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = bonus.color;
        ctx.fillText(bonus.text, 0, 0);
        
        // White outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeText(bonus.text, 0, 0);
        
        ctx.restore();
      });
      
      // Draw mini-boss warning
      if (miniBossRef.current && miniBossRef.current.warningTimer > 0) {
        const mb = miniBossRef.current;
        const alpha = 0.5 + 0.5 * Math.sin(mb.warningTimer * 0.3);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Warning background flash
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.15})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Warning text
        ctx.shadowColor = mb.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = mb.color;
        ctx.font = "bold 24px \"Press Start 2P\", monospace";
        ctx.textAlign = 'center';
        ctx.fillText('? ELITE INCOMING ?', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
        
        ctx.font = "bold 18px \"Press Start 2P\", monospace";
        ctx.fillStyle = '#ffffff';
        ctx.fillText(mb.name, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
        
        ctx.restore();
      }

      // Draw power-ups with enhanced visuals based on rarity
      powerupsRef.current.forEach(powerup => {
        // Skip invalid powerups
        if (!isFinite(powerup.x) || !isFinite(powerup.y)) return;
        
        // Use elapsed time for smooth animation independent of update loop
        const elapsedTime = (Date.now() - (powerup.spawnTime || Date.now())) / 1000;
        const bobY = powerup.y + Math.sin((powerup.bobOffset || 0) + elapsedTime * 2) * 5;
        const config = POWERUP_TYPES[powerup.type];
        if (!config) return; // Skip invalid power-ups
        
        const isRare = config.rarity === 'rare';
        const isLegendary = config.rarity === 'legendary';
        const isUltra = config.rarity === 'ultra';
        const cx = powerup.x + POWERUP_SIZE / 2;
        const cy = bobY + POWERUP_SIZE / 2;
        const time = Date.now() / 1000;
        const rotation = elapsedTime * 0.8; // Continuous rotation based on time alive
        
        ctx.save();
        ctx.translate(cx, cy);
        
        // Particle trail for rare/legendary/ultra
        if (isRare || isLegendary || isUltra) {
          const trailCount = isUltra ? 12 : isLegendary ? 6 : 3;
          for (let i = 0; i < trailCount; i++) {
            const trailAngle = time * (isUltra ? 5 : 3) + (i * Math.PI * 2 / trailCount);
            const trailDist = (isUltra ? 18 : 12) + Math.sin(time * 5 + i) * 3;
            ctx.globalAlpha = isUltra ? 0.6 : 0.4;
            ctx.fillStyle = isUltra ? (i % 3 === 0 ? '#ff00ff' : i % 3 === 1 ? '#00ffff' : '#ffff00') : 
                           isLegendary ? '#ffff00' : config.glowColor;
            ctx.beginPath();
            ctx.arc(
              Math.cos(trailAngle) * trailDist,
              Math.sin(trailAngle) * trailDist,
              isUltra ? 3 : 2, 0, Math.PI * 2
            );
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        
        // Outer glow - more intense for rare/legendary/ultra
        const glowSize = isUltra ? 35 : isLegendary ? 25 : isRare ? 20 : 15;
        ctx.shadowColor = isUltra ? '#ff00ff' : (config.glowColor || config.color);
        ctx.shadowBlur = glowSize;
        
        // Draw shape based on rarity
        ctx.rotate(rotation);
        
        if (isUltra) {
          // Multi-layered star burst for ultra
          const pulseScale = 1 + Math.sin(time * 6) * 0.1;
          
          // Outer ring
          ctx.strokeStyle = '#ff00ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, (POWERUP_SIZE / 2 + 8) * pulseScale, 0, Math.PI * 2);
          ctx.stroke();
          
          // Rainbow outer star
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, POWERUP_SIZE / 2 + 4);
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.3, config.color);
          gradient.addColorStop(0.7, '#ff00ff');
          gradient.addColorStop(1, '#00ffff');
          ctx.fillStyle = gradient;
          
          ctx.beginPath();
          const points = 8;
          const outerR = (POWERUP_SIZE / 2 + 4) * pulseScale;
          const innerR = POWERUP_SIZE / 3;
          for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fill();
          
          // Bright core
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, POWERUP_SIZE / 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (isLegendary) {
          // Star shape for legendary
          ctx.fillStyle = config.color;
          ctx.beginPath();
          const points = 6;
          const outerR = POWERUP_SIZE / 2 + 2;
          const innerR = POWERUP_SIZE / 4;
          for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fill();
          
          // Inner bright core
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, POWERUP_SIZE / 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (isRare) {
          // Hexagon for rare
          ctx.fillStyle = config.color;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3) - Math.PI / 6;
            const r = POWERUP_SIZE / 2;
            if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fill();
          
          // Inner hexagon
          ctx.shadowBlur = 0;
          ctx.fillStyle = config.glowColor || config.color;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3);
            const r = POWERUP_SIZE / 3;
            if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          // Circle for common
          ctx.fillStyle = config.color;
          ctx.beginPath();
          ctx.arc(0, 0, POWERUP_SIZE / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Pulsing outline for all
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1 + Math.sin(time * 4) * 0.5;
        ctx.globalAlpha = 0.5 + Math.sin(time * 4) * 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, POWERUP_SIZE / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        ctx.restore();
        
        // Icon (not rotated)
        ctx.shadowBlur = 0;
        ctx.font = isUltra ? '18px Arial' : isLegendary ? '16px Arial' : isRare ? '15px Arial' : '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = (isUltra || isLegendary) ? '#000000' : '#ffffff';
        ctx.fillText(config.icon, cx, cy);
      });
      ctx.shadowBlur = 0;

      // Draw engine trail particles (behind player)
      const trailOpt = TRAIL_OPTIONS[shipPartsRef.current?.trail || 0] || TRAIL_OPTIONS[0];
      if (trailOpt.enabled) {
        ctx.save();
        engineTrailRef.current.forEach(p => {
          const alpha = p.lifetime / p.maxLifetime;
          const fadeAlpha = alpha > 0.7 ? 1 : alpha / 0.7; // Quick fade at end
          
          if (p.style === 'electric') {
            // Electric - jagged lightning particles with branching
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1 + alpha;
            ctx.globalAlpha = fadeAlpha * 0.9;
            if (!perfMode) {
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 10;
            }
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            const branches = 2 + Math.floor(p.size / 2);
            for (let i = 0; i < branches; i++) {
              const bx = p.x - 4 - i * 2 + Math.random() * 4;
              const by = p.y + (Math.random() - 0.5) * 6;
              ctx.lineTo(bx, by);
            }
            ctx.stroke();
          } else if (p.style === 'ice') {
            // Ice - crystalline sparkles with rotation
            ctx.globalAlpha = fadeAlpha * 0.95;
            ctx.fillStyle = p.color;
            if (!perfMode) {
              ctx.shadowColor = p.secondColor;
              ctx.shadowBlur = 8;
            }
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation || 0);
            ctx.beginPath();
            ctx.moveTo(0, -p.size);
            ctx.lineTo(p.size * 0.5, 0);
            ctx.lineTo(0, p.size);
            ctx.lineTo(-p.size * 0.5, 0);
            ctx.closePath();
            ctx.fill();
            // Add cross pattern
            ctx.globalAlpha = fadeAlpha * 0.5;
            ctx.fillRect(-p.size * 0.15, -p.size, p.size * 0.3, p.size * 2);
            ctx.fillRect(-p.size, -p.size * 0.15, p.size * 2, p.size * 0.3);
            ctx.restore();
          } else if (p.style === 'shadow') {
            // Shadow - dark fading orbs with tendrils
            ctx.globalAlpha = fadeAlpha * 0.75;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
            grad.addColorStop(0, p.color);
            grad.addColorStop(0.4, p.secondColor);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Add wispy tendrils
            if (alpha > 0.5) {
              ctx.globalAlpha = fadeAlpha * 0.4;
              for (let i = 0; i < 3; i++) {
                const angle = (p.rotation || 0) + i * Math.PI * 0.66;
                const tx = p.x + Math.cos(angle) * p.size * 1.5;
                const ty = p.y + Math.sin(angle) * p.size * 1.5;
                ctx.fillRect(tx - 0.5, ty - 0.5, 1, 1);
              }
            }
          } else if (p.style === 'stardust') {
            // Stardust - twinkling sparkles
            const twinkle = Math.sin(Date.now() / 100 + p.x + p.y) * 0.3 + 0.7;
            ctx.globalAlpha = fadeAlpha * twinkle;
            if (!perfMode) {
              ctx.shadowColor = '#ffffff';
              ctx.shadowBlur = 12;
            }
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
            // Add star points
            if (p.size > 2) {
              ctx.globalAlpha = fadeAlpha * twinkle * 0.8;
              ctx.fillStyle = p.secondColor;
              for (let i = 0; i < 4; i++) {
                const angle = i * Math.PI / 2;
                const px = p.x + Math.cos(angle) * p.size;
                const py = p.y + Math.sin(angle) * p.size;
                ctx.fillRect(px - 0.5, py - 0.5, 1, 1);
              }
            }
          } else {
            // Default (plasma, fire, rainbow, etc) - enhanced glowing orbs
            ctx.globalAlpha = fadeAlpha * 0.85;
            if (!perfMode) {
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 12;
            }
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.2);
            grad.addColorStop(0, p.secondColor || '#ffffff');
            grad.addColorStop(0.5, p.color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
            ctx.fill();
            // Add bright core
            if (p.size > 2.5 && !perfMode) {
              ctx.globalAlpha = fadeAlpha;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
        ctx.restore();
      }

      // Draw player ship
      const player = playerRef.current;
      
      // Skip rendering if player position is not valid
      if (!isFinite(player.x) || !isFinite(player.y)) return;
      
      // Player blinks when invincible
      const isInvincible = playerInvincibleRef.current > 0;
      const shouldDrawPlayer = !isInvincible || Math.floor(playerInvincibleRef.current / 5) % 2 === 0;
      
      if (shouldDrawPlayer) {
        // Reset canvas state before shield drawing
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any transforms
        
        // Draw shield if active
        if (upgradesRef.current.shield && upgradesRef.current.shieldHits > 0) {
          const shieldHits = upgradesRef.current.shieldHits;
          const shieldLevel = Math.max(1, Math.min(shieldHits, 9)); // Cap visual at 9, min 1
          const shieldScale = 1 + (shieldLevel - 1) * 0.12;
          const shieldBrightness = 0.6 + (shieldLevel / 9) * 0.4; // Increased visibility
          const pulseSpeed = 100 - shieldLevel * 5;
          const pulseTime = Date.now() / pulseSpeed;
          const shieldFx = shieldEffectsRef.current;
          
          // Get selected shield style
          const shieldOpt = SHIELD_OPTIONS[shipPartsRef.current?.shield || 0] || SHIELD_OPTIONS[0];
          const shieldStyle = shieldOpt.style;
          let shieldColor = shieldOpt.color;
          let glowColor = shieldOpt.glowColor;
          
          // Prismatic shield shifts colors over time
          if (shieldStyle === 'prismatic') {
            const hue = (Date.now() / 20) % 360;
            shieldColor = `hsl(${hue}, 100%, 70%)`;
            glowColor = `hsl(${hue}, 100%, 50%)`;
          }
          
          const centerX = player.x + PLAYER_WIDTH / 2;
          const centerY = player.y + PLAYER_HEIGHT / 2;
          const shieldRadiusX = (PLAYER_WIDTH / 2 + 22) * shieldScale;
          const shieldRadiusY = (PLAYER_HEIGHT / 2 + 18) * shieldScale;
          
          // Always draw a basic shield outline first (guaranteed visible)
          ctx.strokeStyle = shieldColor;
          ctx.lineWidth = 4;
          ctx.globalAlpha = 1;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 25;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, shieldRadiusX, shieldRadiusY, 0, 0, Math.PI * 2);
          ctx.stroke();
          
          // Draw a second glow ring for extra visibility
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 40;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, shieldRadiusX + 5, shieldRadiusY + 5, 0, 0, Math.PI * 2);
          ctx.stroke();
          
          // Guard against non-finite values for shield rendering
          if (isFinite(centerX) && isFinite(centerY) && isFinite(shieldRadiusX) && isFinite(shieldRadiusY)) {
            
            // Impact flash overlay
            if (shieldFx.pulseIntensity > 0.1) {
              ctx.globalAlpha = shieldFx.pulseIntensity * 0.6;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.ellipse(centerX, centerY, shieldRadiusX + 10, shieldRadiusY + 8, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          
            // Outer glow
            const outerGlowSize = 10 + shieldLevel * 5 + shieldFx.pulseIntensity * 20;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = outerGlowSize;
            
            ctx.strokeStyle = shieldColor;
            ctx.lineWidth = 2 + shieldLevel * 0.5;
            ctx.globalAlpha = shieldBrightness + Math.sin(pulseTime) * 0.15;
            
            // Draw shield based on style
            if (shieldStyle === 'hexagon') {
              // Hexagonal shield segments
              ctx.save();
              ctx.translate(centerX, centerY);
              ctx.rotate(shieldFx.rotationAngle);
              
              for (let i = 0; i < 6; i++) {
                const segmentAlpha = shieldFx.hexSegments[i];
                const angle1 = (Math.PI / 3) * i - Math.PI / 6;
                const angle2 = (Math.PI / 3) * (i + 1) - Math.PI / 6;
                
                ctx.globalAlpha = (shieldBrightness * segmentAlpha + Math.sin(pulseTime + i) * 0.1) * 0.8;
                ctx.strokeStyle = segmentAlpha < 0.5 ? '#ff4444' : shieldColor;
                ctx.lineWidth = 2 + shieldLevel * 0.3;
                
                ctx.beginPath();
                ctx.ellipse(0, 0, shieldRadiusX, shieldRadiusY, 0, angle1, angle2);
                ctx.stroke();
                
                if (segmentAlpha > 0.3) {
                  const vx1 = Math.cos(angle1) * shieldRadiusX;
                  const vy1 = Math.sin(angle1) * shieldRadiusY;
                  const vx2 = Math.cos(angle2) * shieldRadiusX;
                  const vy2 = Math.sin(angle2) * shieldRadiusY;
                  
                  ctx.globalAlpha = segmentAlpha * 0.3;
                  ctx.beginPath();
                  ctx.moveTo(0, 0);
                  ctx.lineTo(vx1, vy1);
                  ctx.lineTo(vx2, vy2);
                  ctx.closePath();
                  ctx.fillStyle = shieldColor;
                  ctx.fill();
                }
              }
              ctx.restore();
            } else if (shieldStyle === 'bubble') {
              // Smooth bubble shield
              ctx.save();
              ctx.globalAlpha = shieldBrightness * 0.7;
              ctx.strokeStyle = shieldColor;
              ctx.lineWidth = 3 + shieldLevel * 0.4;
              ctx.shadowColor = glowColor;
              ctx.shadowBlur = 20;
              ctx.beginPath();
              ctx.ellipse(centerX, centerY, shieldRadiusX, shieldRadiusY, 0, 0, Math.PI * 2);
              ctx.stroke();
              
              // Inner glow
              const bubbleGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, shieldRadiusX);
              bubbleGrad.addColorStop(0, 'rgba(0, 255, 136, 0)');
              bubbleGrad.addColorStop(0.7, 'rgba(0, 255, 136, 0.05)');
              bubbleGrad.addColorStop(1, shieldColor);
              ctx.globalAlpha = 0.3 + Math.sin(pulseTime) * 0.1;
              ctx.fillStyle = bubbleGrad;
              ctx.beginPath();
              ctx.ellipse(centerX, centerY, shieldRadiusX, shieldRadiusY, 0, 0, Math.PI * 2);
              ctx.fill();
              
              // Highlight arc
              ctx.globalAlpha = 0.5;
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.ellipse(centerX - shieldRadiusX * 0.3, centerY - shieldRadiusY * 0.3, shieldRadiusX * 0.4, shieldRadiusY * 0.3, -0.5, 0, Math.PI * 0.8);
              ctx.stroke();
              ctx.restore();
            } else if (shieldStyle === 'plasma') {
              // Fiery plasma shield
              ctx.save();
              ctx.globalAlpha = shieldBrightness;
              
              // Multiple fiery rings
              for (let ring = 0; ring < 3; ring++) {
                const ringOffset = Math.sin(pulseTime * 2 + ring * 2) * 3;
                const ringAlpha = 0.6 - ring * 0.15;
                ctx.globalAlpha = ringAlpha;
                ctx.strokeStyle = ring === 0 ? '#ffff00' : ring === 1 ? '#ff8800' : '#ff4400';
                ctx.lineWidth = 3 - ring * 0.5;
                ctx.shadowColor = '#ff4400';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, shieldRadiusX + ringOffset, shieldRadiusY + ringOffset, 0, 0, Math.PI * 2);
                ctx.stroke();
              }
              
              // Fire particles
              for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + pulseTime * 0.5;
                const px = centerX + Math.cos(angle) * shieldRadiusX;
                const py = centerY + Math.sin(angle) * shieldRadiusY * 0.8;
                ctx.globalAlpha = 0.5 + Math.sin(pulseTime * 3 + i) * 0.3;
                ctx.fillStyle = i % 2 === 0 ? '#ffff00' : '#ff6600';
                ctx.beginPath();
                ctx.arc(px, py, 3 + Math.sin(pulseTime + i) * 1.5, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            } else if (shieldStyle === 'void') {
              // Dark energy void shield
              ctx.save();
              ctx.globalAlpha = shieldBrightness;
              
              // Dark inner void
              const voidGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, shieldRadiusX);
              voidGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
              voidGrad.addColorStop(0.6, 'rgba(50, 0, 80, 0.1)');
              voidGrad.addColorStop(0.9, 'rgba(100, 0, 150, 0.3)');
              voidGrad.addColorStop(1, shieldColor);
              ctx.fillStyle = voidGrad;
              ctx.beginPath();
              ctx.ellipse(centerX, centerY, shieldRadiusX, shieldRadiusY, 0, 0, Math.PI * 2);
              ctx.fill();
              
              // Purple energy ring
              ctx.strokeStyle = shieldColor;
              ctx.lineWidth = 2;
              ctx.shadowColor = glowColor;
              ctx.shadowBlur = 25;
              ctx.beginPath();
              ctx.ellipse(centerX, centerY, shieldRadiusX, shieldRadiusY, 0, 0, Math.PI * 2);
              ctx.stroke();
              
              // Orbiting void particles
              for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 - pulseTime * 0.3;
                const px = centerX + Math.cos(angle) * shieldRadiusX * 1.05;
                const py = centerY + Math.sin(angle) * shieldRadiusY * 0.9;
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = i % 2 === 0 ? '#aa00ff' : '#6600aa';
                ctx.beginPath();
                ctx.arc(px, py, 2 + shieldLevel * 0.2, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            } else if (shieldStyle === 'prismatic') {
              // Rainbow prismatic shield
              ctx.save();
              ctx.globalAlpha = shieldBrightness;
              
              // Multiple rainbow rings
              for (let ring = 0; ring < 3; ring++) {
                const ringHue = ((Date.now() / 15) + ring * 40) % 360;
                ctx.strokeStyle = `hsl(${ringHue}, 100%, 60%)`;
                ctx.lineWidth = 3 - ring * 0.5;
                ctx.shadowColor = `hsl(${ringHue}, 100%, 50%)`;
                ctx.shadowBlur = 15;
                ctx.globalAlpha = 0.6 - ring * 0.15;
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, shieldRadiusX - ring * 3, shieldRadiusY - ring * 2, 0, 0, Math.PI * 2);
                ctx.stroke();
              }
              
              // Sparkle particles
              for (let i = 0; i < 10; i++) {
                const angle = (i / 10) * Math.PI * 2 + pulseTime * 0.4;
                const px = centerX + Math.cos(angle) * shieldRadiusX;
                const py = centerY + Math.sin(angle) * shieldRadiusY * 0.85;
                const sparkHue = ((Date.now() / 10) + i * 36) % 360;
                ctx.globalAlpha = 0.6 + Math.sin(pulseTime * 2 + i) * 0.4;
                ctx.fillStyle = `hsl(${sparkHue}, 100%, 70%)`;
                ctx.beginPath();
                ctx.arc(px, py, 2 + Math.sin(pulseTime + i) * 1, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            }
            
            // Inner energy field (all styles)
            ctx.globalAlpha = (0.08 + shieldLevel * 0.02) + Math.sin(pulseTime) * 0.05;
            const innerGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, shieldRadiusX);
            innerGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            // Handle HSL colors properly - use transparent version
            const midColor = shieldColor.startsWith('hsl(') 
              ? shieldColor.replace('hsl(', 'hsla(').replace(')', ', 0.07)')
              : `${shieldColor}11`;
            innerGrad.addColorStop(0.6, midColor);
            innerGrad.addColorStop(1, shieldColor);
            ctx.fillStyle = innerGrad;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, shieldRadiusX, shieldRadiusY, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Additional shield rings for high levels
            if (shieldLevel >= 4) {
              ctx.globalAlpha = 0.25 + Math.sin(pulseTime + 1) * 0.1;
              ctx.strokeStyle = '#88ffff';
              ctx.lineWidth = 1;
              ctx.setLineDash([5, 5]);
              ctx.beginPath();
              ctx.ellipse(centerX, centerY, shieldRadiusX * 0.85, shieldRadiusY * 0.85, 0, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);
            }
            
            if (shieldLevel >= 7) {
              ctx.globalAlpha = 0.2 + Math.sin(pulseTime + 2) * 0.1;
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.ellipse(centerX, centerY, shieldRadiusX * 0.7, shieldRadiusY * 0.7, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
            
            // Orbiting energy particles
            if (shieldLevel >= 3) {
              const particleCount = Math.floor((shieldLevel - 2) * 2);
              for (let i = 0; i < particleCount; i++) {
                const orbitAngle = shieldFx.rotationAngle * 2 + (i * Math.PI * 2 / particleCount);
                const px = centerX + Math.cos(orbitAngle) * shieldRadiusX * 1.05;
                const py = centerY + Math.sin(orbitAngle) * shieldRadiusY * 0.9;
                ctx.globalAlpha = 0.5 + Math.sin(pulseTime + i) * 0.3;
                ctx.fillStyle = i % 2 === 0 ? '#00ffff' : '#ffffff';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(px, py, 2 + shieldLevel * 0.15, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            
            // Draw impact ripples
            shieldFx.impacts.forEach(impact => {
              ctx.globalAlpha = impact.intensity * 0.7;
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(impact.x, impact.y, impact.radius, impact.angle - 0.5, impact.angle + 0.5);
              ctx.stroke();
              
              // Secondary ripple
              ctx.globalAlpha = impact.intensity * 0.4;
              ctx.strokeStyle = '#00ffff';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(impact.x, impact.y, impact.radius * 0.6, impact.angle - 0.8, impact.angle + 0.8);
              ctx.stroke();
            });
            
            // Draw charge particles
            shieldFx.chargeParticles.forEach(particle => {
              ctx.globalAlpha = particle.life / 30;
              ctx.fillStyle = particle.color;
              ctx.shadowColor = particle.color;
              ctx.shadowBlur = 6;
              ctx.beginPath();
              ctx.arc(particle.x, particle.y, particle.size * (particle.life / 30), 0, Math.PI * 2);
              ctx.fill();
            });
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            
            // Shield status indicator
            const indicatorColor = shieldLevel >= 7 ? '#ffffff' : shieldLevel >= 4 ? '#88ffff' : '#00ffff';
            const isRecharging = upgradesRef.current.shieldRechargeTimer <= 0 && shieldHits < upgradesRef.current.shieldMaxHits;
            ctx.fillStyle = indicatorColor;
            ctx.font = `bold ${11 + shieldLevel}px monospace`;
            ctx.textAlign = 'center';
            ctx.shadowColor = indicatorColor;
            ctx.shadowBlur = shieldLevel * 2;
            const statusText = isRecharging ? `\ud83d\udee1\ufe0fx${shieldHits}+` : `\ud83d\udee1\ufe0fx${shieldHits}`;
            ctx.fillText(statusText, centerX, player.y - 18 - shieldLevel * 2);
            ctx.shadowBlur = 0;
          } // End of isFinite guard
        }
        
        // Restore canvas state after shield drawing
        ctx.restore();
        
        const px = player.x;
        const py = player.y;
        const pw = PLAYER_WIDTH;
        const ph = PLAYER_HEIGHT;
        
        // Spawn glow animation - expanding cyan/white glow with particles
        if (playerSpawnGlowRef.current > 0) {
          const spawnTimer = playerSpawnGlowRef.current;
          const spawnProgress = 1 - (spawnTimer / 180); // 0 to 1
          const fadeOut = spawnTimer / 180; // 1 to 0 (for fade out)
          const centerX = px + pw / 2;
          const centerY = py + ph / 2;
          
          // Save context state
          ctx.save();
          
          // Initial flash at the very start
          if (spawnTimer > 85) {
            const flashAlpha = (90 - spawnTimer) / 5 * fadeOut;
            const flashSize = 100 - (90 - spawnTimer) * 15;
            const flashGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, flashSize);
            flashGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
            flashGrad.addColorStop(0.3, `rgba(0, 255, 255, ${flashAlpha * 0.9})`);
            flashGrad.addColorStop(0.6, `rgba(0, 200, 255, ${flashAlpha * 0.5})`);
            flashGrad.addColorStop(1, 'rgba(0, 100, 255, 0)');
            ctx.fillStyle = flashGrad;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 40;
            ctx.beginPath();
            ctx.arc(centerX, centerY, flashSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          
          // Expanding circular waves
          for (let i = 0; i < 3; i++) {
            const waveDelay = i * 10;
            if (spawnTimer < 180 - waveDelay) {
              const waveProgress = Math.min(1, (180 - spawnTimer - waveDelay) / 40);
              const radius = waveProgress * 80;
              const alpha = (1 - waveProgress) * 0.8 * fadeOut;
              
              ctx.globalAlpha = alpha;
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.lineWidth = 3;
              ctx.shadowColor = '#00ffff';
              ctx.shadowBlur = 20;
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
              ctx.stroke();
              
              ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.7})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
              ctx.stroke();
              
              ctx.shadowBlur = 0;
            }
          }
          
          // Bright core glow with fade out
          const coreAlpha = (spawnTimer > 70 ? 1.0 : spawnTimer / 70) * fadeOut;
          const coreSize = 50 + Math.sin(spawnTimer / 6) * 10;
          const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize);
          coreGrad.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
          coreGrad.addColorStop(0.2, `rgba(255, 255, 255, ${coreAlpha * 0.9})`);
          coreGrad.addColorStop(0.4, `rgba(0, 255, 255, ${coreAlpha * 0.8})`);
          coreGrad.addColorStop(0.7, `rgba(0, 200, 255, ${coreAlpha * 0.5})`);
          coreGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
          ctx.fillStyle = coreGrad;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 30;
          ctx.beginPath();
          ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Energy burst effect at start
          if (spawnTimer > 75) {
            const burstAlpha = (90 - spawnTimer) / 15 * fadeOut;
            ctx.globalAlpha = burstAlpha;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 40;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 70 - (90 - spawnTimer) * 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          
          // Radiating particles with fade out
          const particleCount = 16;
          for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + spawnProgress * Math.PI;
            const distance = spawnProgress * 60;
            const particleX = centerX + Math.cos(angle) * distance;
            const particleY = centerY + Math.sin(angle) * distance;
            const particleAlpha = (1 - spawnProgress) * 0.9 * fadeOut;
            
            ctx.globalAlpha = particleAlpha;
            ctx.fillStyle = i % 3 === 0 ? '#ffffff' : (i % 3 === 1 ? '#00ffff' : '#88ffff');
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 4, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Screen flash effect (brighten entire area around spawn)
          if (spawnTimer > 80) {
            const screenFlashAlpha = (90 - spawnTimer) / 10 * 0.2 * fadeOut;
            ctx.globalAlpha = screenFlashAlpha;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
          }
          
          // Reset context
          ctx.restore();
        }
        
        // Apply tilt transform for dynamic movement feel
        ctx.save();
        ctx.translate(px + pw / 2, py + ph / 2);
        ctx.rotate(player.tilt || 0);
        ctx.translate(-(px + pw / 2), -(py + ph / 2));
        
        // Speed lines when moving fast
        const speed = Math.sqrt((player.vx || 0) * (player.vx || 0) + (player.vy || 0) * (player.vy || 0));
        if (speed > 4) {
          ctx.globalAlpha = (speed - 4) / 4 * 0.5;
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            const lineY = py + 5 + i * (ph - 10) / 2;
            ctx.beginPath();
            ctx.moveTo(px - 5 - speed * 2, lineY + (Math.random() - 0.5) * 2);
            ctx.lineTo(px - 15 - speed * 3, lineY + (Math.random() - 0.5) * 2);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        
        // Engine flames (animated) - intensity based on speed
        const flameOffset = Math.sin(Date.now() / 50) * 3;
        const baseFlameSize = 8 + (upgradesRef.current.rapidFire || 0) * 3;
        const boosterOpt = BOOSTER_OPTIONS[shipPartsRef.current?.booster] || BOOSTER_OPTIONS[0];
        // Boost flame size extra when moving forward (positive vx)
        const forwardBoost = Math.max(0, player.vx || 0) * 2;
        const flameSize = (baseFlameSize + (speed || 0) * 1.5 + forwardBoost) * (boosterOpt.flameLength || 1);
        const boosterScale = (boosterOpt.size || 1) * (1 + Math.max(0, player.vx || 0) * 0.05);
        
        // Safety check for valid gradient coordinates
        const safeFlameSize = isFinite(flameSize) ? flameSize : 8;
        const safeFlameOffset = isFinite(flameOffset) ? flameOffset : 0;
        
        if (boosterOpt.dual) {
          // Dual boosters - top and bottom
          [-1, 1].forEach(dir => {
            const yOff = dir * 6;
            const flameGrad = ctx.createLinearGradient(px - safeFlameSize - safeFlameOffset, py + ph / 2 + yOff, px, py + ph / 2 + yOff);
            flameGrad.addColorStop(0, 'transparent');
            flameGrad.addColorStop(0.3, '#ff4400');
            flameGrad.addColorStop(0.6, '#ff8800');
            flameGrad.addColorStop(1, '#ffff00');
            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.moveTo(px + 5, py + ph / 2 + yOff - 3);
            ctx.lineTo(px - safeFlameSize - safeFlameOffset, py + ph / 2 + yOff);
            ctx.lineTo(px + 5, py + ph / 2 + yOff + 3);
            ctx.closePath();
            ctx.fill();
            
            // Inner core
            ctx.fillStyle = upgradesRef.current.rapidFire > 0 ? '#ffffff' : '#00ffff';
            ctx.beginPath();
            ctx.moveTo(px + 5, py + ph / 2 + yOff - 1.5);
            ctx.lineTo(px - 3 - safeFlameOffset / 2, py + ph / 2 + yOff);
            ctx.lineTo(px + 5, py + ph / 2 + yOff + 1.5);
            ctx.closePath();
            ctx.fill();
          });
        } else {
          // Single booster with size scaling
          const flameGradient = ctx.createLinearGradient(px - safeFlameSize - safeFlameOffset, py + ph / 2, px, py + ph / 2);
          flameGradient.addColorStop(0, 'transparent');
          flameGradient.addColorStop(0.3, '#ff4400');
          flameGradient.addColorStop(0.6, '#ff8800');
          flameGradient.addColorStop(1, '#ffff00');
          
          ctx.fillStyle = flameGradient;
          ctx.beginPath();
          ctx.moveTo(px + 5, py + ph / 2 - 4 * boosterScale);
          ctx.lineTo(px - safeFlameSize - safeFlameOffset, py + ph / 2);
          ctx.lineTo(px + 5, py + ph / 2 + 4 * boosterScale);
          ctx.closePath();
          ctx.fill();
          
          // Inner flame (white/cyan core)
          ctx.fillStyle = upgradesRef.current.rapidFire > 0 ? '#ffffff' : '#00ffff';
          ctx.beginPath();
          ctx.moveTo(px + 5, py + ph / 2 - 2 * boosterScale);
          ctx.lineTo(px - 3 - safeFlameOffset / 2, py + ph / 2);
          ctx.lineTo(px + 5, py + ph / 2 + 2 * boosterScale);
          ctx.closePath();
          ctx.fill();
        }
        
        // Ship body shadow/depth
        const shipDesign = SHIP_DESIGNS[selectedShipRef.current] || SHIP_DESIGNS[0];
        const shipColors = shipDesign.colors;
        const isNebulaX = selectedShipRef.current === 0; // NEBULA - X is the first ship
        
        ctx.fillStyle = shipColors.shadow;
        ctx.beginPath();
        ctx.moveTo(px + pw - 2, py + ph / 2 + 2);
        ctx.lineTo(px + 8, py + 4);
        ctx.lineTo(px + 8, py + ph - 4);
        ctx.closePath();
        ctx.fill();
        
        // ========== NEBULA - X SPECIAL DESIGN ==========
        if (isNebulaX) {
          // 4 BIG GUNS - the signature look
          const gunGlow = Math.sin(Date.now() / 100) * 0.3 + 0.7;
          const accentColor = shipColors.accent || '#ff4400';
          
          // Gun barrel positions (2 top, 2 bottom)
          const gunPositions = [
            { x: px + pw - 5, y: py - 2, angle: -0.1 },      // Top front gun
            { x: px + 15, y: py - 4, angle: -0.15 },          // Top back gun
            { x: px + pw - 5, y: py + ph + 2, angle: 0.1 },  // Bottom front gun
            { x: px + 15, y: py + ph + 4, angle: 0.15 },      // Bottom back gun
          ];
          
          // Draw gun mounts first (behind body)
          ctx.fillStyle = '#333344';
          gunPositions.forEach(gun => {
            ctx.save();
            ctx.translate(gun.x, gun.y);
            ctx.rotate(gun.angle);
            // Gun mount
            ctx.fillStyle = '#222233';
            ctx.fillRect(-8, -4, 10, 8);
            ctx.restore();
          });
          
          // Main ship body (angular, aggressive design)
          const bodyGradient = ctx.createLinearGradient(px, py, px, py + ph);
          shipColors.body.forEach((color, i) => {
            bodyGradient.addColorStop(i / (shipColors.body.length - 1), color);
          });
          
          ctx.fillStyle = bodyGradient;
          ctx.beginPath();
          // More angular, aggressive nose
          ctx.moveTo(px + pw + 5, py + ph / 2);          // Extended nose point
          ctx.lineTo(px + pw - 8, py + 2);               // Top front
          ctx.lineTo(px + pw - 20, py + 1);              // Top mid (notch for gun)
          ctx.lineTo(px + 12, py + 4);                   // Top back
          ctx.lineTo(px + 3, py + ph / 2);               // Back center
          ctx.lineTo(px + 12, py + ph - 4);              // Bottom back
          ctx.lineTo(px + pw - 20, py + ph - 1);         // Bottom mid (notch for gun)
          ctx.lineTo(px + pw - 8, py + ph - 2);          // Bottom front
          ctx.closePath();
          ctx.fill();
          
          // Draw the 4 big guns
          gunPositions.forEach((gun, idx) => {
            ctx.save();
            ctx.translate(gun.x, gun.y);
            ctx.rotate(gun.angle);
            
            // Gun barrel (long)
            const barrelGrad = ctx.createLinearGradient(0, -3, 0, 3);
            barrelGrad.addColorStop(0, '#555566');
            barrelGrad.addColorStop(0.5, '#888899');
            barrelGrad.addColorStop(1, '#444455');
            ctx.fillStyle = barrelGrad;
            ctx.fillRect(0, -3, 18, 6);
            
            // Gun barrel tip (glowing)
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = 8 * gunGlow;
            ctx.fillStyle = accentColor;
            ctx.fillRect(16, -2, 4, 4);
            
            // Barrel inner glow
            ctx.fillStyle = '#ffff88';
            ctx.fillRect(17, -1, 2, 2);
            ctx.shadowBlur = 0;
            
            // Gun detail lines
            ctx.strokeStyle = shipColors.glow;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(2, -3);
            ctx.lineTo(2, 3);
            ctx.moveTo(8, -3);
            ctx.lineTo(8, 3);
            ctx.stroke();
            
            ctx.restore();
          });
          
          // Central power core (between gun mounts)
          ctx.shadowColor = shipColors.glow;
          ctx.shadowBlur = 15;
          ctx.fillStyle = shipColors.glow;
          ctx.beginPath();
          ctx.arc(px + pw / 2 + 5, py + ph / 2, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Armor plating lines
          ctx.strokeStyle = shipColors.glow;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.moveTo(px + 20, py + 5);
          ctx.lineTo(px + pw - 15, py + 3);
          ctx.moveTo(px + 20, py + ph - 5);
          ctx.lineTo(px + pw - 15, py + ph - 3);
          // Center line
          ctx.moveTo(px + 10, py + ph / 2);
          ctx.lineTo(px + pw - 10, py + ph / 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          
          // Enhanced cockpit (command center)
          const cockpitGradient = ctx.createLinearGradient(px + pw - 30, py + ph / 2 - 6, px + pw - 30, py + ph / 2 + 6);
          shipColors.cockpit.forEach((color, i) => {
            cockpitGradient.addColorStop(i / (shipColors.cockpit.length - 1), color);
          });
          
          ctx.fillStyle = cockpitGradient;
          ctx.beginPath();
          ctx.ellipse(px + pw - 18, py + ph / 2, 10, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Cockpit highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.beginPath();
          ctx.ellipse(px + pw - 20, py + ph / 2 - 2, 4, 2, -0.3, 0, Math.PI * 2);
          ctx.fill();
          
          // Small stabilizer wings (angular)
          ctx.fillStyle = shipColors.wing;
          // Top stabilizer
          ctx.beginPath();
          ctx.moveTo(px + 8, py + 4);
          ctx.lineTo(px + 5, py - 6);
          ctx.lineTo(px + 18, py - 4);
          ctx.lineTo(px + 20, py + 4);
          ctx.closePath();
          ctx.fill();
          // Bottom stabilizer
          ctx.beginPath();
          ctx.moveTo(px + 8, py + ph - 4);
          ctx.lineTo(px + 5, py + ph + 6);
          ctx.lineTo(px + 18, py + ph + 4);
          ctx.lineTo(px + 20, py + ph - 4);
          ctx.closePath();
          ctx.fill();
          
          // Stabilizer tips glow
          ctx.shadowColor = shipColors.glow;
          ctx.shadowBlur = 8;
          ctx.fillStyle = shipColors.glow;
          ctx.beginPath();
          ctx.arc(px + 5, py - 6, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px + 5, py + ph + 6, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
        } else {
          // ========== STANDARD SHIP DESIGN ==========
          // Main ship body (using selected ship colors)
          const bodyGradient = ctx.createLinearGradient(px, py, px, py + ph);
          shipColors.body.forEach((color, i) => {
            bodyGradient.addColorStop(i / (shipColors.body.length - 1), color);
          });
          
          ctx.fillStyle = bodyGradient;
          ctx.beginPath();
          ctx.moveTo(px + pw, py + ph / 2);           // Nose
          ctx.lineTo(px + pw - 15, py + 3);            // Top front
          ctx.lineTo(px + 10, py + 5);                 // Top back
          ctx.lineTo(px + 5, py + ph / 2);             // Back center
          ctx.lineTo(px + 10, py + ph - 5);            // Bottom back
          ctx.lineTo(px + pw - 15, py + ph - 3);       // Bottom front
          ctx.closePath();
          ctx.fill();
          
          // Cockpit window
          const cockpitGradient = ctx.createLinearGradient(px + pw - 25, py + ph / 2 - 5, px + pw - 25, py + ph / 2 + 5);
          shipColors.cockpit.forEach((color, i) => {
            cockpitGradient.addColorStop(i / (shipColors.cockpit.length - 1), color);
          });
          
          ctx.fillStyle = cockpitGradient;
          ctx.beginPath();
          ctx.ellipse(px + pw - 20, py + ph / 2, 8, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Cockpit highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.ellipse(px + pw - 22, py + ph / 2 - 2, 3, 2, -0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Get wing options for customization
        const wingOpt = WING_OPTIONS[shipPartsRef.current?.wings] || WING_OPTIONS[0];
        const wingLen = wingOpt.length || 1;
        const wingAng = wingOpt.angle || 1;
        
        // Skip standard wings for NEBULA - X (it has its own design)
        if (!isNebulaX) {
          // Top wing
          ctx.fillStyle = shipColors.wing;
          ctx.beginPath();
          ctx.moveTo(px + 20, py + 5);
          ctx.lineTo(px + 35, py - 8 * wingLen * wingAng);
          ctx.lineTo(px + 15, py - 5 * wingLen);
          ctx.lineTo(px + 8, py + 5);
          ctx.closePath();
          ctx.fill();
          
          // Top wing highlight
          ctx.fillStyle = shipColors.wingHighlight;
          ctx.beginPath();
          ctx.moveTo(px + 20, py + 5);
          ctx.lineTo(px + 30, py - 4 * wingLen * wingAng);
          ctx.lineTo(px + 18, py - 2 * wingLen);
          ctx.lineTo(px + 12, py + 5);
          ctx.closePath();
          ctx.fill();
          
          // Bottom wing
          ctx.fillStyle = shipColors.wing;
          ctx.beginPath();
          ctx.moveTo(px + 20, py + ph - 5);
          ctx.lineTo(px + 35, py + ph + 8 * wingLen * wingAng);
          ctx.lineTo(px + 15, py + ph + 5 * wingLen);
          ctx.lineTo(px + 8, py + ph - 5);
          ctx.closePath();
          ctx.fill();
          
          // Bottom wing highlight
          ctx.fillStyle = shipColors.wingDark;
          ctx.beginPath();
          ctx.moveTo(px + 20, py + ph - 5);
          ctx.lineTo(px + 30, py + ph + 4 * wingLen * wingAng);
          ctx.lineTo(px + 18, py + ph + 2 * wingLen);
          ctx.lineTo(px + 12, py + ph - 5);
          ctx.closePath();
          ctx.fill();
          
          // Wing tips (glowing) - enhanced for extended wings
          ctx.shadowColor = shipColors.glow;
          ctx.shadowBlur = wingLen > 1 ? 12 : 8;
          ctx.fillStyle = shipColors.glow;
          ctx.beginPath();
          ctx.arc(px + 35, py - 8 * wingLen * wingAng, wingLen > 1 ? 3 : 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px + 35, py + ph + 8 * wingLen * wingAng, wingLen > 1 ? 3 : 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Detail lines on body
          ctx.strokeStyle = shipColors.glow;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + 15, py + 8);
          ctx.lineTo(px + pw - 18, py + 6);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(px + 15, py + ph - 8);
          ctx.lineTo(px + pw - 18, py + ph - 6);
          ctx.stroke();
        }
        
        // Nose tip glow
        
        // Missile pods (if missiles unlocked)
        if (upgradesRef.current.missiles) {
          ctx.fillStyle = '#ff6600';
          ctx.shadowColor = '#ff6600';
          ctx.shadowBlur = 5;
          // Top missile pod
          ctx.fillRect(px + 25, py - 3, 8, 3);
          // Bottom missile pod
          ctx.fillRect(px + 25, py + ph, 8, 3);
          ctx.shadowBlur = 0;
        }
        
        // Ship ability visual indicators
        const currentShipAbility = (SHIP_DESIGNS[selectedShipRef.current] || SHIP_DESIGNS[0]).ability;
        const abilityState = shipAbilityRef.current;
        
        if (currentShipAbility === 'chainLightning') {
          // THUNDER: Electric sparks around ship
          const sparkTime = Date.now() / 50;
          ctx.strokeStyle = '#ffff00';
          ctx.lineWidth = 1;
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 10;
          for (let i = 0; i < 3; i++) {
            const angle = sparkTime + (i * Math.PI * 2 / 3);
            const x1 = px + pw / 2 + Math.cos(angle) * 25;
            const y1 = py + ph / 2 + Math.sin(angle) * 20;
            const x2 = x1 + (Math.random() - 0.5) * 15;
            const y2 = y1 + (Math.random() - 0.5) * 15;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
        } else if (currentShipAbility === 'freezeShot') {
          // GLACIER: Frosty aura
          const frostPulse = Math.sin(Date.now() / 200) * 0.2 + 0.6;
          ctx.strokeStyle = `rgba(136, 255, 255, ${frostPulse})`;
          ctx.lineWidth = 2;
          ctx.shadowColor = '#88ffff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(px + pw / 2, py + ph / 2, 30, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (currentShipAbility === 'solarFlare') {
          // SOLAR: Solar charge indicator
          const chargePercent = abilityState.solarFlareTimer / abilityState.solarFlareInterval;
          if (chargePercent > 0.8) {
            // Ready to fire indicator
            ctx.fillStyle = '#ffaa00';
            ctx.font = "bold 8px monospace";
            ctx.textAlign = 'center';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 10;
            ctx.fillText('\u2600\ufe0fREADY', px + pw / 2, py - 10);
            ctx.shadowBlur = 0;
          }
        } else if (currentShipAbility === 'berserk') {
          // BERSERKER: Red rage aura when damaged
          if (livesRef.current < 3) {
            const ragePulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
            const rageIntensity = (3 - livesRef.current) / 3;
            ctx.strokeStyle = `rgba(255, 0, 0, ${ragePulse * rageIntensity})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20 * rageIntensity;
            ctx.beginPath();
            ctx.arc(px + pw / 2, py + ph / 2, 35, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Damage multiplier indicator
            ctx.fillStyle = '#ff4444';
            ctx.font = "bold 8px monospace";
            ctx.textAlign = 'center';
            ctx.fillText(`${abilityState.berserkMultiplier.toFixed(1)}x DMG`, px + pw / 2, py - 10);
          }
        } else if (currentShipAbility === 'phaseShift' && abilityState.phaseShiftActive) {
          // WRAITH: Phase shift active visual
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = '#8888ff';
          ctx.beginPath();
          ctx.arc(px + pw / 2, py + ph / 2, 40, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        
        // Restore transform after player drawing
        ctx.restore();
        
        // Draw muzzle flash effect
        const muzzleFlash = muzzleFlashRef.current;
        if (muzzleFlash.active && muzzleFlash.timer > 0) {
          ctx.save();
          const flashAlpha = muzzleFlash.timer / 4;
          const flashSize = 8 + (4 - muzzleFlash.timer) * 3;
          
          // Bright flash
          ctx.globalAlpha = flashAlpha;
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 20;
          
          const flashGrad = ctx.createRadialGradient(
            muzzleFlash.x, muzzleFlash.y, 0,
            muzzleFlash.x, muzzleFlash.y, flashSize
          );
          flashGrad.addColorStop(0, '#ffffff');
          flashGrad.addColorStop(0.3, '#ffff88');
          flashGrad.addColorStop(0.6, '#ff8800');
          flashGrad.addColorStop(1, 'rgba(255, 136, 0, 0)');
          
          ctx.fillStyle = flashGrad;
          ctx.beginPath();
          ctx.arc(muzzleFlash.x, muzzleFlash.y, flashSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Cone blast
          ctx.fillStyle = `rgba(255, 255, 200, ${flashAlpha * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(muzzleFlash.x, muzzleFlash.y);
          ctx.lineTo(muzzleFlash.x + flashSize * 2, muzzleFlash.y - flashSize);
          ctx.lineTo(muzzleFlash.x + flashSize * 2, muzzleFlash.y + flashSize);
          ctx.closePath();
          ctx.fill();
          
          muzzleFlash.timer--;
          if (muzzleFlash.timer <= 0) {
            muzzleFlash.active = false;
          }
          
          ctx.restore();
        }
      }
      
      // Draw practice mode hitboxes
      if (gameModeRef.current === 'practice' && practiceSettingsRef.current.showHitboxes) {
        ctx.save();
        
        // Player hitbox (precise circular hitbox for bullet hell gameplay)
        const centerX = player.x + PLAYER_WIDTH / 2;
        const centerY = player.y + PLAYER_HEIGHT / 2;
        
        // Draw precise circular hitbox
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, PLAYER_HITBOX_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw sprite outline for reference
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT);
        
        // Draw center hitpoint
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Hitbox label
        ctx.fillStyle = '#00ff00';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`HITBOX: ${PLAYER_HITBOX_RADIUS}px`, centerX, player.y - 8);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.fillText(`SPRITE: ${PLAYER_WIDTH}x${PLAYER_HEIGHT}`, centerX, player.y - 18);
        
        ctx.setLineDash([]);
        ctx.restore();
      }
      
      // Draw player laser beam (when rapidFire is maxed)
      const playerLaser = playerLaserRef.current;
      if (playerLaser.charging || playerLaser.firing) {
        const laserY = player.y + PLAYER_HEIGHT / 2;
        
        if (playerLaser.charging) {
          // Charging effect at ship nose
          const chargePercent = playerLaser.charge / 100;
          const chargeRadius = 5 + chargePercent * 20;
          
          ctx.save();
          
          // Energy gathering particles
          ctx.strokeStyle = `rgba(0, 255, 100, ${chargePercent})`;
          ctx.lineWidth = 2;
          for (let i = 0; i < 8; i++) {
            const angle = (Date.now() / 100 + i * Math.PI / 4) % (Math.PI * 2);
            const dist = 40 - chargePercent * 30;
            const startX = player.x + PLAYER_WIDTH + Math.cos(angle) * dist;
            const startY = laserY + Math.sin(angle) * dist;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(player.x + PLAYER_WIDTH + 5, laserY);
            ctx.stroke();
          }
          
          // Charging orb
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 30 * chargePercent;
          
          const chargeGrad = ctx.createRadialGradient(
            player.x + PLAYER_WIDTH + 5, laserY, 0,
            player.x + PLAYER_WIDTH + 5, laserY, chargeRadius
          );
          chargeGrad.addColorStop(0, '#ffffff');
          chargeGrad.addColorStop(0.4, '#88ffaa');
          chargeGrad.addColorStop(1, `rgba(0, 255, 100, ${chargePercent * 0.5})`);
          
          ctx.fillStyle = chargeGrad;
          ctx.beginPath();
          ctx.arc(player.x + PLAYER_WIDTH + 5, laserY, chargeRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Warning indicator
          if (chargePercent > 0.7) {
            ctx.fillStyle = '#00ff88';
            ctx.font = "10px \"Press Start 2P\", monospace";
            ctx.textAlign = 'center';
            if (Math.floor(Date.now() / 100) % 2 === 0) {
              ctx.fillText('LASER READY', player.x + PLAYER_WIDTH / 2, player.y - 15);
            }
          }
          
          ctx.restore();
        }
        
        if (playerLaser.firing) {
          // Firing the laser beam!
          const laserHeight = 20;
          const intensity = Math.min(1, playerLaser.duration / 30);
          const shake = (Math.random() - 0.5) * 4;
          
          ctx.save();
          
          // Outer destructive glow
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 50;
          
          // Create intense beam gradient
          const laserGradient = ctx.createLinearGradient(
            player.x + PLAYER_WIDTH, laserY - laserHeight / 2,
            player.x + PLAYER_WIDTH, laserY + laserHeight / 2
          );
          laserGradient.addColorStop(0, 'rgba(0, 255, 100, 0)');
          laserGradient.addColorStop(0.2, 'rgba(100, 255, 150, 0.6)');
          laserGradient.addColorStop(0.35, 'rgba(150, 255, 200, 0.9)');
          laserGradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
          laserGradient.addColorStop(0.65, 'rgba(150, 255, 200, 0.9)');
          laserGradient.addColorStop(0.8, 'rgba(100, 255, 150, 0.6)');
          laserGradient.addColorStop(1, 'rgba(0, 255, 100, 0)');
          
          ctx.fillStyle = laserGradient;
          ctx.fillRect(player.x + PLAYER_WIDTH, laserY - laserHeight / 2 + shake, GAME_WIDTH, laserHeight);
          
          // Hot core beam
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(player.x + PLAYER_WIDTH, laserY - 4 + shake, GAME_WIDTH, 8);
          
          // Flickering intensity
          if (Math.random() > 0.3) {
            ctx.fillStyle = `rgba(150, 255, 200, ${0.3 + Math.random() * 0.4})`;
            ctx.fillRect(player.x + PLAYER_WIDTH, laserY - laserHeight / 2 - 10 + shake, GAME_WIDTH, laserHeight + 20);
          }
          
          // Energy particles along beam
          for (let i = 0; i < 10; i++) {
            const px = player.x + PLAYER_WIDTH + Math.random() * (GAME_WIDTH - player.x - PLAYER_WIDTH);
            const py = laserY + (Math.random() - 0.5) * laserHeight;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px, py, 2 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Muzzle flash at ship
          const flashGrad = ctx.createRadialGradient(
            player.x + PLAYER_WIDTH, laserY, 0,
            player.x + PLAYER_WIDTH, laserY, 30
          );
          flashGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
          flashGrad.addColorStop(0.5, 'rgba(150, 255, 200, 0.8)');
          flashGrad.addColorStop(1, 'rgba(0, 255, 100, 0)');
          ctx.fillStyle = flashGrad;
          ctx.beginPath();
          ctx.arc(player.x + PLAYER_WIDTH, laserY, 30, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      }

      // Draw bullet trails (behind bullets)
      bulletTrailsRef.current.forEach(trail => {
        ctx.save();
        ctx.globalAlpha = trail.alpha;
        ctx.shadowColor = trail.glowColor;
        ctx.shadowBlur = 8;
        ctx.fillStyle = trail.color;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      });
      
      // Draw missile trails (behind missiles)
      missileTrailsRef.current.forEach(trail => {
        ctx.save();
        ctx.globalAlpha = trail.alpha;
        if (trail.isSmoke) {
          // Smoke puff
          ctx.fillStyle = `rgba(100, 80, 60, ${trail.alpha})`;
          ctx.beginPath();
          ctx.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Fire/spark
          ctx.shadowColor = '#ff6600';
          ctx.shadowBlur = 10;
          ctx.fillStyle = trail.color;
          ctx.beginPath();
          ctx.arc(trail.x, trail.y, trail.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.restore();
      });

      // Draw bullets
      bulletsRef.current.forEach(bullet => {
        // Skip bullets with non-finite positions
        if (!isFinite(bullet.x) || !isFinite(bullet.y)) return;
        
        if (bullet.isWaveCannon) {
          // Wave Cannon beam - massive blue energy blast with crackling edges
          const beamHeight = bullet.size;
          ctx.save();
          
          // Electric edge particles (skip in perf mode)
          if (!perfMode) {
            for (let i = 0; i < 5; i++) {
              const edgeY = bullet.y + (Math.random() * beamHeight);
              const edgeX = bullet.x + Math.random() * bullet.size * 1.5;
              ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#00ffff';
              ctx.globalAlpha = 0.5 + Math.random() * 0.5;
              ctx.beginPath();
              ctx.arc(edgeX, edgeY, 1 + Math.random() * 2, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          }
          
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = perfMode ? 10 : 25;
          
          // Outer glow
          const gradient = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x + bullet.size * 2, bullet.y);
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.2, '#88ffff');
          gradient.addColorStop(0.5, '#00ffff');
          gradient.addColorStop(0.8, '#0088ff');
          gradient.addColorStop(1, '#0044aa');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.ellipse(bullet.x + bullet.size, bullet.y + beamHeight / 2, bullet.size, beamHeight / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Core with pulse effect
          const pulse = 0.8 + Math.sin(Date.now() / 30) * 0.2;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(bullet.x + bullet.size * 0.7, bullet.y + beamHeight / 2, bullet.size * 0.5 * pulse, beamHeight / 4 * pulse, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // Normal bullet - enhanced with animated glow trail
          ctx.save();
          const bulletPolarity = bullet.polarity || 'light';
          
          // Use weapon level color if available, otherwise polarity color
          const hasWeaponColor = bullet.weaponColor && bullet.weaponLevel > 1;
          const bulletColor = hasWeaponColor ? bullet.weaponColor : (bulletPolarity === 'light' ? '#ffff00' : '#8B00FF');
          const glowColor = hasWeaponColor ? bullet.weaponColor : (bulletPolarity === 'light' ? '#ff8800' : '#4B0082');
          const coreColor = bulletPolarity === 'light' ? '#ffffff' : '#ff88ff';
          
          // Bullet size based on weapon level
          const sizeMult = bullet.bulletSize || 1;
          const bw = BULLET_WIDTH * sizeMult;
          const bh = BULLET_HEIGHT * sizeMult;
          
          // Animated trail length based on speed and weapon level
          const trailLength = perfMode ? 12 : (20 + (bullet.weaponLevel || 1) * 2);
          
          // Outer glow effect - enhanced for higher weapon levels
          ctx.shadowColor = bulletColor;
          ctx.shadowBlur = perfMode ? 6 : (15 + (bullet.weaponLevel || 1) * 2);
          
          // Elongated gradient trail behind bullet
          const trailGrad = ctx.createLinearGradient(bullet.x - trailLength, bullet.y, bullet.x, bullet.y);
          trailGrad.addColorStop(0, 'rgba(255, 136, 0, 0)');
          trailGrad.addColorStop(0.5, `${glowColor}44`);
          trailGrad.addColorStop(1, glowColor);
          ctx.fillStyle = trailGrad;
          ctx.beginPath();
          ctx.moveTo(bullet.x - trailLength, bullet.y + bh / 2);
          ctx.lineTo(bullet.x, bullet.y);
          ctx.lineTo(bullet.x + bw, bullet.y + bh / 2);
          ctx.lineTo(bullet.x, bullet.y + bh);
          ctx.closePath();
          ctx.fill();
          
          // Main bullet body - pointed shape (scaled by weapon level)
          ctx.fillStyle = bulletColor;
          ctx.beginPath();
          ctx.moveTo(bullet.x + bw + 4 * sizeMult, bullet.y + bh / 2);
          ctx.lineTo(bullet.x, bullet.y);
          ctx.lineTo(bullet.x, bullet.y + bh);
          ctx.closePath();
          ctx.fill();
          
          // Piercing indicator for max weapon level
          if (bullet.isPiercing) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 50) * 0.3;
            ctx.beginPath();
            ctx.moveTo(bullet.x + bw + 8 * sizeMult, bullet.y + bh / 2);
            ctx.lineTo(bullet.x + bw + 2 * sizeMult, bullet.y - 2);
            ctx.lineTo(bullet.x + bw + 2 * sizeMult, bullet.y + bh + 2);
            ctx.closePath();
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          
          // Bright animated core
          const corePulse = 0.8 + Math.sin(Date.now() / 40 + bullet.x) * 0.2;
          ctx.fillStyle = coreColor;
          ctx.globalAlpha = corePulse;
          ctx.beginPath();
          ctx.arc(bullet.x + bw / 2, bullet.y + bh / 2, bh / 2 * corePulse, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
          ctx.restore();
        }
      });

      // Draw enemy bullets - use reduced effects during boss battles for performance
      const reducedBulletEffects = bossActiveRef.current && !perfMode;
      enemyBulletsRef.current.forEach(bullet => {
        // Skip bullets with non-finite positions
        if (!isFinite(bullet.x) || !isFinite(bullet.y)) return;
        
        // Bullet color based on type
        if (bullet.isCannon) {
          // Cannon shot (large orange/red plasma ball)
          ctx.save();
          ctx.translate(bullet.x, bullet.y);
          ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
          
          // Size multiplier for regen cannons
          const sizeMultiplier = bullet.cannonSize || 1;
          const baseSize = 12 * sizeMultiplier;
          
          // Different color for regen cannons (dark red/black theme)
          const isRegenCannon = bullet.isRegenCannon;
          const glowColor = isRegenCannon ? '#ff0000' : '#ff4400';
          const outerColor = isRegenCannon ? '#aa0000' : '#ff0000';
          const midColor = isRegenCannon ? '#ff2200' : '#ff6600';
          
          // Outer glow - reduce during boss battles
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = reducedBulletEffects ? 8 : (isRegenCannon ? 25 : 20);
          
          // Plasma ball - simplified gradient during boss battles
          if (reducedBulletEffects) {
            ctx.fillStyle = midColor;
          } else {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseSize);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.2, isRegenCannon ? '#ff8888' : '#ffff00');
            gradient.addColorStop(0.5, midColor);
            gradient.addColorStop(1, outerColor);
            ctx.fillStyle = gradient;
          }
          ctx.beginPath();
          ctx.arc(0, 0, baseSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Inner core
          ctx.fillStyle = isRegenCannon ? '#ffaaaa' : '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, baseSize * 0.35, 0, Math.PI * 2);
          ctx.fill();
          
          // Trail - longer for regen cannons
          const trailLength = isRegenCannon ? 20 : 15;
          ctx.fillStyle = isRegenCannon ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 100, 0, 0.5)';
          ctx.beginPath();
          ctx.ellipse(-trailLength, 0, trailLength * 0.7, baseSize * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Extra ring effect for regen cannons
          if (isRegenCannon && !reducedBulletEffects) {
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, baseSize * 1.3, 0, Math.PI * 2);
            ctx.stroke();
          }
          
          ctx.restore();
        } else if (bullet.isFireBullet) {
          // FIRE BULLET - Burning projectile
          ctx.save();
          ctx.translate(bullet.x, bullet.y);
          ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
          
          const firePhase = Date.now() / 80;
          const flicker = Math.sin(firePhase) * 0.2 + 0.8;
          
          // Outer fire glow
          ctx.shadowColor = '#ff4400';
          ctx.shadowBlur = 15 * flicker;
          
          // Fire gradient
          const fireGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
          fireGrad.addColorStop(0, '#ffffff');
          fireGrad.addColorStop(0.3, '#ffff00');
          fireGrad.addColorStop(0.6, '#ff8800');
          fireGrad.addColorStop(1, '#ff2200');
          ctx.fillStyle = fireGrad;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Fire trail
          ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
          ctx.beginPath();
          ctx.ellipse(-12, 0, 10, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 200, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(-8, 0, 6, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Spark particles
          ctx.fillStyle = '#ffff00';
          for (let i = 0; i < 3; i++) {
            const sparkAngle = firePhase * 2 + i * 2;
            const sparkDist = 5 + Math.sin(sparkAngle) * 3;
            ctx.beginPath();
            ctx.arc(Math.cos(sparkAngle) * sparkDist, Math.sin(sparkAngle) * sparkDist * 0.5, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          
          ctx.restore();
        } else if (bullet.isIceBullet) {
          // ICE BULLET - Freezing projectile
          ctx.save();
          ctx.translate(bullet.x, bullet.y);
          ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
          
          const icePhase = Date.now() / 120;
          const shimmer = Math.sin(icePhase) * 0.15 + 0.85;
          
          // Outer ice glow
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 12 * shimmer;
          
          // Ice gradient (crystalline look)
          const iceGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 9);
          iceGrad.addColorStop(0, '#ffffff');
          iceGrad.addColorStop(0.4, '#88eeff');
          iceGrad.addColorStop(0.7, '#00ccff');
          iceGrad.addColorStop(1, '#0066aa');
          ctx.fillStyle = iceGrad;
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          
          // Crystal spikes
          ctx.strokeStyle = '#88eeff';
          ctx.lineWidth = 2;
          for (let i = 0; i < 6; i++) {
            const spikeAngle = (Math.PI * 2 / 6) * i + icePhase * 0.5;
            const spikeLen = 4 + Math.sin(icePhase + i) * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(spikeAngle) * 5, Math.sin(spikeAngle) * 5);
            ctx.lineTo(Math.cos(spikeAngle) * (5 + spikeLen), Math.sin(spikeAngle) * (5 + spikeLen));
            ctx.stroke();
          }
          
          // Frost trail
          ctx.fillStyle = 'rgba(136, 238, 255, 0.4)';
          ctx.beginPath();
          ctx.ellipse(-10, 0, 8, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Snowflake particles
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          for (let i = 0; i < 4; i++) {
            const snowAngle = icePhase + i * Math.PI / 2;
            const snowDist = 8 + Math.sin(snowAngle * 2) * 3;
            ctx.beginPath();
            ctx.arc(-snowDist + Math.cos(snowAngle) * 2, Math.sin(snowAngle) * 3, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          
          ctx.restore();
        } else if (bullet.aimed) {
          // Turret bullet (cyan - aimed shot)
          ctx.save();
          ctx.translate(bullet.x, bullet.y);
          ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
          
          ctx.fillStyle = '#00ffff';
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = reducedBulletEffects ? 6 : 12;
          ctx.beginPath();
          ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Core - skip in reduced mode
          if (!reducedBulletEffects) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(2, 0, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          
          ctx.restore();
        } else if (bullet.fromBehind) {
          // Ambush bullet (colored by polarity - coming from behind)
          const bulletPolarity = bullet.polarity || 'light';
          const bulletColor = bulletPolarity === 'light' ? '#ffffff' : '#8B00FF';
          const bulletGlow = bulletPolarity === 'light' ? '#aaaaff' : '#4B0082';
          ctx.fillStyle = bulletColor;
          ctx.shadowColor = bulletGlow;
          ctx.shadowBlur = reducedBulletEffects ? 5 : 10;
          ctx.fillRect(bullet.x, bullet.y, ENEMY_BULLET_WIDTH, ENEMY_BULLET_HEIGHT);
          // Bullet trail (on left side since moving right) - skip in reduced mode
          if (!reducedBulletEffects) {
            ctx.fillStyle = bulletPolarity === 'light' ? '#ccccff' : '#6B00AA';
            ctx.fillRect(bullet.x - 6, bullet.y + 1, 6, ENEMY_BULLET_HEIGHT - 2);
          }
        } else if (bullet.type === 'miniboss') {
          // Mini-boss bullet - colorful plasma shot
          ctx.save();
          ctx.translate(bullet.x, bullet.y);
          ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
          
          ctx.shadowColor = bullet.color || '#ff00ff';
          ctx.shadowBlur = 15;
          
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.5, bullet.color || '#ff00ff');
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        } else if (bullet.type === 'bomb') {
          // Bomb - large sphere with glow
          ctx.save();
          ctx.shadowColor = bullet.color || '#ffaa00';
          ctx.shadowBlur = 20;
          
          const size = Math.max(1, bullet.size || 12);
          const gradient = ctx.createRadialGradient(bullet.x, bullet.y, 0, bullet.x, bullet.y, size);
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.3, '#ffff00');
          gradient.addColorStop(0.7, '#ff6600');
          gradient.addColorStop(1, '#aa0000');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(bullet.x, bullet.y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Fuse spark
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bullet.x - size * 0.6, bullet.y - size * 0.6, 3, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        } else if (bullet.type === 'laser') {
          // Laser beam - horizontal bar
          ctx.save();
          const w = bullet.width || 250;
          const h = bullet.height || 10;
          
          ctx.shadowColor = bullet.color || '#00ffff';
          ctx.shadowBlur = 25;
          
          const gradient = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x + w, bullet.y);
          gradient.addColorStop(0, 'rgba(255,255,255,0)');
          gradient.addColorStop(0.1, bullet.color || '#00ffff');
          gradient.addColorStop(0.9, bullet.color || '#00ffff');
          gradient.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(bullet.x, bullet.y, w, h);
          
          // Core
          const coreGrad = ctx.createLinearGradient(bullet.x, bullet.y + h/4, bullet.x + w, bullet.y + h/4);
          coreGrad.addColorStop(0, 'rgba(255,255,255,0)');
          coreGrad.addColorStop(0.2, '#ffffff');
          coreGrad.addColorStop(0.8, '#ffffff');
          coreGrad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = coreGrad;
          ctx.fillRect(bullet.x, bullet.y + h/4, w, h/2);
          
          ctx.restore();
        } else if (bullet.type === 'spiral') {
          // Spiral bullet - glowing magenta orb
          ctx.save();
          ctx.translate(bullet.x, bullet.y);
          
          ctx.shadowColor = '#ff00ff';
          ctx.shadowBlur = 12;
          
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.4, '#ff88ff');
          gradient.addColorStop(1, '#ff00ff');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          
          // Rotating trail
          ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
          ctx.lineWidth = 2;
          const trailAngle = Math.atan2(bullet.vy, bullet.vx) + Math.PI;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(trailAngle) * 10, Math.sin(trailAngle) * 10);
          ctx.stroke();
          
          ctx.restore();
        } else if (bullet.type === 'wave') {
          // Wave bullet - undulating energy shot
          ctx.save();
          ctx.translate(bullet.x, bullet.y);
          
          ctx.shadowColor = '#00ffaa';
          ctx.shadowBlur = 10;
          
          // Main orb
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 7);
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.4, '#88ffcc');
          gradient.addColorStop(1, '#00ffaa');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          
          // Wave trail
          ctx.strokeStyle = 'rgba(0, 255, 170, 0.6)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const tx = i * 4;
            const ty = Math.sin(bullet.wavePhase - i * 0.5) * 5;
            if (i === 0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
          }
          ctx.stroke();
          
          ctx.restore();
        } else if (bullet.type === 'sniper') {
          // Sniper bullet - fast red tracer
          ctx.save();
          ctx.translate(bullet.x, bullet.y);
          ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
          
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 15;
          
          // Long tracer effect
          const gradient = ctx.createLinearGradient(-30, 0, 10, 0);
          gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
          gradient.addColorStop(0.5, 'rgba(255, 100, 100, 0.5)');
          gradient.addColorStop(1, '#ff0000');
          ctx.fillStyle = gradient;
          ctx.fillRect(-30, -3, 40, 6);
          
          // Bullet core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(5, 0, 4, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Bright tip
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(8, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        } else {
          // Regular enemy bullet (colored by polarity)
          const bulletPolarity = bullet.polarity || 'light';
          const bulletColor = bulletPolarity === 'light' ? '#ffffff' : '#8B00FF';
          const bulletGlow = bulletPolarity === 'light' ? '#aaaaff' : '#4B0082';
          const trailColor = bulletPolarity === 'light' ? '#ccccff' : '#6B00AA';
          ctx.fillStyle = bulletColor;
          ctx.shadowColor = bulletGlow;
          ctx.shadowBlur = 8;
          ctx.fillRect(bullet.x, bullet.y, ENEMY_BULLET_WIDTH, ENEMY_BULLET_HEIGHT);
          // Bullet trail
          ctx.fillStyle = trailColor;
          ctx.fillRect(bullet.x + ENEMY_BULLET_WIDTH, bullet.y + 1, 6, ENEMY_BULLET_HEIGHT - 2);
        }
      });
      ctx.shadowBlur = 0;

      // Draw Force bullets with level-based colors and effects
      forceBulletsRef.current.forEach(bullet => {
        if (!isFinite(bullet.x) || !isFinite(bullet.y)) return;
        ctx.save();
        
        const bulletColor = bullet.color || '#ff8800';
        const bulletLevel = bullet.level || 1;
        const isHoming = bullet.homing;
        
        ctx.shadowColor = bulletColor;
        ctx.shadowBlur = 10 + bulletLevel * 2;
        
        // Create gradient based on bullet level
        const gradient = ctx.createRadialGradient(bullet.x, bullet.y, 0, bullet.x, bullet.y, 5 + bulletLevel);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, bulletColor);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4 + bulletLevel, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail - longer for higher levels
        const angle = Math.atan2(bullet.vy, bullet.vx);
        const trailLength = 6 + bulletLevel * 3;
        
        // Convert hex to rgba for trail
        let trailColor = 'rgba(255, 136, 0, 0.5)';
        if (bulletColor.startsWith('#')) {
          const hex = bulletColor.slice(1);
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          trailColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
        }
        ctx.fillStyle = trailColor;
        ctx.beginPath();
        ctx.ellipse(
          bullet.x - Math.cos(angle) * trailLength,
          bullet.y - Math.sin(angle) * trailLength,
          trailLength, 3, angle, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Homing bullets get a special indicator ring
        if (isHoming) {
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(bullet.x, bullet.y, 8, 0, Math.PI * 2);
          ctx.stroke();
          
          // Spinning particles for homing effect
          const spinAngle = (Date.now() / 100) % (Math.PI * 2);
          for (let i = 0; i < 3; i++) {
            const pAngle = spinAngle + (i * Math.PI * 2 / 3);
            const px = bullet.x + Math.cos(pAngle) * 10;
            const py = bullet.y + Math.sin(pAngle) * 10;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // Level 3+ gets electric sparks
        if (bulletLevel >= 3 && Math.random() < 0.3) {
          ctx.strokeStyle = bulletColor;
          ctx.lineWidth = 1;
          const sparkAngle = Math.random() * Math.PI * 2;
          const sparkLen = 5 + Math.random() * 5;
          ctx.beginPath();
          ctx.moveTo(bullet.x, bullet.y);
          ctx.lineTo(
            bullet.x + Math.cos(sparkAngle) * sparkLen,
            bullet.y + Math.sin(sparkAngle) * sparkLen
          );
          ctx.stroke();
        }
        
        ctx.restore();
      });

      // Draw missiles
      missilesRef.current.forEach(missile => {
        // Skip missiles with non-finite positions
        if (!isFinite(missile.x) || !isFinite(missile.y)) return;
        
        ctx.save();
        ctx.translate(missile.x + MISSILE_WIDTH / 2, missile.y + MISSILE_HEIGHT / 2);
        ctx.rotate(missile.angle || 0);
        
        // Enhanced exhaust trail glow
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 15;
        
        // Outer flame trail
        const flameGrad = ctx.createLinearGradient(-MISSILE_WIDTH / 2 - 20, 0, -MISSILE_WIDTH / 2, 0);
        flameGrad.addColorStop(0, 'rgba(255, 100, 0, 0)');
        flameGrad.addColorStop(0.5, 'rgba(255, 150, 0, 0.6)');
        flameGrad.addColorStop(1, '#ffff00');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.ellipse(-MISSILE_WIDTH / 2 - 8, 0, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Missile body gradient
        const bodyGrad = ctx.createLinearGradient(0, -MISSILE_HEIGHT / 2, 0, MISSILE_HEIGHT / 2);
        bodyGrad.addColorStop(0, '#ff8844');
        bodyGrad.addColorStop(0.5, '#ff6600');
        bodyGrad.addColorStop(1, '#cc4400');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(-MISSILE_WIDTH / 2, -MISSILE_HEIGHT / 2, MISSILE_WIDTH, MISSILE_HEIGHT);
        
        // Missile head
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(MISSILE_WIDTH / 2, 0);
        ctx.lineTo(MISSILE_WIDTH / 2 - 5, -MISSILE_HEIGHT / 2);
        ctx.lineTo(MISSILE_WIDTH / 2 - 5, MISSILE_HEIGHT / 2);
        ctx.closePath();
        ctx.fill();
        
        // Bright core flame
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-MISSILE_WIDTH / 2 - 2, 0, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      // Draw off-screen enemy warning indicators
      ctx.save();
      enemiesRef.current.forEach(enemy => {
        if (!isFinite(enemy.x) || !isFinite(enemy.y)) return;
        
        const ew = enemy.width || ENEMY_WIDTH;
        const eh = enemy.height || ENEMY_HEIGHT;
        const isOffScreenRight = enemy.x > GAME_WIDTH;
        const isOffScreenLeft = enemy.x + ew < 0;
        const isOnScreen = !isOffScreenRight && !isOffScreenLeft;
        
        if (!isOnScreen) {
          // Draw warning arrow at edge of screen
          const arrowY = Math.max(20, Math.min(GAME_HEIGHT - 20, enemy.y + eh / 2));
          const arrowX = isOffScreenRight ? GAME_WIDTH - 15 : 15;
          const arrowDirection = isOffScreenRight ? -1 : 1; // -1 = point left, 1 = point right
          
          // Pulsing effect
          const pulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
          ctx.globalAlpha = pulse;
          
          // Danger color based on enemy type
          const isDangerous = enemy.type === 'heavy' || enemy.type === 'bomber' || enemy.type === 'sniper';
          ctx.fillStyle = isDangerous ? '#ff4444' : '#ffaa00';
          ctx.strokeStyle = isDangerous ? '#ff0000' : '#ff6600';
          ctx.lineWidth = 2;
          
          // Draw triangle arrow
          ctx.beginPath();
          ctx.moveTo(arrowX + arrowDirection * 10, arrowY);
          ctx.lineTo(arrowX - arrowDirection * 5, arrowY - 10);
          ctx.lineTo(arrowX - arrowDirection * 5, arrowY + 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          
          ctx.globalAlpha = 1;
        }
      });
      ctx.restore();
      
      // Draw enemies
      let renderCounter = 0;
      enemiesRef.current.forEach(enemy => {
        // Guard against non-finite coordinates
        if (!isFinite(enemy.x) || !isFinite(enemy.y)) return;
        
        // DEBUG: Log first enemy render position
        const isFirst = renderCounter === 0;
        renderCounter++;
        if (isFirst) {
        }
        
        ctx.save();
        const ex = enemy.x;
        const ey = enemy.y;
        const ew = Math.max(1, enemy.width || ENEMY_WIDTH);
        const eh = Math.max(1, enemy.height || ENEMY_HEIGHT);
        const centerY = ey + eh / 2;
        const centerX = ex + ew / 2;
        
        if (enemy.type === 'heavy') {
          // HEAVY ENEMY - Large cannon ship
          // Engine glow (dual large)
          ctx.shadowColor = '#ff4400';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#ff6600';
          ctx.beginPath();
          ctx.ellipse(ex + ew + 8, ey + eh * 0.3, 12, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(ex + ew + 8, ey + eh * 0.7, 12, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Main armored body
          const heavyGrad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
          heavyGrad.addColorStop(0, '#443322');
          heavyGrad.addColorStop(0.3, '#665544');
          heavyGrad.addColorStop(0.5, '#887766');
          heavyGrad.addColorStop(0.7, '#665544');
          heavyGrad.addColorStop(1, '#443322');
          ctx.fillStyle = heavyGrad;
          
          // Bulky hull shape
          ctx.beginPath();
          ctx.moveTo(ex + 10, centerY);
          ctx.lineTo(ex + 20, ey + 5);
          ctx.lineTo(ex + ew - 15, ey + 5);
          ctx.lineTo(ex + ew, ey + eh * 0.25);
          ctx.lineTo(ex + ew, ey + eh * 0.75);
          ctx.lineTo(ex + ew - 15, ey + eh - 5);
          ctx.lineTo(ex + 20, ey + eh - 5);
          ctx.closePath();
          ctx.fill();
          
          // Armor plates
          ctx.strokeStyle = '#554433';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Cannon mount (front)
          ctx.fillStyle = '#333333';
          ctx.fillRect(ex - 5, centerY - 8, 20, 16);
          
          // Cannon barrel
          ctx.fillStyle = '#444444';
          ctx.fillRect(ex - 15, centerY - 4, 15, 8);
          
          // Cannon tip glow
          ctx.shadowColor = '#ff8800';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.arc(ex - 15, centerY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Bridge/cockpit
          ctx.fillStyle = '#222222';
          ctx.beginPath();
          ctx.moveTo(ex + ew * 0.3, centerY - 8);
          ctx.lineTo(ex + ew * 0.5, centerY - 12);
          ctx.lineTo(ex + ew * 0.6, centerY - 8);
          ctx.lineTo(ex + ew * 0.6, centerY + 8);
          ctx.lineTo(ex + ew * 0.5, centerY + 12);
          ctx.lineTo(ex + ew * 0.3, centerY + 8);
          ctx.closePath();
          ctx.fill();
          
          // Red eye
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(ex + ew * 0.45, centerY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Health pips
          for (let i = 0; i < enemy.health; i++) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(ex + 10 + i * 8, ey + eh + 4, 6, 3);
          }
          
        } else if (enemy.type === 'fire') {
          // FIRE ENEMY - Burning elemental ship from carrier
          const firePhase = Date.now() / 100;
          
          // Fiery engine glow
          ctx.shadowColor = '#ff4400';
          ctx.shadowBlur = 25;
          ctx.fillStyle = '#ff6600';
          ctx.beginPath();
          ctx.ellipse(ex + ew + 10, centerY, 15, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.ellipse(ex + ew + 5, centerY, 8, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Main body - fiery gradient
          const fireGrad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
          fireGrad.addColorStop(0, '#ff2200');
          fireGrad.addColorStop(0.3, '#ff6600');
          fireGrad.addColorStop(0.5, '#ffaa00');
          fireGrad.addColorStop(0.7, '#ff6600');
          fireGrad.addColorStop(1, '#ff2200');
          ctx.fillStyle = fireGrad;
          
          // Angular aggressive hull
          ctx.beginPath();
          ctx.moveTo(ex + 5, centerY);
          ctx.lineTo(ex + 15, ey + 3);
          ctx.lineTo(ex + ew - 10, ey + 5);
          ctx.lineTo(ex + ew, ey + eh * 0.3);
          ctx.lineTo(ex + ew + 5, centerY);
          ctx.lineTo(ex + ew, ey + eh * 0.7);
          ctx.lineTo(ex + ew - 10, ey + eh - 5);
          ctx.lineTo(ex + 15, ey + eh - 3);
          ctx.closePath();
          ctx.fill();
          
          // Flame decorations on hull
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 10;
          ctx.strokeStyle = '#ffff00';
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            const flameX = ex + 20 + i * 15;
            const flameHeight = 5 + Math.sin(firePhase + i) * 3;
            ctx.beginPath();
            ctx.moveTo(flameX, ey + 8);
            ctx.lineTo(flameX + 3, ey + 8 - flameHeight);
            ctx.lineTo(flameX + 6, ey + 8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(flameX, ey + eh - 8);
            ctx.lineTo(flameX + 3, ey + eh - 8 + flameHeight);
            ctx.lineTo(flameX + 6, ey + eh - 8);
            ctx.stroke();
          }
          
          // Fire cannon (front)
          ctx.fillStyle = '#440000';
          ctx.fillRect(ex - 10, centerY - 6, 18, 12);
          
          // Cannon tip glow (pulsing fire)
          const firePulse = Math.sin(firePhase * 2) * 0.3 + 0.7;
          ctx.shadowColor = '#ff4400';
          ctx.shadowBlur = 15 * firePulse;
          ctx.fillStyle = '#ff8800';
          ctx.beginPath();
          ctx.arc(ex - 10, centerY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.arc(ex - 10, centerY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Burning eye
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#ff4400';
          ctx.beginPath();
          ctx.arc(ex + ew * 0.4, centerY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex + ew * 0.4, centerY, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Health pips (orange)
          for (let i = 0; i < enemy.health; i++) {
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(ex + 10 + i * 8, ey + eh + 4, 6, 3);
          }
          
        } else if (enemy.type === 'ice') {
          // ICE ENEMY - Frozen elemental ship from carrier
          const icePhase = Date.now() / 150;
          
          // Cold engine glow
          ctx.shadowColor = '#00ccff';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#44ddff';
          ctx.beginPath();
          ctx.ellipse(ex + ew + 8, centerY, 12, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(ex + ew + 4, centerY, 5, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Main body - icy gradient
          const iceGrad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
          iceGrad.addColorStop(0, '#004466');
          iceGrad.addColorStop(0.3, '#0088aa');
          iceGrad.addColorStop(0.5, '#00ccff');
          iceGrad.addColorStop(0.7, '#0088aa');
          iceGrad.addColorStop(1, '#004466');
          ctx.fillStyle = iceGrad;
          
          // Crystalline hull shape
          ctx.beginPath();
          ctx.moveTo(ex + 8, centerY);
          ctx.lineTo(ex + 18, ey + 5);
          ctx.lineTo(ex + ew * 0.4, ey + 2);
          ctx.lineTo(ex + ew - 5, ey + eh * 0.2);
          ctx.lineTo(ex + ew + 3, centerY);
          ctx.lineTo(ex + ew - 5, ey + eh * 0.8);
          ctx.lineTo(ex + ew * 0.4, ey + eh - 2);
          ctx.lineTo(ex + 18, ey + eh - 5);
          ctx.closePath();
          ctx.fill();
          
          // Ice crystal decorations
          ctx.strokeStyle = '#88eeff';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 8;
          // Crystal patterns
          for (let i = 0; i < 4; i++) {
            const crystalX = ex + 15 + i * 12;
            const crystalLen = 4 + Math.cos(icePhase + i * 0.5) * 2;
            ctx.beginPath();
            ctx.moveTo(crystalX, centerY - crystalLen);
            ctx.lineTo(crystalX, centerY + crystalLen);
            ctx.stroke();
          }
          
          // Frost cannon (front)
          ctx.fillStyle = '#003344';
          ctx.fillRect(ex - 8, centerY - 5, 16, 10);
          
          // Cannon tip glow (icy pulse)
          const icePulse = Math.sin(icePhase * 1.5) * 0.3 + 0.7;
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 12 * icePulse;
          ctx.fillStyle = '#00ddff';
          ctx.beginPath();
          ctx.arc(ex - 8, centerY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex - 8, centerY, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Frozen eye
          ctx.shadowColor = '#00aaff';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#44ddff';
          ctx.beginPath();
          ctx.arc(ex + ew * 0.35, centerY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex + ew * 0.35 - 1, centerY - 1, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Snowflake particles around ship
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          for (let i = 0; i < 5; i++) {
            const snowAngle = icePhase + i * Math.PI * 2 / 5;
            const snowDist = 20 + Math.sin(icePhase * 2 + i) * 5;
            const snowX = centerX + Math.cos(snowAngle) * snowDist;
            const snowY = centerY + Math.sin(snowAngle) * snowDist * 0.6;
            ctx.beginPath();
            ctx.arc(snowX, snowY, 2, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Health pips (cyan)
          for (let i = 0; i < enemy.health; i++) {
            ctx.fillStyle = '#00ddff';
            ctx.fillRect(ex + 10 + i * 8, ey + eh + 4, 6, 3);
          }
          
        } else if (enemy.type === 'turret') {
          // STATIC TURRET - Rotating gun platform
          // Base platform (octagonal)
          const baseGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, ew / 2);
          baseGrad.addColorStop(0, '#555555');
          baseGrad.addColorStop(0.5, '#333333');
          baseGrad.addColorStop(1, '#222222');
          ctx.fillStyle = baseGrad;
          
          // Draw octagon base
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 - Math.PI / 8;
            const radius = ew / 2;
            const px = centerX + Math.cos(angle) * radius;
            const py = centerY + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          
          // Base ring
          ctx.strokeStyle = '#666666';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Inner ring
          ctx.strokeStyle = '#00aaaa';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ew / 4, 0, Math.PI * 2);
          ctx.stroke();
          
          // Rotating gun barrel
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(enemy.angle);
          
          // Gun barrel
          const barrelGrad = ctx.createLinearGradient(0, -5, 0, 5);
          barrelGrad.addColorStop(0, '#444444');
          barrelGrad.addColorStop(0.5, '#888888');
          barrelGrad.addColorStop(1, '#444444');
          ctx.fillStyle = barrelGrad;
          ctx.fillRect(0, -4, ew / 2 + 8, 8);
          
          // Barrel tip (glowing)
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#00ffff';
          ctx.beginPath();
          ctx.arc(ew / 2 + 8, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Gun housing
          ctx.fillStyle = '#555555';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#777777';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.restore();
          
          // Warning indicator (pulses)
          const pulse = Math.sin(Date.now() / 100) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + pulse * 0.3})`;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ew / 2 + 5 + pulse * 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Health indicator (for multi-hit turrets)
          if (enemy.health > 1) {
            ctx.fillStyle = '#00ff00';
            for (let i = 0; i < enemy.health; i++) {
              ctx.beginPath();
              ctx.arc(centerX - 8 + i * 8, ey + eh + 8, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          
        } else if (enemy.type === 'ambush') {
          // AMBUSH ENEMY - Flanker design (faces right, comes from behind)
          // Engine glow (on left side since facing right)
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 15;
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.ellipse(ex - 5, centerY, 8, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Main body gradient - yellow/orange danger colors
          const ambushGrad = ctx.createLinearGradient(ex, ey, ex + ew, ey + eh);
          ambushGrad.addColorStop(0, '#aa6600');
          ambushGrad.addColorStop(0.3, '#ffaa00');
          ambushGrad.addColorStop(0.5, '#ffcc00');
          ambushGrad.addColorStop(0.7, '#ffaa00');
          ambushGrad.addColorStop(1, '#aa6600');
          ctx.fillStyle = ambushGrad;
          
          // Pointed nose (facing RIGHT)
          ctx.beginPath();
          ctx.moveTo(ex + ew, centerY); // Nose on right
          ctx.lineTo(ex + ew * 0.6, ey + 5);
          ctx.lineTo(ex + ew * 0.3, ey + 5);
          ctx.lineTo(ex, ey + eh * 0.3);
          ctx.lineTo(ex, ey + eh * 0.7);
          ctx.lineTo(ex + ew * 0.3, ey + eh - 5);
          ctx.lineTo(ex + ew * 0.6, ey + eh - 5);
          ctx.closePath();
          ctx.fill();
          
          // Top fin
          ctx.fillStyle = '#886600';
          ctx.beginPath();
          ctx.moveTo(ex + ew * 0.5, ey + 5);
          ctx.lineTo(ex + ew * 0.4, ey - 8);
          ctx.lineTo(ex + ew * 0.2, ey + 5);
          ctx.closePath();
          ctx.fill();
          
          // Bottom fin
          ctx.beginPath();
          ctx.moveTo(ex + ew * 0.5, ey + eh - 5);
          ctx.lineTo(ex + ew * 0.4, ey + eh + 8);
          ctx.lineTo(ex + ew * 0.2, ey + eh - 5);
          ctx.closePath();
          ctx.fill();
          
          // Warning stripes
          ctx.fillStyle = '#000000';
          ctx.globalAlpha = 0.3;
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(ex + 10 + i * 12, ey + 8, 4, eh - 16);
          }
          ctx.globalAlpha = 1;
          
          // Cockpit (on right side)
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.moveTo(ex + ew - 8, centerY);
          ctx.lineTo(ex + ew - 18, centerY - 4);
          ctx.lineTo(ex + ew - 22, centerY);
          ctx.lineTo(ex + ew - 18, centerY + 4);
          ctx.closePath();
          ctx.fill();
          
          // Warning eye glow (yellow)
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.arc(ex + ew - 15, centerY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Danger indicator
          if (Math.floor(Date.now() / 200) % 2 === 0) {
            ctx.fillStyle = '#ff0000';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', ex + ew / 2, ey - 5);
          }
          
        } else if (enemy.type === 'fast') {
          // FAST ENEMY - Sleek interceptor design
          // Engine glow
          ctx.shadowColor = '#ff6600';
          ctx.shadowBlur = 15;
          ctx.fillStyle = '#ff4400';
          ctx.beginPath();
          ctx.ellipse(ex + ew + 5, centerY, 8, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Main body gradient
          const fastGrad = ctx.createLinearGradient(ex, ey, ex + ew, ey + eh);
          fastGrad.addColorStop(0, '#cc0000');
          fastGrad.addColorStop(0.3, '#ff3333');
          fastGrad.addColorStop(0.5, '#ff5555');
          fastGrad.addColorStop(0.7, '#ff3333');
          fastGrad.addColorStop(1, '#cc0000');
          ctx.fillStyle = fastGrad;
          
          // Pointed nose
          ctx.beginPath();
          ctx.moveTo(ex, centerY);
          ctx.lineTo(ex + ew * 0.4, ey + 5);
          ctx.lineTo(ex + ew * 0.7, ey + 5);
          ctx.lineTo(ex + ew, ey + eh * 0.3);
          ctx.lineTo(ex + ew, ey + eh * 0.7);
          ctx.lineTo(ex + ew * 0.7, ey + eh - 5);
          ctx.lineTo(ex + ew * 0.4, ey + eh - 5);
          ctx.closePath();
          ctx.fill();
          
          // Top fin
          ctx.fillStyle = '#aa0000';
          ctx.beginPath();
          ctx.moveTo(ex + ew * 0.5, ey + 5);
          ctx.lineTo(ex + ew * 0.6, ey - 8);
          ctx.lineTo(ex + ew * 0.8, ey + 5);
          ctx.closePath();
          ctx.fill();
          
          // Bottom fin
          ctx.beginPath();
          ctx.moveTo(ex + ew * 0.5, ey + eh - 5);
          ctx.lineTo(ex + ew * 0.6, ey + eh + 8);
          ctx.lineTo(ex + ew * 0.8, ey + eh - 5);
          ctx.closePath();
          ctx.fill();
          
          // Cockpit (menacing visor)
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.moveTo(ex + 8, centerY);
          ctx.lineTo(ex + 18, centerY - 4);
          ctx.lineTo(ex + 22, centerY);
          ctx.lineTo(ex + 18, centerY + 4);
          ctx.closePath();
          ctx.fill();
          
          // Red eye glow
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(ex + 15, centerY, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
        } else if (enemy.type === 'spiral') {
          // SPIRAL SHOOTER - Rotating attack ship
          // Spinning energy core glow
          ctx.shadowColor = '#ff00ff';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#ff00ff';
          ctx.beginPath();
          ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Main body - circular with rotating segments
          const spiralGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, ew / 2);
          spiralGrad.addColorStop(0, '#880088');
          spiralGrad.addColorStop(0.5, '#550055');
          spiralGrad.addColorStop(1, '#330033');
          ctx.fillStyle = spiralGrad;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ew / 2 - 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Rotating spiral arms
          ctx.strokeStyle = '#ff00ff';
          ctx.lineWidth = 3;
          for (let i = 0; i < 4; i++) {
            const armAngle = enemy.spiralAngle + (Math.PI / 2) * i;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
              centerX + Math.cos(armAngle) * (ew / 2 + 5),
              centerY + Math.sin(armAngle) * (eh / 2 + 5)
            );
            ctx.stroke();
          }
          
          // Energy ring
          ctx.strokeStyle = '#ff88ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ew / 2 + 3, 0, Math.PI * 2);
          ctx.stroke();
          
          // Health pips
          for (let i = 0; i < enemy.health; i++) {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(ex + 5 + i * 10, ey + eh + 4, 8, 3);
          }
          
        } else if (enemy.type === 'wave') {
          // WAVE SHOOTER - Sinusoidal attack ship
          // Flowing energy trail
          ctx.shadowColor = '#00ffaa';
          ctx.shadowBlur = 15;
          ctx.strokeStyle = '#00ffaa';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < 20; i++) {
            const wx = ex + ew + i * 3;
            const wy = centerY + Math.sin(enemy.wavePhase - i * 0.3) * 8;
            if (i === 0) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
          
          // Main body - fluid shape
          const waveGrad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
          waveGrad.addColorStop(0, '#005544');
          waveGrad.addColorStop(0.3, '#00aa88');
          waveGrad.addColorStop(0.5, '#00ffaa');
          waveGrad.addColorStop(0.7, '#00aa88');
          waveGrad.addColorStop(1, '#005544');
          ctx.fillStyle = waveGrad;
          
          // Wavy body
          ctx.beginPath();
          ctx.moveTo(ex, centerY);
          ctx.bezierCurveTo(ex + 10, ey, ex + ew - 10, ey, ex + ew, centerY);
          ctx.bezierCurveTo(ex + ew - 10, ey + eh, ex + 10, ey + eh, ex, centerY);
          ctx.fill();
          
          // Core
          ctx.fillStyle = '#00ffaa';
          ctx.shadowColor = '#00ffaa';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Oscillating eye
          const eyeOffset = Math.sin(enemy.wavePhase) * 3;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex + 10, centerY + eyeOffset, 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Health pips
          for (let i = 0; i < enemy.health; i++) {
            ctx.fillStyle = '#00ffaa';
            ctx.fillRect(ex + 5 + i * 10, ey + eh + 4, 8, 3);
          }
          
        } else if (enemy.type === 'sniper') {
          // SNIPER - Precision shooter with targeting laser
            const laserColor = enemy.fromBehind ? '0, 255, 0' : '255, 0, 0'; // Green for behind, red for normal
          if (enemy.targeting) {
            const laserLength = 400;
            const laserStartX = enemy.fromBehind ? enemy.x + ew : enemy.x;
            const laserEndX = laserStartX + Math.cos(enemy.targetAngle) * laserLength;
            const laserEndY = enemy.y + ENEMY_HEIGHT / 2 + Math.sin(enemy.targetAngle) * laserLength;
            
            // Pulsing laser sight
            const pulse = Math.sin(enemy.targetTimer * 0.3) * 0.3 + 0.7;
            ctx.strokeStyle = `rgba(${laserColor}, ${pulse * 0.5})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(laserStartX, enemy.y + ENEMY_HEIGHT / 2);
            ctx.lineTo(laserEndX, laserEndY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Targeting reticle on player
            const targetX = player.x + PLAYER_WIDTH / 2;
            const targetY = player.y + PLAYER_HEIGHT / 2;
            ctx.strokeStyle = `rgba(${laserColor}, ${pulse})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(targetX, targetY, 15 + (1 - enemy.targetTimer / enemy.targetDuration) * 20, 0, Math.PI * 2);
            ctx.stroke();
            // Crosshairs
            ctx.beginPath();
            ctx.moveTo(targetX - 20, targetY);
            ctx.lineTo(targetX + 20, targetY);
            ctx.moveTo(targetX, targetY - 20);
            ctx.lineTo(targetX, targetY + 20);
            ctx.stroke();
          }
          
          // Main body - angular sniper design
          const sniperGrad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
          sniperGrad.addColorStop(0, enemy.fromBehind ? '#114411' : '#441111');
          sniperGrad.addColorStop(0.5, enemy.fromBehind ? '#228822' : '#882222');
          sniperGrad.addColorStop(1, enemy.fromBehind ? '#114411' : '#441111');
          ctx.fillStyle = sniperGrad;
          
          // Body - flip for from behind
          ctx.beginPath();
          if (enemy.fromBehind) {
            // Mirrored body facing right
            ctx.moveTo(ex + ew, centerY - 5);
            ctx.lineTo(ex + ew - 10, ey + 3);
            ctx.lineTo(ex + 5, ey + 3);
            ctx.lineTo(ex, centerY);
            ctx.lineTo(ex + 5, ey + eh - 3);
            ctx.lineTo(ex + ew - 10, ey + eh - 3);
            ctx.lineTo(ex + ew, centerY + 5);
          } else {
            ctx.moveTo(ex, centerY - 5);
            ctx.lineTo(ex + 10, ey + 3);
            ctx.lineTo(ex + ew - 5, ey + 3);
            ctx.lineTo(ex + ew, centerY);
            ctx.lineTo(ex + ew - 5, ey + eh - 3);
            ctx.lineTo(ex + 10, ey + eh - 3);
            ctx.lineTo(ex, centerY + 5);
          }
          ctx.closePath();
          ctx.fill();
          
          // Long barrel - flip for from behind
          ctx.fillStyle = '#333333';
          if (enemy.fromBehind) {
            ctx.fillRect(ex + ew - 5, centerY - 2, 30, 4);
          } else {
            ctx.fillRect(ex - 25, centerY - 2, 30, 4);
          }
          
          // Barrel tip (glows when targeting)
          if (enemy.targeting) {
            ctx.shadowColor = enemy.fromBehind ? '#00ff00' : '#ff0000';
            ctx.shadowBlur = 15;
            ctx.fillStyle = enemy.fromBehind ? '#00ff00' : '#ff0000';
          } else {
            ctx.fillStyle = '#666666';
          }
          ctx.beginPath();
          ctx.arc(enemy.fromBehind ? ex + ew + 25 : ex - 25, centerY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Scope - flip for from behind
          ctx.fillStyle = '#222222';
          if (enemy.fromBehind) {
            ctx.fillRect(ex + ew - 20, ey - 3, 12, 6);
            ctx.strokeStyle = '#44ff44';
            ctx.lineWidth = 1;
            ctx.strokeRect(ex + ew - 20, ey - 3, 12, 6);
            // Scope lens
            ctx.fillStyle = enemy.targeting ? '#00ff00' : '#004400';
            ctx.fillRect(ex + ew - 18, ey - 1, 3, 2);
          } else {
            ctx.fillRect(ex + 8, ey - 3, 12, 6);
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 1;
            ctx.strokeRect(ex + 8, ey - 3, 12, 6);
            // Scope lens
            ctx.fillStyle = enemy.targeting ? '#ff0000' : '#440000';
            ctx.fillRect(ex + 10, ey - 1, 3, 2);
          }
          
          // Health pips
          for (let i = 0; i < enemy.health; i++) {
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(ex + 5 + i * 10, ey + eh + 4, 8, 3);
          }
          
        } else if (enemy.type === 'flyby') {
          // FLYBY FORMATION ENEMY - Animated squadron entering the battle
          const glowColor = enemy.glowColor || '#ff4488';
          const pathProgress = Math.max(0, enemy.pathProgress / enemy.pathDuration);
          
          // Invincibility shimmer effect during flyby
          if (enemy.invincible) {
            ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 50) * 0.3;
          }
          
          // Dramatic trail effect during path animation
          if (pathProgress < 1) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 20 + Math.sin(Date.now() / 100) * 10;
            
            // Motion trail
            const trailLength = 5;
            for (let t = 1; t <= trailLength; t++) {
              ctx.globalAlpha = (1 - t / trailLength) * 0.3;
              ctx.fillStyle = glowColor;
              ctx.beginPath();
              ctx.arc(ex + ew/2 + t * 8, centerY, 4, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = enemy.invincible ? 0.8 : 1;
          }
          
          // Engine glow - intense during flyby
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 15;
          ctx.fillStyle = glowColor;
          ctx.beginPath();
          ctx.ellipse(ex + ew + 5, centerY, 8 + Math.sin(Date.now() / 80) * 3, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Secondary engine trails
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(ex + ew + 10, centerY - 4, 4, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(ex + ew + 10, centerY + 4, 4, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Main body - sleek fighter with color accent
          const flybyGrad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
          flybyGrad.addColorStop(0, '#222233');
          flybyGrad.addColorStop(0.3, '#334455');
          flybyGrad.addColorStop(0.5, '#445566');
          flybyGrad.addColorStop(0.7, '#334455');
          flybyGrad.addColorStop(1, '#222233');
          ctx.fillStyle = flybyGrad;
          
          // Angular fighter body
          ctx.beginPath();
          ctx.moveTo(ex - 5, centerY);
          ctx.lineTo(ex + 10, ey + 2);
          ctx.lineTo(ex + ew - 5, ey + 2);
          ctx.lineTo(ex + ew + 5, centerY);
          ctx.lineTo(ex + ew - 5, ey + eh - 2);
          ctx.lineTo(ex + 10, ey + eh - 2);
          ctx.closePath();
          ctx.fill();
          
          // Color accent stripes
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ex + 5, centerY);
          ctx.lineTo(ex + ew - 5, centerY);
          ctx.stroke();
          
          // Wing tips with glow color
          ctx.fillStyle = glowColor;
          ctx.beginPath();
          ctx.moveTo(ex + 8, ey + 2);
          ctx.lineTo(ex + 5, ey - 8);
          ctx.lineTo(ex + 15, ey + 2);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(ex + 8, ey + eh - 2);
          ctx.lineTo(ex + 5, ey + eh + 8);
          ctx.lineTo(ex + 15, ey + eh - 2);
          ctx.closePath();
          ctx.fill();
          
          // Cockpit
          ctx.fillStyle = enemy.invincible ? '#88ffff' : '#44aaaa';
          ctx.beginPath();
          ctx.ellipse(ex + ew * 0.35, centerY, 6, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Shield indicator when invincible
          if (enemy.invincible) {
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
            ctx.beginPath();
            ctx.arc(ex + ew/2, centerY, ew * 0.6, 0, Math.PI * 2);
            ctx.stroke();
          }
          
          ctx.globalAlpha = 1;
          
        } else if (enemy.type === 'formation') {
          // FORMATION ENEMY - Coordinated squadron unit
          // Formation indicator glow - get color from formation
          const formation = formationsRef.current[enemy.formationId];
          const formationColor = formation ? formation.color : '#00ff88';
          
          // Engine glow
          ctx.shadowColor = formationColor;
          ctx.shadowBlur = 12;
          ctx.fillStyle = formationColor;
          ctx.beginPath();
          ctx.ellipse(ex + ew + 3, centerY, 6, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Main body gradient - uses formation color theme
          const formGrad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
          formGrad.addColorStop(0, '#004444');
          formGrad.addColorStop(0.3, '#006666');
          formGrad.addColorStop(0.5, '#008888');
          formGrad.addColorStop(0.7, '#006666');
          formGrad.addColorStop(1, '#004444');
          ctx.fillStyle = formGrad;
          
          // Sleek formation fighter body
          ctx.beginPath();
          ctx.moveTo(ex, centerY);
          ctx.lineTo(ex + 12, ey + 4);
          ctx.lineTo(ex + ew - 8, ey + 4);
          ctx.lineTo(ex + ew, centerY);
          ctx.lineTo(ex + ew - 8, ey + eh - 4);
          ctx.lineTo(ex + 12, ey + eh - 4);
          ctx.closePath();
          ctx.fill();
          
          // Formation wing stripes
          ctx.strokeStyle = formationColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ex + 8, ey + 6);
          ctx.lineTo(ex + 15, ey - 6);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ex + 8, ey + eh - 6);
          ctx.lineTo(ex + 15, ey + eh + 6);
          ctx.stroke();
          
          // Leader has special marking
          if (enemy.formationIndex === 0) {
            ctx.shadowColor = formationColor;
            ctx.shadowBlur = 8;
            ctx.strokeStyle = formationColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ex + ew / 2, centerY, 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
          
          // Cockpit
          ctx.fillStyle = '#001122';
          ctx.beginPath();
          ctx.ellipse(ex + 10, centerY, 5, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Eye glow
          ctx.shadowColor = formationColor;
          ctx.shadowBlur = 6;
          ctx.fillStyle = formationColor;
          ctx.beginPath();
          ctx.arc(ex + 10, centerY, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
        } else if (enemy.type === 'shielded') {
          // SHIELDED ENEMY - Armored with energy barrier
          // Engine glow
          ctx.shadowColor = '#0088ff';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#00aaff';
          ctx.beginPath();
          ctx.ellipse(ex + ew + 4, centerY, 7, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Main body - blue/silver armored
          const shieldedGrad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
          shieldedGrad.addColorStop(0, '#334455');
          shieldedGrad.addColorStop(0.3, '#5577aa');
          shieldedGrad.addColorStop(0.5, '#88aacc');
          shieldedGrad.addColorStop(0.7, '#5577aa');
          shieldedGrad.addColorStop(1, '#334455');
          ctx.fillStyle = shieldedGrad;
          
          // Bulky armored hull
          ctx.beginPath();
          ctx.moveTo(ex + 8, centerY);
          ctx.lineTo(ex + 15, ey + 3);
          ctx.lineTo(ex + ew - 10, ey + 3);
          ctx.lineTo(ex + ew, ey + eh * 0.25);
          ctx.lineTo(ex + ew, ey + eh * 0.75);
          ctx.lineTo(ex + ew - 10, ey + eh - 3);
          ctx.lineTo(ex + 15, ey + eh - 3);
          ctx.closePath();
          ctx.fill();
          
          // Armor plating lines
          ctx.strokeStyle = '#4466aa';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ex + 20, ey + 5);
          ctx.lineTo(ex + 20, ey + eh - 5);
          ctx.moveTo(ex + ew - 15, ey + 8);
          ctx.lineTo(ex + ew - 15, ey + eh - 8);
          ctx.stroke();
          
          // Cockpit
          ctx.fillStyle = '#001133';
          ctx.beginPath();
          ctx.ellipse(ex + 12, centerY, 5, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Eye
          ctx.shadowColor = '#00aaff';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#00ccff';
          ctx.beginPath();
          ctx.arc(ex + 12, centerY, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Energy shield bubble (if shield active)
          if (enemy.shield > 0) {
            const shieldAlpha = enemy.shieldFlash > 0 ? 0.6 : 0.3;
            const shieldPulse = Math.sin(Date.now() / 100) * 0.1 + 0.9;
            
            ctx.globalAlpha = shieldAlpha;
            ctx.strokeStyle = enemy.shieldFlash > 0 ? '#ffffff' : '#00aaff';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00aaff';
            ctx.shadowBlur = 15;
            
            // Shield bubble
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, (ew / 2 + 8) * shieldPulse, (eh / 2 + 6) * shieldPulse, 0, 0, Math.PI * 2);
            ctx.stroke();
            
            // Shield segments
            ctx.globalAlpha = shieldAlpha * 0.5;
            for (let i = 0; i < 6; i++) {
              const angle = (i / 6) * Math.PI * 2 + Date.now() / 500;
              const sx = centerX + Math.cos(angle) * (ew / 2 + 5);
              const sy = centerY + Math.sin(angle) * (eh / 2 + 3);
              ctx.beginPath();
              ctx.arc(sx, sy, 4, 0, Math.PI * 2);
              ctx.stroke();
            }
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            
            // Shield strength indicator
            ctx.fillStyle = '#00aaff';
            ctx.font = "8px \"Press Start 2P\", monospace";
            ctx.textAlign = 'center';
            ctx.fillText(`[${enemy.shield}]`, centerX, ey - 8);
          }
          
        } else if (enemy.type === 'cloaked') {
          // CLOAKED ENEMY - Stealth ship
          ctx.globalAlpha = enemy.cloakAlpha || 0.1;
          
          // Shimmer effect when partially visible
          const shimmer = Math.sin(Date.now() / 50 + ex) * 0.1;
          ctx.globalAlpha = Math.max(0.05, (enemy.cloakAlpha || 0.1) + shimmer);
          
          // Engine glow (faint)
          ctx.shadowColor = '#8800ff';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#aa44ff';
          ctx.beginPath();
          ctx.ellipse(ex + ew + 3, centerY, 5, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Main body - dark purple/black stealth
          const cloakGrad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
          cloakGrad.addColorStop(0, '#110022');
          cloakGrad.addColorStop(0.5, '#220044');
          cloakGrad.addColorStop(1, '#110022');
          ctx.fillStyle = cloakGrad;
          
          // Sleek stealth hull
          ctx.beginPath();
          ctx.moveTo(ex, centerY);
          ctx.lineTo(ex + 15, ey + 5);
          ctx.lineTo(ex + ew - 5, ey + 8);
          ctx.lineTo(ex + ew, centerY);
          ctx.lineTo(ex + ew - 5, ey + eh - 8);
          ctx.lineTo(ex + 15, ey + eh - 5);
          ctx.closePath();
          ctx.fill();
          
          // Stealth panels
          ctx.strokeStyle = '#330066';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ex + 10, centerY);
          ctx.lineTo(ex + ew - 10, ey + 10);
          ctx.moveTo(ex + 10, centerY);
          ctx.lineTo(ex + ew - 10, ey + eh - 10);
          ctx.stroke();
          
          // Eye (only visible when revealed)
          if (enemy.cloakAlpha > 0.3) {
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.arc(ex + 8, centerY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          
          ctx.globalAlpha = 1;
          
          // "STEALTH" indicator when cloaked
          if (enemy.cloaked && enemy.cloakAlpha < 0.3) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#aa44ff';
            ctx.font = '6px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️', centerX, ey - 5);
            ctx.globalAlpha = 1;
          }
          
        } else if (enemy.type === 'shielder') {
          // SHIELDER - Cloaked support ship that generates shields
          ctx.globalAlpha = enemy.cloakAlpha || 0.15;
          
          // More visible when actively shielding
          if (enemy.revealTimer > 0) {
            enemy.revealTimer--;
            ctx.globalAlpha = 0.8;
          }
          
          // Shimmer effect
          const shimmer = Math.sin(Date.now() / 40 + ex) * 0.1;
          ctx.globalAlpha = Math.max(0.1, ctx.globalAlpha + shimmer);
          
          // Shield pulse ring when active
          const pulseSize = Math.sin(enemy.shieldPulse) * 5;
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 1;
          ctx.globalAlpha = Math.abs(Math.sin(enemy.shieldPulse)) * 0.5;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 20 + pulseSize, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.globalAlpha = enemy.revealTimer > 0 ? 0.8 : (enemy.cloakAlpha || 0.15);
          
          // Engine glow (cyan - support ship color)
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#00aaaa';
          ctx.beginPath();
          ctx.ellipse(ex + ew + 5, centerY, 6, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Main body - teal/cyan stealth support ship
          const shielderGrad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
          shielderGrad.addColorStop(0, '#003344');
          shielderGrad.addColorStop(0.5, '#005566');
          shielderGrad.addColorStop(1, '#003344');
          ctx.fillStyle = shielderGrad;
          
          // Round support ship hull
          ctx.beginPath();
          ctx.moveTo(ex + 5, centerY);
          ctx.quadraticCurveTo(ex + 5, ey, ex + ew / 2, ey + 3);
          ctx.lineTo(ex + ew - 5, centerY - 5);
          ctx.lineTo(ex + ew, centerY);
          ctx.lineTo(ex + ew - 5, centerY + 5);
          ctx.lineTo(ex + ew / 2, ey + eh - 3);
          ctx.quadraticCurveTo(ex + 5, ey + eh, ex + 5, centerY);
          ctx.closePath();
          ctx.fill();
          
          // Shield generator dish on top
          ctx.fillStyle = '#00ffff';
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(ex + 12, centerY, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Energy lines to dish
          ctx.strokeStyle = '#00aaff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ex + 12, centerY - 5);
          ctx.lineTo(ex + 12, ey + 2);
          ctx.moveTo(ex + 12, centerY + 5);
          ctx.lineTo(ex + 12, ey + eh - 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
          
          ctx.globalAlpha = 1;// "SUPPORT" indicator when visible
          if (enemy.revealTimer > 0) {
            ctx.fillStyle = '#00ffff';
            ctx.font = '6px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SHIELD', centerX, ey - 8);
          }
          
        } else if (enemy.type === 'healer') {
          // HEALER - Support drone that repairs other enemies
          const healPulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
          
          // Healing aura when active
          if (enemy.healCooldown === 0) {
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3 + healPulse * 0.3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, enemy.healRange || 120, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          
          // Green glow
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 15 * healPulse;
          
          // Engine glow (green/white)
          ctx.fillStyle = '#88ffaa';
          ctx.beginPath();
          ctx.ellipse(ex + ew + 5, centerY, 5, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Main body - medical drone (white/green)
          const healerGrad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
          healerGrad.addColorStop(0, '#115533');
          healerGrad.addColorStop(0.5, '#22aa66');
          healerGrad.addColorStop(1, '#115533');
          ctx.fillStyle = healerGrad;
          
          // Rounded drone body
          ctx.beginPath();
          ctx.arc(centerX, centerY, ew / 2 - 2, 0, Math.PI * 2);
          ctx.fill();
          
          // White cross symbol
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(centerX - 2, centerY - 8, 4, 16);
          ctx.fillRect(centerX - 8, centerY - 2, 16, 4);
          
          // Rotating healing ring
          const healAngle = Date.now() / 500;
          ctx.strokeStyle = '#00ff88';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ew / 2 + 3, healAngle, healAngle + Math.PI);
          ctx.stroke();
          
          ctx.shadowBlur = 0;
          
          // "HEALER" label
          ctx.fillStyle = '#00ff88';
          ctx.font = '6px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('HEAL', centerX, ey - 8);
          
        } else if (enemy.type === 'teleporter') {
          // TELEPORTER - Blinks around unpredictably
          const teleportProgress = enemy.teleportCharge / (enemy.teleportChargeMax || 30);
          
          // Teleport charge effect
          if (enemy.teleportCharge > 0) {
            ctx.strokeStyle = '#aa00ff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = teleportProgress;
            for (let ring = 0; ring < 3; ring++) {
              const ringSize = 10 + ring * 8 * teleportProgress;
              ctx.beginPath();
              ctx.arc(centerX, centerY, ringSize, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          }
          
          // Afterimage effect (ghost trail)
          if (enemy.lastX !== undefined && enemy.lastY !== undefined) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#8800ff';
            ctx.beginPath();
            ctx.arc(enemy.lastX + ew / 2, enemy.lastY + eh / 2, ew / 2 - 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          
          // Purple glow
          ctx.shadowColor = '#aa00ff';
          ctx.shadowBlur = 12;
          
          // Engine glow (purple)
          ctx.fillStyle = '#cc44ff';
          ctx.beginPath();
          ctx.ellipse(ex + ew + 4, centerY, 5, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Main body - sleek teleporter ship
          const teleGrad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
          teleGrad.addColorStop(0, '#330066');
          teleGrad.addColorStop(0.5, '#6600aa');
          teleGrad.addColorStop(1, '#330066');
          ctx.fillStyle = teleGrad;
          
          // Angular teleporter body
          ctx.beginPath();
          ctx.moveTo(ex, centerY);
          ctx.lineTo(ex + 10, ey);
          ctx.lineTo(ex + ew - 3, ey + 5);
          ctx.lineTo(ex + ew, centerY);
          ctx.lineTo(ex + ew - 3, ey + eh - 5);
          ctx.lineTo(ex + 10, ey + eh);
          ctx.closePath();
          ctx.fill();
          
          // Warp core center
          ctx.fillStyle = '#ff00ff';
          const coreGlow = Math.sin(Date.now() / 100) * 3 + 5;
          ctx.beginPath();
          ctx.arc(centerX - 3, centerY, coreGlow, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.shadowBlur = 0;
          
          // "WARP" label when charging
          if (enemy.teleportCharge > 15) {
            ctx.fillStyle = '#aa00ff';
            ctx.font = '6px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('WARP', centerX, ey - 8);
          }
          
        } else if (enemy.type === 'splitter') {
          // SPLITTER - Large enemy that splits into smaller ones
          const splitPulse = Math.sin(Date.now() / 300) * 0.2 + 0.8;
          const isLargeSize = enemy.health > 1;
          
          // Unstable energy aura
          ctx.strokeStyle = '#ff8800';
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.3 + splitPulse * 0.3;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ew / 2 + 5 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          
          // Orange glow
          ctx.shadowColor = '#ff8800';
          ctx.shadowBlur = 15 * splitPulse;
          
          // Main body gradient (orange/yellow)
          const splitGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, ew / 2);
          splitGrad.addColorStop(0, '#ffcc00');
          splitGrad.addColorStop(0.5, '#ff8800');
          splitGrad.addColorStop(1, '#aa4400');
          ctx.fillStyle = splitGrad;
          
          // Cell-like body
          ctx.beginPath();
          ctx.arc(centerX, centerY, ew / 2 - 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Division line showing split potential
          ctx.strokeStyle = '#ffff00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX, ey + 3);
          ctx.lineTo(centerX, ey + eh - 3);
          ctx.stroke();
          
          // Two nuclei showing it will split
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(centerX - 6, centerY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX + 6, centerY, 4, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.shadowBlur = 0;
          
          // "SPLIT" warning
          ctx.fillStyle = '#ff8800';
          ctx.font = '6px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('SPLIT', centerX, ey - 8);
          
        } else if (enemy.type === 'mine') {
          // MINE - Slowly homes toward player, explodes on contact
          const armProgress = enemy.armed ? 1 : (enemy.armTimer || 0) / (enemy.armingTime || 60);
          const minePulse = Math.sin(Date.now() / (enemy.armed ? 100 : 300)) * 0.4 + 0.6;
          
          // Danger radius when armed
          if (enemy.armed) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.2 + minePulse * 0.2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(centerX, centerY, enemy.explosionRadius || 100, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
          }
          
          // Glow color changes when armed
          ctx.shadowColor = enemy.armed ? '#ff0000' : '#ffaa00';
          ctx.shadowBlur = 20 * minePulse;
          
          // Mine body (spherical)
          const mineGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, ew / 2);
          if (enemy.armed) {
            mineGrad.addColorStop(0, '#ff4444');
            mineGrad.addColorStop(0.5, '#aa0000');
            mineGrad.addColorStop(1, '#550000');
          } else {
            mineGrad.addColorStop(0, '#ffcc44');
            mineGrad.addColorStop(0.5, '#aa8800');
            mineGrad.addColorStop(1, '#554400');
          }
          ctx.fillStyle = mineGrad;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, ew / 2 - 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Spikes around mine
          ctx.fillStyle = enemy.armed ? '#ff0000' : '#ffaa00';
          for (let spike = 0; spike < 8; spike++) {
            const spikeAngle = (spike / 8) * Math.PI * 2 + Date.now() / 1000;
            const spikeX = centerX + Math.cos(spikeAngle) * (ew / 2 - 1);
            const spikeY = centerY + Math.sin(spikeAngle) * (ew / 2 - 1);
            ctx.beginPath();
            ctx.arc(spikeX, spikeY, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Center warning light
          if (enemy.armed && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = '#ffffff';
          } else {
            ctx.fillStyle = enemy.armed ? '#ff0000' : '#ffaa00';
          }
          ctx.beginPath();
          ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.shadowBlur = 0;
          
          // Arming progress bar
          if (!enemy.armed && armProgress > 0) {
            ctx.fillStyle = '#333333';
            ctx.fillRect(ex, ey - 8, ew, 4);
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(ex, ey - 8, ew * armProgress, 4);
          }
          
          // "ARMED" warning
          if (enemy.armed) {
            ctx.fillStyle = '#ff0000';
            ctx.font = '6px monospace';
            ctx.textAlign = 'center';
            if (Math.floor(Date.now() / 200) % 2 === 0) {
              ctx.fillText('ARMED', centerX, ey - 10);
            }
          }
          
        } else if (enemy.type === 'bomber') {
          // SUICIDE BOMBER - Dangerous explosive enemy
          const pulse = Math.sin(enemy.pulsePhase || 0) * 0.3 + 0.7;
          
          // Warning glow
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 20 * pulse;
          
          // Engine trail
          ctx.fillStyle = '#ff4400';
          ctx.beginPath();
          ctx.ellipse(ex + ew + 10, centerY, 12, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Main body - red/black danger colors
          const bomberGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, ew / 2);
          bomberGrad.addColorStop(0, '#ff4400');
          bomberGrad.addColorStop(0.5, '#aa0000');
          bomberGrad.addColorStop(1, '#440000');
          ctx.fillStyle = bomberGrad;
          
          // Round bomb body
          ctx.beginPath();
          ctx.arc(centerX, centerY, ew / 2 - 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Danger stripes
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ex + 5, centerY - 5);
          ctx.lineTo(ex + ew - 5, centerY - 5);
          ctx.moveTo(ex + 5, centerY + 5);
          ctx.lineTo(ex + ew - 5, centerY + 5);
          ctx.stroke();
          
          // Flashing warning light
          if (Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = '#ffffff';
          } else {
            ctx.fillStyle = '#ff0000';
          }
          ctx.beginPath();
          ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Skull icon
          ctx.fillStyle = '#ffffff';
          ctx.font = "bold 10px monospace";
          ctx.textAlign = 'center';
          ctx.fillText('?', centerX, centerY + 4);
          
          ctx.shadowBlur = 0;
          
          // "DANGER" text
          ctx.fillStyle = '#ff0000';
          ctx.font = "6px \"Press Start 2P\", monospace";
          ctx.textAlign = 'center';
          if (Math.floor(Date.now() / 200) % 2 === 0) {
            ctx.fillText('DANGER', centerX, ey - 8);
          }
          
        } else {
          // NORMAL ENEMY - Heavy fighter design
          // Engine glows (dual)
          ctx.shadowColor = '#ff00ff';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#ff44ff';
          ctx.beginPath();
          ctx.ellipse(ex + ew + 3, ey + eh * 0.3, 6, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(ex + ew + 3, ey + eh * 0.7, 6, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Main body gradient
          const normalGrad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
          normalGrad.addColorStop(0, '#660066');
          normalGrad.addColorStop(0.3, '#aa00aa');
          normalGrad.addColorStop(0.5, '#dd00dd');
          normalGrad.addColorStop(0.7, '#aa00aa');
          normalGrad.addColorStop(1, '#660066');
          ctx.fillStyle = normalGrad;
          
          // Armored hull
          ctx.beginPath();
          ctx.moveTo(ex + 5, centerY);
          ctx.lineTo(ex + 15, ey);
          ctx.lineTo(ex + ew - 5, ey);
          ctx.lineTo(ex + ew, ey + eh * 0.2);
          ctx.lineTo(ex + ew, ey + eh * 0.8);
          ctx.lineTo(ex + ew - 5, ey + eh);
          ctx.lineTo(ex + 15, ey + eh);
          ctx.closePath();
          ctx.fill();
          
          // Wing plates
          ctx.fillStyle = '#880088';
          ctx.beginPath();
          ctx.moveTo(ex + 20, ey);
          ctx.lineTo(ex + 30, ey - 10);
          ctx.lineTo(ex + ew - 10, ey - 5);
          ctx.lineTo(ex + ew - 10, ey);
          ctx.closePath();
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(ex + 20, ey + eh);
          ctx.lineTo(ex + 30, ey + eh + 10);
          ctx.lineTo(ex + ew - 10, ey + eh + 5);
          ctx.lineTo(ex + ew - 10, ey + eh);
          ctx.closePath();
          ctx.fill();
          
          // Weapon pods
          ctx.fillStyle = '#444444';
          ctx.fillRect(ex + 5, ey - 3, 12, 6);
          ctx.fillRect(ex + 5, ey + eh - 3, 12, 6);
          
          // Glowing weapon tips
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 6;
          ctx.fillStyle = '#00ffff';
          ctx.beginPath();
          ctx.arc(ex + 5, ey, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ex + 5, ey + eh, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Central eye/sensor
          ctx.fillStyle = '#220022';
          ctx.beginPath();
          ctx.arc(ex + 18, centerY, 6, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.shadowColor = '#ff00ff';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#ff00ff';
          ctx.beginPath();
          ctx.arc(ex + 18, centerY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex + 17, centerY - 1, 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        
        // Damage sparks when hit recently (optional visual)
        if (enemy.hitFlash && enemy.hitFlash > 0) {
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = enemy.hitFlash / 10;
          ctx.fillRect(ex, ey, ew, eh);
          ctx.globalAlpha = 1;
        }
        
        // Elite enemy indicator - golden glowing crown/aura
        if (enemy.isElite) {
          const elitePulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
          
          // Golden aura ring
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 15 * elitePulse;
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.max(ew, eh) / 2 + 8, 0, Math.PI * 2);
          ctx.stroke();
          
          // Crown icon above enemy
          ctx.fillStyle = '#ffd700';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚡', centerX, ey - 12);
          
          // "ELITE" label
          ctx.fillStyle = '#ffd700';
          ctx.font = "bold 6px monospace";
          ctx.fillText('ELITE', centerX, ey - 2);
          
          ctx.shadowBlur = 0;
        }
        
        // Frozen visual effect (from GLACIER ship ability)
        if (enemy.frozen) {
          const frozenPulse = Math.sin(Date.now() / 100) * 0.2 + 0.8;
          
          // Ice overlay
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = '#88ffff';
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.max(ew, eh) / 2 + 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Ice crystals
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = '#ffffff';
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + Date.now() / 500;
            const crystalX = centerX + Math.cos(angle) * (ew / 2 + 5);
            const crystalY = centerY + Math.sin(angle) * (eh / 2 + 5);
            ctx.beginPath();
            ctx.moveTo(crystalX, crystalY - 4);
            ctx.lineTo(crystalX + 2, crystalY);
            ctx.lineTo(crystalX, crystalY + 4);
            ctx.lineTo(crystalX - 2, crystalY);
            ctx.closePath();
            ctx.fill();
          }
          
          // "FROZEN" label
          ctx.globalAlpha = frozenPulse;
          ctx.fillStyle = '#88ffff';
          ctx.font = "bold 6px monospace";
          ctx.textAlign = 'center';
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 8;
          ctx.fillText('⚡FROZEN', centerX, ey - 15);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
        
        // Draw polarity indicator ring around enemy
        const enemyPolarity = enemy.polarity || 'light';
        const polarityColor = enemyPolarity === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(139, 0, 255, 0.6)';
        const polarityGlow = enemyPolarity === 'light' ? '#ffffff' : '#8B00FF';
        ctx.strokeStyle = polarityColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = polarityGlow;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(ew, eh) / 2 + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.restore();
      });

      // ========== Draw Space Carrier ==========
      if (carrierRef.current) {
        const carrier = carrierRef.current;
        ctx.save();
        
        const cx = carrier.x;
        const cy = carrier.y;
        const cw = carrier.width;
        const ch = carrier.height;
        const centerY = cy + ch / 2;
        const phase = carrier.phase;
        const engineGlow = carrier.engineGlow;
        
        // Massive engine array (8 engines)
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 30 * engineGlow;
        for (let i = 0; i < 8; i++) {
          const engineY = cy + ch * (0.1 + i * 0.11);
          const flameLen = 20 + Math.sin(phase * 3 + i) * 8;
          
          // Engine flame
          ctx.fillStyle = '#ff8800';
          ctx.beginPath();
          ctx.ellipse(cx + cw + flameLen, engineY, flameLen, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Engine core
          ctx.fillStyle = '#ffff88';
          ctx.beginPath();
          ctx.ellipse(cx + cw + 10, engineY, 10, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        
        // Main hull - dark gray industrial look
        const hullGrad = ctx.createLinearGradient(cx, cy, cx, cy + ch);
        hullGrad.addColorStop(0, '#222233');
        hullGrad.addColorStop(0.2, '#444455');
        hullGrad.addColorStop(0.5, '#555566');
        hullGrad.addColorStop(0.8, '#444455');
        hullGrad.addColorStop(1, '#222233');
        ctx.fillStyle = hullGrad;
        
        // Main body shape (massive rectangular with angular front)
        ctx.beginPath();
        ctx.moveTo(cx + 30, cy + 10);
        ctx.lineTo(cx + cw - 20, cy + 5);
        ctx.lineTo(cx + cw, cy + ch * 0.15);
        ctx.lineTo(cx + cw, cy + ch * 0.85);
        ctx.lineTo(cx + cw - 20, cy + ch - 5);
        ctx.lineTo(cx + 30, cy + ch - 10);
        ctx.lineTo(cx, centerY);
        ctx.closePath();
        ctx.fill();
        
        // Hull plating lines
        ctx.strokeStyle = '#333344';
        ctx.lineWidth = 2;
        for (let i = 1; i < 8; i++) {
          const plateX = cx + 30 + i * (cw - 50) / 8;
          ctx.beginPath();
          ctx.moveTo(plateX, cy + 15);
          ctx.lineTo(plateX, cy + ch - 15);
          ctx.stroke();
        }
        
        // Upper deck structure
        ctx.fillStyle = '#333344';
        ctx.beginPath();
        ctx.moveTo(cx + 80, cy + 10);
        ctx.lineTo(cx + cw - 80, cy + 5);
        ctx.lineTo(cx + cw - 80, cy - 20);
        ctx.lineTo(cx + 150, cy - 25);
        ctx.lineTo(cx + 100, cy - 15);
        ctx.lineTo(cx + 80, cy + 10);
        ctx.closePath();
        ctx.fill();
        
        // Lower deck structure
        ctx.beginPath();
        ctx.moveTo(cx + 80, cy + ch - 10);
        ctx.lineTo(cx + cw - 80, cy + ch - 5);
        ctx.lineTo(cx + cw - 80, cy + ch + 20);
        ctx.lineTo(cx + 150, cy + ch + 25);
        ctx.lineTo(cx + 100, cy + ch + 15);
        ctx.lineTo(cx + 80, cy + ch - 10);
        ctx.closePath();
        ctx.fill();
        
        // Bridge tower
        ctx.fillStyle = '#444466';
        ctx.fillRect(cx + cw * 0.6, cy - 35, 60, 35);
        ctx.fillRect(cx + cw * 0.6 + 10, cy - 50, 40, 20);
        
        // Bridge windows
        ctx.fillStyle = '#88aaff';
        ctx.shadowColor = '#88aaff';
        ctx.shadowBlur = 5;
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(cx + cw * 0.6 + 8 + i * 13, cy - 45, 8, 10);
        }
        ctx.shadowBlur = 0;
        
        // Hangar bay doors (glowing when dropping)
        const hangarGlow = carrier.dropsRemaining > 0 ? Math.sin(phase * 2) * 0.3 + 0.7 : 0.3;
        ctx.fillStyle = '#222222';
        ctx.fillRect(cx + 20, centerY - 30, 80, 60);
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 15 * hangarGlow;
        ctx.fillStyle = `rgba(255, 136, 0, ${hangarGlow * 0.5})`;
        ctx.fillRect(cx + 25, centerY - 25, 70, 50);
        ctx.shadowBlur = 0;
        
        // Hangar bay interior glow
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(cx + 30, centerY - 20, 60, 40);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(cx + 35, centerY - 15, 50, 30);
        
        // Defensive turrets on hull
        ctx.fillStyle = '#555555';
        const turretPositions = [
          { x: cx + 100, y: cy - 10 },
          { x: cx + 200, y: cy - 8 },
          { x: cx + 300, y: cy - 5 },
          { x: cx + 100, y: cy + ch + 10 },
          { x: cx + 200, y: cy + ch + 8 },
          { x: cx + 300, y: cy + ch + 5 },
        ];
        turretPositions.forEach(t => {
          ctx.beginPath();
          ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#666666';
          ctx.fillRect(t.x - 12, t.y - 2, 12, 4);
          ctx.fillStyle = '#555555';
        });
        
        // Running lights (blinking)
        const lightPhase = Math.floor(Date.now() / 500) % 2;
        ctx.shadowBlur = 8;
        // Red lights
        ctx.shadowColor = '#ff0000';
        ctx.fillStyle = lightPhase ? '#ff0000' : '#440000';
        ctx.beginPath();
        ctx.arc(cx + 5, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + cw - 10, cy + 10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + cw - 10, cy + ch - 10, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Green lights
        ctx.shadowColor = '#00ff00';
        ctx.fillStyle = lightPhase ? '#00ff00' : '#004400';
        ctx.beginPath();
        ctx.arc(cx + 50, cy - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 50, cy + ch + 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // "CARRIER" label
        ctx.fillStyle = '#666688';
        ctx.font = "bold 12px \"Press Start 2P\", monospace";
        ctx.textAlign = 'center';
        ctx.fillText('CARRIER', cx + cw / 2, centerY);
        
        // Warning stripes near hangar
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + 15, centerY - 35 + i * 8);
          ctx.lineTo(cx + 100, centerY - 35 + i * 8);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx + 15, centerY + 35 - i * 8);
          ctx.lineTo(cx + 100, centerY + 35 - i * 8);
          ctx.stroke();
        }
        
        ctx.restore();
      }

      // Draw Boss
      if (bossRef.current) {
        const boss = bossRef.current;
        ctx.save();
        
        // Use actual boss dimensions
        const bossW = boss.width;
        const bossH = boss.height;
        const bx = boss.x;
        const by = boss.y;
        const centerY = by + bossH / 2;
        const pulsePhase = Date.now() / 200;
        
        // Dark boss color scheme (waves 5, 10, 15, 20)
        const isDark = boss.isDarkBoss;
        const accentColor = isDark ? '#ff0000' : '#00ffff';
        const accentColorDim = isDark ? '#880000' : '#00aaff';
        const hullDark = isDark ? '#110000' : '#001122';
        const hullMid = isDark ? '#220000' : '#003344';
        const hullLight = isDark ? '#330000' : '#005566';
        
        if (boss.isSuperBoss) {
          // ========== SUPER BOSS - THE OVERLORD (Wave 10, 20, 30...) ==========
          // Massive multi-engine array
          ctx.shadowColor = accentColor;
          ctx.shadowBlur = 40;
          for (let i = 0; i < 6; i++) {
            const engineY = by + bossH * (0.1 + i * 0.15);
            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.ellipse(bx + bossW + 20, engineY, 25, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = isDark ? '#ffaaaa' : '#ffffff';
            ctx.beginPath();
            ctx.ellipse(bx + bossW + 15, engineY, 12, 5, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          
          // Main hull - dark with accent colors
          const superGrad = ctx.createLinearGradient(bx, by, bx, by + bossH);
          superGrad.addColorStop(0, isDark ? '#000000' : '#001122');
          superGrad.addColorStop(0.2, isDark ? '#110000' : '#003344');
          superGrad.addColorStop(0.5, isDark ? '#220000' : '#005566');
          superGrad.addColorStop(0.8, isDark ? '#110000' : '#003344');
          superGrad.addColorStop(1, isDark ? '#000000' : '#001122');
          ctx.fillStyle = superGrad;
          
          // Massive armored body with angular design
          ctx.beginPath();
          ctx.moveTo(bx + 20, centerY);
          ctx.lineTo(bx + bossW * 0.15, by + 5);
          ctx.lineTo(bx + bossW * 0.5, by);
          ctx.lineTo(bx + bossW * 0.8, by + 10);
          ctx.lineTo(bx + bossW, by + bossH * 0.1);
          ctx.lineTo(bx + bossW, by + bossH * 0.9);
          ctx.lineTo(bx + bossW * 0.8, by + bossH - 10);
          ctx.lineTo(bx + bossW * 0.5, by + bossH);
          ctx.lineTo(bx + bossW * 0.15, by + bossH - 5);
          ctx.closePath();
          ctx.fill();
          
          // Armor plating with glowing seams
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6 + Math.sin(pulsePhase) * 0.2;
          ctx.beginPath();
          ctx.moveTo(bx + bossW * 0.3, by + 5);
          ctx.lineTo(bx + bossW * 0.3, by + bossH - 5);
          ctx.moveTo(bx + bossW * 0.5, by);
          ctx.lineTo(bx + bossW * 0.5, by + bossH);
          ctx.moveTo(bx + bossW * 0.7, by + 10);
          ctx.lineTo(bx + bossW * 0.7, by + bossH - 10);
          ctx.stroke();
          ctx.globalAlpha = 1;
          
          // Massive top wing structure
          ctx.fillStyle = isDark ? '#110000' : '#002233';
          ctx.beginPath();
          ctx.moveTo(bx + bossW * 0.2, by + 5);
          ctx.lineTo(bx + bossW * 0.25, by - 50);
          ctx.lineTo(bx + bossW * 0.4, by - 70);
          ctx.lineTo(bx + bossW * 0.55, by - 60);
          ctx.lineTo(bx + bossW * 0.7, by - 65);
          ctx.lineTo(bx + bossW * 0.8, by + 10);
          ctx.closePath();
          ctx.fill();
          
          // Bottom wing structure
          ctx.beginPath();
          ctx.moveTo(bx + bossW * 0.2, by + bossH - 5);
          ctx.lineTo(bx + bossW * 0.25, by + bossH + 50);
          ctx.lineTo(bx + bossW * 0.4, by + bossH + 70);
          ctx.lineTo(bx + bossW * 0.55, by + bossH + 60);
          ctx.lineTo(bx + bossW * 0.7, by + bossH + 65);
          ctx.lineTo(bx + bossW * 0.8, by + bossH - 10);
          ctx.closePath();
          ctx.fill();
          
          // Wing edge energy lines
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 3;
          ctx.shadowColor = accentColor;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.moveTo(bx + bossW * 0.25, by - 50);
          ctx.lineTo(bx + bossW * 0.4, by - 70);
          ctx.lineTo(bx + bossW * 0.55, by - 60);
          ctx.lineTo(bx + bossW * 0.7, by - 65);
          ctx.moveTo(bx + bossW * 0.25, by + bossH + 50);
          ctx.lineTo(bx + bossW * 0.4, by + bossH + 70);
          ctx.lineTo(bx + bossW * 0.55, by + bossH + 60);
          ctx.lineTo(bx + bossW * 0.7, by + bossH + 65);
          ctx.stroke();
          ctx.shadowBlur = 0;
          
          // MAIN DEATH LASER - Central weapon
          const laserActive = boss.laserCharging || boss.laserFiring;
          ctx.fillStyle = '#111111';
          ctx.beginPath();
          ctx.moveTo(bx - 10, centerY);
          ctx.lineTo(bx + 50, centerY - 35);
          ctx.lineTo(bx + 50, centerY + 35);
          ctx.closePath();
          ctx.fill();
          
          // Laser core
          ctx.fillStyle = laserActive ? accentColor : (isDark ? '#441111' : '#004455');
          ctx.shadowColor = laserActive ? accentColor : accentColorDim;
          ctx.shadowBlur = laserActive ? 40 + Math.sin(pulsePhase * 2) * 15 : 10;
          ctx.beginPath();
          ctx.arc(bx + 20, centerY, 25, 0, Math.PI * 2);
          ctx.fill();
          
          // Inner laser ring
          ctx.fillStyle = laserActive ? '#ffffff' : accentColor;
          ctx.beginPath();
          ctx.arc(bx + 20, centerY, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Secondary weapon banks
          for (let side = -1; side <= 1; side += 2) {
            const weaponY = centerY + side * bossH * 0.35;
            ctx.fillStyle = isDark ? '#aa3333' : '#00aaaa';
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(bx + 40, weaponY, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bx + 40, weaponY, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          
          // Central eye cluster
          ctx.fillStyle = isDark ? '#110000' : '#001111';
          ctx.beginPath();
          ctx.arc(bx + bossW * 0.45, centerY, 25, 0, Math.PI * 2);
          ctx.fill();
          
          // Main eye
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 25;
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(bx + bossW * 0.45, centerY, 15, 0, Math.PI * 2);
          ctx.fill();
          
          // Eye highlight
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bx + bossW * 0.45 - 5, centerY - 5, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Surrounding sensor eyes
          for (let i = 0; i < 4; i++) {
            const eyeAngle = (Math.PI / 3) * i + Math.PI / 6 + pulsePhase * 0.3;
            const eyeX = bx + bossW * 0.45 + Math.cos(eyeAngle) * 35;
            const eyeY = centerY + Math.sin(eyeAngle) * 30;
            ctx.shadowColor = '#ff4444';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          
        } else if (boss.isMegaBoss) {
          // ========== MEGA BOSS - DREADNOUGHT ==========
          // Massive engine array glow
          ctx.shadowColor = isDark ? '#ff0000' : '#ff4400';
          ctx.shadowBlur = 30;
          for (let i = 0; i < 4; i++) {
            const engineY = by + bossH * (0.2 + i * 0.2);
            ctx.fillStyle = isDark ? '#ff0000' : '#ff6600';
            ctx.beginPath();
            ctx.ellipse(bx + bossW + 15, engineY, 20, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = isDark ? '#ff4444' : '#ffff00';
            ctx.beginPath();
            ctx.ellipse(bx + bossW + 10, engineY, 10, 4, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          
          // Main hull gradient
          const megaGrad = ctx.createLinearGradient(bx, by, bx, by + bossH);
          megaGrad.addColorStop(0, isDark ? '#000000' : '#440000');
          megaGrad.addColorStop(0.2, isDark ? '#110000' : '#881100');
          megaGrad.addColorStop(0.5, isDark ? '#220000' : '#cc2200');
          megaGrad.addColorStop(0.8, isDark ? '#110000' : '#881100');
          megaGrad.addColorStop(1, isDark ? '#000000' : '#440000');
          ctx.fillStyle = megaGrad;
          
          // Armored main body
          ctx.beginPath();
          ctx.moveTo(bx + 30, centerY);
          ctx.lineTo(bx + bossW * 0.25, by + 10);
          ctx.lineTo(bx + bossW * 0.7, by + 10);
          ctx.lineTo(bx + bossW, by + bossH * 0.15);
          ctx.lineTo(bx + bossW, by + bossH * 0.85);
          ctx.lineTo(bx + bossW * 0.7, by + bossH - 10);
          ctx.lineTo(bx + bossW * 0.25, by + bossH - 10);
          ctx.closePath();
          ctx.fill();
          
          // Armor plating details
          ctx.strokeStyle = isDark ? '#330000' : '#661100';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx + bossW * 0.4, by + 10);
          ctx.lineTo(bx + bossW * 0.4, by + bossH - 10);
          ctx.moveTo(bx + bossW * 0.6, by + 15);
          ctx.lineTo(bx + bossW * 0.6, by + bossH - 15);
          ctx.stroke();
          
          // Top mega wing with spikes
          ctx.fillStyle = isDark ? '#110000' : '#660000';
          ctx.beginPath();
          ctx.moveTo(bx + bossW * 0.3, by + 10);
          ctx.lineTo(bx + bossW * 0.35, by - 35);
          ctx.lineTo(bx + bossW * 0.45, by - 45);
          ctx.lineTo(bx + bossW * 0.55, by - 35);
          ctx.lineTo(bx + bossW * 0.65, by - 40);
          ctx.lineTo(bx + bossW * 0.7, by + 10);
          ctx.closePath();
          ctx.fill();
          
          // Bottom mega wing with spikes
          ctx.beginPath();
          ctx.moveTo(bx + bossW * 0.3, by + bossH - 10);
          ctx.lineTo(bx + bossW * 0.35, by + bossH + 35);
          ctx.lineTo(bx + bossW * 0.45, by + bossH + 45);
          ctx.lineTo(bx + bossW * 0.55, by + bossH + 35);
          ctx.lineTo(bx + bossW * 0.65, by + bossH + 40);
          ctx.lineTo(bx + bossW * 0.7, by + bossH - 10);
          ctx.closePath();
          ctx.fill();
          
          // Wing edge highlights
          ctx.strokeStyle = isDark ? '#ff0000' : '#ff4400';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx + bossW * 0.35, by - 35);
          ctx.lineTo(bx + bossW * 0.45, by - 45);
          ctx.lineTo(bx + bossW * 0.55, by - 35);
          ctx.moveTo(bx + bossW * 0.35, by + bossH + 35);
          ctx.lineTo(bx + bossW * 0.45, by + bossH + 45);
          ctx.lineTo(bx + bossW * 0.55, by + bossH + 35);
          ctx.stroke();
          
          // Weapon arrays on wings
          ctx.fillStyle = isDark ? '#111111' : '#333333';
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(bx + bossW * (0.35 + i * 0.1), by - 25, 8, 15);
            ctx.fillRect(bx + bossW * (0.35 + i * 0.1), by + bossH + 10, 8, 15);
          }
          
          // LASER CANNON - Central weapon system
          const laserActive = boss.laserCharging || boss.laserFiring;
          ctx.fillStyle = isDark ? '#111111' : '#222222';
          ctx.beginPath();
          ctx.moveTo(bx, centerY);
          ctx.lineTo(bx + 40, centerY - 20);
          ctx.lineTo(bx + 40, centerY + 20);
          ctx.closePath();
          ctx.fill();
          
          // Laser barrel
          ctx.fillStyle = laserActive ? '#ffff00' : '#444444';
          ctx.shadowColor = laserActive ? '#ffff00' : '#ff0000';
          ctx.shadowBlur = laserActive ? 25 + Math.sin(pulsePhase) * 10 : 5;
          ctx.beginPath();
          ctx.arc(bx + 15, centerY, 18, 0, Math.PI * 2);
          ctx.fill();
          
          // Inner glow
          ctx.fillStyle = laserActive ? '#ffffff' : (isDark ? '#ff0000' : '#ff4400');
          ctx.beginPath();
          ctx.arc(bx + 15, centerY, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Secondary weapons
          ctx.fillStyle = isDark ? '#ff0000' : '#ff4400';
          ctx.shadowColor = isDark ? '#ff0000' : '#ff4400';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(bx + 50, by + 25, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(bx + 50, by + bossH - 25, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Multiple eyes/sensors
          for (let i = 0; i < 3; i++) {
            const eyeY = centerY + (i - 1) * 30;
            ctx.fillStyle = isDark ? '#000000' : '#220000';
            ctx.beginPath();
            ctx.arc(bx + bossW * 0.5, eyeY, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(bx + bossW * 0.5, eyeY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bx + bossW * 0.5 - 2, eyeY - 2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          
        } else {
          // ========== REGULAR BOSS - BATTLECRUISER ==========
          // Engine glow array
          ctx.shadowColor = '#ff00ff';
          ctx.shadowBlur = 20;
          for (let i = 0; i < 3; i++) {
            const engineY = by + bossH * (0.25 + i * 0.25);
            ctx.fillStyle = '#ff44ff';
            ctx.beginPath();
            ctx.ellipse(bx + bossW + 8, engineY, 12, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(bx + bossW + 5, engineY, 5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          
          // Main hull gradient
          const bossGrad = ctx.createLinearGradient(bx, by, bx, by + bossH);
          bossGrad.addColorStop(0, '#330033');
          bossGrad.addColorStop(0.3, '#660066');
          bossGrad.addColorStop(0.5, '#990099');
          bossGrad.addColorStop(0.7, '#660066');
          bossGrad.addColorStop(1, '#330033');
          ctx.fillStyle = bossGrad;
          
          // Main armored body
          ctx.beginPath();
          ctx.moveTo(bx + 15, centerY);
          ctx.lineTo(bx + bossW * 0.3, by + 5);
          ctx.lineTo(bx + bossW * 0.8, by + 8);
          ctx.lineTo(bx + bossW, by + bossH * 0.2);
          ctx.lineTo(bx + bossW, by + bossH * 0.8);
          ctx.lineTo(bx + bossW * 0.8, by + bossH - 8);
          ctx.lineTo(bx + bossW * 0.3, by + bossH - 5);
          ctx.closePath();
          ctx.fill();
          
          // Top wing
          ctx.fillStyle = '#440044';
          ctx.beginPath();
          ctx.moveTo(bx + bossW * 0.35, by + 5);
          ctx.lineTo(bx + bossW * 0.4, by - 20);
          ctx.lineTo(bx + bossW * 0.6, by - 25);
          ctx.lineTo(bx + bossW * 0.7, by + 8);
          ctx.closePath();
          ctx.fill();
          
          // Bottom wing
          ctx.beginPath();
          ctx.moveTo(bx + bossW * 0.35, by + bossH - 5);
          ctx.lineTo(bx + bossW * 0.4, by + bossH + 20);
          ctx.lineTo(bx + bossW * 0.6, by + bossH + 25);
          ctx.lineTo(bx + bossW * 0.7, by + bossH - 8);
          ctx.closePath();
          ctx.fill();
          
          // Wing edge glow
          ctx.strokeStyle = '#ff00ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx + bossW * 0.4, by - 20);
          ctx.lineTo(bx + bossW * 0.6, by - 25);
          ctx.moveTo(bx + bossW * 0.4, by + bossH + 20);
          ctx.lineTo(bx + bossW * 0.6, by + bossH + 25);
          ctx.stroke();
          
          // Front weapon prong
          ctx.fillStyle = '#550055';
          ctx.beginPath();
          ctx.moveTo(bx, centerY);
          ctx.lineTo(bx + 25, centerY - 12);
          ctx.lineTo(bx + 25, centerY + 12);
          ctx.closePath();
          ctx.fill();
          
          // Weapon tip glow
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#00ffff';
          ctx.beginPath();
          ctx.arc(bx + 8, centerY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Side weapon pods
          ctx.fillStyle = '#333333';
          ctx.fillRect(bx + 30, by - 5, 20, 10);
          ctx.fillRect(bx + 30, by + bossH - 5, 20, 10);
          
          ctx.shadowColor = '#ff00ff';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#ff00ff';
          ctx.beginPath();
          ctx.arc(bx + 35, by, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(bx + 35, by + bossH, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Central eye/core
          ctx.fillStyle = '#220022';
          ctx.beginPath();
          ctx.arc(bx + bossW * 0.45, centerY, 15, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(bx + bossW * 0.45, centerY, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bx + bossW * 0.45 - 3, centerY - 2, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        
        // Draw charging laser effect
        if (boss.laserCharging) {
          const chargeRadius = 15 + (boss.laserCharge / 100) * 35;
          
          // Outer energy ring
          ctx.strokeStyle = `rgba(255, 100, 0, ${0.5 + boss.laserCharge / 200})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(bx + 15, centerY, chargeRadius + 10, 0, Math.PI * 2);
          ctx.stroke();
          
          // Main charging orb
          ctx.fillStyle = `rgba(255, 255, 0, ${0.4 + boss.laserCharge / 200})`;
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 40 + boss.laserCharge / 3;
          ctx.beginPath();
          ctx.arc(bx + 15, centerY, chargeRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Inner hot core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bx + 15, centerY, chargeRadius * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Warning indicator - flashing
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#ff0000';
          ctx.font = "bold 14px \"Press Start 2P\", monospace";
          ctx.textAlign = 'center';
          if (Math.floor(Date.now() / 150) % 2 === 0) {
            ctx.fillText('? DANGER ?', bx + bossW / 2, by - 75);
          }
          ctx.shadowBlur = 0;
        }
        
        // Draw firing laser beam - size based on boss type
        if (boss.laserFiring) {
          const laserY = centerY;
          const laserSize = boss.laserSize || 30;
          const laserHalfSize = laserSize / 2;
          const coreSize = laserSize * 0.3;
          
          // Screen shake effect hint (visual only)
          const shake = Math.random() * (boss.isSuperBoss ? 8 : 4) - (boss.isSuperBoss ? 4 : 2);
          
          // Outer destructive glow - bigger for super boss
          ctx.shadowColor = boss.isSuperBoss ? '#ff4400' : '#ff0000';
          ctx.shadowBlur = boss.isSuperBoss ? 100 : 60;
          
          // Create intense beam gradient
          const laserGradient = ctx.createLinearGradient(0, laserY - laserHalfSize - 5, 0, laserY + laserHalfSize + 5);
          laserGradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
          laserGradient.addColorStop(0.2, 'rgba(255, 50, 0, 0.6)');
          laserGradient.addColorStop(0.35, 'rgba(255, 150, 50, 0.9)');
          laserGradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
          laserGradient.addColorStop(0.65, 'rgba(255, 150, 50, 0.9)');
          laserGradient.addColorStop(0.8, 'rgba(255, 50, 0, 0.6)');
          laserGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
          
          ctx.fillStyle = laserGradient;
          ctx.fillRect(0, laserY - laserHalfSize + shake, bx + 15, laserSize);
          
          // Hot core beam
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, laserY - coreSize + shake, bx + 15, coreSize * 2);
          
          // Flickering intensity
          if (Math.random() > 0.3) {
            ctx.fillStyle = `rgba(255, 200, 100, ${0.3 + Math.random() * 0.4})`;
            ctx.fillRect(0, laserY - laserHalfSize - 10 + shake, bx + 15, laserSize + 20);
          }
          
          // Energy particles along beam - more for super boss
          const particleCount = boss.isSuperBoss ? 15 : 8;
          for (let i = 0; i < particleCount; i++) {
            const px = Math.random() * bx;
            const py = laserY + (Math.random() - 0.5) * laserSize;
            ctx.fillStyle = boss.isSuperBoss ? '#ffff88' : '#ffff00';
            ctx.beginPath();
            ctx.arc(px, py, 2 + Math.random() * (boss.isSuperBoss ? 5 : 3), 0, Math.PI * 2);
            ctx.fill();
          }
          
          ctx.shadowBlur = 0;
        }
        
        // Draw Super Boss shield
        if (boss.isSuperBoss && boss.shield > 0) {
          const shieldPercent = boss.shield / boss.maxShield;
          const shieldPulse = Math.sin(Date.now() / 150) * 0.2 + 0.8;
          const shieldColor = isDark ? '#ff0000' : '#00ffff';
          const shieldColorDim = isDark ? '#aa0000' : '#00aaaa';
          
          // Massive hexagonal shield effect
          ctx.save();
          ctx.globalAlpha = shieldPercent * 0.6 * shieldPulse;
          
          // Outer shield glow
          ctx.shadowColor = shieldColor;
          ctx.shadowBlur = 40;
          ctx.strokeStyle = shieldColor;
          ctx.lineWidth = 4;
          
          // Draw shield as hexagon around boss
          const shieldPadding = 30;
          ctx.beginPath();
          ctx.moveTo(bx - shieldPadding, centerY);
          ctx.lineTo(bx + bossW * 0.2, by - bossH * 0.3 - shieldPadding);
          ctx.lineTo(bx + bossW * 0.8, by - bossH * 0.3 - shieldPadding);
          ctx.lineTo(bx + bossW + shieldPadding, centerY);
          ctx.lineTo(bx + bossW * 0.8, by + bossH + bossH * 0.3 + shieldPadding);
          ctx.lineTo(bx + bossW * 0.2, by + bossH + bossH * 0.3 + shieldPadding);
          ctx.closePath();
          ctx.stroke();
          
          // Inner shield fill
          ctx.globalAlpha = shieldPercent * 0.15 * shieldPulse;
          ctx.fillStyle = shieldColor;
          ctx.fill();
          
          // Shield energy grid pattern
          ctx.globalAlpha = shieldPercent * 0.3;
          ctx.strokeStyle = shieldColorDim;
          ctx.lineWidth = 1;
          for (let i = 0; i < 6; i++) {
            const gridY = by - 40 + i * (bossH + 80) / 5;
            ctx.beginPath();
            ctx.moveTo(bx - 20, gridY);
            ctx.lineTo(bx + bossW + 20, gridY);
            ctx.stroke();
          }
          for (let i = 0; i < 5; i++) {
            const gridX = bx + i * bossW / 4;
            ctx.beginPath();
            ctx.moveTo(gridX, by - 40);
            ctx.lineTo(gridX, by + bossH + 40);
            ctx.stroke();
          }
          
          ctx.restore();
        }
        
        // Draw Mega Boss shield (smaller than super boss)
        if (boss.isMegaBoss && !boss.isSuperBoss && boss.shield > 0) {
          const shieldPercent = boss.shield / boss.maxShield;
          const shieldPulse = Math.sin(Date.now() / 150) * 0.2 + 0.8;
          const megaShieldColor = isDark ? '#ff0000' : '#44aaff';
          
          ctx.save();
          ctx.globalAlpha = shieldPercent * 0.5 * shieldPulse;
          
          // Shield glow
          ctx.shadowColor = megaShieldColor;
          ctx.shadowBlur = 25;
          ctx.strokeStyle = megaShieldColor;
          ctx.lineWidth = 3;
          
          // Draw shield as oval around boss
          const shieldPadding = 20;
          ctx.beginPath();
          ctx.ellipse(
            bx + bossW / 2,
            centerY,
            bossW / 2 + shieldPadding + 20,
            bossH / 2 + shieldPadding + 30,
            0, 0, Math.PI * 2
          );
          ctx.stroke();
          
          // Inner shield fill
          ctx.globalAlpha = shieldPercent * 0.1 * shieldPulse;
          ctx.fillStyle = megaShieldColor;
          ctx.fill();
          
          ctx.restore();
        }
        
        // Draw EMP charging effect
        if (boss.empCharging && boss.isMegaBoss) {
          const chargePercent = boss.empCharge / 100;
          const pulseIntensity = Math.sin(Date.now() / 50) * 0.3 + 0.7;
          
          // EMP charging sphere at center of boss
          const empX = bx + bossW / 2;
          const empY = centerY;
          const chargeRadius = Math.max(1, 20 + chargePercent * 40);
          
          // Guard against non-finite values
          if (!isFinite(empX) || !isFinite(empY) || !isFinite(chargeRadius)) {
            // Skip rendering
          } else {
            ctx.save();
            
            // Electric arcs around charging sphere
            ctx.strokeStyle = `rgba(100, 200, 255, ${chargePercent * pulseIntensity})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
              const angle = (Date.now() / 100 + i * Math.PI / 4) % (Math.PI * 2);
              const arcLen = 30 + Math.random() * 30;
              ctx.beginPath();
              ctx.moveTo(empX + Math.cos(angle) * chargeRadius, empY + Math.sin(angle) * chargeRadius);
              ctx.lineTo(
                empX + Math.cos(angle) * (chargeRadius + arcLen),
                empY + Math.sin(angle) * (chargeRadius + arcLen)
              );
              ctx.stroke();
            }
            
            // Outer ring
            ctx.shadowColor = '#00aaff';
            ctx.shadowBlur = 30 * chargePercent;
            ctx.strokeStyle = `rgba(0, 150, 255, ${chargePercent})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(empX, empY, chargeRadius + 10, 0, Math.PI * 2);
            ctx.stroke();
            
            // Core sphere
            const coreGrad = ctx.createRadialGradient(empX, empY, 0, empX, empY, chargeRadius);
            coreGrad.addColorStop(0, `rgba(255, 255, 255, ${chargePercent})`);
            coreGrad.addColorStop(0.5, `rgba(100, 200, 255, ${chargePercent * 0.7})`);
            coreGrad.addColorStop(1, `rgba(0, 100, 200, ${chargePercent * 0.3})`);
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(empX, empY, chargeRadius, 0, Math.PI * 2);
            ctx.fill();
          
            // Warning text
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#ff4444';
            ctx.font = "bold 12px \"Press Start 2P\", monospace";
            ctx.textAlign = 'center';
            if (Math.floor(Date.now() / 100) % 2 === 0) {
              ctx.fillText('? EMP CHARGING ?', empX, by - (boss.isSuperBoss ? 120 : 80));
            }
          
            ctx.restore();
          }
        }
        
        // Draw EMP shockwave
        if (boss.empActive && boss.isMegaBoss && boss.empRadius > 1) {
          const empX = bx + bossW / 2;
          const empY = centerY;
          
          // Guard against non-finite values
          if (isFinite(empX) && isFinite(empY) && isFinite(boss.empRadius)) {
            ctx.save();
            
            // Expanding shockwave ring
            const ringWidth = 20;
            const innerRadius = Math.max(1, boss.empRadius - ringWidth);
            const outerRadius = Math.max(2, boss.empRadius);
            const alpha = 1 - (boss.empRadius / boss.empRange) * 0.7;
            
            // Outer glow
            ctx.shadowColor = '#00aaff';
            ctx.shadowBlur = 30;
            
            // Create shockwave gradient
            const waveGrad = ctx.createRadialGradient(empX, empY, innerRadius, empX, empY, outerRadius);
            waveGrad.addColorStop(0, `rgba(0, 150, 255, 0)`);
            waveGrad.addColorStop(0.3, `rgba(100, 200, 255, ${alpha * 0.8})`);
            waveGrad.addColorStop(0.6, `rgba(200, 230, 255, ${alpha})`);
            waveGrad.addColorStop(1, `rgba(100, 200, 255, ${alpha * 0.5})`);
            
            ctx.fillStyle = waveGrad;
            ctx.beginPath();
            ctx.arc(empX, empY, outerRadius, 0, Math.PI * 2);
            ctx.arc(empX, empY, innerRadius, 0, Math.PI * 2, true);
            ctx.fill();
            
            // Electric arcs along the ring
            ctx.strokeStyle = `rgba(200, 230, 255, ${alpha})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 16; i++) {
              const angle = (i * Math.PI / 8) + (Date.now() / 200);
              const arcStart = boss.empRadius - 5;
              const arcEnd = boss.empRadius + 15 + Math.random() * 10;
              ctx.beginPath();
              ctx.moveTo(empX + Math.cos(angle) * arcStart, empY + Math.sin(angle) * arcStart);
              ctx.lineTo(empX + Math.cos(angle) * arcEnd, empY + Math.sin(angle) * arcEnd);
              ctx.stroke();
            }
            
            ctx.restore();
          }
        }
        
        // Draw INVINCIBILITY shield while boss is emerging
        if (boss.invincible) {
          ctx.save();
          
          const shieldPulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
          const flashIntensity = boss.invincibleFlash > 0 ? boss.invincibleFlash / 10 : 0;
          
          // Decay flash counter
          if (boss.invincibleFlash > 0) boss.invincibleFlash--;
          
          // Golden protective barrier
          ctx.shadowColor = flashIntensity > 0 ? '#ffffff' : '#ffcc00';
          ctx.shadowBlur = 40 + flashIntensity * 30;
          ctx.strokeStyle = flashIntensity > 0 ? '#ffffff' : `rgba(255, 200, 50, ${shieldPulse})`;
          ctx.lineWidth = 4;
          
          // Draw hexagonal shield
          const shieldPadding = 40;
          ctx.beginPath();
          ctx.moveTo(bx - shieldPadding, centerY);
          ctx.lineTo(bx + bossW * 0.15, by - shieldPadding * 1.5);
          ctx.lineTo(bx + bossW * 0.85, by - shieldPadding * 1.5);
          ctx.lineTo(bx + bossW + shieldPadding, centerY);
          ctx.lineTo(bx + bossW * 0.85, by + bossH + shieldPadding * 1.5);
          ctx.lineTo(bx + bossW * 0.15, by + bossH + shieldPadding * 1.5);
          ctx.closePath();
          ctx.stroke();
          
          // Inner glow fill
          ctx.globalAlpha = 0.15 * shieldPulse + flashIntensity * 0.3;
          ctx.fillStyle = '#ffcc00';
          ctx.fill();
          
          // Rotating energy arcs
          ctx.globalAlpha = 0.6 * shieldPulse;
          ctx.strokeStyle = '#ffff88';
          ctx.lineWidth = 2;
          const arcAngle = (Date.now() / 500) % (Math.PI * 2);
          for (let i = 0; i < 4; i++) {
            const angle = arcAngle + (i * Math.PI / 2);
            const radius = (bossW + bossH) / 2.5;
            const arcX = bx + bossW / 2 + Math.cos(angle) * radius;
            const arcY = centerY + Math.sin(angle) * radius * 0.6;
            ctx.beginPath();
            ctx.arc(arcX, arcY, 8, 0, Math.PI * 2);
            ctx.stroke();
          }
          
          // "EMERGING" text indicator
          ctx.globalAlpha = shieldPulse;
          ctx.fillStyle = '#ffcc00';
          ctx.font = "bold 12px \"Press Start 2P\", monospace";
          ctx.textAlign = 'center';
          ctx.shadowColor = '#ff8800';
          ctx.shadowBlur = 10;
          ctx.fillText('? INVINCIBLE ?', bx + bossW / 2, by - (boss.isSuperBoss ? 130 : (boss.isMegaBoss ? 100 : 55)));
          
          ctx.restore();
        }
        
        // Boss health bar - positioned above wings
        const healthBarWidth = bossW;
        const healthBarHeight = boss.isSuperBoss ? 16 : (boss.isMegaBoss ? 14 : 10);
        const healthPercent = boss.health / boss.maxHealth;
        const healthBarY = boss.isSuperBoss ? by - 90 : (boss.isMegaBoss ? by - 60 : by - 35);
        
        // Shield bar for super boss and mega boss (above health bar)
        if (boss.isMegaBoss && boss.maxShield > 0) {
          const shieldBarY = healthBarY - 20;
          const shieldPercent = Math.max(0, boss.shield / boss.maxShield);
          
          // Shield bar background
          ctx.fillStyle = isDark ? '#220000' : '#113333';
          ctx.fillRect(bx, shieldBarY, healthBarWidth, 12);
          
          // Shield bar fill - different color for mega vs super, and dark boss
          const shieldColor1 = isDark ? '#660000' : (boss.isSuperBoss ? '#006688' : '#004466');
          const shieldColor2 = isDark ? '#ff0000' : (boss.isSuperBoss ? '#00ffff' : '#44aaff');
          const shieldGrad = ctx.createLinearGradient(bx, shieldBarY, bx + healthBarWidth * shieldPercent, shieldBarY);
          shieldGrad.addColorStop(0, shieldColor1);
          shieldGrad.addColorStop(1, shieldColor2);
          ctx.fillStyle = shieldGrad;
          ctx.fillRect(bx, shieldBarY, healthBarWidth * shieldPercent, 12);
          
          // Shield bar border
          ctx.strokeStyle = shieldColor2;
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, shieldBarY, healthBarWidth, 12);
          
          // Shield label
          ctx.fillStyle = shieldColor2;
          ctx.font = "8px \"Press Start 2P\", monospace";
          ctx.textAlign = 'right';
          ctx.fillText('SHIELD', bx - 5, shieldBarY + 10);
        }
        
        // Health bar background with border glow
        ctx.shadowColor = boss.isSuperBoss ? '#ff0000' : (boss.isMegaBoss ? '#ff4400' : '#ff00ff');
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#222222';
        ctx.fillRect(bx, healthBarY, healthBarWidth, healthBarHeight);
        ctx.shadowBlur = 0;
        
        // Health gradient
        const healthGrad = ctx.createLinearGradient(bx, healthBarY, bx + healthBarWidth * healthPercent, healthBarY);
        if (healthPercent > 0.5) {
          healthGrad.addColorStop(0, '#00aa00');
          healthGrad.addColorStop(1, '#00ff00');
        } else if (healthPercent > 0.25) {
          healthGrad.addColorStop(0, '#aaaa00');
          healthGrad.addColorStop(1, '#ffff00');
        } else {
          healthGrad.addColorStop(0, '#aa0000');
          healthGrad.addColorStop(1, '#ff0000');
        }
        ctx.fillStyle = healthGrad;
        ctx.fillRect(bx, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
        
        // Health bar segments
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        for (let i = 1; i < 10; i++) {
          ctx.beginPath();
          ctx.moveTo(bx + (healthBarWidth / 10) * i, healthBarY);
          ctx.lineTo(bx + (healthBarWidth / 10) * i, healthBarY + healthBarHeight);
          ctx.stroke();
        }
        
        ctx.strokeStyle = isDark ? '#ff0000' : (boss.isMegaBoss ? '#ff4400' : '#ff00ff');
        ctx.lineWidth = boss.isMegaBoss ? 3 : 2;
        ctx.strokeRect(bx, healthBarY, healthBarWidth, healthBarHeight);
        
        // Boss label with shadow
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillStyle = isDark ? '#ff0000' : (boss.isSuperBoss ? '#ff0000' : (boss.isMegaBoss ? '#ff4400' : '#ff00ff'));
        ctx.font = boss.isSuperBoss ? "bold 16px 'Press Start 2P', monospace" : (boss.isMegaBoss ? "bold 14px 'Press Start 2P', monospace" : "bold 11px 'Press Start 2P', monospace");
        ctx.textAlign = 'center';
        const bossName = boss.isSuperBoss 
          ? (isDark ? `\ud83d\udc80 DARK OVERLORD \ud83d\udc80` : `\ud83d\udc51 OVERLORD \ud83d\udc51`) 
          : (boss.isMegaBoss 
            ? (isDark ? `\ud83d\udc7f SHADOW DREADNOUGHT \ud83d\udc7f` : `\u2694\ufe0f DREADNOUGHT \u2694\ufe0f`) 
            : `WAVE ${waveRef.current} BOSS`);
        ctx.fillText(bossName, bx + bossW / 2, healthBarY - (boss.isSuperBoss ? 28 : 8));
        ctx.shadowBlur = 0;
        
        ctx.restore();
      }
      
      // Draw Mini-Boss
      if (miniBossRef.current) {
        const mb = miniBossRef.current;
        ctx.save();
        
        const mbX = mb.x;
        const mbY = mb.y;
        const mbW = mb.width;
        const mbH = mb.height;
        const pulsePhase = Date.now() / 150;
        
        // Warning flash when entering
        if (mb.warningTimer > 0) {
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(mb.warningTimer * 0.5);
        }
        
        // Engine glow
        ctx.shadowColor = mb.color;
        ctx.shadowBlur = 20 + Math.sin(pulsePhase) * 5;
        ctx.fillStyle = mb.color;
        ctx.beginPath();
        ctx.ellipse(mbX + mbW + 8, mbY + mbH / 2, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Mini-boss body based on type
        const bodyGrad = ctx.createLinearGradient(mbX, mbY, mbX + mbW, mbY);
        bodyGrad.addColorStop(0, '#222222');
        bodyGrad.addColorStop(0.3, mb.color);
        bodyGrad.addColorStop(0.7, mb.color);
        bodyGrad.addColorStop(1, '#111111');
        ctx.fillStyle = bodyGrad;
        
        // Different shapes based on attack pattern
        switch (mb.attackPattern) {
          case 'spread': // Gunship - angular design
            ctx.beginPath();
            ctx.moveTo(mbX, mbY + mbH / 2);
            ctx.lineTo(mbX + mbW * 0.2, mbY);
            ctx.lineTo(mbX + mbW * 0.8, mbY + 5);
            ctx.lineTo(mbX + mbW, mbY + mbH * 0.3);
            ctx.lineTo(mbX + mbW, mbY + mbH * 0.7);
            ctx.lineTo(mbX + mbW * 0.8, mbY + mbH - 5);
            ctx.lineTo(mbX + mbW * 0.2, mbY + mbH);
            ctx.closePath();
            ctx.fill();
            break;
          case 'bombs': // Bomber - bulky design
            ctx.beginPath();
            ctx.moveTo(mbX + 10, mbY + mbH / 2);
            ctx.quadraticCurveTo(mbX, mbY + 10, mbX + mbW * 0.3, mbY);
            ctx.lineTo(mbX + mbW, mbY + mbH * 0.2);
            ctx.lineTo(mbX + mbW, mbY + mbH * 0.8);
            ctx.lineTo(mbX + mbW * 0.3, mbY + mbH);
            ctx.quadraticCurveTo(mbX, mbY + mbH - 10, mbX + 10, mbY + mbH / 2);
            ctx.closePath();
            ctx.fill();
            break;
          case 'chase': // Hunter - sleek design
            ctx.beginPath();
            ctx.moveTo(mbX, mbY + mbH / 2);
            ctx.lineTo(mbX + mbW * 0.15, mbY + 5);
            ctx.lineTo(mbX + mbW, mbY + mbH * 0.4);
            ctx.lineTo(mbX + mbW, mbY + mbH * 0.6);
            ctx.lineTo(mbX + mbW * 0.15, mbY + mbH - 5);
            ctx.closePath();
            ctx.fill();
            break;
          case 'laser': // Sentinel - circular design
            ctx.beginPath();
            ctx.arc(mbX + mbW / 2, mbY + mbH / 2, Math.min(mbW, mbH) / 2, 0, Math.PI * 2);
            ctx.fill();
            // Inner ring
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(mbX + mbW / 2, mbY + mbH / 2, Math.min(mbW, mbH) / 3, 0, Math.PI * 2);
            ctx.stroke();
            break;
          case 'spawn': // Swarm Lord - insectoid design
            ctx.beginPath();
            ctx.moveTo(mbX + 5, mbY + mbH / 2);
            ctx.lineTo(mbX + mbW * 0.3, mbY);
            ctx.lineTo(mbX + mbW * 0.5, mbY + 8);
            ctx.lineTo(mbX + mbW * 0.7, mbY);
            ctx.lineTo(mbX + mbW, mbY + mbH * 0.3);
            ctx.lineTo(mbX + mbW - 10, mbY + mbH / 2);
            ctx.lineTo(mbX + mbW, mbY + mbH * 0.7);
            ctx.lineTo(mbX + mbW * 0.7, mbY + mbH);
            ctx.lineTo(mbX + mbW * 0.5, mbY + mbH - 8);
            ctx.lineTo(mbX + mbW * 0.3, mbY + mbH);
            ctx.closePath();
            ctx.fill();
            break;
            
          // === NEW MINI-BOSS TYPE SHAPES ===
          case 'snipe': // Deadeye - sniper rifle shape
            ctx.beginPath();
            ctx.moveTo(mbX, mbY + mbH / 2);
            ctx.lineTo(mbX + mbW * 0.15, mbY + mbH * 0.3);
            ctx.lineTo(mbX + mbW * 0.6, mbY + mbH * 0.25);
            ctx.lineTo(mbX + mbW, mbY + mbH / 2); // Long barrel
            ctx.lineTo(mbX + mbW * 0.6, mbY + mbH * 0.75);
            ctx.lineTo(mbX + mbW * 0.15, mbY + mbH * 0.7);
            ctx.closePath();
            ctx.fill();
            // Scope
            ctx.fillStyle = '#ff0088';
            ctx.beginPath();
            ctx.arc(mbX + mbW * 0.3, mbY + mbH * 0.35, 6, 0, Math.PI * 2);
            ctx.fill();
            break;
            
          case 'barrage': // Juggernaut - tank shape
            ctx.beginPath();
            ctx.moveTo(mbX + 10, mbY + 10);
            ctx.lineTo(mbX + mbW - 5, mbY + 5);
            ctx.lineTo(mbX + mbW, mbY + mbH * 0.3);
            ctx.lineTo(mbX + mbW, mbY + mbH * 0.7);
            ctx.lineTo(mbX + mbW - 5, mbY + mbH - 5);
            ctx.lineTo(mbX + 10, mbY + mbH - 10);
            ctx.lineTo(mbX, mbY + mbH * 0.7);
            ctx.lineTo(mbX, mbY + mbH * 0.3);
            ctx.closePath();
            ctx.fill();
            // Armor plates
            ctx.strokeStyle = '#555555';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(mbX + mbW * 0.3, mbY);
            ctx.lineTo(mbX + mbW * 0.3, mbY + mbH);
            ctx.moveTo(mbX + mbW * 0.6, mbY);
            ctx.lineTo(mbX + mbW * 0.6, mbY + mbH);
            ctx.stroke();
            break;
            
          case 'teleport': // Phantom - ethereal shape
            const phantomAlpha = mb.teleportFlashTimer > 0 ? 0.3 + 0.7 * Math.sin(mb.teleportFlashTimer * 0.5) : 1;
            ctx.globalAlpha = phantomAlpha;
            ctx.beginPath();
            ctx.moveTo(mbX, mbY + mbH / 2);
            ctx.bezierCurveTo(mbX + mbW * 0.2, mbY - 10, mbX + mbW * 0.8, mbY - 10, mbX + mbW, mbY + mbH * 0.3);
            ctx.lineTo(mbX + mbW * 0.7, mbY + mbH / 2);
            ctx.lineTo(mbX + mbW, mbY + mbH * 0.7);
            ctx.bezierCurveTo(mbX + mbW * 0.8, mbY + mbH + 10, mbX + mbW * 0.2, mbY + mbH + 10, mbX, mbY + mbH / 2);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
            break;
            
          case 'pulse': // Pulsar - star/burst shape
            const starPoints = 8;
            ctx.beginPath();
            for (let i = 0; i < starPoints * 2; i++) {
              const angle = (i * Math.PI) / starPoints - Math.PI / 2;
              const radius = i % 2 === 0 ? Math.min(mbW, mbH) / 2 : Math.min(mbW, mbH) / 4;
              const x = mbX + mbW / 2 + Math.cos(angle + pulsePhase * 0.5) * radius;
              const y = mbY + mbH / 2 + Math.sin(angle + pulsePhase * 0.5) * radius;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            break;
            
          case 'berserk': // Berserker - aggressive spiky shape
            const spikeIntensity = 1 + (1 - mb.health / mb.maxHealth) * 0.5; // Spikier at low health
            ctx.beginPath();
            ctx.moveTo(mbX, mbY + mbH / 2);
            ctx.lineTo(mbX + mbW * 0.1, mbY + 5 * spikeIntensity);
            ctx.lineTo(mbX + mbW * 0.25, mbY + mbH * 0.3);
            ctx.lineTo(mbX + mbW * 0.4, mbY - 5 * spikeIntensity);
            ctx.lineTo(mbX + mbW * 0.55, mbY + mbH * 0.25);
            ctx.lineTo(mbX + mbW * 0.75, mbY + 5);
            ctx.lineTo(mbX + mbW, mbY + mbH * 0.4);
            ctx.lineTo(mbX + mbW - 5, mbY + mbH / 2);
            ctx.lineTo(mbX + mbW, mbY + mbH * 0.6);
            ctx.lineTo(mbX + mbW * 0.75, mbY + mbH - 5);
            ctx.lineTo(mbX + mbW * 0.55, mbY + mbH * 0.75);
            ctx.lineTo(mbX + mbW * 0.4, mbY + mbH + 5 * spikeIntensity);
            ctx.lineTo(mbX + mbW * 0.25, mbY + mbH * 0.7);
            ctx.lineTo(mbX + mbW * 0.1, mbY + mbH - 5 * spikeIntensity);
            ctx.closePath();
            ctx.fill();
            // Rage glow at low health
            if (mb.health / mb.maxHealth < 0.4) {
              ctx.shadowColor = '#ff0000';
              ctx.shadowBlur = 20 + Math.sin(pulsePhase * 3) * 10;
            }
            break;
            
          default: // Fallback rectangle
            ctx.fillRect(mbX, mbY, mbW, mbH);
            break;
        }
        
        // === MODIFIER VISUAL EFFECTS ===
        if (mb.modifierEffect) {
          ctx.save();
          switch (mb.modifierEffect) {
            case 'armor':
              // Metallic armor overlay
              ctx.globalAlpha = 0.3;
              ctx.fillStyle = '#888888';
              ctx.fillRect(mbX, mbY, mbW, mbH);
              ctx.strokeStyle = '#aaaaaa';
              ctx.lineWidth = 3;
              ctx.strokeRect(mbX + 3, mbY + 3, mbW - 6, mbH - 6);
              break;
              
            case 'shield':
              // Shield bubble
              if (mb.modShield > 0) {
                const shieldAlpha = 0.3 + (mb.modShield / mb.modShieldMax) * 0.3;
                ctx.globalAlpha = shieldAlpha;
                ctx.strokeStyle = '#00aaff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(mbX + mbW / 2, mbY + mbH / 2, Math.max(mbW, mbH) / 2 + 10, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = 'rgba(0, 170, 255, 0.15)';
                ctx.fill();
              }
              break;
              
            case 'rage':
              // Rage aura
              ctx.globalAlpha = 0.4;
              ctx.shadowColor = '#ff4400';
              ctx.shadowBlur = 15 + Math.sin(pulsePhase * 2) * 5;
              ctx.strokeStyle = '#ff4400';
              ctx.lineWidth = 2;
              ctx.strokeRect(mbX - 5, mbY - 5, mbW + 10, mbH + 10);
              break;
              
            case 'phase':
              // Phasing effect
              if (mb.phaseInvulnTimer > 0) {
                ctx.globalAlpha = 0.3 + 0.2 * Math.sin(pulsePhase * 4);
                ctx.fillStyle = '#cc88ff';
                ctx.fillRect(mbX, mbY, mbW, mbH);
              }
              break;
              
            case 'speed':
              // Speed lines
              ctx.globalAlpha = 0.5;
              ctx.strokeStyle = '#00ff88';
              ctx.lineWidth = 2;
              for (let i = 0; i < 3; i++) {
                const lineY = mbY + mbH * 0.25 + i * mbH * 0.25;
                ctx.beginPath();
                ctx.moveTo(mbX + mbW + 5, lineY);
                ctx.lineTo(mbX + mbW + 25 + Math.random() * 10, lineY);
                ctx.stroke();
              }
              break;
              
            case 'vampire':
              // Dark aura
              ctx.globalAlpha = 0.4;
              const vampGrad = ctx.createRadialGradient(mbX + mbW / 2, mbY + mbH / 2, 0, mbX + mbW / 2, mbY + mbH / 2, Math.max(mbW, mbH));
              vampGrad.addColorStop(0, 'rgba(136, 0, 0, 0)');
              vampGrad.addColorStop(0.7, 'rgba(136, 0, 0, 0.3)');
              vampGrad.addColorStop(1, 'rgba(136, 0, 0, 0.6)');
              ctx.fillStyle = vampGrad;
              ctx.beginPath();
              ctx.arc(mbX + mbW / 2, mbY + mbH / 2, Math.max(mbW, mbH) * 0.7, 0, Math.PI * 2);
              ctx.fill();
              break;
          }
          ctx.restore();
        }
        
        // Sniper lock-on laser
        if (mb.sniperLocked && mb.sniperLockTimer > 0) {
          ctx.save();
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(mb.sniperLockTimer * 0.3);
          ctx.strokeStyle = '#ff0088';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(mbX, mbY + mbH / 2);
          ctx.lineTo(mb.sniperTargetX, mb.sniperTargetY);
          ctx.stroke();
          ctx.setLineDash([]);
          // Target reticle
          ctx.beginPath();
          ctx.arc(mb.sniperTargetX, mb.sniperTargetY, 15, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(mb.sniperTargetX - 20, mb.sniperTargetY);
          ctx.lineTo(mb.sniperTargetX + 20, mb.sniperTargetY);
          ctx.moveTo(mb.sniperTargetX, mb.sniperTargetY - 20);
          ctx.lineTo(mb.sniperTargetX, mb.sniperTargetY + 20);
          ctx.stroke();
          ctx.restore();
        }
        
        // Polarity indicator
        const polarityColor = mb.polarity === 'light' ? '#ffffff' : '#8800ff';
        ctx.shadowColor = polarityColor;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = polarityColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mbX + mbW / 2, mbY + mbH / 2, 15, 0, Math.PI * 2);
        ctx.stroke();
        
        // Eye/cockpit glow
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mbX + mbW * 0.3, mbY + mbH / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        
        // Health bar
        const hpBarWidth = mbW;
        const hpBarHeight = 8;
        const hpPercent = mb.health / mb.maxHealth;
        const hpBarY = mbY - 20;
        
        ctx.fillStyle = '#222222';
        ctx.fillRect(mbX, hpBarY, hpBarWidth, hpBarHeight);
        
        const hpGrad = ctx.createLinearGradient(mbX, hpBarY, mbX + hpBarWidth * hpPercent, hpBarY);
        hpGrad.addColorStop(0, hpPercent > 0.5 ? '#00aa00' : (hpPercent > 0.25 ? '#aaaa00' : '#aa0000'));
        hpGrad.addColorStop(1, hpPercent > 0.5 ? '#00ff00' : (hpPercent > 0.25 ? '#ffff00' : '#ff0000'));
        ctx.fillStyle = hpGrad;
        ctx.fillRect(mbX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);
        
        ctx.strokeStyle = mb.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(mbX, hpBarY, hpBarWidth, hpBarHeight);
        
        // Name label
        ctx.fillStyle = mb.color;
        ctx.font = "10px \"Press Start 2P\", monospace";
        ctx.textAlign = 'center';
        ctx.fillText(mb.name, mbX + mbW / 2, hpBarY - 5);
        
        ctx.restore();
      }

      // Draw special power-up effects
      
      // Draw Black Hole effect
      if (blackHoleRef.current) {
        const bh = blackHoleRef.current;
        const time = Date.now() / 1000;
        const pulseScale = 1 + Math.sin(time * 5) * 0.1;
        
        ctx.save();
        ctx.translate(bh.x, bh.y);
        
        // Outer spiral
        for (let i = 0; i < 6; i++) {
          const spiralAngle = time * 3 + i * Math.PI / 3;
          const spiralRadius = 60 + Math.sin(time * 4 + i) * 10;
          ctx.strokeStyle = `rgba(102, 0, 255, ${0.3 + Math.sin(time * 4 + i * 0.5) * 0.2})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, spiralRadius * pulseScale, spiralAngle, spiralAngle + Math.PI / 2);
          ctx.stroke();
        }
        
        // Event horizon
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, bh.radius);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.5, '#220044');
        gradient.addColorStop(0.8, '#6600ff');
        gradient.addColorStop(1, 'rgba(102, 0, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, bh.radius * pulseScale, 0, Math.PI * 2);
        ctx.fill();
        
        // Core singularity
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
      
      // Draw Clone effect
      if (cloneRef.current) {
        const clone = cloneRef.current;
        const time = Date.now() / 1000;
        
        ctx.save();
        ctx.globalAlpha = clone.alpha * (0.5 + Math.sin(time * 4) * 0.2);
        
        // Draw ghost-like player copy
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#00aaaa';
        
        // Simple ship shape for clone
        ctx.beginPath();
        ctx.moveTo(clone.x + PLAYER_WIDTH, clone.y + PLAYER_HEIGHT / 2);
        ctx.lineTo(clone.x, clone.y);
        ctx.lineTo(clone.x + 10, clone.y + PLAYER_HEIGHT / 2);
        ctx.lineTo(clone.x, clone.y + PLAYER_HEIGHT);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      }
      
      // Draw Invincibility aura
      if (upgradesRef.current.invincible) {
        const time = Date.now() / 1000;
        const player = playerRef.current;
        
        ctx.save();
        ctx.translate(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2);
        
        // Rainbow pulsing shield
        const hue = (time * 100) % 360;
        ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
        ctx.lineWidth = 3 + Math.sin(time * 8) * 2;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 20;
        
        ctx.beginPath();
        ctx.arc(0, 0, 35 + Math.sin(time * 5) * 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner glow
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5 + Math.sin(time * 10) * 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
      }
      
      // Draw Time Warp effect (slow-mo visual)
      if (upgradesRef.current.timeWarp) {
        const time = Date.now() / 1000;
        ctx.save();
        
        // Screen tint
        ctx.globalAlpha = 0.1 + Math.sin(time * 2) * 0.05;
        ctx.fillStyle = '#8800ff';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Clock-like circles at edges
        for (let i = 0; i < 4; i++) {
          const angle = time + i * Math.PI / 2;
          const x = GAME_WIDTH / 2 + Math.cos(angle) * (GAME_WIDTH / 2 - 30);
          const y = GAME_HEIGHT / 2 + Math.sin(angle) * (GAME_HEIGHT / 2 - 30);
          
          ctx.globalAlpha = 0.3;
          ctx.strokeStyle = '#aa00ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 15, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        ctx.restore();
      }
      
      // Draw Laser Beam
      if (upgradesRef.current.laserBeam) {
        const player = playerRef.current;
        const time = Date.now() / 1000;
        
        ctx.save();
        
        // Beam
        const beamY = player.y + PLAYER_HEIGHT / 2;
        const gradient = ctx.createLinearGradient(player.x + PLAYER_WIDTH, beamY, GAME_WIDTH, beamY);
        gradient.addColorStop(0, '#ff00aa');
        gradient.addColorStop(0.5, '#ff44cc');
        gradient.addColorStop(1, 'rgba(255, 0, 170, 0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 8 + Math.sin(time * 20) * 3;
        ctx.shadowColor = '#ff00aa';
        ctx.shadowBlur = 20;
        
        ctx.beginPath();
        ctx.moveTo(player.x + PLAYER_WIDTH, beamY);
        ctx.lineTo(GAME_WIDTH, beamY + Math.sin(time * 15) * 5);
        ctx.stroke();
        
        // Core beam
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(player.x + PLAYER_WIDTH, beamY);
        ctx.lineTo(GAME_WIDTH, beamY);
        ctx.stroke();
        
        ctx.restore();
        
        // Damage enemies in beam path
        enemiesRef.current.forEach(enemy => {
          const ey = enemy.y + (enemy.height || ENEMY_HEIGHT) / 2;
          if (Math.abs(ey - beamY) < 20 && enemy.x > player.x) {
            enemy.health -= 0.5; // Continuous damage
          }
        });
      }
      
      // Draw Phoenix aura if active
      if (upgradesRef.current.phoenix) {
        const player = playerRef.current;
        const time = Date.now() / 1000;
        
        ctx.save();
        ctx.translate(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2);
        
        // Flame-like particles
        for (let i = 0; i < 8; i++) {
          const angle = time * 2 + i * Math.PI / 4;
          const dist = 25 + Math.sin(time * 6 + i) * 8;
          const x = Math.cos(angle) * dist;
          const y = Math.sin(angle) * dist;
          
          ctx.globalAlpha = 0.5 + Math.sin(time * 8 + i) * 0.3;
          ctx.fillStyle = i % 2 === 0 ? '#ff8800' : '#ffaa00';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }

      // Draw Force Pod(s)
      if (forceRef.current && forceRef.current.active) {
        const force = forceRef.current;
        const currentSize = force.currentSize || FORCE_SIZE;
        const powerRatio = force.power / FORCE_MAX_POWER;
        const forceLevel = force.level || 1;
        const levelData = FORCE_LEVELS[forceLevel] || FORCE_LEVELS[1];
        
        // Function to draw a single Force pod
        const drawForcePod = (x, y, size, isPrimary) => {
          // Guard against non-finite coordinates
          if (!isFinite(x) || !isFinite(y) || !isFinite(size) || size <= 0) return;
          
          ctx.save();
          
          // Color based on level
          const levelColor = levelData.color;
          const glowIntensity = 20 + forceLevel * 8 + powerRatio * 15;
          
          ctx.shadowColor = levelColor;
          ctx.shadowBlur = glowIntensity;
          
          // Main orb gradient - ensure radius is positive
          const safeSize = Math.max(2, size);
          const forceGradient = ctx.createRadialGradient(x, y, 0, x, y, safeSize / 2);
          if (force.split) {
            // Electric blue-white when split
            forceGradient.addColorStop(0, '#ffffff');
            forceGradient.addColorStop(0.2, '#aaffff');
            forceGradient.addColorStop(0.5, '#00ddff');
            forceGradient.addColorStop(0.8, '#0088ff');
            forceGradient.addColorStop(1, '#0044aa');
            ctx.shadowColor = '#00aaff';
          } else {
            // Convert levelColor to gradient
            forceGradient.addColorStop(0, '#ffffff');
            forceGradient.addColorStop(0.3, levelColor);
            forceGradient.addColorStop(0.7, levelColor);
            forceGradient.addColorStop(1, '#331100');
          }
          
          ctx.fillStyle = forceGradient;
          ctx.beginPath();
          ctx.arc(x, y, size / 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Inner core - brighter for higher levels
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x, y, size / 6 + forceLevel, 0, Math.PI * 2);
          ctx.fill();
          
          // Level indicator rings
          if (forceLevel > 1) {
            for (let ring = 0; ring < forceLevel - 1; ring++) {
              const ringRadius = size / 2 + 3 + ring * 4;
              ctx.strokeStyle = levelColor;
              ctx.globalAlpha = 0.4 + (ring * 0.15);
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          }
          
          // Pulsing ring - more intense when powered
          const pulseSpeed = 100 - powerRatio * 50;
          const pulseSize = size / 2 + Math.sin(Date.now() / pulseSpeed) * (3 + powerRatio * 5);
          ctx.strokeStyle = force.split ? 'rgba(100, 200, 255, 0.7)' : `${levelColor}aa`;
          ctx.lineWidth = 2 + forceLevel * 0.5;
          ctx.beginPath();
          ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
          ctx.stroke();
          
          // Electric sparks - more for higher levels
          const sparkCount = forceLevel + (force.power > 25 ? Math.floor(powerRatio * 4) : 0);
          if (sparkCount > 0 && !force.split) {
            for (let i = 0; i < sparkCount; i++) {
              const sparkAngle = (Date.now() / (150 - forceLevel * 20) + i * Math.PI * 2 / sparkCount) % (Math.PI * 2);
              const sparkDist = size / 2 + 5 + Math.random() * (8 + forceLevel * 3);
              const sparkX = x + Math.cos(sparkAngle) * sparkDist;
              const sparkY = y + Math.sin(sparkAngle) * sparkDist;
              
              ctx.strokeStyle = levelColor;
              ctx.globalAlpha = 0.5 + Math.random() * 0.5;
              ctx.lineWidth = 1 + (forceLevel > 3 ? 1 : 0);
              ctx.beginPath();
              ctx.moveTo(x + Math.cos(sparkAngle) * (size / 2), y + Math.sin(sparkAngle) * (size / 2));
              ctx.lineTo(sparkX, sparkY);
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }
          
          // Level 5 (OMEGA) special effect - orbiting particles
          if (forceLevel >= 5) {
            const particleCount = 6;
            for (let i = 0; i < particleCount; i++) {
              const pAngle = (Date.now() / 500 + i * Math.PI * 2 / particleCount) % (Math.PI * 2);
              const pDist = size / 2 + 15;
              const px = x + Math.cos(pAngle) * pDist;
              const py = y + Math.sin(pAngle) * pDist;
              
              ctx.fillStyle = '#00ffff';
              ctx.shadowColor = '#00ffff';
              ctx.shadowBlur = 8;
              ctx.beginPath();
              ctx.arc(px, py, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          
          // Level name indicator (small text above pod when powered)
          if (forceLevel > 1 && isPrimary) {
            ctx.fillStyle = levelColor;
            ctx.font = "bold 8px Arial";
            ctx.textAlign = 'center';
            ctx.fillText(levelData.name, x, y - size / 2 - 8);
          }
          
          ctx.restore();
        };
        
        // Draw primary Force pod
        if (force.split) {
          // Calculate rotating positions for orbiting pods
          const orbitRadius = force.splitY;
          const topPodX = force.x + Math.cos(force.splitAngle) * orbitRadius * 0.3;
          const topPodY = force.y + Math.sin(force.splitAngle) * orbitRadius - orbitRadius * 0.5;
          const botPodX = force.x + Math.cos(force.splitAngle + Math.PI) * orbitRadius * 0.3;
          const botPodY = force.y + Math.sin(force.splitAngle + Math.PI) * orbitRadius + orbitRadius * 0.5;
          
          // Draw two pods when split - orbiting around center
          drawForcePod(topPodX, topPodY, currentSize * 0.7, true);
          drawForcePod(botPodX, botPodY, currentSize * 0.7, false);
          
          // Draw connecting electricity between split pods
          ctx.save();
          ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#00aaff';
          ctx.shadowBlur = 10;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(topPodX, topPodY);
          ctx.lineTo(botPodX, botPodY);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Draw orbit trail effect
          ctx.globalAlpha = 0.3;
          ctx.strokeStyle = '#00aaff';
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.ellipse(force.x, force.y, orbitRadius * 0.3, orbitRadius, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          
          ctx.restore();
        } else {
          drawForcePod(force.x, force.y, currentSize, true);
        }
        
        // Draw power meter below Force
        if (force.power > 0) {
          const meterWidth = 30;
          const meterHeight = 4;
          const meterX = force.x - meterWidth / 2;
          const meterY = force.y + (force.split ? force.splitY + 20 : currentSize / 2 + 10);
          
          ctx.fillStyle = '#333333';
          ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
          
          const powerGradient = ctx.createLinearGradient(meterX, meterY, meterX + meterWidth, meterY);
          powerGradient.addColorStop(0, '#ff8800');
          powerGradient.addColorStop(0.5, '#ffff00');
          powerGradient.addColorStop(1, '#00ffff');
          ctx.fillStyle = powerGradient;
          ctx.fillRect(meterX, meterY, meterWidth * powerRatio, meterHeight);
          
          ctx.strokeStyle = force.split ? '#00ffff' : '#ff8800';
          ctx.lineWidth = 1;
          ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
        }
        
        // Draw Force Shield effect when active
        if (force.shieldActive) {
          const player = playerRef.current;
          const shieldRadius = 60;
          const shieldPulse = Math.sin(Date.now() / 100) * 5;
          
          ctx.save();
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 20;
          
          // Main shield bubble around player
          const shieldGradient = ctx.createRadialGradient(
            player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, 0,
            player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, shieldRadius + shieldPulse
          );
          shieldGradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
          shieldGradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.1)');
          shieldGradient.addColorStop(0.9, 'rgba(0, 255, 255, 0.4)');
          shieldGradient.addColorStop(1, 'rgba(0, 255, 255, 0.6)');
          
          ctx.fillStyle = shieldGradient;
          ctx.beginPath();
          ctx.arc(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, shieldRadius + shieldPulse, 0, Math.PI * 2);
          ctx.fill();
          
          // Hexagonal shield pattern
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          const hexCount = 6;
          for (let i = 0; i < hexCount; i++) {
            const angle = (Date.now() / 1000 + i * Math.PI * 2 / hexCount) % (Math.PI * 2);
            const hx = player.x + PLAYER_WIDTH / 2 + Math.cos(angle) * (shieldRadius * 0.7);
            const hy = player.y + PLAYER_HEIGHT / 2 + Math.sin(angle) * (shieldRadius * 0.7);
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
              const hAngle = j * Math.PI / 3;
              const hpx = hx + Math.cos(hAngle) * 10;
              const hpy = hy + Math.sin(hAngle) * 10;
              if (j === 0) ctx.moveTo(hpx, hpy);
              else ctx.lineTo(hpx, hpy);
            }
            ctx.closePath();
            ctx.stroke();
          }
          
          // Shield timer indicator
          const timerRatio = force.shieldTimer / 180;
          ctx.fillStyle = '#00ffff';
          ctx.font = "bold 10px Arial";
          ctx.textAlign = 'center';
          ctx.fillText(`SHIELD: ${Math.ceil(force.shieldTimer / 60)}s`, 
            player.x + PLAYER_WIDTH / 2, player.y - 20);
          
          ctx.restore();
        }
      }

      // Draw electricity bolts
      electricityRef.current.forEach(elec => {
        ctx.save();
        ctx.strokeStyle = `rgba(100, 200, 255, ${elec.lifetime / 10})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 15;
        
        // Draw jagged lightning
        ctx.beginPath();
        ctx.moveTo(elec.x1, elec.y1);
        
        const segments = 5;
        const dx = (elec.x2 - elec.x1) / segments;
        const dy = (elec.y2 - elec.y1) / segments;
        
        for (let i = 1; i < segments; i++) {
          const jitterX = (Math.random() - 0.5) * 20;
          const jitterY = (Math.random() - 0.5) * 20;
          ctx.lineTo(elec.x1 + dx * i + jitterX, elec.y1 + dy * i + jitterY);
        }
        
        ctx.lineTo(elec.x2, elec.y2);
        ctx.stroke();
        
        // Inner bright core
        ctx.strokeStyle = `rgba(255, 255, 255, ${elec.lifetime / 15})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
      });

      // ============ ENHANCED HUD ============
      const hudTime = Date.now();
      
      // === TOP LEFT: Score Panel ===
      ctx.save();
      // Score background panel
      const scoreGrad = ctx.createLinearGradient(0, 0, 200, 0);
      scoreGrad.addColorStop(0, 'rgba(0, 20, 40, 0.85)');
      scoreGrad.addColorStop(1, 'rgba(0, 20, 40, 0)');
      ctx.fillStyle = scoreGrad;
      ctx.fillRect(0, 0, 200, 45);
      
      // Score border
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 45);
      ctx.lineTo(160, 45);
      ctx.lineTo(200, 25);
      ctx.stroke();
      
      // Score label
      ctx.font = "8px \"Press Start 2P\", monospace";
      ctx.fillStyle = '#00ff88';
      ctx.textAlign = 'left';
      ctx.fillText('SCORE', 12, 14);
      
      // Score value with glow
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 10;
      ctx.font = "18px \"Press Start 2P\", monospace";
      ctx.fillStyle = '#ffffff';
      ctx.fillText(scoreRef.current.toLocaleString(), 12, 35);
      ctx.shadowBlur = 0;
      
      // Multiplier display
      const mult = scoreMultiplierRef.current;
      if (mult > 1.0) {
        const multColor = mult >= 8 ? '#ff00ff' : mult >= 5 ? '#ff6600' : mult >= 3 ? '#ffff00' : '#00ffff';
        const multAlpha = multiplierDecayTimerRef.current > 0 ? 1.0 : 0.5 + 0.5 * Math.sin(Date.now() / 100); // Pulse when decaying
        ctx.globalAlpha = multAlpha;
        ctx.shadowColor = multColor;
        ctx.shadowBlur = 15;
        ctx.font = "12px \"Press Start 2P\", monospace";
        ctx.fillStyle = multColor;
        ctx.fillText(`\u00d7${mult.toFixed(1)}`, 12, 52);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }
      
      // Challenge mode timer display
      const currentMode = gameModeRef.current;
      if (currentMode === 'survival' || currentMode === 'timeAttack') {
        const timerMs = currentMode === 'survival' 
          ? challengeStatsRef.current.survivalTime 
          : challengeStatsRef.current.timeAttackTime;
        const totalSeconds = Math.floor(timerMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Timer label
        ctx.font = "6px \"Press Start 2P\", monospace";
        ctx.fillStyle = currentMode === 'survival' ? '#ff4444' : '#4488ff';
        ctx.fillText(currentMode === 'survival' ? 'SURVIVAL TIME' : 'TIME', 130, 14);
        
        // Timer value
        ctx.shadowColor = currentMode === 'survival' ? '#ff4444' : '#4488ff';
        ctx.shadowBlur = 10;
        ctx.font = "14px \"Press Start 2P\", monospace";
        ctx.fillStyle = '#ffffff';
        ctx.fillText(timerText, 130, 32);
        ctx.shadowBlur = 0;
      } else if (currentMode === 'bossRush') {
        // Boss Rush mode: show bosses defeated
        ctx.font = "6px \"Press Start 2P\", monospace";
        ctx.fillStyle = '#aa44ff';
        ctx.fillText('BOSS RUSH', 130, 14);
        
        ctx.shadowColor = '#aa44ff';
        ctx.shadowBlur = 10;
        ctx.font = "14px \"Press Start 2P\", monospace";
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`BOSS ${Math.ceil(waveRef.current / 5)}/4`, 130, 32);
        ctx.shadowBlur = 0;
      }
      ctx.restore();
      
      // === TOP RIGHT: Lives Panel ===
      ctx.save();
      const livesGrad = ctx.createLinearGradient(GAME_WIDTH - 180, 0, GAME_WIDTH, 0);
      livesGrad.addColorStop(0, 'rgba(40, 0, 0, 0)');
      livesGrad.addColorStop(1, 'rgba(40, 0, 0, 0.85)');
      ctx.fillStyle = livesGrad;
      ctx.fillRect(GAME_WIDTH - 180, 0, 180, 45);
      
      // Lives border
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(GAME_WIDTH, 45);
      ctx.lineTo(GAME_WIDTH - 140, 45);
      ctx.lineTo(GAME_WIDTH - 180, 25);
      ctx.stroke();
      
      // Lives label
      ctx.font = "8px \"Press Start 2P\", monospace";
      ctx.fillStyle = '#ff6666';
      ctx.textAlign = 'right';
      ctx.fillText('LIVES', GAME_WIDTH - 12, 14);
      
      // Draw heart icons
      const lives = Math.max(0, livesRef.current);
      for (let i = 0; i < 3; i++) {
        const heartX = GAME_WIDTH - 35 - i * 30;
        const heartY = 28;
        const isActive = i < lives;
        
        ctx.beginPath();
        // Heart shape
        ctx.moveTo(heartX, heartY + 4);
        ctx.bezierCurveTo(heartX, heartY, heartX - 8, heartY, heartX - 8, heartY + 4);
        ctx.bezierCurveTo(heartX - 8, heartY + 10, heartX, heartY + 14, heartX, heartY + 18);
        ctx.bezierCurveTo(heartX, heartY + 14, heartX + 8, heartY + 10, heartX + 8, heartY + 4);
        ctx.bezierCurveTo(heartX + 8, heartY, heartX, heartY, heartX, heartY + 4);
        
        if (isActive) {
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#ff4444';
          ctx.fill();
          // Highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(heartX - 3, heartY + 5, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = '#442222';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
      ctx.restore();
      
      // === BOMB STOCK DISPLAY (below lives) ===
      ctx.save();
      const bombY = 55;
      const bombX = GAME_WIDTH - 15;
      ctx.font = "8px \"Press Start 2P\", monospace";
      ctx.fillStyle = '#ff8800';
      ctx.textAlign = 'right';
      ctx.fillText('BOMB', bombX, bombY);
      
      // Draw bomb icons
      const bombStock = bombRef.current.stock;
      for (let i = 0; i < 3; i++) {
        const iconX = bombX - 5 - i * 22;
        const iconY = bombY + 10;
        const isActive = i < bombStock;
        
        ctx.font = '14px Arial';
        ctx.globalAlpha = isActive ? 1 : 0.3;
        if (isActive) {
          ctx.shadowColor = '#ff4400';
          ctx.shadowBlur = 8;
        }
        ctx.fillText('\ud83d\udca3', iconX, iconY + 12);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      
      // === RENDER IMPACT PARTICLES ===
      ctx.save();
      impactParticlesRef.current.forEach(p => {
        const alpha = p.lifetime / p.maxLifetime;
        ctx.globalAlpha = Math.min(1, alpha * p.brightness);
        
        // Draw glow ring
        if (!perfMode) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
        }
        
        // Main particle
        ctx.fillStyle = p.color;
        ctx.beginPath();
        const sizeScale = 0.6 + alpha * 0.4;
        ctx.arc(p.x, p.y, p.size * sizeScale, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright core
        if (p.size > 2) {
          ctx.globalAlpha = Math.min(1, alpha * p.brightness * 1.2);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * sizeScale * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;
      ctx.restore();
      
      // === RENDER SPARK PARTICLES ===
      ctx.save();
      sparkParticlesRef.current.forEach(p => {
        const alpha = p.lifetime / p.maxLifetime;
        ctx.globalAlpha = alpha * 0.9;
        
        // Draw spark trail
        if (p.prevX !== undefined && p.prevY !== undefined) {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1, p.size * alpha * 1.2);
          if (!perfMode) {
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;
          }
          ctx.beginPath();
          ctx.moveTo(p.prevX, p.prevY);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        
        // Draw spark head (bright point)
        ctx.globalAlpha = alpha;
        if (!perfMode) {
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 8;
        }
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glow
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      ctx.restore();
      
      // === GRAZE METER (bottom left) ===
      ctx.save();
      const grazeMeterX = 10;
      const grazeMeterY = GAME_HEIGHT - 50;
      const grazeMeterWidth = 80;
      const grazeMeterHeight = 8;
      const graze = grazeRef.current;
      
      // Graze meter background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(grazeMeterX, grazeMeterY, grazeMeterWidth, grazeMeterHeight);
      
      // Graze meter fill
      const grazeRatio = graze.meter / GRAZE_METER_MAX;
      const grazeGrad = ctx.createLinearGradient(grazeMeterX, grazeMeterY, grazeMeterX + grazeMeterWidth, grazeMeterY);
      grazeGrad.addColorStop(0, '#00aaff');
      grazeGrad.addColorStop(0.5, '#00ffff');
      grazeGrad.addColorStop(1, '#88ffff');
      ctx.fillStyle = grazeGrad;
      ctx.fillRect(grazeMeterX, grazeMeterY, grazeMeterWidth * grazeRatio, grazeMeterHeight);
      
      // Graze meter border with glow when active
      if (graze.displayTimer > 0) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
      }
      ctx.strokeStyle = graze.displayTimer > 0 ? '#00ffff' : '#004466';
      ctx.lineWidth = 1;
      ctx.strokeRect(grazeMeterX, grazeMeterY, grazeMeterWidth, grazeMeterHeight);
      ctx.shadowBlur = 0;
      
      // Graze label and count
      ctx.font = "7px \"Press Start 2P\", monospace";
      ctx.fillStyle = graze.displayTimer > 0 ? '#00ffff' : '#88aacc';
      ctx.textAlign = 'left';
      ctx.fillText('GRAZE', grazeMeterX, grazeMeterY - 4);
      
      // Show graze count
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(graze.count.toString(), grazeMeterX + grazeMeterWidth, grazeMeterY - 4);
      
      // Meter full indicator
      if (graze.meter >= GRAZE_METER_MAX) {
        const flash = Math.sin(Date.now() / 100) > 0;
        if (flash) {
          ctx.font = "6px \"Press Start 2P\", monospace";
          ctx.fillStyle = '#ffff00';
          ctx.textAlign = 'center';
          ctx.fillText('MAX!', grazeMeterX + grazeMeterWidth / 2, grazeMeterY + grazeMeterHeight + 10);
        }
      }
      ctx.restore();
      
      // === WEAPON LEVEL HUD (bottom left, above graze meter) ===
      ctx.save();
      const weaponLevel = weaponLevelRef.current.level;
      const weaponXP = weaponLevelRef.current.xp;
      const weaponData = WEAPON_LEVELS[weaponLevel] || WEAPON_LEVELS[1];
      const weaponColor = weaponData.color;
      const weaponName = weaponData.name;
      const maxXP = weaponData.xpToNext || 100;
      const xpRatio = weaponLevel >= 5 ? 1 : weaponXP / maxXP;
      
      const weaponHudX = 10;
      const weaponHudY = GAME_HEIGHT - 85;
      const weaponBarWidth = 80;
      const weaponBarHeight = 6;
      
      // Weapon level up flash effect
      const levelUpTimer = weaponLevelRef.current.levelUpTimer || 0;
      if (levelUpTimer > 0) {
        ctx.shadowColor = weaponColor;
        ctx.shadowBlur = 15 + Math.sin(levelUpTimer / 5) * 5;
      }
      
      // Weapon label
      ctx.font = "7px \"Press Start 2P\", monospace";
      ctx.textAlign = 'left';
      ctx.fillStyle = levelUpTimer > 0 ? weaponColor : '#aaaacc';
      ctx.fillText('WEAPON', weaponHudX, weaponHudY - 12);
      
      // Level indicator
      ctx.fillStyle = weaponColor;
      ctx.textAlign = 'right';
      ctx.fillText(`LV.${weaponLevel}`, weaponHudX + weaponBarWidth, weaponHudY - 12);
      
      // XP bar background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(weaponHudX, weaponHudY, weaponBarWidth, weaponBarHeight);
      
      // XP bar fill with gradient
      const weaponGrad = ctx.createLinearGradient(weaponHudX, weaponHudY, weaponHudX + weaponBarWidth, weaponHudY);
      const darkerColor = weaponColor.replace(/[0-9a-f]{2}/gi, (match) => {
        const val = Math.floor(parseInt(match, 16) * 0.6);
        return val.toString(16).padStart(2, '0');
      });
      weaponGrad.addColorStop(0, darkerColor);
      weaponGrad.addColorStop(0.5, weaponColor);
      weaponGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = weaponGrad;
      ctx.fillRect(weaponHudX, weaponHudY, weaponBarWidth * xpRatio, weaponBarHeight);
      
      // XP bar border
      ctx.strokeStyle = levelUpTimer > 0 ? weaponColor : '#445566';
      ctx.lineWidth = 1;
      ctx.strokeRect(weaponHudX, weaponHudY, weaponBarWidth, weaponBarHeight);
      ctx.shadowBlur = 0;
      
      // Weapon name below bar
      ctx.font = "5px \"Press Start 2P\", monospace";
      ctx.textAlign = 'center';
      ctx.fillStyle = weaponColor;
      ctx.fillText(weaponName, weaponHudX + weaponBarWidth / 2, weaponHudY + weaponBarHeight + 8);
      
      // MAX POWER indicator when at level 5
      if (weaponLevel >= 5) {
        const flash = Math.sin(Date.now() / 80) > 0;
        if (flash) {
          ctx.shadowColor = '#ff8800';
          ctx.shadowBlur = 12;
          ctx.font = "6px \"Press Start 2P\", monospace";
          ctx.fillStyle = '#ff8800';
          ctx.fillText('MAX POWER!', weaponHudX + weaponBarWidth / 2, weaponHudY + weaponBarHeight + 16);
          ctx.shadowBlur = 0;
        }
      }
      ctx.restore();
      
      // === BULLET CANCEL PARTICLES ===
      bulletCancelRef.current.particles.forEach(p => {
        const alpha = p.timer / 25;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 * alpha, 0, Math.PI * 2);
        ctx.fill();
        
        // Points text
        ctx.font = "8px \"Press Start 2P\", monospace";
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('+' + p.points, p.x, p.y - 8);
        ctx.restore();
      });
      
      // === BOMB EXPLOSION EFFECT ===
      if (bombRef.current.active) {
        const bomb = bombRef.current;
        const bombProgress = 1 - (bomb.timer / BOMB_DURATION);
        const bombRadius = bombProgress * Math.max(GAME_WIDTH, GAME_HEIGHT);
        
        ctx.save();
        // Expanding ring
        const ringGrad = ctx.createRadialGradient(bomb.x, bomb.y, 0, bomb.x, bomb.y, bombRadius);
        ringGrad.addColorStop(0, 'rgba(255, 100, 0, 0)');
        ringGrad.addColorStop(0.7, 'rgba(255, 100, 0, 0)');
        ringGrad.addColorStop(0.85, 'rgba(255, 150, 50, 0.4)');
        ringGrad.addColorStop(0.95, 'rgba(255, 255, 100, 0.8)');
        ringGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y, bombRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Screen flash
        if (bomb.timer > BOMB_DURATION - 10) {
          const flashAlpha = (BOMB_DURATION - bomb.timer + 10) / 20;
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
        ctx.restore();
      }

      // === TOP CENTER: Wave Indicator ===
      ctx.save();
      const waveCenterX = GAME_WIDTH / 2;
      
      // Wave panel background
      ctx.fillStyle = 'rgba(0, 30, 60, 0.8)';
      ctx.beginPath();
      ctx.moveTo(waveCenterX - 80, 0);
      ctx.lineTo(waveCenterX + 80, 0);
      ctx.lineTo(waveCenterX + 60, 50);
      ctx.lineTo(waveCenterX - 60, 50);
      ctx.closePath();
      ctx.fill();
      
      // Wave panel border
      ctx.strokeStyle = bossActiveRef.current ? '#ff00ff' : '#00aaff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Wave text
      ctx.textAlign = 'center';
      ctx.font = "10px \"Press Start 2P\", monospace";
      ctx.fillStyle = '#88aaff';
      ctx.fillText('WAVE', waveCenterX, 18);
      
      ctx.shadowColor = bossActiveRef.current ? '#ff00ff' : '#00ff88';
      ctx.shadowBlur = 15;
      ctx.font = "20px \"Press Start 2P\", monospace";
      ctx.fillStyle = bossActiveRef.current ? '#ff88ff' : '#ffffff';
      ctx.fillText(waveRef.current.toString(), waveCenterX, 42);
      ctx.shadowBlur = 0;
      
      // Kill progress bar (below wave indicator)
      if (!bossActiveRef.current) {
        const killsNeeded = waveKillsNeededRef.current;
        const currentKills = Math.min(waveKillsRef.current, killsNeeded);
        const killProgress = currentKills / killsNeeded;
        
        const barWidth = 100;
        const barX = waveCenterX - barWidth / 2;
        const barY = 55;
        
        // Progress bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, 6);
        
        // Progress fill
        const progressGrad = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        progressGrad.addColorStop(0, '#ff6600');
        progressGrad.addColorStop(1, '#ffaa00');
        ctx.fillStyle = progressGrad;
        ctx.fillRect(barX, barY, barWidth * killProgress, 6);
        
        // Progress border
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, 6);
        
        // Kill count text
        ctx.font = "7px \"Press Start 2P\", monospace";
        ctx.fillStyle = '#ffaa00';
        ctx.fillText(`${currentKills}/${killsNeeded} KILLS`, waveCenterX, barY + 16);
      } else {
        // Boss indicator
        ctx.font = "8px \"Press Start 2P\", monospace";
        ctx.fillStyle = '#ff00ff';
        const bossFlash = Math.sin(hudTime / 150) > 0;
        if (bossFlash) {
          ctx.fillText('? BOSS BATTLE ?', waveCenterX, 62);
        }
      }
      ctx.restore();
      
      // === LEFT SIDE: Upgrade Panel ===
      ctx.save();
      let upgradeY = 55;
      const upgradeX = 8;
      const hasUpgrades = upgradesRef.current.rapidFire > 0 || 
                         upgradesRef.current.missiles || 
                         upgradesRef.current.shield ||
                         upgradesRef.current.speedBoost > 0 ||
                         upgradesRef.current.spreadShot ||
                         upgradesRef.current.magnet ||
                         (forceRef.current && forceRef.current.active);
      
      if (hasUpgrades) {
        // Upgrade panel background - dynamically sized for active upgrades
        let panelHeight = 90;
        if (upgradesRef.current.speedBoost > 0) panelHeight += 16;
        if (upgradesRef.current.spreadShot) panelHeight += 16;
        if (upgradesRef.current.magnet && upgradesRef.current.magnetTimer > 0) panelHeight += 16;
        if (upgradesRef.current.piercing && upgradesRef.current.piercingTimer > 0) panelHeight += 16;
        if (upgradesRef.current.doubleScore && upgradesRef.current.doubleScoreTimer > 0) panelHeight += 16;
        if (upgradesRef.current.ricochet && upgradesRef.current.ricochetTimer > 0) panelHeight += 16;
        if (upgradesRef.current.invincible && upgradesRef.current.invincibleTimer > 0) panelHeight += 16;
        if (upgradesRef.current.laserBeam && upgradesRef.current.laserBeamTimer > 0) panelHeight += 16;
        if (upgradesRef.current.chainLightning && upgradesRef.current.chainLightningTimer > 0) panelHeight += 16;
        if (upgradesRef.current.timeWarp && upgradesRef.current.timeWarpTimer > 0) panelHeight += 16;
        if (blackHoleRef.current) panelHeight += 16;
        if (cloneRef.current) panelHeight += 16;
        if (upgradesRef.current.phoenix) panelHeight += 16;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 50, 140, panelHeight);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 50, 140, panelHeight);
        
        // Power-ups label
        ctx.font = "6px \"Press Start 2P\", monospace";
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'left';
        ctx.fillText('POWER-UPS', upgradeX, upgradeY);
        upgradeY += 12;
      }
      
      if (upgradesRef.current.rapidFire > 0) {
        const rapidLevel = upgradesRef.current.rapidFire;
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 5;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`? RAPID`, upgradeX, upgradeY);
        // Level pips
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i < rapidLevel ? '#ffff00' : '#333333';
          ctx.fillRect(upgradeX + 75 + i * 12, upgradeY - 7, 8, 8);
        }
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      if (upgradesRef.current.missiles) {
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 5;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`💥 MISSILE`, upgradeX, upgradeY);
        ctx.font = "7px \"Press Start 2P\", monospace";
        ctx.fillStyle = '#888888';
        ctx.fillText('[M]', upgradeX + 95, upgradeY);
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      if (upgradesRef.current.shield) {
        const shieldHits = upgradesRef.current.shieldHits;
        const shieldColor = shieldHits >= 7 ? '#ffffff' : shieldHits >= 4 ? '#88ffff' : '#00ffff';
        ctx.fillStyle = shieldColor;
        ctx.shadowColor = shieldColor;
        ctx.shadowBlur = 5;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`🛡️ SHIELD`, upgradeX, upgradeY);
        // Shield pips
        for (let i = 0; i < 9; i++) {
          ctx.fillStyle = i < shieldHits ? shieldColor : '#222222';
          ctx.fillRect(upgradeX + 80 + (i % 3) * 10, upgradeY - 7 - Math.floor(i / 3) * 5, 6, 3);
        }
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      // Speed Boost display
      if (upgradesRef.current.speedBoost > 0) {
        const speedLevel = upgradesRef.current.speedBoost;
        ctx.fillStyle = '#00ffaa';
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 5;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`⚡ SPEED`, upgradeX, upgradeY);
        // Level pips
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i < speedLevel ? '#00ffaa' : '#333333';
          ctx.fillRect(upgradeX + 75 + i * 12, upgradeY - 7, 8, 8);
        }
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      // Spread Shot display
      if (upgradesRef.current.spreadShot) {
        ctx.fillStyle = '#ff0066';
        ctx.shadowColor = '#ff0066';
        ctx.shadowBlur = 5;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`? SPREAD`, upgradeX, upgradeY);
        ctx.fillStyle = '#ffffff';
        ctx.font = "7px \"Press Start 2P\", monospace";
        ctx.fillText('?', upgradeX + 90, upgradeY);
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      // Magnet display with timer
      if (upgradesRef.current.magnet && upgradesRef.current.magnetTimer > 0) {
        const magnetTime = Math.ceil(upgradesRef.current.magnetTimer / 60); // Convert to seconds
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 5;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`🧲 MAGNET`, upgradeX, upgradeY);
        // Timer display
        ctx.fillStyle = magnetTime <= 3 ? '#ff4444' : '#ffffff';
        ctx.font = "7px \"Press Start 2P\", monospace";
        ctx.fillText(`${magnetTime}s`, upgradeX + 90, upgradeY);
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      // New power-up displays
      if (upgradesRef.current.piercing && upgradesRef.current.piercingTimer > 0) {
        const piercingTime = Math.ceil(upgradesRef.current.piercingTimer / 60);
        ctx.fillStyle = '#ff8800';
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 5;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`🗡️ PIERCE`, upgradeX, upgradeY);
        ctx.fillStyle = piercingTime <= 3 ? '#ff4444' : '#ffffff';
        ctx.font = "7px \"Press Start 2P\", monospace";
        ctx.fillText(`${piercingTime}s`, upgradeX + 90, upgradeY);
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      if (upgradesRef.current.doubleScore && upgradesRef.current.doubleScoreTimer > 0) {
        const scoreTime = Math.ceil(upgradesRef.current.doubleScoreTimer / 60);
        ctx.fillStyle = '#ffff88';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 5;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`ÅÅ¸ 2X SCORE`, upgradeX, upgradeY);
        ctx.fillStyle = scoreTime <= 5 ? '#ff4444' : '#ffffff';
        ctx.font = "7px \"Press Start 2P\", monospace";
        ctx.fillText(`${scoreTime}s`, upgradeX + 98, upgradeY);
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      if (upgradesRef.current.ricochet && upgradesRef.current.ricochetTimer > 0) {
        const ricochetTime = Math.ceil(upgradesRef.current.ricochetTimer / 60);
        ctx.fillStyle = '#88ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 5;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(` BOUNCE`, upgradeX, upgradeY);
        ctx.fillStyle = ricochetTime <= 3 ? '#ff4444' : '#ffffff';
        ctx.font = "7px \"Press Start 2P\", monospace";
        ctx.fillText(`${ricochetTime}s`, upgradeX + 90, upgradeY);
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      if (upgradesRef.current.invincible && upgradesRef.current.invincibleTimer > 0) {
        const invincTime = Math.ceil(upgradesRef.current.invincibleTimer / 60);
        const flash = Math.sin(hudTime / 100) > 0;
        ctx.fillStyle = flash ? '#ffffff' : '#ffff00';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`? INVINCIBLE`, upgradeX, upgradeY);
        ctx.fillStyle = invincTime <= 2 ? '#ff4444' : '#ffffff';
        ctx.font = "7px \"Press Start 2P\", monospace";
        ctx.fillText(`${invincTime}s`, upgradeX + 110, upgradeY);
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      if (upgradesRef.current.laserBeam && upgradesRef.current.laserBeamTimer > 0) {
        const laserTime = Math.ceil(upgradesRef.current.laserBeamTimer / 60);
        ctx.fillStyle = '#ff00aa';
        ctx.shadowColor = '#ff00aa';
        ctx.shadowBlur = 5;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`« LASER`, upgradeX, upgradeY);
        ctx.fillStyle = laserTime <= 3 ? '#ff4444' : '#ffffff';
        ctx.font = "7px \"Press Start 2P\", monospace";
        ctx.fillText(`${laserTime}s`, upgradeX + 85, upgradeY);
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      if (upgradesRef.current.chainLightning && upgradesRef.current.chainLightningTimer > 0) {
        const chainTime = Math.ceil(upgradesRef.current.chainLightningTimer / 60);
        ctx.fillStyle = '#00aaff';
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 5;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`⚡ CHAIN`, upgradeX, upgradeY);
        ctx.fillStyle = chainTime <= 3 ? '#ff4444' : '#ffffff';
        ctx.font = "7px \"Press Start 2P\", monospace";
        ctx.fillText(`${chainTime}s`, upgradeX + 80, upgradeY);
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      if (upgradesRef.current.timeWarp && upgradesRef.current.timeWarpTimer > 0) {
        const warpTime = Math.ceil(upgradesRef.current.timeWarpTimer / 60);
        const flash = Math.sin(hudTime / 150) > 0;
        ctx.fillStyle = flash ? '#aa00ff' : '#cc44ff';
        ctx.shadowColor = '#aa00ff';
        ctx.shadowBlur = 8;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`? TIME WARP`, upgradeX, upgradeY);
        ctx.fillStyle = warpTime <= 3 ? '#ff4444' : '#ffffff';
        ctx.font = "7px \"Press Start 2P\", monospace";
        ctx.fillText(`${warpTime}s`, upgradeX + 100, upgradeY);
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      if (blackHoleRef.current) {
        const bhTime = Math.ceil(blackHoleRef.current.lifetime / 60);
        ctx.fillStyle = '#6600ff';
        ctx.shadowColor = '#6600ff';
        ctx.shadowBlur = 8;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`⚫ BLACK HOLE`, upgradeX, upgradeY);
        ctx.fillStyle = bhTime <= 2 ? '#ff4444' : '#ffffff';
        ctx.font = "7px \"Press Start 2P\", monospace";
        ctx.fillText(`${bhTime}s`, upgradeX + 110, upgradeY);
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      if (cloneRef.current) {
        const cloneTime = Math.ceil(cloneRef.current.lifetime / 60);
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 5;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`👥 CLONE`, upgradeX, upgradeY);
        ctx.fillStyle = cloneTime <= 3 ? '#ff4444' : '#ffffff';
        ctx.font = "7px \"Press Start 2P\", monospace";
        ctx.fillText(`${cloneTime}s`, upgradeX + 85, upgradeY);
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      if (upgradesRef.current.phoenix) {
        const flash = Math.sin(hudTime / 200) > 0;
        ctx.fillStyle = flash ? '#ff8800' : '#ffaa00';
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 8;
        ctx.font = "9px \"Press Start 2P\", monospace";
        ctx.fillText(`🔥 PHOENIX`, upgradeX, upgradeY);
        ctx.fillStyle = '#00ff00';
        ctx.font = "7px \"Press Start 2P\", monospace";
        ctx.fillText(`READY`, upgradeX + 90, upgradeY);
        ctx.shadowBlur = 0;
        upgradeY += 16;
      }
      
      if (forceRef.current && forceRef.current.active) {
        const force = forceRef.current;
        const powerPercent = force.power / FORCE_MAX_POWER;
        const forceLevel = force.level || 1;
        const levelData = FORCE_LEVELS[forceLevel] || FORCE_LEVELS[1];
        
        if (force.split) {
          ctx.fillStyle = '#00ffff';
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 8;
          ctx.font = "9px \"Press Start 2P\", monospace";
          ctx.fillText(`\ud83d\udd35 FORCE`, upgradeX, upgradeY);
          ctx.fillStyle = '#ffffff';
          ctx.fillText('MAX', upgradeX + 75, upgradeY);
        } else {
          ctx.fillStyle = levelData.color;
          ctx.shadowColor = levelData.color;
          ctx.shadowBlur = 5;
          ctx.font = "9px \"Press Start 2P\", monospace";
          ctx.fillText(`\ud83d\udd35 FORCE`, upgradeX, upgradeY);
          // Power bar
          ctx.fillStyle = '#333333';
          ctx.fillRect(upgradeX + 75, upgradeY - 7, 40, 8);
          ctx.fillStyle = levelData.color;
          ctx.fillRect(upgradeX + 75, upgradeY - 7, 40 * powerPercent, 8);
          ctx.strokeStyle = levelData.color;
          ctx.lineWidth = 1;
          ctx.strokeRect(upgradeX + 75, upgradeY - 7, 40, 8);
        }
        ctx.shadowBlur = 0;
        upgradeY += 16;
        
        // Show Force level if > 1
        if (forceLevel > 1) {
          ctx.fillStyle = levelData.color;
          ctx.shadowColor = levelData.color;
          ctx.shadowBlur = 3;
          ctx.font = "7px \"Press Start 2P\", monospace";
          ctx.fillText(`  LV${forceLevel} ${levelData.name}`, upgradeX, upgradeY);
          ctx.shadowBlur = 0;
          upgradeY += 12;
        }
        
        // Show shield ability hint for level 4+
        if (forceLevel >= 4 && force.power >= 50 && !force.shieldActive) {
          const flash = Math.sin(hudTime / 200) > 0;
          if (flash) {
            ctx.fillStyle = '#00ffff';
            ctx.font = "6px \"Press Start 2P\", monospace";
            ctx.fillText(`  [G] SHIELD`, upgradeX, upgradeY);
            upgradeY += 10;
          }
        }
      }
      ctx.restore();
      
      // === BOTTOM LEFT: Wave Cannon ===
      if (waveCannonChargeRef.current > 0 || isChargingRef.current) {
        ctx.save();
        const chargeBarWidth = 150;
        const chargeBarHeight = 14;
        const chargeX = 10;
        const chargeY = GAME_HEIGHT - 30;
        const chargePercent = waveCannonChargeRef.current / WAVE_CANNON_MAX_CHARGE;
        
        // Background panel
        ctx.fillStyle = 'rgba(0, 20, 50, 0.8)';
        ctx.fillRect(chargeX - 5, chargeY - 20, chargeBarWidth + 20, 45);
        ctx.strokeStyle = chargePercent >= 1 ? '#00ffff' : '#0066aa';
        ctx.lineWidth = 1;
        ctx.strokeRect(chargeX - 5, chargeY - 20, chargeBarWidth + 20, 45);
        
        // Label
        ctx.font = "8px \"Press Start 2P\", monospace";
        ctx.textAlign = 'left';
        ctx.fillStyle = chargePercent >= 1 ? '#00ffff' : '#4488aa';
        ctx.fillText('WAVE CANNON', chargeX, chargeY - 8);
        
        if (chargePercent >= 1) {
          // Ready indicator flashing
          const flash = Math.sin(hudTime / 100) > 0;
          if (flash) {
            ctx.fillStyle = '#ffffff';
            ctx.fillText('READY!', chargeX + 110, chargeY - 8);
          }
        } else {
          ctx.font = "6px \"Press Start 2P\", monospace";
          ctx.fillStyle = '#666666';
          ctx.fillText('[SHIFT]', chargeX + 100, chargeY - 8);
        }
        
        // Charge bar background
        ctx.fillStyle = '#111133';
        ctx.fillRect(chargeX, chargeY, chargeBarWidth, chargeBarHeight);
        
        // Charge segments
        const segments = 10;
        for (let i = 0; i < segments; i++) {
          const segX = chargeX + (chargeBarWidth / segments) * i;
          const segWidth = (chargeBarWidth / segments) - 2;
          const segFilled = i / segments < chargePercent;
          
          if (segFilled) {
            const segGrad = ctx.createLinearGradient(segX, chargeY, segX, chargeY + chargeBarHeight);
            segGrad.addColorStop(0, '#00ddff');
            segGrad.addColorStop(0.5, '#0088ff');
            segGrad.addColorStop(1, '#0044aa');
            ctx.fillStyle = segGrad;
            ctx.fillRect(segX + 1, chargeY + 1, segWidth, chargeBarHeight - 2);
          }
        }
        
        // Glow when full
        if (chargePercent >= 1) {
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 15 + Math.sin(hudTime / 50) * 5;
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(chargeX, chargeY, chargeBarWidth, chargeBarHeight);
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = '#0066aa';
          ctx.lineWidth = 1;
          ctx.strokeRect(chargeX, chargeY, chargeBarWidth, chargeBarHeight);
        }
        
        ctx.restore();
      }
      
      // === DASH COOLDOWN INDICATOR ===
      ctx.save();
      const dashX = 180;
      const dashY = GAME_HEIGHT - 15;
      const dashReady = dashRef.current.cooldown <= 0;
      const dashCooldownPercent = 1 - (dashRef.current.cooldown / DASH_COOLDOWN);
      
      // Dash icon/label
      ctx.font = "8px \"Press Start 2P\", monospace";
      ctx.textAlign = 'left';
      ctx.fillStyle = dashReady ? '#00ffff' : '#444466';
      ctx.fillText('DASH', dashX, dashY);
      
      if (dashReady) {
        // Ready - pulsing glow
        const pulse = Math.sin(hudTime / 80) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(dashX + 50, dashY - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        
        // Key hint
        ctx.font = "6px \"Press Start 2P\", monospace";
        ctx.fillStyle = '#666666';
        ctx.fillText('[Q]', dashX + 60, dashY);
      } else {
        // Cooldown bar
        const barWidth = 40;
        const barHeight = 6;
        ctx.fillStyle = '#111133';
        ctx.fillRect(dashX + 40, dashY - 8, barWidth, barHeight);
        ctx.fillStyle = '#0088aa';
        ctx.fillRect(dashX + 40, dashY - 8, barWidth * dashCooldownPercent, barHeight);
        ctx.strokeStyle = '#336688';
        ctx.lineWidth = 1;
        ctx.strokeRect(dashX + 40, dashY - 8, barWidth, barHeight);
      }
      ctx.restore();
      
      // === BOTTOM CENTER: Polarity & Speed Indicators ===
      ctx.save();
      const polarityX = GAME_WIDTH / 2;
      const polarityY = GAME_HEIGHT - 25;
      
      // Polarity indicator panel
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(polarityX - 80, polarityY - 18, 160, 35);
      ctx.strokeStyle = polarityRef.current === 'light' ? '#aaaaff' : '#8B00FF';
      ctx.lineWidth = 2;
      ctx.strokeRect(polarityX - 80, polarityY - 18, 160, 35);
      
      // Polarity label and value
      ctx.font = "7px \"Press Start 2P\", monospace";
      ctx.textAlign = 'center';
      ctx.fillStyle = '#888888';
      ctx.fillText('POLARITY [C]', polarityX - 40, polarityY - 5);
      
      // Polarity value with glow
      ctx.font = "10px \"Press Start 2P\", monospace";
      const polarityColor = polarityRef.current === 'light' ? '#ffffff' : '#8B00FF';
      ctx.fillStyle = polarityColor;
      ctx.shadowColor = polarityColor;
      ctx.shadowBlur = 10;
      ctx.fillText(polarityRef.current.toUpperCase(), polarityX - 40, polarityY + 10);
      ctx.shadowBlur = 0;
      
      // Absorb meter
      const absorbPercent = polarityAbsorbedRef.current / POLARITY_MAX_ABSORB;
      if (absorbPercent > 0) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(polarityX - 70, polarityY + 14, 60, 4);
        ctx.fillStyle = polarityColor;
        ctx.fillRect(polarityX - 70, polarityY + 14, 60 * absorbPercent, 4);
      }
      
      // Speed indicator
      ctx.font = "7px \"Press Start 2P\", monospace";
      ctx.fillStyle = '#888888';
      ctx.fillText('SPEED [[]]', polarityX + 40, polarityY - 5);
      
      // Speed pips
      for (let i = 1; i <= 4; i++) {
        ctx.fillStyle = i <= speedSettingRef.current ? '#00ff00' : '#333333';
        if (i <= speedSettingRef.current) {
          ctx.shadowColor = '#00ff00';
          ctx.shadowBlur = 5;
        }
        ctx.fillRect(polarityX + 20 + i * 12, polarityY + 2, 8, 8);
        ctx.shadowBlur = 0;
      }
      ctx.restore();
      
      // === Draw Kill Chain Combo Display ===
      if (killChainRef.current.count > 0) {
        const kc = killChainRef.current;
        const pulse = kc.pulseTimer > 0 ? Math.sin(kc.pulseTimer * 0.5) * 0.2 + 1 : 1;
        const scale = 1 + (Math.min(kc.count, 50) * 0.01) * pulse; // Grow with combo
        
        ctx.save();
        ctx.translate(kc.x, kc.y);
        ctx.scale(scale, scale);
        
        // Combo count
        ctx.font = "24px \"Press Start 2P\", monospace";
        ctx.textAlign = 'center';
        const comboColor = kc.count >= 50 ? '#ff00ff' : kc.count >= 25 ? '#ff8800' : kc.count >= 10 ? '#ffff00' : '#ffffff';
        ctx.fillStyle = comboColor;
        ctx.shadowColor = comboColor;
        ctx.shadowBlur = 20;
        ctx.fillText(`${kc.count} CHAIN`, 0, 0);
        
        // Multiplier
        ctx.font = "14px \"Press Start 2P\", monospace";
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 15;
        ctx.fillText(`x${kc.multiplier.toFixed(1)}`, 0, 20);
        
        // Timer bar
        const barWidth = 120;
        const barHeight = 4;
        const timerPercent = kc.timer / KILL_CHAIN_TIMEOUT;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-barWidth / 2, 28, barWidth, barHeight);
        
        const barColor = timerPercent > 0.5 ? '#00ff00' : timerPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = barColor;
        ctx.shadowColor = barColor;
        ctx.shadowBlur = 8;
        ctx.fillRect(-barWidth / 2, 28, barWidth * timerPercent, barHeight);
        
        ctx.shadowBlur = 0;
        ctx.restore();
      }
      
      // === Draw Chain Combo Display (Polarity) ===
      if (chainDisplayRef.current) {
        const chain = chainDisplayRef.current;
        ctx.save();
        ctx.font = "14px \"Press Start 2P\", monospace";
        ctx.textAlign = 'center';
        const chainColor = chain.polarity === 'light' ? '#ffffff' : '#8B00FF';
        ctx.fillStyle = chainColor;
        ctx.shadowColor = chainColor;
        ctx.shadowBlur = 15;
        ctx.fillText(`${chain.count} CHAIN!`, chain.x, chain.y - 10);
        ctx.font = "10px \"Press Start 2P\", monospace";
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`+${chain.multiplier}`, chain.x, chain.y + 5);
        ctx.shadowBlur = 0;
        ctx.restore();
      }
      
      // === Draw Option Satellites ===
      optionsRef.current.forEach((option, index) => {
        // Guard against non-finite coordinates
        if (!isFinite(option.x) || !isFinite(option.y)) return;
        
        ctx.save();
        const optionSize = 12;
        const pulse = Math.sin(Date.now() / 100 + index) * 2;
        
        // Option glow
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10 + pulse;
        
        // Option body
        const gradient = ctx.createRadialGradient(option.x, option.y, 0, option.x, option.y, optionSize);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#00ffff');
        gradient.addColorStop(0.7, '#0088ff');
        gradient.addColorStop(1, '#004488');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(option.x, option.y, optionSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(option.x, option.y, optionSize / 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.restore();
      });
      
      // === BOTTOM RIGHT: High Score ===
      ctx.save();
      ctx.font = "8px \"Press Start 2P\", monospace";
      ctx.textAlign = 'right';
      ctx.fillStyle = '#666666';
      ctx.fillText('HI-SCORE', GAME_WIDTH - 10, GAME_HEIGHT - 20);
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 5;
      ctx.fillText(Math.max(scoreRef.current, highScore).toLocaleString(), GAME_WIDTH - 10, GAME_HEIGHT - 8);
      ctx.shadowBlur = 0;
      ctx.restore();
      
      // Draw checkpoint transition fade overlay
      const transition = checkpointTransitionRef.current;
      if (transition.active && transition.fadeAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${transition.fadeAlpha})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // During fade, show checkpoint text
        if (transition.phase === 'fade' || transition.phase === 'complete') {
          const textAlpha = Math.min(1, transition.fadeAlpha * 2);
          ctx.globalAlpha = textAlpha;
          ctx.font = "bold 24px \"Press Start 2P\", monospace";
          ctx.textAlign = 'center';
          ctx.fillStyle = '#00ffff';
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 20;
          ctx.fillText('CHECKPOINT', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
          ctx.font = "16px \"Press Start 2P\", monospace";
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 10;
          ctx.fillText(`WAVE ${(transition.pendingCheckpoint && transition.pendingCheckpoint.wave) || 0} COMPLETE`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      }
      
      // Draw victory transition fade overlay
      const victory = victoryRef.current;
      if (victory.active && victory.fadeAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${victory.fadeAlpha})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // During fade, show victory text
        if (victory.phase === 'fade' || victory.phase === 'complete') {
          const textAlpha = Math.min(1, victory.fadeAlpha * 2);
          ctx.globalAlpha = textAlpha;
          ctx.font = "bold 32px \"Press Start 2P\", monospace";
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffd700';
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 30;
          ctx.fillText('VICTORY!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
          ctx.font = "14px \"Press Start 2P\", monospace";
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 15;
          ctx.fillText('THE NEXUS CORE HAS BEEN DESTROYED', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
          ctx.font = "12px \"Press Start 2P\", monospace";
          ctx.fillStyle = '#00ffff';
          ctx.fillText('HUMANITY IS SAVED', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      }
      
      // Draw level fade transition overlay
      const levelFade = levelFadeRef.current;
      if (levelFade.active) {
        ctx.save();
        
        // Update fade timer and alpha
        levelFade.timer--;
        if (levelFade.fadeIn) {
          // Fade from black to transparent
          levelFade.alpha = Math.max(0, levelFade.alpha - 0.02);
        }
        
        // Draw black overlay
        ctx.fillStyle = `rgba(0, 0, 0, ${levelFade.alpha})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Show wave text during fade
        if (levelFade.showText && levelFade.alpha > 0.2) {
          const textAlpha = Math.min(1, levelFade.alpha * 1.5);
          ctx.globalAlpha = textAlpha;
          
          // Zone name (if applicable)
          const zoneNum = Math.ceil(levelFade.wave / 5);
          const zones = {
            1: { name: 'ASTEROID BELT', color: '#ff8844' },
            2: { name: 'NEBULA CORE', color: '#ff44ff' },
            3: { name: 'ICE FIELDS', color: '#44ffff' },
            4: { name: 'FIRE SECTOR', color: '#ff4400' },
            5: { name: 'VOID ZONE', color: '#8844ff' },
            6: { name: 'TECH FORTRESS', color: '#44ff44' }
          };
          const zone = zones[zoneNum] || zones[1];
          
          // Zone title
          ctx.font = "12px \"Press Start 2P\", monospace";
          ctx.textAlign = 'center';
          ctx.fillStyle = zone.color;
          ctx.shadowColor = zone.color;
          ctx.shadowBlur = 15;
          ctx.fillText(zone.name, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
          
          // Wave number - big and bold
          ctx.font = "bold 32px \"Press Start 2P\", monospace";
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 20;
          ctx.fillText(`WAVE ${levelFade.wave}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
          
          // Subtext
          ctx.font = "10px \"Press Start 2P\", monospace";
          ctx.fillStyle = '#888888';
          ctx.shadowBlur = 0;
          ctx.fillText('GET READY', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 45);
          
          ctx.globalAlpha = 1;
        }
        
        // End fade when timer expires
        if (levelFade.timer <= 0 || levelFade.alpha <= 0) {
          levelFade.active = false;
        }
        
        ctx.restore();
      }
      
      // Draw Practice Mode HUD indicator
      if (gameModeRef.current === 'practice') {
        ctx.save();
        const settings = practiceSettingsRef.current;
        
        // Practice mode banner
        ctx.fillStyle = 'rgba(0, 50, 0, 0.7)';
        ctx.fillRect(GAME_WIDTH / 2 - 80, 5, 160, 22);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 1;
        ctx.strokeRect(GAME_WIDTH / 2 - 80, 5, 160, 22);
        
        ctx.font = "bold 10px monospace";
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ff88';
        ctx.fillText('PRACTICE MODE', GAME_WIDTH / 2, 20);
        
        // Active options indicators
        const activeOptions = [];
        if (settings.infiniteLives) activeOptions.push('INF');
        if (settings.invincible) activeOptions.push('INV');
        if (settings.maxPower) activeOptions.push('MAX');
        if (settings.slowBullets) activeOptions.push('SLW');
        if (settings.showHitboxes) activeOptions.push('HBX');
        
        if (activeOptions.length > 0) {
          ctx.font = '8px monospace';
          ctx.fillStyle = '#88ffaa';
          ctx.fillText(activeOptions.join(' | '), GAME_WIDTH / 2, 38);
        }
        
        // "Scores not saved" reminder
        ctx.font = '7px monospace';
        ctx.fillStyle = '#ff8866';
        ctx.fillText('SCORES NOT SAVED', GAME_WIDTH / 2, 50);
        
        ctx.restore();
      }
      
      // Draw FPS counter if enabled
      if (userSettingsRef.current?.showFPS) {
        ctx.save();
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        const fps = fpsRef.current.fps;
        const fpsColor = fps >= 55 ? '#00ff00' : fps >= 30 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(5, 5, 60, 18);
        ctx.fillStyle = fpsColor;
        ctx.fillText(`FPS: ${fps}`, 10, 18);
        ctx.restore();
      }
      
      // End screen shake transform
      ctx.restore();
    };

    const gameLoop = (timestamp) => {
      // Update FPS counter
      const fpsData = fpsRef.current;
      fpsData.frames++;
      if (timestamp - fpsData.lastTime >= 1000) {
        fpsData.fps = fpsData.frames;
        fpsData.frames = 0;
        fpsData.lastTime = timestamp;
      }
      
      // Don't render at all during brand, cinematic, or splash screens
      // But clear the canvas to prevent old frames from showing through during fade transitions
      if (gameStateRef.current === 'brand' || gameStateRef.current === 'cinematic' || gameStateRef.current === 'splash') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      if (gameStateRef.current !== 'playing') {
        // Debug: Log when not playing
        if (enemiesRef.current.length > 0) {
        }
        // Still render but don't update (for menu, paused, etc.)
        render(ctx, timestamp);
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      // Debug: Confirm we're updating
      if (enemiesRef.current.length > 0) {
      }

      // Update challenge mode timers
      const mode = gameModeRef.current;
      if (mode === 'survival' || mode === 'timeAttack') {
        const elapsed = Date.now() - challengeStatsRef.current.startTime;
        if (mode === 'survival') {
          challengeStatsRef.current.survivalTime = elapsed;
        } else {
          challengeStatsRef.current.timeAttackTime = elapsed;
        }
      }

      // Update stars (parallax background)
      starsRef.current.forEach(star => {
        star.x -= star.speed;
        if (star.x < 0) {
          star.x = GAME_WIDTH;
          star.y = Math.random() * GAME_HEIGHT;
        }
      });
      
      // Update checkpoint transition
      const transition = checkpointTransitionRef.current;
      if (transition.active) {
        transition.timer++;
        
        if (transition.phase === 'explosions') {
          // Create staggered explosions at boss location
          transition.explosionTimer++;
          if (transition.explosionTimer % 8 === 0 && transition.timer < 90) {
            const offsetX = (Math.random() - 0.5) * (transition.bossWidth || 150);
            const offsetY = (Math.random() - 0.5) * (transition.bossHeight || 100);
            createExplosion(
              transition.bossX + offsetX,
              transition.bossY + offsetY,
              Math.random() > 0.5 ? 'large' : 'normal',
              true
            );
            // Shake screen with each explosion
            triggerScreenShake(5 + Math.random() * 5, 10);
          }
          
          // After 1.5 seconds of explosions, start fade
          if (transition.timer >= 90) {
            transition.phase = 'fade';
            // Show "CHECKPOINT REACHED" text
            floatingTextsRef.current.push({
              x: GAME_WIDTH / 2,
              y: GAME_HEIGHT / 2 - 50,
              text: '',
              color: '#00ffff',
              lifetime: 120,
              vy: 0,
              scale: 2
            });
          }
        } else if (transition.phase === 'fade') {
          // Fade to black
          transition.fadeAlpha = Math.min(1, transition.fadeAlpha + 0.02);
          
          // When fully faded, transition to checkpoint screen
          if (transition.fadeAlpha >= 1) {
            transition.phase = 'complete';
            
            // Apply bonus points and show checkpoint screen
            const pending = transition.pendingCheckpoint;
            scoreRef.current = pending.score;
            setScore(pending.score);
            
            setCheckpointStats({
              wave: pending.wave,
              score: pending.score,
              lives: pending.lives,
              bonusPoints: pending.bonusPoints
            });
            setCheckpointSelection(0);
            checkpointSelectionRef.current = 0;
            setGameState('checkpoint');
            gameStateRef.current = 'checkpoint';
            
            // Reset transition state
            checkpointTransitionRef.current = {
              active: false,
              phase: 'none',
              timer: 0,
              fadeAlpha: 0,
              pendingCheckpoint: null,
              explosionTimer: 0
            };
          }
        }
      }
      
      // Update victory sequence
      const victory = victoryRef.current;
      if (victory.active) {
        victory.timer++;
        
        if (victory.phase === 'explosion') {
          // Create epic explosion sequence at boss location
          if (victory.timer % 6 === 0 && victory.timer < 120) {
            const offsetX = (Math.random() - 0.5) * 200;
            const offsetY = (Math.random() - 0.5) * 150;
            createExplosion(
              victory.bossX + offsetX,
              victory.bossY + offsetY,
              Math.random() > 0.3 ? 'large' : 'boss',
              true
            );
            triggerScreenShake(8 + Math.random() * 8, 15);
          }
          
          // After 2 seconds of explosions, transition to victory screen
          if (victory.timer >= 120) {
            victory.phase = 'fade';
            victory.fadeAlpha = 0;
          }
        } else if (victory.phase === 'fade') {
          // Fade to victory screen
          victory.fadeAlpha = Math.min(1, victory.fadeAlpha + 0.02);
          
          if (victory.fadeAlpha >= 1) {
            victory.phase = 'complete';
            setGameState('victory');
            gameStateRef.current = 'victory';
            victory.active = false;
            // Mark game as beaten to unlock challenge modes
            if (gameMode === 'campaign') {
              localStorage.setItem('nebulaXGameBeaten', 'true');
              setGameBeaten(true);
            }
          }
        }
      }
      
      // Update chain combo timer
      if (chainRef.current.timer > 0) {
        chainRef.current.timer--;
        if (chainRef.current.timer <= 0) {
          // Chain expired - reset
          chainRef.current = { count: 0, type: null, timer: 0, multiplier: 1 };
        }
      }
      
      // Update kill chain combo timer
      if (killChainRef.current.timer > 0) {
        killChainRef.current.timer--;
        if (killChainRef.current.timer <= 0) {
          // Kill chain broken - reset
          killChainRef.current.count = 0;
          killChainRef.current.multiplier = 1.0;
        }
      }
      if (killChainRef.current.pulseTimer > 0) {
        killChainRef.current.pulseTimer--;
      }
      
      // Update graze combo timer
      if (grazeRef.current.comboTimer > 0) {
        grazeRef.current.comboTimer--;
        if (grazeRef.current.comboTimer <= 0) {
          // Graze combo expired
          grazeRef.current.combo = 0;
        }
      }
      // Update graze display timer
      if (grazeRef.current.displayTimer > 0) {
        grazeRef.current.displayTimer--;
      }
      
      // Update bomb animation
      if (bombRef.current.active) {
        bombRef.current.timer--;
        if (bombRef.current.timer <= 0) {
          bombRef.current.active = false;
        }
      }
      
      // Update weapon level up timer
      if (weaponLevelRef.current.levelUpTimer > 0) {
        weaponLevelRef.current.levelUpTimer--;
      }
      
      // Update bullet cancel particles
      bulletCancelRef.current.particles = bulletCancelRef.current.particles.filter(p => {
        p.timer--;
        if (p.vx) p.x += p.vx;
        if (p.vy) p.y += p.vy;
        return p.timer > 0;
      });
      
      // Update chain display timer
      if (chainDisplayRef.current && chainDisplayRef.current.timer > 0) {
        chainDisplayRef.current.timer--;
        if (chainDisplayRef.current.timer <= 0) {
          chainDisplayRef.current = null;
        }
      }
      
      // Update score multiplier decay
      if (multiplierDecayTimerRef.current > 0) {
        multiplierDecayTimerRef.current--;
      } else if (scoreMultiplierRef.current > 1.0) {
        // Decay multiplier slowly back to 1.0
        scoreMultiplierRef.current = Math.max(1.0, scoreMultiplierRef.current - MULTIPLIER_DECAY_RATE);
      }

      // Player movement
      const player = playerRef.current;
      
      // Poll gamepad
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let gamepad = null;
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected) {
          gamepad = gamepads[i];
          gamepadRef.current = gamepad;
          break;
        }
      }
      
      // Gamepad input
      let gpMoveX = 0, gpMoveY = 0;
      let gpShoot = false, gpMissile = false, gpForce = false, gpWaveCannon = false, gpLaser = false;
      let gpDash = false;
      
      if (gamepad) {
        // Left stick for movement (axes 0 and 1)
        const deadzone = 0.15;
        if (Math.abs(gamepad.axes[0]) > deadzone) gpMoveX = gamepad.axes[0];
        if (Math.abs(gamepad.axes[1]) > deadzone) gpMoveY = gamepad.axes[1];
        
        // Right stick for optional aim assist / polarity quick toggle
        const rightStickX = gamepad.axes[2] || 0;
        if (Math.abs(rightStickX) > 0.7 && !gamepadButtonsRef.current.rightStickToggle) {
          // Quick polarity toggle with right stick flick
          const newPolarity = polarityRef.current === 'light' ? 'dark' : 'light';
          polarityRef.current = newPolarity;
          setPolarity(newPolarity);
          gamepadButtonsRef.current.rightStickToggle = true;
        } else if (Math.abs(rightStickX) < 0.3) {
          gamepadButtonsRef.current.rightStickToggle = false;
        }
        
        // D-pad (buttons 12-15 on standard gamepad)
        if (gamepad.buttons[12]?.pressed) gpMoveY = -1; // Up
        if (gamepad.buttons[13]?.pressed) gpMoveY = 1;  // Down
        if (gamepad.buttons[14]?.pressed) gpMoveX = -1; // Left
        if (gamepad.buttons[15]?.pressed) gpMoveX = 1;  // Right
        
        // PS4/PS5 Controller button mapping:
        // X (Cross) = button 0 = Shoot
        // O (Circle) = button 1 = Force toggle / Bomb
        // Square = button 2 = Missile
        // Triangle = button 3 = Laser beam (when available)
        // L1 = button 4 = Polarity toggle
        // R1 = button 5 = Shoot (alt)
        // L2 = button 6 = Wave Cannon charge
        // R2 = button 7 = Auto-fire (hold to shoot)
        // Share = button 8 = Quick Restart (on game over)
        // Options = button 9 = Pause/Resume
        // L3 = button 10 = Dash
        // R3 = button 11 = Dash (alt)
        // PS = button 16 = (reserved)
        // Touchpad = button 17 = Menu select (context sensitive)
        
        // Shooting - X, R1, or R2 trigger
        const r2Pressure = gamepad.buttons[7]?.value || 0;
        gpShoot = gamepad.buttons[0]?.pressed || gamepad.buttons[5]?.pressed || r2Pressure > 0.1;
        
        // Missiles - Square
        gpMissile = gamepad.buttons[2]?.pressed;
        
        // Force toggle / Bomb - Circle
        gpForce = gamepad.buttons[1]?.pressed;
        
        // Wave Cannon - L2 trigger (pressure sensitive)
        const l2Pressure = gamepad.buttons[6]?.value || 0;
        gpWaveCannon = l2Pressure > 0.3; // Requires significant trigger press
        
        // Laser - Triangle
        gpLaser = gamepad.buttons[3]?.pressed;
        
        // Dash - L3 or R3 stick click
        gpDash = gamepad.buttons[10]?.pressed || gamepad.buttons[11]?.pressed;
        
        // Polarity toggle - L1 bumper (with debounce)
        if (gamepad.buttons[4]?.pressed && !gamepadButtonsRef.current.polarity) {
          const newPolarity = polarityRef.current === 'light' ? 'dark' : 'light';
          polarityRef.current = newPolarity;
          setPolarity(newPolarity);
          soundSystem.playMenuMove();
          // Vibration feedback for polarity change
          if (gamepad.vibrationActuator) {
            gamepad.vibrationActuator.playEffect('dual-rumble', {
              startDelay: 0,
              duration: 100,
              weakMagnitude: 0.3,
              strongMagnitude: 0.5
            }).catch(() => {});
          }
        }
        gamepadButtonsRef.current.polarity = gamepad.buttons[4]?.pressed || false;
        
        // Handle pause (Options button)
        if (gamepad.buttons[9]?.pressed && !gamepadButtonsRef.current.pause) {
          if (gameStateRef.current === 'playing') {
            setGameState('paused');
            // Pause all audio
            soundSystem.suspend();
            if (gameMusicRef.current && !gameMusicRef.current.paused) {
              gameMusicRef.current.pause();
            }
          } else if (gameStateRef.current === 'paused') {
            setGameState('playing');
            // Resume all audio
            soundSystem.resume();
            if (gameMusicRef.current) {
              gameMusicRef.current.play().catch(() => {});
            }
          }
        }
        gamepadButtonsRef.current.pause = gamepad.buttons[9]?.pressed || false;
        
        // Handle brand screen - any button to continue
        if (gameStateRef.current === 'brand') {
          const anyButtonPressed = gamepad.buttons.some((btn, index) => btn?.pressed && index !== 9);
          if (anyButtonPressed) {
            soundSystem.init();
            soundSystem.resume();
            setGameState('cinematic');
            gameStateRef.current = 'cinematic';
          }
        }
        
        // Handle cinematic screen - any button to skip
        if (gameStateRef.current === 'cinematic') {
          const anyButtonPressed = gamepad.buttons.some((btn, index) => btn?.pressed && index !== 9);
          if (anyButtonPressed && !gamepadButtonsRef.current.skipCinematic) {
            setGameState('splash');
            gameStateRef.current = 'splash';
          }
          gamepadButtonsRef.current.skipCinematic = gamepad.buttons.some((btn, index) => btn?.pressed && index !== 9);
        }
        
        // Handle splash screen - any button to continue
        if (gameStateRef.current === 'splash') {
          // Check if any button is pressed
          const anyButtonPressed = gamepad.buttons.some((btn, index) => btn?.pressed && index !== 9); // Exclude options button
          if (anyButtonPressed) {
            setGameState('menu');
          }
        }
        
        // Handle menu navigation with D-pad and analog stick (only when in menu)
        if (gameStateRef.current === 'menu') {
          const stickY = gamepad.axes[1] || 0;
          const stickX = gamepad.axes[0] || 0;
          const stickDeadzone = 0.5;
          const stickUp = stickY < -stickDeadzone;
          const stickDown = stickY > stickDeadzone;
          const stickLeft = stickX < -stickDeadzone;
          const stickRight = stickX > stickDeadzone;
          // Menu options: Start, Continue (if save), Customize, Controls
          const menuMaxIndex = hasSaveGame() ? 3 : 2;
          
          // In customize screen, handle ship selection with left/right
          if (showCustomizeRef.current) {
            if ((gamepad.buttons[14]?.pressed && !gamepadButtonsRef.current.menuLeft) ||
                (stickLeft && !gamepadButtonsRef.current.stickLeft)) {
              setSelectedShip(prev => prev <= 0 ? SHIP_DESIGNS.length - 1 : prev - 1);
            }
            if ((gamepad.buttons[15]?.pressed && !gamepadButtonsRef.current.menuRight) ||
                (stickRight && !gamepadButtonsRef.current.stickRight)) {
              setSelectedShip(prev => prev >= SHIP_DESIGNS.length - 1 ? 0 : prev + 1);
            }
            gamepadButtonsRef.current.menuLeft = gamepad.buttons[14]?.pressed || false;
            gamepadButtonsRef.current.menuRight = gamepad.buttons[15]?.pressed || false;
            gamepadButtonsRef.current.stickLeft = stickLeft;
            gamepadButtonsRef.current.stickRight = stickRight;
          }
          
          // D-pad Up (button 12) or Left Stick Up - navigate up in menu
          if ((gamepad.buttons[12]?.pressed && !gamepadButtonsRef.current.menuUp) ||
              (stickUp && !gamepadButtonsRef.current.stickUp)) {
            if (!showSettingsRef.current && !showCustomizeRef.current) {
              soundSystem.playMenuMove();
              setMenuSelection(prev => prev <= 0 ? menuMaxIndex : prev - 1);
            }
          }
          gamepadButtonsRef.current.menuUp = gamepad.buttons[12]?.pressed || false;
          gamepadButtonsRef.current.stickUp = stickUp;
          
          // D-pad Down (button 13) or Left Stick Down - navigate down in menu
          if ((gamepad.buttons[13]?.pressed && !gamepadButtonsRef.current.menuDown) ||
              (stickDown && !gamepadButtonsRef.current.stickDown)) {
            if (!showSettingsRef.current && !showCustomizeRef.current) {
              soundSystem.playMenuMove();
              setMenuSelection(prev => prev >= menuMaxIndex ? 0 : prev + 1);
            }
          }
          gamepadButtonsRef.current.menuDown = gamepad.buttons[13]?.pressed || false;
          gamepadButtonsRef.current.stickDown = stickDown;
          
          // X button (button 0) - select menu item
          if (gamepad.buttons[0]?.pressed && !gamepadButtonsRef.current.menuSelect) {
            soundSystem.playMenuSelect();
            if (showSettingsRef.current) {
              setShowSettings(false);
            } else if (showCustomizeRef.current) {
              setShowCustomize(false);
            } else {
              // In main menu, select current item
              const saveExists = hasSaveGame();
              if (menuSelectionRef.current === 0) {
                startGame();
              } else if (menuSelectionRef.current === 1 && saveExists) {
                loadGame();
              } else if ((menuSelectionRef.current === 1 && !saveExists) || (menuSelectionRef.current === 2 && saveExists)) {
                setShowCustomize(true);
              } else {
                setShowSettings(true);
              }
            }
          }
          gamepadButtonsRef.current.menuSelect = gamepad.buttons[0]?.pressed || false;
          
          // Circle button (button 1) - back from settings or customize
          if (gamepad.buttons[1]?.pressed && !gamepadButtonsRef.current.menuBack) {
            if (showSettingsRef.current) {
              setShowSettings(false);
            } else if (showCustomizeRef.current) {
              setShowCustomize(false);
            }
          }
          gamepadButtonsRef.current.menuBack = gamepad.buttons[1]?.pressed || false;
        }
        
        // Handle pause menu navigation with D-pad and analog stick
        if (gameStateRef.current === 'paused') {
          const stickY = gamepad.axes[1] || 0;
          const stickDeadzone = 0.5;
          const stickUp = stickY < -stickDeadzone;
          const stickDown = stickY > stickDeadzone;
          
          // D-pad Up (button 12) or Left Stick Up - navigate up in pause menu
          if ((gamepad.buttons[12]?.pressed && !gamepadButtonsRef.current.menuUp) ||
              (stickUp && !gamepadButtonsRef.current.stickUp)) {
            if (!showPauseControlsRef.current) {
              setPauseSelection(prev => prev <= 0 ? 3 : prev - 1);
            }
          }
          gamepadButtonsRef.current.menuUp = gamepad.buttons[12]?.pressed || false;
          gamepadButtonsRef.current.stickUp = stickUp;
          
          // D-pad Down (button 13) or Left Stick Down - navigate down in pause menu
          if ((gamepad.buttons[13]?.pressed && !gamepadButtonsRef.current.menuDown) ||
              (stickDown && !gamepadButtonsRef.current.stickDown)) {
            if (!showPauseControlsRef.current) {
              setPauseSelection(prev => prev >= 3 ? 0 : prev + 1);
            }
          }
          gamepadButtonsRef.current.menuDown = gamepad.buttons[13]?.pressed || false;
          gamepadButtonsRef.current.stickDown = stickDown;
          
          // X button (button 0) - select pause menu item
          if (gamepad.buttons[0]?.pressed && !gamepadButtonsRef.current.menuSelect) {
            if (showPauseControlsRef.current) {
              setShowPauseControls(false);
            } else {
              if (pauseSelectionRef.current === 0) {
                setGameState('playing');
              } else if (pauseSelectionRef.current === 1) {
                startGame();
                setGameState('playing');
                setPauseSelection(0);
              } else if (pauseSelectionRef.current === 2) {
                setShowPauseControls(true);
              } else if (pauseSelectionRef.current === 3) {
                setGameState('menu');
                setShowPauseControls(false);
                setPauseSelection(0);
              }
            }
          }
          gamepadButtonsRef.current.menuSelect = gamepad.buttons[0]?.pressed || false;
          
          // Circle button (button 1) - back from pause controls or resume
          if (gamepad.buttons[1]?.pressed && !gamepadButtonsRef.current.menuBack) {
            if (showPauseControlsRef.current) {
              setShowPauseControls(false);
            } else {
              setGameState('playing');
            }
          }
          gamepadButtonsRef.current.menuBack = gamepad.buttons[1]?.pressed || false;
        }
        
        // Handle checkpoint screen navigation
        if (gameStateRef.current === 'checkpoint') {
          const stickY = gamepad.axes[1] || 0;
          const stickDeadzone = 0.5;
          const stickUp = stickY < -stickDeadzone;
          const stickDown = stickY > stickDeadzone;
          
          // D-pad Up/Down or Left Stick - navigate checkpoint menu
          if ((gamepad.buttons[12]?.pressed && !gamepadButtonsRef.current.menuUp) ||
              (stickUp && !gamepadButtonsRef.current.stickUp)) {
            setCheckpointSelection(prev => prev <= 0 ? 3 : prev - 1);
          }
          if ((gamepad.buttons[13]?.pressed && !gamepadButtonsRef.current.menuDown) ||
              (stickDown && !gamepadButtonsRef.current.stickDown)) {
            setCheckpointSelection(prev => prev >= 3 ? 0 : prev + 1);
          }
          gamepadButtonsRef.current.menuUp = gamepad.buttons[12]?.pressed || false;
          gamepadButtonsRef.current.menuDown = gamepad.buttons[13]?.pressed || false;
          gamepadButtonsRef.current.stickUp = stickUp;
          gamepadButtonsRef.current.stickDown = stickDown;
          
          // X button - select checkpoint menu item
          if (gamepad.buttons[0]?.pressed && !gamepadButtonsRef.current.menuSelect) {
            if (checkpointSelectionRef.current === 0) {
              // Continue to next wave
              setGameState('playing');
              gameStateRef.current = 'playing';
            } else if (checkpointSelectionRef.current === 1) {
              // Save progress
              saveGame();
            } else if (checkpointSelectionRef.current === 2) {
              // Open customization
              setShowCustomize(true);
            } else {
              // Quit to menu (no save)
              if (gameMusicRef.current) {
                gameMusicRef.current.pause();
                gameMusicRef.current = null;
              }
              setGameState('menu');
              gameStateRef.current = 'menu';
            }
          }
          gamepadButtonsRef.current.menuSelect = gamepad.buttons[0]?.pressed || false;
        }
        
        // Handle start/restart (X button in game over)
        if (gamepad.buttons[0]?.pressed && !gamepadButtonsRef.current.start) {
          if (gameStateRef.current === 'gameOver') {
            startGame();
          }
        }
        gamepadButtonsRef.current.start = gamepad.buttons[0]?.pressed || false;
        
        // Handle missile (Square) - with cooldown
        if (gpMissile && !gamepadButtonsRef.current.missile && upgradesRef.current.missiles) {
          if (timestamp - lastMissileRef.current > 300) {
            soundSystem.playMissile();
            triggerGamepadVibration(0.3, 0.6, 150); // Medium vibration for missile
            missilesRef.current.push({
              x: player.x + PLAYER_WIDTH,
              y: player.y + PLAYER_HEIGHT / 2 - MISSILE_HEIGHT / 2,
              target: null
            });
            lastMissileRef.current = timestamp;
          }
        }
        gamepadButtonsRef.current.missile = gpMissile;
        
        // Handle bomb (Select/Share button 8) - screen clear
        const gpBomb = gamepad.buttons[8]?.pressed;
        if (gpBomb && !gamepadButtonsRef.current.bomb) {
          const bomb = bombRef.current;
          if (bomb.stock > 0 && !bomb.active) {
            // Activate bomb!
            bomb.stock--;
            bomb.active = true;
            bomb.timer = BOMB_DURATION;
            bomb.x = player.x + PLAYER_WIDTH / 2;
            bomb.y = player.y + PLAYER_HEIGHT / 2;
            
            soundSystem.playBomb();
            triggerGamepadVibration(0.8, 1.0, 400);
            playerInvincibleRef.current = BOMB_INVINCIBILITY;
            triggerScreenShake(25, 60);
            
            // Cancel ALL enemy bullets
            const canceledBullets = enemyBulletsRef.current.length;
            enemyBulletsRef.current.forEach(bullet => {
              bulletCancelRef.current.particles.push({
                x: bullet.x, y: bullet.y, timer: 30, points: 10
              });
              scoreRef.current += 10;
            });
            bulletCancelRef.current.totalCanceled += canceledBullets;
            enemyBulletsRef.current = [];
            
            // Destroy all enemies
            enemiesRef.current.forEach(enemy => {
              const ew = enemy.width || ENEMY_WIDTH;
              const eh = enemy.height || ENEMY_HEIGHT;
              createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, 'normal', true);
              scoreRef.current += enemy.points * 2;
              waveKillsRef.current++;
            });
            enemiesRef.current = [];
            
            setScore(scoreRef.current);
            
            floatingTextsRef.current.push({
              x: bomb.x, y: bomb.y - 50,
              text: '', color: '#ff4400', timer: 60, vy: -1
            });
          }
        }
        gamepadButtonsRef.current.bomb = gpBomb;
        
        // Handle force toggle (Circle) - with cooldown
        if (gpForce && !gamepadButtonsRef.current.force && forceRef.current) {
          if (timestamp - lastForceToggleRef.current > 300) {
            const force = forceRef.current;
            if (force.attached === 'front') {
              force.attached = 'back';
              force.returning = false;
            } else if (force.attached === 'back') {
              force.attached = null;
              force.returning = false;
            } else {
              force.targetAttachment = 'front';
              force.returning = true;
            }
            lastForceToggleRef.current = timestamp;
          }
        }
        gamepadButtonsRef.current.force = gpForce;
      }
      
      // Combined keyboard + gamepad movement with velocity-based physics
      let movingRight = false;
      let movingLeft = false;
      
      const ACCELERATION = 0.8;  // How quickly ship speeds up
      const MAX_SPEED = SPEED_LEVELS[speedSettingRef.current - 1] || 5;  // Speed based on setting (1-4)
      const FRICTION = 0.88;     // How quickly ship slows down (0-1, lower = more friction)
      const TILT_SPEED = 0.15;   // How quickly the ship tilts
      const MAX_TILT = 0.25;     // Maximum tilt angle in radians
      
      // Update dash cooldown
      const dash = dashRef.current;
      if (dash.cooldown > 0) {
        dash.cooldown--;
      }
      
      // Update active dash
      if (dash.active) {
        dash.timer--;
        if (dash.timer <= 0) {
          dash.active = false;
          // Brief invincibility lingers
          if (playerInvincibleRef.current < 10) {
            playerInvincibleRef.current = 10;
          }
        }
      }
      
      // Calculate input direction
      let inputX = 0;
      let inputY = 0;
      
      if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) inputY -= 1;
      if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) inputY += 1;
      if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) inputX -= 1;
      if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) inputX += 1;
      
      // Apply gamepad analog input (overrides keyboard if significant)
      if (Math.abs(gpMoveX) > 0.1) inputX = gpMoveX;
      if (Math.abs(gpMoveY) > 0.1) inputY = gpMoveY;
      
      // Track movement direction for force pod
      if (inputX > 0.1) movingRight = true;
      if (inputX < -0.1) movingLeft = true;
      
      // Handle dash input (Q key or L3/R3 on gamepad)
      const dashInput = keysRef.current['KeyQ'] || gpDash;
      if (dashInput && !dashRef.current.active && dashRef.current.cooldown <= 0 && (inputX !== 0 || inputY !== 0)) {
        // Trigger dash in current movement direction
        soundSystem.playDash();
        const magnitude = Math.sqrt(inputX * inputX + inputY * inputY);
        const dirX = inputX / magnitude;
        const dirY = inputY / magnitude;
        
        dashRef.current = {
          active: true,
          cooldown: DASH_COOLDOWN,
          direction: { x: dirX, y: dirY },
          timer: DASH_DURATION
        };
        
        // Instant velocity in dash direction
        player.vx = dirX * DASH_DISTANCE / DASH_DURATION;
        player.vy = dirY * DASH_DISTANCE / DASH_DURATION;
        
        // Invincible during dash
        playerInvincibleRef.current = DASH_DURATION + 5;
        
        // Create dash trail effect
        for (let i = 0; i < 8; i++) {
          const trailX = player.x + PLAYER_WIDTH / 2 - dirX * i * 8;
          const trailY = player.y + PLAYER_HEIGHT / 2 - dirY * i * 8;
          pickupEffectsRef.current.push({
            x: trailX,
            y: trailY,
            vx: -dirX * 2 + (Math.random() - 0.5) * 2,
            vy: -dirY * 2 + (Math.random() - 0.5) * 2,
            color: '#00ffff',
            size: 4 + Math.random() * 4,
            lifetime: 15 + Math.floor(Math.random() * 10),
            type: 'sparkle'
          });
        }
        
        // Small screen shake for dash
        triggerScreenShake(3, 5);
      }
      
      // Apply acceleration based on input (skip if dashing)
      if (inputX !== 0 || inputY !== 0) {
        // Normalize diagonal movement
        const magnitude = Math.sqrt(inputX * inputX + inputY * inputY);
        const normalizedX = inputX / magnitude;
        const normalizedY = inputY / magnitude;
        
        // Speed boost multiplier
        const speedMultiplier = 1 + (upgradesRef.current.speedBoost * 0.25); // +25% per stack
        
        // Apply acceleration
        player.vx += normalizedX * ACCELERATION * Math.abs(inputX) * speedMultiplier;
        player.vy += normalizedY * ACCELERATION * Math.abs(inputY) * speedMultiplier;
        
        // Clamp to max speed (also boosted)
        const boostedMaxSpeed = MAX_SPEED * speedMultiplier;
        const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        if (currentSpeed > boostedMaxSpeed) {
          player.vx = (player.vx / currentSpeed) * boostedMaxSpeed;
          player.vy = (player.vy / currentSpeed) * boostedMaxSpeed;
        }
      }
      
      // Update magnet timer
      if (upgradesRef.current.magnetTimer > 0) {
        upgradesRef.current.magnetTimer--;
        if (upgradesRef.current.magnetTimer <= 0) {
          upgradesRef.current.magnet = false;
        }
      }
      
      // Update piercing timer
      if (upgradesRef.current.piercingTimer > 0) {
        upgradesRef.current.piercingTimer--;
        if (upgradesRef.current.piercingTimer <= 0) {
          upgradesRef.current.piercing = false;
        }
      }
      
      // Update double score timer
      if (upgradesRef.current.doubleScoreTimer > 0) {
        upgradesRef.current.doubleScoreTimer--;
        if (upgradesRef.current.doubleScoreTimer <= 0) {
          upgradesRef.current.doubleScore = false;
        }
      }
      
      // Update ricochet timer
      if (upgradesRef.current.ricochetTimer > 0) {
        upgradesRef.current.ricochetTimer--;
        if (upgradesRef.current.ricochetTimer <= 0) {
          upgradesRef.current.ricochet = false;
        }
      }
      
      // Update invincibility timer
      if (upgradesRef.current.invincibleTimer > 0) {
        upgradesRef.current.invincibleTimer--;
        if (upgradesRef.current.invincibleTimer <= 0) {
          upgradesRef.current.invincible = false;
        }
      }
      
      // Update laser beam timer
      if (upgradesRef.current.laserBeamTimer > 0) {
        upgradesRef.current.laserBeamTimer--;
        if (upgradesRef.current.laserBeamTimer <= 0) {
          upgradesRef.current.laserBeam = false;
        }
      }
      
      // Update chain lightning timer
      if (upgradesRef.current.chainLightningTimer > 0) {
        upgradesRef.current.chainLightningTimer--;
        if (upgradesRef.current.chainLightningTimer <= 0) {
          upgradesRef.current.chainLightning = false;
        }
      }
      
      // Update time warp timer
      if (upgradesRef.current.timeWarpTimer > 0) {
        upgradesRef.current.timeWarpTimer--;
        if (upgradesRef.current.timeWarpTimer <= 0) {
          upgradesRef.current.timeWarp = false;
        }
      }
      
      // Update black hole
      if (blackHoleRef.current) {
        blackHoleRef.current.lifetime--;
        if (blackHoleRef.current.lifetime <= 0) {
          blackHoleRef.current = null;
        } else {
          // Pull enemies toward black hole
          enemiesRef.current.forEach(enemy => {
            const dx = blackHoleRef.current.x - (enemy.x + (enemy.width || ENEMY_WIDTH) / 2);
            const dy = blackHoleRef.current.y - (enemy.y + (enemy.height || ENEMY_HEIGHT) / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
              const pull = blackHoleRef.current.pullStrength * (1 - dist / 200);
              enemy.x += (dx / dist) * pull;
              enemy.y += (dy / dist) * pull;
              // Damage if close enough
              if (dist < 30) {
                enemy.health -= 2;
              }
            }
          });
          // Also pull enemy bullets
          enemyBulletsRef.current.forEach(bullet => {
            const dx = blackHoleRef.current.x - bullet.x;
            const dy = blackHoleRef.current.y - bullet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150 && dist > 10) {
              const pull = 3 * (1 - dist / 150);
              bullet.x += (dx / dist) * pull;
              bullet.y += (dy / dist) * pull;
            }
          });
        }
      }
      
      // Update clone
      if (cloneRef.current) {
        cloneRef.current.lifetime--;
        if (cloneRef.current.lifetime <= 0) {
          cloneRef.current = null;
        } else {
          // Clone follows player with delay
          cloneRef.current.x += (player.x - 80 - cloneRef.current.x) * 0.1;
          cloneRef.current.y += (player.y - cloneRef.current.y) * 0.1;
        }
      }
      
      // Apply friction (deceleration when not moving)
      player.vx *= FRICTION;
      player.vy *= FRICTION;
      
      // Stop completely if very slow
      if (Math.abs(player.vx) < 0.1) player.vx = 0;
      if (Math.abs(player.vy) < 0.1) player.vy = 0;
      
      // Update position based on velocity
      player.x += player.vx;
      player.y += player.vy;
      
      // Clamp position to bounds (full screen width)
      player.x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, player.x));
      player.y = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_HEIGHT, player.y));
      
      // Bounce off edges slightly
      if (player.x <= 0 || player.x >= GAME_WIDTH - PLAYER_WIDTH) player.vx *= -0.3;
      if (player.y <= 0 || player.y >= GAME_HEIGHT - PLAYER_HEIGHT) player.vy *= -0.3;
      
      // Record player position history for option satellites
      playerHistoryRef.current.unshift({ x: player.x, y: player.y });
      if (playerHistoryRef.current.length > MAX_OPTIONS * OPTION_TRAIL_DELAY + 10) {
        playerHistoryRef.current.pop();
      }
      
      // Spawn engine trail particles
      const trailOpt = TRAIL_OPTIONS[shipPartsRef.current?.trail || 0] || TRAIL_OPTIONS[0];
      if (trailOpt.enabled && !playerInvincibleRef.current) {
        const spawnCount = trailOpt.particleCount;
        for (let i = 0; i < spawnCount; i++) {
          const spread = trailOpt.style === 'electric' ? 6 : 4;
          let particleColor = trailOpt.color;
          let secondColor = trailOpt.secondColor;
          
          // Rainbow color cycling
          if (trailOpt.style === 'rainbow') {
            const hue = (Date.now() / 10 + i * 60) % 360;
            particleColor = `hsl(${hue}, 100%, 60%)`;
            secondColor = `hsl(${(hue + 30) % 360}, 100%, 50%)`;
          }
          
          // Style-specific properties
          const baseSize = trailOpt.style === 'stardust' ? 1.5 : 2;
          const sizeVariance = trailOpt.style === 'electric' ? 4 : 3;
          const baseLifetime = trailOpt.style === 'stardust' ? 30 : 20;
          const lifetimeVariance = trailOpt.style === 'ice' ? 20 : 15;
          
          engineTrailRef.current.push({
            x: player.x + 5,
            y: player.y + PLAYER_HEIGHT / 2 + (Math.random() - 0.5) * spread,
            vx: -2 - Math.random() * 2,
            vy: (Math.random() - 0.5) * 1.5,
            size: baseSize + Math.random() * sizeVariance,
            lifetime: baseLifetime + Math.random() * lifetimeVariance,
            maxLifetime: baseLifetime + lifetimeVariance,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            color: particleColor,
            secondColor: secondColor,
            style: trailOpt.style
          });
        }
      }
      
      // Update engine trail particles
      engineTrailRef.current = engineTrailRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.lifetime--;
        
        // Style-specific updates
        if (p.style === 'ice') {
          p.rotation = (p.rotation || 0) + (p.rotationSpeed || 0);
          p.size *= 0.97; // Slower shrink for ice crystals
        } else if (p.style === 'electric') {
          p.vx *= 0.98; // Electric particles slow down
          p.size *= 0.94;
        } else if (p.style === 'stardust') {
          p.size *= 0.96; // Maintain size longer
          p.vy += (Math.random() - 0.5) * 0.1; // Drift
        } else if (p.style === 'shadow') {
          p.rotation = (p.rotation || 0) + 0.05;
          p.size *= 0.93;
        } else {
          p.size *= 0.95;
        }
        
        // Add slight gravity for some styles
        if (p.style === 'sakura' || p.style === 'fire') {
          p.vy += 0.05;
        }
        
        return p.lifetime > 0 && p.size > 0.3;
      });
      
      // Limit trail particles with configurable max
      if (engineTrailRef.current.length > PARTICLE_LIMITS.engineTrail) {
        engineTrailRef.current = engineTrailRef.current.slice(-PARTICLE_LIMITS.engineTrail);
      }
      
      // Update impact particles
      impactParticlesRef.current = impactParticlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95; // Friction
        p.vy *= 0.95;
        p.lifetime--;
        p.size *= 0.96;
        p.brightness *= 0.98;
        return p.lifetime > 0 && p.size > 0.2;
      });
      
      // Update spark particles  
      sparkParticlesRef.current = sparkParticlesRef.current.filter(p => {
        p.prevX = p.x;
        p.prevY = p.y;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Gravity
        p.vx *= 0.98;
        p.lifetime--;
        p.size *= 0.97;
        return p.lifetime > 0 && p.size > 0.1;
      });
      
      // Update bullet trails
      bulletTrailsRef.current = bulletTrailsRef.current.filter(trail => {
        trail.lifetime--;
        trail.size *= 0.92;
        trail.alpha *= 0.88;
        return trail.lifetime > 0 && trail.alpha > 0.05;
      });
      
      // Update missile trails
      missileTrailsRef.current = missileTrailsRef.current.filter(trail => {
        trail.lifetime--;
        trail.size *= 0.94;
        trail.alpha *= 0.9;
        if (trail.isSmoke) {
          trail.y -= 0.3; // Smoke rises slightly
        }
        return trail.lifetime > 0 && trail.alpha > 0.05;
      });
      
      // Update option satellite positions (follow player trail)
      const options = optionsRef.current;
      for (let i = 0; i < options.length; i++) {
        const historyIndex = (i + 1) * OPTION_TRAIL_DELAY;
        if (playerHistoryRef.current[historyIndex]) {
          options[i].x = playerHistoryRef.current[historyIndex].x;
          options[i].y = playerHistoryRef.current[historyIndex].y;
        }
      }
      
      // Calculate tilt based on vertical velocity
      const targetTilt = (player.vy / MAX_SPEED) * MAX_TILT;
      player.tilt += (targetTilt - player.tilt) * TILT_SPEED;
      
      // Update force attachment based on horizontal movement
      if (forceRef.current && forceRef.current.attached) {
        if (movingRight && forceRef.current.attached === 'front') {
          // Moving forward - force transitions to back
          forceRef.current.attached = 'back';
        } else if (movingLeft && forceRef.current.attached === 'back') {
          // Moving backward - force returns to front
          forceRef.current.attached = 'front';
        }
      }

      // Wave Cannon charging (hold shift or L2 trigger)
      if (keysRef.current['ShiftLeft'] || keysRef.current['ShiftRight'] || gpWaveCannon) {
        isChargingRef.current = true;
        waveCannonChargeRef.current = Math.min(WAVE_CANNON_MAX_CHARGE, waveCannonChargeRef.current + WAVE_CANNON_CHARGE_RATE);
      } else if (isChargingRef.current && waveCannonChargeRef.current > 0) {
        // Release wave cannon!
        soundSystem.playWaveCannonFire();
        const chargeLevel = waveCannonChargeRef.current / WAVE_CANNON_MAX_CHARGE;
        const waveSize = 10 + chargeLevel * 30;
        const waveDamage = Math.ceil(1 + chargeLevel * 4);
        bulletsRef.current.push({
          x: player.x + PLAYER_WIDTH,
          y: player.y + PLAYER_HEIGHT / 2,
          isWaveCannon: true,
          size: waveSize,
          damage: waveDamage,
          speed: 8 + chargeLevel * 4
        });
        waveCannonChargeRef.current = 0;
        isChargingRef.current = false;
      }

      // Auto-fire with space held down or gamepad shoot button (respects fire rate upgrade) - only if not charging
      const fireRate = BASE_FIRE_RATE / (1 + upgradesRef.current.rapidFire * 0.5);
      
      // Player laser beam - available when rapidFire is at max (level 3)
      // Activated by Triangle button or L key (separate from regular shooting)
      const canUseLaser = upgradesRef.current.rapidFire >= 3;
      const playerLaser = playerLaserRef.current;
      const laserInput = keysRef.current['KeyL'] || gpLaser;
      
      if (canUseLaser && laserInput && !isChargingRef.current) {
        // Charge the laser while holding fire
        if (!playerLaser.firing) {
          playerLaser.charging = true;
          playerLaser.charge = Math.min(100, playerLaser.charge + 3);
          
          // Fire the laser when fully charged
          if (playerLaser.charge >= 100) {
            playerLaser.firing = true;
            playerLaser.duration = 90; // 1.5 seconds at 60fps
            playerLaser.charging = false;
            // Play laser blast sound
            try {
              const laserSound = new Audio('/ship-lasser-blast.mp3');
              laserSound.volume = 0.4;
              laserSound.play().catch(() => {});
            } catch (e) {}
          }
        }
      } else if (canUseLaser && playerLaser.charging && !playerLaser.firing && !laserInput) {
        // Released early - fire a shorter burst if charged enough
        if (playerLaser.charge >= 30) {
          playerLaser.firing = true;
          playerLaser.duration = Math.floor(playerLaser.charge * 0.6); // Shorter duration based on charge
          // Play laser blast sound
          try {
            const laserSound = new Audio('/ship-lasser-blast.mp3');
            laserSound.volume = 0.4;
            laserSound.play().catch(() => {});
          } catch (e) {}
        }
        playerLaser.charging = false;
        playerLaser.charge = 0;
      }
      
      // Update laser firing
      if (playerLaser.firing) {
        playerLaser.duration--;
        
        // Laser damages enemies
        enemiesRef.current.forEach(enemy => {
          const laserY = player.y + PLAYER_HEIGHT / 2;
          const laserHeight = 20;
          
          // Check if enemy is in laser path
          if (enemy.x > player.x + PLAYER_WIDTH &&
              enemy.y + ENEMY_HEIGHT > laserY - laserHeight / 2 &&
              enemy.y < laserY + laserHeight / 2) {
            // Skip all spawn invulnerable enemies
            if (enemy.spawnInvulnerable) {
              return; // Don't damage
            }
            // Damage enemy
            enemy.health -= 0.5; // Continuous damage
            if (enemy.health <= 0 && !enemy.dying) {
              enemy.dying = true;
              const ew = enemy.width || ENEMY_WIDTH;
              const eh = enemy.height || ENEMY_HEIGHT;
              createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, enemy.type === 'heavy' ? 'heavy' : 'normal', true);
              scoreRef.current += enemy.points || 10;
              setScore(scoreRef.current);
              waveKillsRef.current++;
              sessionStatsRef.current.kills++;
            }
          }
        });
        
        // Laser damages boss
        if (bossRef.current && bossActiveRef.current) {
          const boss = bossRef.current;
          const laserY = player.y + PLAYER_HEIGHT / 2;
          const laserHeight = 20;
          
          if (boss.x < GAME_WIDTH &&
              boss.y + boss.height > laserY - laserHeight / 2 &&
              boss.y < laserY + laserHeight / 2) {
            // Skip damage if boss is invincible
            if (boss.invincible) {
              boss.invincibleFlash = 5;
            } else {
              // Damage boss (shield first)
              if (boss.shield && boss.shield > 0) {
                boss.shield -= 0.3;
                boss.shieldRegenDelay = 180;
              } else {
                boss.health -= 0.3;
              }
            }
          }
        }
        
        if (playerLaser.duration <= 0) {
          playerLaser.firing = false;
          playerLaser.charge = 0;
        }
      }
      
      // Normal shooting (X button / Space - TAP TO FIRE, not hold)
      // Only fire when button is newly pressed (not held from previous frame)
      const spacePressed = keysRef.current['Space'];
      const spacePrevPressed = prevKeysRef.current['Space'];
      const gpShootPrevPressed = gamepadButtonsRef.current.shoot;
      const isNewShot = (spacePressed && !spacePrevPressed) || (gpShoot && !gpShootPrevPressed);
      
      // Get weapon level data
      const weaponData = WEAPON_LEVELS[weaponLevelRef.current.level] || WEAPON_LEVELS[1];
      const weaponFireRateBonus = weaponData.fireRateBonus || 0;
      const adjustedFireRate = fireRate * (1 - weaponFireRateBonus);
      
      if (isNewShot && !isChargingRef.current && timestamp - lastShotRef.current > adjustedFireRate) {
        // Play shoot sound
        soundSystem.playShoot(1 + Math.random() * 0.2);
        
        // Trigger muzzle flash effect
        muzzleFlashRef.current = {
          active: true,
          timer: 4,
          x: player.x + PLAYER_WIDTH,
          y: player.y + PLAYER_HEIGHT / 2
        };
        
        // Get current ship ability
        const currentShip = SHIP_DESIGNS[selectedShipRef.current] || SHIP_DESIGNS[0];
        const shipAbility = currentShip.ability || null;
        
        // Calculate damage modifier from abilities and weapon level
        let damageMultiplier = weaponData.damage;
        if (shipAbility === 'berserk') {
          // BERSERKER: More damage at low health
          const healthPercent = livesRef.current / 3;
          damageMultiplier *= 1 + (1 - healthPercent) * 1.5; // Up to 2.5x damage at 1 life
          shipAbilityRef.current.berserkMultiplier = damageMultiplier;
        }
        
        // Fire bullets based on weapon level
        const bulletCount = weaponData.bulletCount;
        const bulletSize = weaponData.bulletSize;
        const weaponColor = weaponData.color;
        const isPiercing = weaponData.special === 'piercing';
        
        // Calculate bullet spread based on level
        const spreadAngles = {
          1: [0],                                    // Single center
          2: [-0.05, 0.05],                          // Twin parallel
          3: [-0.15, 0, 0.15],                       // Triple spread
          4: [-0.2, -0.07, 0.07, 0.2],               // Quad spread
          5: [-0.25, -0.12, 0, 0.12, 0.25]           // Five-way
        };
        
        const angles = spreadAngles[bulletCount] || [0];
        
        for (let i = 0; i < bulletCount; i++) {
          const angle = angles[i] || 0;
          const yOffset = Math.sin(angle) * 15; // Vertical spread
          
          bulletsRef.current.push({
            x: player.x + PLAYER_WIDTH,
            y: player.y + PLAYER_HEIGHT / 2 - BULLET_HEIGHT / 2 + yOffset,
            polarity: polarityRef.current,
            ability: shipAbility,
            damage: damageMultiplier,
            canChain: shipAbility === 'chainLightning',
            canFreeze: shipAbility === 'freezeShot',
            weaponLevel: weaponLevelRef.current.level,
            weaponColor: weaponColor,
            bulletSize: bulletSize,
            spreadAngle: angle,
            isPiercing: isPiercing || upgradesRef.current.piercing
          });
        }
        
        // Spread shot - adds additional diagonal bullets
        if (upgradesRef.current.spreadShot) {
          // Upper diagonal
          bulletsRef.current.push({
            x: player.x + PLAYER_WIDTH,
            y: player.y + PLAYER_HEIGHT / 2 - BULLET_HEIGHT / 2,
            polarity: polarityRef.current,
            spreadAngle: -0.3, // Slight upward angle
            isSpread: true
          });
          // Lower diagonal
          bulletsRef.current.push({
            x: player.x + PLAYER_WIDTH,
            y: player.y + PLAYER_HEIGHT / 2 - BULLET_HEIGHT / 2,
            polarity: polarityRef.current,
            spreadAngle: 0.3, // Slight downward angle
            isSpread: true
          });
        }
        
        // Force pod also shoots when attached
        if (forceRef.current && forceRef.current.attached) {
          const force = forceRef.current;
          bulletsRef.current.push({
            x: force.attached === 'front' ? force.x + FORCE_SIZE : force.x - FORCE_SIZE,
            y: force.y,
            isForceShot: true,
            polarity: polarityRef.current
          });
        }
        
        // Option satellites also fire!
        for (const option of optionsRef.current) {
          bulletsRef.current.push({
            x: option.x + 10,
            y: option.y,
            isOptionShot: true,
            polarity: polarityRef.current
          });
        }
        
        // Clone also fires if active
        if (cloneRef.current) {
          bulletsRef.current.push({
            x: cloneRef.current.x + PLAYER_WIDTH,
            y: cloneRef.current.y + PLAYER_HEIGHT / 2,
            isCloneShot: true,
            polarity: polarityRef.current
          });
        }
        
        lastShotRef.current = timestamp;
      }
      
      // Update previous key/button states for tap detection
      prevKeysRef.current['Space'] = spacePressed;
      gamepadButtonsRef.current.shoot = gpShoot;

      // Update Force pod position
      if (forceRef.current) {
        const force = forceRef.current;
        
        // Update Force shield timer
        if (force.shieldActive && force.shieldTimer > 0) {
          force.shieldTimer--;
          // Keep player invincible while shield is active
          playerInvincibleRef.current = Math.max(playerInvincibleRef.current, 2);
          if (force.shieldTimer <= 0) {
            force.shieldActive = false;
          }
        }
        
        // Calculate dynamic size based on power
        const powerRatio = force.power / FORCE_MAX_POWER;
        const currentSize = FORCE_SIZE * (1 + powerRatio * 0.5); // Grows up to 1.5x
        force.currentSize = currentSize;
        
        // Check if should split (at max power)
        if (force.power >= FORCE_MAX_POWER && !force.split) {
          force.split = true;
          force.splitY = 25; // Vertical offset for split pods
          force.splitAngle = 0; // Rotation angle for orbiting pods
        }
        
        // Update split pod rotation
        if (force.split) {
          force.splitAngle = (force.splitAngle + 0.05) % (Math.PI * 2); // Rotate continuously
        }
        
        // Position the Force pod(s)
        if (force.attached === 'front') {
          force.x = player.x + PLAYER_WIDTH + currentSize / 2 + 5;
          force.y = player.y + PLAYER_HEIGHT / 2;
        } else if (force.attached === 'back') {
          force.x = player.x - currentSize / 2 - 5;
          force.y = player.y + PLAYER_HEIGHT / 2;
        } else if (force.returning) {
          // Smoothly move towards target attachment position
          const targetX = force.targetAttachment === 'front' 
            ? player.x + PLAYER_WIDTH + currentSize / 2 + 5
            : player.x - currentSize / 2 - 5;
          const targetY = player.y + PLAYER_HEIGHT / 2;
          
          // Smooth interpolation (ease-in)
          const returnSpeed = 0.15; // 15% of distance per frame
          const dx = targetX - force.x;
          const dy = targetY - force.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Move towards target
          force.x += dx * returnSpeed;
          force.y += dy * returnSpeed;
          
          // Snap to position when close enough and complete attachment
          if (distance < 5) {
            force.x = targetX;
            force.y = targetY;
            force.attached = force.targetAttachment;
            force.returning = false;
            force.targetAttachment = null;
            soundSystem.playPowerupPickup(); // Play attachment sound
          }
        } else {
          // Float freely - slowly drift towards mouse or just hover
          force.x += 2;
          if (force.x > GAME_WIDTH) {
            force.x = GAME_WIDTH - 50;
          }
        }
        
        // Electricity attack when powered up (power > 50)
        const now = Date.now();
        if (force.power > 50 && now - lastElectricityRef.current > 200) {
          // Find enemies in range for electricity
          const electricRange = 150 + powerRatio * 100; // Range increases with power
          
          enemiesRef.current.forEach(enemy => {
            const dx = (enemy.x + ENEMY_WIDTH / 2) - force.x;
            const dy = (enemy.y + ENEMY_HEIGHT / 2) - force.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Primary pod electricity
            if (dist < electricRange) {
              electricityRef.current.push({
                x1: force.x,
                y1: force.y,
                x2: enemy.x + ENEMY_WIDTH / 2,
                y2: enemy.y + ENEMY_HEIGHT / 2,
                lifetime: 10,
                targetEnemy: enemy
              });
            }
            
            // Second pod electricity when split
            if (force.split) {
              // Calculate rotating positions
              const orbitRadius = force.splitY;
              const topPodX = force.x + Math.cos(force.splitAngle) * orbitRadius * 0.3;
              const topPodY = force.y + Math.sin(force.splitAngle) * orbitRadius - orbitRadius * 0.5;
              const botPodX = force.x + Math.cos(force.splitAngle + Math.PI) * orbitRadius * 0.3;
              const botPodY = force.y + Math.sin(force.splitAngle + Math.PI) * orbitRadius + orbitRadius * 0.5;
              
              const dy2Top = (enemy.y + ENEMY_HEIGHT / 2) - topPodY;
              const dx2Top = (enemy.x + ENEMY_WIDTH / 2) - topPodX;
              const dy2Bot = (enemy.y + ENEMY_HEIGHT / 2) - botPodY;
              const dx2Bot = (enemy.x + ENEMY_WIDTH / 2) - botPodX;
              const distTop = Math.sqrt(dx2Top * dx2Top + dy2Top * dy2Top);
              const distBot = Math.sqrt(dx2Bot * dx2Bot + dy2Bot * dy2Bot);
              
              if (distTop < electricRange) {
                electricityRef.current.push({
                  x1: topPodX,
                  y1: topPodY,
                  x2: enemy.x + ENEMY_WIDTH / 2,
                  y2: enemy.y + ENEMY_HEIGHT / 2,
                  lifetime: 10,
                  targetEnemy: enemy
                });
              }
              if (distBot < electricRange) {
                electricityRef.current.push({
                  x1: botPodX,
                  y1: botPodY,
                  x2: enemy.x + ENEMY_WIDTH / 2,
                  y2: enemy.y + ENEMY_HEIGHT / 2,
                  lifetime: 10,
                  targetEnemy: enemy
                });
              }
            }
          });
          
          // Electricity can also hit boss
          if (bossRef.current && bossActiveRef.current) {
            const boss = bossRef.current;
            const dx = (boss.x + BOSS_WIDTH / 2) - force.x;
            const dy = (boss.y + BOSS_HEIGHT / 2) - force.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < electricRange * 1.5) {
              electricityRef.current.push({
                x1: force.x,
                y1: force.y,
                x2: boss.x + BOSS_WIDTH / 2,
                y2: boss.y + BOSS_HEIGHT / 2,
                lifetime: 10,
                targetBoss: true
              });
            }
          }
          
          lastElectricityRef.current = now;
        }
        
        // Force pod auto-targeting and shooting
        if (now - forceLastShotRef.current > FORCE_FIRE_RATE && force.active) {
          // Find nearest enemy
          let nearestEnemy = null;
          let nearestDist = Infinity;
          
          // Check regular enemies - when in back position, prefer enemies behind the player
          const isInBack = force.attached === 'back';
          enemiesRef.current.forEach(enemy => {
            const dx = (enemy.x + ENEMY_WIDTH / 2) - force.x;
            const dy = (enemy.y + ENEMY_HEIGHT / 2) - force.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // When in back, prioritize enemies to the left; when in front, prioritize enemies to the right
            const validTarget = isInBack 
              ? enemy.x < force.x + 150  // When behind ship, target enemies on the left
              : enemy.x > force.x - 100; // When in front, target enemies on the right
            if (dist < nearestDist && validTarget) {
              nearestDist = dist;
              nearestEnemy = { x: enemy.x + ENEMY_WIDTH / 2, y: enemy.y + ENEMY_HEIGHT / 2 };
            }
          });
          
          // Also target boss
          if (bossRef.current && bossActiveRef.current) {
            const boss = bossRef.current;
            const dx = (boss.x + BOSS_WIDTH / 2) - force.x;
            const dy = (boss.y + BOSS_HEIGHT / 2) - force.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestEnemy = { x: boss.x + BOSS_WIDTH / 2, y: boss.y + BOSS_HEIGHT / 2 };
            }
          }
          
          // Shoot at nearest enemy with upgraded bullets based on Force level
          if (nearestEnemy && nearestDist < 400) { // Only shoot if enemy within range
            const dx = nearestEnemy.x - force.x;
            const dy = nearestEnemy.y - force.y;
            const angle = Math.atan2(dy, dx);
            const forceLevel = force.level || 1;
            const levelData = FORCE_LEVELS[forceLevel];
            const bulletCount = levelData.bulletCount;
            
            // Fire bullets based on level
            for (let i = 0; i < bulletCount; i++) {
              // Spread angle based on bullet count
              let bulletAngle = angle;
              if (bulletCount > 1) {
                const spreadRange = 0.3 * (bulletCount - 1);
                bulletAngle = angle - spreadRange / 2 + (spreadRange * i / (bulletCount - 1));
              }
              
              const isHoming = levelData.special === 'homing' && i === Math.floor(bulletCount / 2);
              
              forceBulletsRef.current.push({
                x: force.x,
                y: force.y,
                vx: Math.cos(bulletAngle) * FORCE_BULLET_SPEED,
                vy: Math.sin(bulletAngle) * FORCE_BULLET_SPEED,
                isForce: true,
                damage: levelData.damage,
                level: forceLevel,
                color: levelData.color,
                homing: isHoming,
                target: isHoming ? nearestEnemy : null
              });
            }
            forceLastShotRef.current = now;
            
            // Play force shot sound (pitch varies with level)
            if (forceLevel >= 3) {
              soundSystem.playElectricZap();
            }
          }
        }
      }
      
      // Update Force bullets with homing logic
      forceBulletsRef.current = forceBulletsRef.current.filter(bullet => {
        // Homing logic for level 5 bullets
        if (bullet.homing && bullet.target && enemiesRef.current.includes(bullet.target)) {
          const targetX = bullet.target.x + (bullet.target.width || ENEMY_WIDTH) / 2;
          const targetY = bullet.target.y + (bullet.target.height || ENEMY_HEIGHT) / 2;
          const dx = targetX - bullet.x;
          const dy = targetY - bullet.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const homingStrength = 0.15; // How strongly bullets curve toward target
            const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
            bullet.vx += (dx / dist) * homingStrength * speed;
            bullet.vy += (dy / dist) * homingStrength * speed;
            // Normalize to maintain speed
            const newSpeed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
            bullet.vx = (bullet.vx / newSpeed) * speed;
            bullet.vy = (bullet.vy / newSpeed) * speed;
          }
        } else if (bullet.homing && !bullet.target) {
          // Find a new target if current one is gone
          let closest = null;
          let closestDist = Infinity;
          enemiesRef.current.forEach(enemy => {
            const ex = enemy.x + (enemy.width || ENEMY_WIDTH) / 2;
            const ey = enemy.y + (enemy.height || ENEMY_HEIGHT) / 2;
            const dist = Math.sqrt((ex - bullet.x) ** 2 + (ey - bullet.y) ** 2);
            if (dist < closestDist) {
              closestDist = dist;
              closest = enemy;
            }
          });
          if (closest && closestDist < 400) {
            bullet.target = closest;
          }
        }
        
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        return bullet.x > 0 && bullet.x < GAME_WIDTH && bullet.y > 0 && bullet.y < GAME_HEIGHT;
      });

      // Update electricity and apply damage
      electricityRef.current = electricityRef.current.filter(elec => {
        elec.lifetime--;
        
        // Apply damage on first frame
        if (elec.lifetime === 9) {
          if (elec.targetEnemy) {
            // Damage enemy
            const enemy = elec.targetEnemy;
            if (enemiesRef.current.includes(enemy)) {
              enemy.health = (enemy.health || 1) - 1;
              if (enemy.health <= 0) {
                const ew = enemy.width || ENEMY_WIDTH;
                const eh = enemy.height || ENEMY_HEIGHT;
                createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, 'small', true);
                const newScore = scoreRef.current + enemy.points;
                setScore(newScore);
                scoreRef.current = newScore;
                waveKillsRef.current++;
                sessionStatsRef.current.kills++;
                
                // Gain power from kills
                if (forceRef.current) {
                  forceRef.current.power = Math.min(FORCE_MAX_POWER, forceRef.current.power + 5);
                }
                
                if (Math.random() < POWERUP_DROP_CHANCE) {
                  spawnPowerup(enemy.x, enemy.y);
                }
                
                enemiesRef.current = enemiesRef.current.filter(e => e !== enemy);
              }
            }
          }
          
          if (elec.targetBoss && bossRef.current) {
            bossRef.current.health -= 0.5;
            if (bossRef.current.health <= 0) {
              // Boss defeated! MASSIVE explosion
              sessionStatsRef.current.bosses++;
              createExplosion(bossRef.current.x + BOSS_WIDTH / 2, bossRef.current.y + BOSS_HEIGHT / 2, 'boss', true);
              createExplosion(bossRef.current.x + 30, bossRef.current.y + 20, 'large');
              createExplosion(bossRef.current.x + BOSS_WIDTH - 30, bossRef.current.y + BOSS_HEIGHT - 20, 'large');
              const newScore = scoreRef.current + bossRef.current.points;
              setScore(newScore);
              scoreRef.current = newScore;
              
              // Check for checkpoint (after waves 5, 10, 15, etc.) BEFORE incrementing
              const completedWave = waveRef.current;
              const isCheckpointWave = completedWave % 5 === 0 && completedWave > 0;
              // Victory condition depends on game mode
              const mode = gameModeRef.current;
              let isVictoryWave = false;
              if (mode === 'campaign') {
                isVictoryWave = completedWave === 20; // Campaign ends at wave 20
              } else if (mode === 'timeAttack') {
                isVictoryWave = completedWave === 10; // Time Attack ends at wave 10
              } else if (mode === 'bossRush') {
                isVictoryWave = completedWave === 20; // Boss Rush ends at wave 20
              }
              // Survival mode never ends - infinite waves!
              
              // Store boss data for transition if checkpoint
              const defeatedBoss = { ...bossRef.current };
              
              bossRef.current = null;
              bossActiveRef.current = false;
              setBossActive(false);
              miniBossSpawnedRef.current = false; // Reset for next wave
              
              // Check for victory (wave 20 completed)
              if (isVictoryWave) {
                // Stop all music
                if (gameMusicRef.current) {
                  gameMusicRef.current.pause();
                  gameMusicRef.current = null;
                }
                if (bossSpawnSoundRef.current) {
                  bossSpawnSoundRef.current.pause();
                  bossSpawnSoundRef.current = null;
                }
                // Initialize victory sequence
                victoryRef.current = {
                  active: true,
                  phase: 'explosion',
                  timer: 0,
                  scrollY: 0,
                  storyIndex: 0,
                  fadeAlpha: 0,
                  bossX: defeatedBoss.x + defeatedBoss.width / 2,
                  bossY: defeatedBoss.y + defeatedBoss.height / 2,
                  finalScore: newScore
                };
                // Epic explosion sequence
                triggerScreenShake(30, 60);
                // Clear enemies and bullets
                enemiesRef.current = [];
                enemyBulletsRef.current = [];
                playerInvincibleRef.current = 9999;
                return elec.lifetime > 0;
              }
              
              waveRef.current++;
              setWave(waveRef.current);
              // Track highest wave reached for Practice Mode
              const currentHighestWave = parseInt(localStorage.getItem('nebulaXHighestWave') || '1', 10);
              if (waveRef.current > currentHighestWave) {
                localStorage.setItem('nebulaXHighestWave', waveRef.current.toString());
              }
              waveKillsRef.current = 0;
              waveKillsNeededRef.current = 10 + (waveRef.current * 5);
              waveStartTimeRef.current = performance.now(); // Reset grace period for new wave
              
              if (isCheckpointWave) {
                // Start smooth checkpoint transition with boss explosion sequence
                startCheckpointTransition(defeatedBoss, completedWave);
              } else {
                // Play level complete sound for regular wave completions
                try {
                  const levelCompleteSound = new Audio(asset('mixkit-completion-of-a-level-2063.wav'));
                  levelCompleteSound.volume = 0.5;
                  levelCompleteSound.play().catch(() => {});
                } catch (e) {}
                // Resume normal gameplay music
                resumeGameplayMusic();
                // Trigger wave intro fade effect
                levelFadeRef.current = { 
                  active: true, 
                  fadeIn: true, 
                  alpha: 0.8, 
                  showText: waveRef.current
                };
              }
            }
          }
        }
        
        return elec.lifetime > 0;
      });
      
      // Update player bullets and filter out off-screen bullets
      bulletsRef.current = bulletsRef.current.filter(bullet => {
        const bulletPolarity = bullet.polarity || 'light';
        if (Math.random() < 0.5) {
          bulletTrailsRef.current.push({
            x: bullet.x - 2,
            y: bullet.y + BULLET_HEIGHT / 2,
            size: 3 + Math.random() * 2,
            color: bulletPolarity === 'light' ? '#ffff00' : '#8B00FF',
            glowColor: bulletPolarity === 'light' ? '#ff8800' : '#4B0082',
            lifetime: 8,
            alpha: 0.8
          });
        }
        
        // Wave cannon energy trail
        if (bullet.isWaveCannon && Math.random() < 0.8) {
          bulletTrailsRef.current.push({
            x: bullet.x - 10 + (Math.random() - 0.5) * 10,
            y: bullet.y + bullet.size / 2 + (Math.random() - 0.5) * bullet.size,
            size: 5 + Math.random() * 8,
            color: '#00ffff',
            glowColor: '#0088ff',
            lifetime: 12,
            alpha: 0.6
          });
        }
        
        if (bullet.isWaveCannon) {
          bullet.x += bullet.speed;
          bullet.size *= 0.995; // Slowly shrink
          return bullet.x < GAME_WIDTH && bullet.size > 5;
        } else if (bullet.isSpread) {
          // Spread bullets move diagonally
          bullet.x += BULLET_SPEED * Math.cos(bullet.spreadAngle);
          bullet.y += BULLET_SPEED * Math.sin(bullet.spreadAngle);
          return bullet.x < GAME_WIDTH && bullet.y > 0 && bullet.y < GAME_HEIGHT;
        } else {
          bullet.x += BULLET_SPEED;
          return bullet.x < GAME_WIDTH;
        }
      });

      // Update missiles (homing behavior)
      missilesRef.current = missilesRef.current.filter(missile => {
        // Spawn smoke trail particles for missiles
        if (Math.random() < 0.7) {
          missileTrailsRef.current.push({
            x: missile.x - 5,
            y: missile.y + MISSILE_HEIGHT / 2 + (Math.random() - 0.5) * 4,
            size: 4 + Math.random() * 4,
            color: Math.random() > 0.3 ? '#ffaa00' : '#ff6600',
            lifetime: 15,
            alpha: 0.7,
            isSmoke: Math.random() > 0.5
          });
        }
        
        // Find nearest enemy for homing
        let nearestEnemy = null;
        let nearestDist = Infinity;
        
        enemiesRef.current.forEach(enemy => {
          const dx = enemy.x - missile.x;
          const dy = enemy.y - missile.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < nearestDist && dx > 0) {
            nearestDist = dist;
            nearestEnemy = enemy;
          }
        });
        
        if (nearestEnemy && nearestDist < 300) {
          // Home towards enemy
          const dx = nearestEnemy.x + ENEMY_WIDTH / 2 - missile.x;
          const dy = nearestEnemy.y + ENEMY_HEIGHT / 2 - missile.y;
          const angle = Math.atan2(dy, dx);
          missile.x += Math.cos(angle) * MISSILE_SPEED;
          missile.y += Math.sin(angle) * MISSILE_SPEED;
          missile.angle = angle;
        } else {
          // Move straight
          missile.x += MISSILE_SPEED;
          missile.angle = 0;
        }
        
        return missile.x < GAME_WIDTH && missile.x > -MISSILE_WIDTH && 
               missile.y > -MISSILE_HEIGHT && missile.y < GAME_HEIGHT + MISSILE_HEIGHT;
      });

      // Spawn enemies (only if boss is not active and grace period has passed)
      // Skip enemy spawning in Boss Rush mode - only bosses!
      const gracePeriodOver = timestamp - waveStartTimeRef.current > WAVE_GRACE_PERIOD;
      const isBossRush = gameModeRef.current === 'bossRush';
      
      // Check if we should spawn a boss (enough kills accumulated)
      if (!bossActiveRef.current && !bossRef.current && waveKillsRef.current >= waveKillsNeededRef.current) {
        console.log('[BOSS] Spawning boss! Wave:', waveRef.current, 'Kills:', waveKillsRef.current);
        
        // Create boss
        const bossType = waveRef.current >= 15 ? 'mega' : waveRef.current >= 10 ? 'super' : 'normal';
        const isMegaBoss = bossType === 'mega';
        const isSuperBoss = bossType === 'super' || bossType === 'mega';
        const bossHealth = 100 + (waveRef.current * 50);
        const bossShield = isSuperBoss ? bossHealth * 0.3 : 0;
        
        bossRef.current = {
          x: GAME_WIDTH + 50,
          y: GAME_HEIGHT / 2 - BOSS_HEIGHT / 2,
          width: BOSS_WIDTH,
          height: BOSS_HEIGHT,
          health: bossHealth,
          maxHealth: bossHealth,
          shield: bossShield,
          maxShield: bossShield,
          shieldRegenDelay: 0,
          points: 1000 + (waveRef.current * 500),
          type: bossType,
          isSuperBoss: isSuperBoss,
          isMegaBoss: isMegaBoss,
          entered: false,
          phase: 0,
          phaseTimer: 0,
          targetY: GAME_HEIGHT / 2 - BOSS_HEIGHT / 2,
          invincible: false,
          regenerating: false,
          regenCount: 0,
          maxRegens: 2,
          regenThreshold: 0.3,
          regenDuration: 180,
          regenCooldown: 0,
          regenCooldownMax: 300,
          laserCharging: false,
          laserFiring: false,
          laserChargeDuration: 0,
          laserDuration: 0,
          lastShot: Date.now(),
          lastLaser: Date.now(),
          lastCannonShot: Date.now(),
          lastSecondaryShot: Date.now(),
          fireRate: isMegaBoss ? 1200 : isSuperBoss ? 1500 : 2000,
          cannonFireRate: 2500,
          secondaryFireRate: 1800,
          empActive: false,
          empRadius: 0,
          lastEMP: Date.now(),
          regenEMPFired: false
        };
        
        bossActiveRef.current = true;
        setBossActive(true);
        soundSystem.playBossWarning();
      }
      
      // In Boss Rush mode, spawn boss immediately
      // Boss spawning handled by game loop based on kill count
      
      // Show "DANGER INCOMING" warning when grace period ends
      if (gracePeriodOver && !graceWarningShownRef.current && !bossActiveRef.current && !isBossRush) {
        graceWarningShownRef.current = true;
        floatingTextsRef.current.push({
          x: GAME_WIDTH / 2,
          y: GAME_HEIGHT / 2 - 30,
          text: '⚠️ DANGER INCOMING ⚠️',
          color: '#ff4444',
          lifetime: 120,
          vy: 0,
          flash: true,
          scale: 1.5
        });
        // Play warning sound
        soundSystem.playBossWarning();
      }
      
      // Skip regular enemy spawning in Boss Rush mode
      if (!isBossRush && gracePeriodOver && !bossActiveRef.current && timestamp - lastSpawnRef.current > SPAWN_RATE / (1 + waveRef.current * 0.1)) {
        spawnEnemy();
        lastSpawnRef.current = timestamp;
      }
      
      // Spawn formations periodically (starts wave 2, ~10% chance when spawning)
      // Skip in Boss Rush mode
      const formationInterval = 8000 - Math.min(4000, waveRef.current * 300); // 8s at wave 1, down to 4s
      if (!isBossRush && gracePeriodOver && !bossActiveRef.current && waveRef.current >= 2 && 
          timestamp - lastFormationSpawnRef.current > formationInterval) {
        if (Math.random() < 0.3) { // 30% chance to spawn a formation
          spawnFormation();
        }
        lastFormationSpawnRef.current = timestamp;
      }
      
      // Spawn flyby formations periodically (starts wave 3, every ~12 seconds)
      const flybyInterval = 12000 - Math.min(5000, waveRef.current * 400); // 12s down to 7s
      if (gracePeriodOver && !bossActiveRef.current && waveRef.current >= 3 && 
          timestamp - lastFlybySpawnRef.current > flybyInterval) {
        // Check if there isn't already an active flyby in progress
        const activeFlyby = flybyFormationsRef.current.find(g => g.phase === 'entering');
        if (!activeFlyby && Math.random() < 0.4) { // 40% chance
          spawnFlybyFormation();
        }
        lastFlybySpawnRef.current = timestamp;
      }
      
      // Clean up completed flyby formations
      flybyFormationsRef.current = flybyFormationsRef.current.filter(group => {
        // Check if all enemies from this group are gone
        const hasEnemies = enemiesRef.current.some(e => e.flybyGroupId === group.id);
        if (!hasEnemies && group.aliveCount > 0) {
          // All enemies destroyed - award bonus
          const bonus = group.bonus;
          scoreRef.current += bonus;
          setScore(scoreRef.current);
          
          floatingTextsRef.current.push({
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT / 2 - 50,
            text: `${group.name} BONUS +${bonus}`,
            color: group.color || '#ffff00',
            lifetime: 90,
            vy: -1,
            scale: 1.2
          });
          
          return false; // Remove completed group
        }
        return hasEnemies;
      });
      
      // Spawn mini-boss periodically (starts wave 2, once per wave)
      // Spawns when player has killed 40-60% of enemies needed for boss
      const miniBossKillThreshold = Math.floor(waveKillsNeededRef.current * 0.5); // 50% progress
      if (!isBossRush && gracePeriodOver && !bossActiveRef.current && !miniBossRef.current && 
          !miniBossSpawnedRef.current && waveRef.current >= 2 && 
          waveKillsRef.current >= miniBossKillThreshold) {
        spawnMiniBoss();
        console.log('[MINIBOSS] Spawned at wave', waveRef.current, 'kills:', waveKillsRef.current, '/', waveKillsNeededRef.current);
      }
      
      // ========== ENVIRONMENTAL HAZARDS ==========
      const hazards = hazardsRef.current;
      const waveNum = waveRef.current;
      
      // Spawn hazards periodically (starts wave 3, but not during boss battles)
      if (waveNum >= 3 && !bossActiveRef.current && timestamp - lastHazardSpawnRef.current > 3000) {
        lastHazardSpawnRef.current = timestamp;
        
        // Random hazard type based on wave
        const roll = Math.random();
        
        // Asteroids - most common (starts wave 3)
        if (roll < 0.5) {
          // 20% chance for HUGE asteroid (5x normal size)
          const isGiant = Math.random() < 0.2;
          const baseSize = 20 + Math.random() * 40;
          const size = isGiant ? baseSize * 5 : baseSize;
          
          hazards.asteroids.push({
            x: GAME_WIDTH + size,
            y: Math.random() * (GAME_HEIGHT - size * 2) + size,
            size: size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * (isGiant ? 0.02 : 0.05), // Giant asteroids rotate slower
            vx: -2 - Math.random() * 2 - waveNum * 0.1,
            vy: (Math.random() - 0.5) * 2,
            health: isGiant ? Math.floor(size / 5) + 10 : Math.floor(size / 10) + 1, // Giant asteroids have more health
            isGiant: isGiant
          });
        }
        // Laser barriers - less common (starts wave 4)
        else if (roll < 0.7 && waveNum >= 4 && hazards.laserBarriers.length < 2) {
          hazards.laserBarriers.push({
            y: 50 + Math.random() * (GAME_HEIGHT - 100),
            width: 0,
            maxWidth: GAME_WIDTH * 0.6,
            active: false,
            timer: 0,
            warningTimer: 90, // 1.5 seconds warning
            growSpeed: 8
          });
        }
        // Gravity wells - rare (starts wave 5)
        else if (roll < 0.85 && waveNum >= 5 && hazards.gravityWells.length < 2) {
          hazards.gravityWells.push({
            x: GAME_WIDTH + 80,
            y: 80 + Math.random() * (GAME_HEIGHT - 160),
            radius: 60 + Math.random() * 40,
            strength: 0.3 + waveNum * 0.02,
            pulsePhase: 0,
            vx: -1 - Math.random() * 0.5
          });
        }
      }
      
      // Update asteroids
      hazards.asteroids = hazards.asteroids.filter(asteroid => {
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;
        asteroid.rotation += asteroid.rotationSpeed;
        
        // Bounce off top/bottom
        if (asteroid.y < asteroid.size || asteroid.y > GAME_HEIGHT - asteroid.size) {
          asteroid.vy *= -0.8;
          asteroid.y = Math.max(asteroid.size, Math.min(GAME_HEIGHT - asteroid.size, asteroid.y));
        }
        
        // Check collision with player (if not invincible or dashing)
        if (playerInvincibleRef.current <= 0 && !dashRef.current.active && !upgradesRef.current.invincible) {
          const player = playerRef.current;
          const dx = (player.x + PLAYER_WIDTH / 2) - asteroid.x;
          const dy = (player.y + PLAYER_HEIGHT / 2) - asteroid.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < asteroid.size + 15) {
            // Player hit!
            if (upgradesRef.current.shield && upgradesRef.current.shieldHits > 0) {
              upgradesRef.current.shieldHits--;
              upgradesRef.current.shieldRechargeTimer = 180; // Reset recharge timer
              if (upgradesRef.current.shieldHits <= 0) upgradesRef.current.shield = false;
              createShieldImpact(asteroid.x, asteroid.y);
              createExplosion(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, 'small');
              triggerScreenShake(8, 10);
            } else {
              soundSystem.playPlayerDestroy();
              const newLives = livesRef.current - 1;
              setLives(newLives);
              livesRef.current = newLives;
              playerInvincibleRef.current = 120;
              createExplosion(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, 'large');
              triggerScreenShake(15, 20);
              if (newLives <= 0) {
                handleGameOver();
              }
            }
          }
        }
        
        // Check collision with player bullets
        bulletsRef.current = bulletsRef.current.filter(bullet => {
          const bx = bullet.isWaveCannon ? bullet.x : bullet.x + BULLET_WIDTH / 2;
          const by = bullet.isWaveCannon ? bullet.y : bullet.y + BULLET_HEIGHT / 2;
          const dx = bx - asteroid.x;
          const dy = by - asteroid.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < asteroid.size) {
            asteroid.health -= bullet.damage || 1;
            createExplosion(bx, by, 'small');
            return bullet.isWaveCannon; // Wave cannon passes through
          }
          return true;
        });
        
        // Asteroid destroyed
        if (asteroid.health <= 0) {
          createExplosion(asteroid.x, asteroid.y, asteroid.size > 35 ? 'large' : 'normal', true);
          // Score based on size
          const points = Math.floor(asteroid.size);
          scoreRef.current += points;
          setScore(scoreRef.current);
          
          // Large asteroids split into smaller ones
          if (asteroid.size > 30) {
            for (let i = 0; i < 2; i++) {
              const newSize = asteroid.size * 0.5;
              hazards.asteroids.push({
                x: asteroid.x,
                y: asteroid.y,
                size: newSize,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.08,
                vx: asteroid.vx + (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 4,
                health: Math.floor(newSize / 10) + 1
              });
            }
          }
          return false;
        }
        
        return asteroid.x > -asteroid.size * 2;
      });
      
      // Update laser barriers
      hazards.laserBarriers = hazards.laserBarriers.filter(barrier => {
        if (barrier.warningTimer > 0) {
          barrier.warningTimer--;
          return true;
        }
        
        if (!barrier.active) {
          // Grow the barrier
          barrier.width += barrier.growSpeed;
          if (barrier.width >= barrier.maxWidth) {
            barrier.active = true;
            barrier.timer = 120; // Active for 2 seconds
          }
        } else {
          barrier.timer--;
          if (barrier.timer <= 0) {
            // Shrink and remove
            barrier.width -= barrier.growSpeed * 2;
            if (barrier.width <= 0) return false;
          }
        }
        
        // Check player collision with active barrier
        if (barrier.active && playerInvincibleRef.current <= 0 && !dashRef.current.active && !upgradesRef.current.invincible) {
          const player = playerRef.current;
          const barrierX = GAME_WIDTH - barrier.width;
          const barrierHeight = 8;
          
          if (player.x + PLAYER_WIDTH > barrierX && player.x < GAME_WIDTH &&
              player.y + PLAYER_HEIGHT > barrier.y - barrierHeight / 2 &&
              player.y < barrier.y + barrierHeight / 2) {
            // Hit by laser!
            if (upgradesRef.current.shield && upgradesRef.current.shieldHits > 0) {
              upgradesRef.current.shieldHits--;
              upgradesRef.current.shieldRechargeTimer = 180;
              if (upgradesRef.current.shieldHits <= 0) upgradesRef.current.shield = false;
              createShieldImpact(player.x + PLAYER_WIDTH / 2, barrier.y);
            } else {
              soundSystem.playPlayerDestroy();
              const newLives = livesRef.current - 1;
              setLives(newLives);
              livesRef.current = newLives;
              playerInvincibleRef.current = 120;
              createExplosion(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, 'large');
              triggerScreenShake(12, 15);
              if (newLives <= 0) {
                handleGameOver();
              }
            }
          }
        }
        
        return true;
      });
      
      // Update gravity wells
      hazards.gravityWells = hazards.gravityWells.filter(well => {
        well.x += well.vx;
        well.pulsePhase += 0.05;
        
        // Apply gravity pull to player
        const player = playerRef.current;
        const dx = well.x - (player.x + PLAYER_WIDTH / 2);
        const dy = well.y - (player.y + PLAYER_HEIGHT / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < well.radius * 2 && dist > 10) {
          // Pull player toward center
          const pullStrength = well.strength * (1 - dist / (well.radius * 2));
          player.x += (dx / dist) * pullStrength * 3;
          player.y += (dy / dist) * pullStrength * 3;
          
          // Damage if too close to center
          if (dist < well.radius * 0.3 && playerInvincibleRef.current <= 0 && !dashRef.current.active && !upgradesRef.current.invincible) {
            if (upgradesRef.current.shield && upgradesRef.current.shieldHits > 0) {
              upgradesRef.current.shieldHits--;
              upgradesRef.current.shieldRechargeTimer = 180;
              if (upgradesRef.current.shieldHits <= 0) upgradesRef.current.shield = false;
              createShieldImpact(well.x, well.y);
              playerInvincibleRef.current = 30;
            } else {
              soundSystem.playPlayerDestroy();
              const newLives = livesRef.current - 1;
              setLives(newLives);
              livesRef.current = newLives;
              playerInvincibleRef.current = 120;
              createExplosion(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, 'large');
              triggerScreenShake(10, 15);
              if (newLives <= 0) {
                handleGameOver();
              }
            }
          }
        }
        
        // Also pull enemies and bullets slightly
        enemiesRef.current.forEach(enemy => {
          const ex = enemy.x + (enemy.width || ENEMY_WIDTH) / 2;
          const ey = enemy.y + (enemy.height || ENEMY_HEIGHT) / 2;
          const edx = well.x - ex;
          const edy = well.y - ey;
          const edist = Math.sqrt(edx * edx + edy * edy);
          if (edist < well.radius * 2 && edist > 10) {
            const pull = well.strength * 0.3 * (1 - edist / (well.radius * 2));
            enemy.x += (edx / edist) * pull;
            enemy.y += (edy / edist) * pull;
          }
        });
        
        return well.x > -well.radius * 2;
      });
      
      // Update formation bonus display texts
      formationBonusDisplayRef.current = formationBonusDisplayRef.current.filter(bonus => {
        bonus.timer--;
        bonus.y -= 0.5; // Float upward
        return bonus.timer > 0;
      });
      
      // Update mini-boss
      if (miniBossRef.current) {
        const mb = miniBossRef.current;
        const player = playerRef.current;
        
        // Warning flash timer
        if (mb.warningTimer > 0) {
          mb.warningTimer--;
        }
        
        // Check if mini-boss should enter regeneration phase
        if (!mb.regenerating && !mb.hasRegenerated && mb.entered &&
            mb.health <= mb.maxHealth * mb.regenThreshold && mb.health > 0) {
          // Enter regeneration phase
          mb.regenerating = true;
          mb.regenTimer = mb.regenDuration;
          mb.regenShield = mb.regenShieldMax;
          mb.regenSpawnedSnipers = 0;
          mb.regenSpawnedSentinel = false;
          mb.regenSpawnedShielder = false;
          // Show floating text
          floatingTextsRef.current.push({
            x: mb.x + mb.width / 2,
            y: mb.y - 20,
            text: '',
            color: '#00ff00',
            lifetime: 120,
            vy: -0.5
          });
        }
        
        // Handle regeneration phase
        if (mb.regenerating) {
          mb.regenTimer--;
          
          // Regenerate health over time
          const regenAmount = (mb.maxHealth * 0.6) / mb.regenDuration; // Regen 60% of max health
          mb.health = Math.min(mb.maxHealth, mb.health + regenAmount);
          
          // Spawn 2 snipers at specific intervals
          if (mb.regenSpawnedSnipers < 2 && mb.regenTimer === Math.floor(mb.regenDuration * 0.7)) {
            // First sniper at 70% through regen
            const spawnY = 50 + Math.random() * (GAME_HEIGHT - 100);
            enemiesRef.current.push({
              x: GAME_WIDTH + 20,
              y: spawnY,
              type: 'sniper',
              health: 2 + Math.floor(waveRef.current / 3),
              speed: ENEMY_SPEED * 0.4,
              points: 80,
              canShoot: true,
              lastShot: Date.now(),
              targeting: false,
              targetTimer: 0,
              lockedAngle: 0,
              aimTime: Math.max(30, 60 - waveRef.current * 2),
              polarity: mb.polarity,
              spawnedByMiniBoss: true
            });
            mb.regenSpawnedSnipers++;
          }
          if (mb.regenSpawnedSnipers < 2 && mb.regenTimer === Math.floor(mb.regenDuration * 0.4)) {
            // Second sniper at 40% through regen
            const spawnY = 50 + Math.random() * (GAME_HEIGHT - 100);
            enemiesRef.current.push({
              x: GAME_WIDTH + 20,
              y: spawnY,
              type: 'sniper',
              health: 2 + Math.floor(waveRef.current / 3),
              speed: ENEMY_SPEED * 0.4,
              points: 80,
              canShoot: true,
              lastShot: Date.now(),
              targeting: false,
              targetTimer: 0,
              lockedAngle: 0,
              aimTime: Math.max(30, 60 - waveRef.current * 2),
              polarity: mb.polarity,
              spawnedByMiniBoss: true
            });
            mb.regenSpawnedSnipers++;
          }
          
          // Spawn sentinel at midpoint
          if (!mb.regenSpawnedSentinel && mb.regenTimer === Math.floor(mb.regenDuration * 0.5)) {
            const spawnY = 50 + Math.random() * (GAME_HEIGHT - 100);
            enemiesRef.current.push({
              x: GAME_WIDTH + 20,
              y: spawnY,
              type: 'turret',
              health: 3,
              speed: ENEMY_SPEED * 0.3,
              points: 50,
              canShoot: true,
              lastShot: Date.now(),
              angle: Math.PI,
              rotateSpeed: 0.03,
              polarity: mb.polarity,
              spawnedByMiniBoss: true
            });
            mb.regenSpawnedSentinel = true;
          }
          
          // Spawn shielder support at 25% timer
          if (!mb.regenSpawnedShielder && mb.regenTimer === Math.floor(mb.regenDuration * 0.25)) {
            const shielderY = 50 + Math.random() * (GAME_HEIGHT - 100);
            enemiesRef.current.push({
              x: GAME_WIDTH + 20,
              y: shielderY,
              type: 'shielder',
              health: 3,
              speed: ENEMY_SPEED * 0.5,
              points: 100,
              canShoot: false,
              cloaked: true,
              cloakAlpha: 0.15,
              revealTimer: 0,
              shieldRange: 150,
              shieldCooldown: 0,
              shieldInterval: 180,
              shieldPulse: 0,
              shieldedTargets: [],
              spawnedByMiniBoss: true,
              spawnInvulnerable: true,
              spawnInvulnerableTimer: 300
            });
            mb.regenSpawnedShielder = true;
            floatingTextsRef.current.push({
              x: mb.x + mb.width / 2,
              y: mb.y + mb.height + 20,
              text: '',
              color: '#00ffff',
              lifetime: 60,
              vy: 1
            });
          }
          
          // End regeneration
          if (mb.regenTimer <= 0) {
            mb.regenerating = false;
            mb.regenShield = 0;
            mb.hasRegenerated = true;
            // Show floating text
            floatingTextsRef.current.push({
              x: mb.x + mb.width / 2,
              y: mb.y - 20,
              text: '',
              color: '#ff4400',
              lifetime: 90,
              vy: -1
            });
          }
        }
        
        // Enter screen
        if (!mb.entered) {
          mb.x -= 3;
          if (mb.x <= GAME_WIDTH - mb.width - 50) {
            mb.entered = true;
          }
        } else {
          // Movement based on type
          mb.phaseTimer++;
          
          if (mb.attackPattern === 'chase') {
            // Hunter chases player aggressively
            const dx = player.x - mb.x;
            const dy = player.y - mb.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 100) { // Don't get too close
              mb.x += (dx / dist) * mb.speed * 0.5;
            }
            mb.y += (dy / dist) * mb.speed * 1.5;
          } else {
            // Standard vertical movement with sine wave
            if (mb.phaseTimer > 60) {
              mb.phaseTimer = 0;
              mb.targetY = 50 + Math.random() * (GAME_HEIGHT - mb.height - 100);
            }
            if (mb.y < mb.targetY) mb.y += mb.speed;
            if (mb.y > mb.targetY) mb.y -= mb.speed;
            
            // Slight horizontal oscillation
            mb.x = GAME_WIDTH - mb.width - 50 + Math.sin(Date.now() / 500) * 30;
          }
          
          // Mini-boss attacks (disabled during regeneration)
          if (!mb.regenerating) {
            const currentTime = Date.now();
            if (currentTime - mb.lastShot > mb.attackCooldown) {
              mb.lastShot = currentTime;
            
              switch (mb.attackPattern) {
                case 'spread': {
                  // Fire 5-way spread
                  for (let angle = -30; angle <= 30; angle += 15) {
                    const rad = angle * Math.PI / 180;
                    enemyBulletsRef.current.push({
                      x: mb.x,
                      y: mb.y + mb.height / 2,
                      vx: -8 * Math.cos(rad),
                      vy: 8 * Math.sin(rad),
                      type: 'miniboss',
                      color: mb.color
                    });
                  }
                  soundSystem.playEnemyShoot();
                  break;
                }
                case 'bombs': {
                  // Drop bombs that fall down
                  enemyBulletsRef.current.push({
                    x: mb.x,
                    y: mb.y + mb.height / 2,
                    vx: -4,
                    vy: 2,
                    type: 'bomb',
                    color: '#ffaa00',
                    size: 12
                  });
                  soundSystem.playEnemyShoot();
                  break;
                }
                case 'chase': {
                  // Fire aimed shot at player
                  const dx = player.x - mb.x;
                const dy = player.y - mb.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                enemyBulletsRef.current.push({
                  x: mb.x,
                  y: mb.y + mb.height / 2,
                  vx: (dx / dist) * 10,
                  vy: (dy / dist) * 10,
                  type: 'miniboss',
                  color: '#ff00ff'
                });
                soundSystem.playEnemyShoot();
                break;
              }
              case 'laser': {
                // Fire a horizontal laser beam
                enemyBulletsRef.current.push({
                  x: mb.x - 200,
                  y: mb.y + mb.height / 2 - 5,
                  vx: 0,
                  vy: 0,
                  type: 'laser',
                  color: '#00ffff',
                  width: 250,
                  height: 10,
                  lifetime: 30
                });
                soundSystem.playEnemyShoot();
                break;
              }
              case 'spawn': {
                // Spawn small drones
                for (let i = 0; i < 2; i++) {
                  enemiesRef.current.push({
                    x: mb.x,
                    y: mb.y + mb.height / 2 + (i === 0 ? -30 : 30),
                    type: 'drone',
                    health: 1,
                    speed: ENEMY_SPEED * 1.5,
                    points: 15,
                    canShoot: false,
                    polarity: mb.polarity,
                    width: 20,
                    height: 20,
                    spawnedByMiniBoss: true
                  });
                }
                break;
              }
              
              // === NEW MINI-BOSS ATTACK PATTERNS ===
              case 'snipe': {
                // Deadeye: Lock on to player position, then fire precise shot
                if (!mb.sniperLocked) {
                  // Start locking on
                  mb.sniperLocked = true;
                  mb.sniperLockTimer = 45; // Lock for 45 frames
                  mb.sniperTargetX = player.x + PLAYER_WIDTH / 2;
                  mb.sniperTargetY = player.y + PLAYER_HEIGHT / 2;
                  // Show targeting laser
                  floatingTextsRef.current.push({
                    x: mb.x - 50,
                    y: mb.y + mb.height / 2,
                    text: '',
                    color: '#ff0088',
                    lifetime: 45,
                    vy: 0
                  });
                }
                break;
              }
              
              case 'barrage': {
                // Juggernaut: Fire massive bullet wall
                mb.barragePhase = (mb.barragePhase + 1) % 3;
                const bulletCount = 8 + mb.barragePhase * 4; // 8, 12, or 16 bullets
                const spreadAngle = 60 + mb.barragePhase * 15;
                
                for (let i = 0; i < bulletCount; i++) {
                  const angle = (-spreadAngle / 2 + (spreadAngle / (bulletCount - 1)) * i) * Math.PI / 180;
                  enemyBulletsRef.current.push({
                    x: mb.x,
                    y: mb.y + mb.height / 2,
                    vx: -6 * Math.cos(angle),
                    vy: 6 * Math.sin(angle),
                    type: 'miniboss',
                    color: '#888888',
                    size: 8
                  });
                }
                soundSystem.playEnemyShoot();
                // Screen shake for heavy barrage
                if (mb.barragePhase === 2) {
                  triggerScreenShake(4, 8);
                }
                break;
              }
              
              case 'teleport': {
                // Phantom: Teleport to new position and fire
                if (mb.teleportCooldown <= 0) {
                  // Fire from current position
                  const angles = [-15, 0, 15];
                  angles.forEach(angle => {
                    const rad = angle * Math.PI / 180;
                    enemyBulletsRef.current.push({
                      x: mb.x,
                      y: mb.y + mb.height / 2,
                      vx: -9 * Math.cos(rad),
                      vy: 9 * Math.sin(rad),
                      type: 'miniboss',
                      color: '#9966ff'
                    });
                  });
                  soundSystem.playEnemyShoot();
                  
                  // Start teleport
                  mb.teleportFlashTimer = 15;
                  mb.teleportCooldown = 120; // 2 seconds between teleports
                  
                  // Choose new position
                  const newY = 50 + Math.random() * (GAME_HEIGHT - mb.height - 100);
                  const newX = GAME_WIDTH - mb.width - 30 - Math.random() * 100;
                  mb.teleportTargetX = newX;
                  mb.teleportTargetY = newY;
                }
                break;
              }
              
              case 'pulse': {
                // Pulsar: Fire expanding ring of bullets
                mb.pulsePhase = (mb.pulsePhase + 1) % 3;
                const ringCount = 12 + mb.pulsePhase * 4;
                const pulseSpeed = 4 + mb.pulsePhase;
                
                for (let i = 0; i < ringCount; i++) {
                  const angle = (360 / ringCount) * i * Math.PI / 180;
                  enemyBulletsRef.current.push({
                    x: mb.x + mb.width / 2,
                    y: mb.y + mb.height / 2,
                    vx: Math.cos(angle) * pulseSpeed,
                    vy: Math.sin(angle) * pulseSpeed,
                    type: 'pulse',
                    color: '#ffff00',
                    size: 6
                  });
                }
                soundSystem.playEnemyShoot();
                break;
              }
              
              case 'berserk': {
                // Berserker: Gets more aggressive as health drops
                const healthPercent = mb.health / mb.maxHealth;
                mb.berserkMultiplier = 1 + (1 - healthPercent) * 2; // Up to 3x at low health
                
                // Fire more bullets based on berserk level
                const berserkBullets = Math.floor(3 + mb.berserkMultiplier * 2);
                const berserkSpeed = 6 + mb.berserkMultiplier * 2;
                
                for (let i = 0; i < berserkBullets; i++) {
                  const spreadAngle = 50 * mb.berserkMultiplier;
                  const angle = (-spreadAngle / 2 + (spreadAngle / (berserkBullets - 1)) * i) * Math.PI / 180;
                  enemyBulletsRef.current.push({
                    x: mb.x,
                    y: mb.y + mb.height / 2,
                    vx: -berserkSpeed * Math.cos(angle),
                    vy: berserkSpeed * Math.sin(angle),
                    type: 'miniboss',
                    color: healthPercent < 0.3 ? '#ff0000' : '#ff2200'
                  });
                }
                soundSystem.playEnemyShoot();
                
                // Visual rage effect at low health
                if (healthPercent < 0.4 && Math.random() < 0.3) {
                  floatingTextsRef.current.push({
                    x: mb.x + mb.width / 2,
                    y: mb.y - 10,
                    text: '',
                    color: '#ff0000',
                    lifetime: 30,
                    vy: -2
                  });
                }
                break;
              }
              
              default:
                break;
            }
          }
          
          // === SNIPER LOCK-ON UPDATE (outside main attack switch) ===
          if (mb.sniperLocked && mb.sniperLockTimer > 0) {
            mb.sniperLockTimer--;
            if (mb.sniperLockTimer <= 0) {
              // Fire the sniper shot at locked position
              const dx = mb.sniperTargetX - mb.x;
              const dy = mb.sniperTargetY - (mb.y + mb.height / 2);
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              // Fire 3 rapid shots
              for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                  enemyBulletsRef.current.push({
                    x: mb.x,
                    y: mb.y + mb.height / 2,
                    vx: (dx / dist) * 14,
                    vy: (dy / dist) * 14,
                    type: 'sniper',
                    color: '#ff0088',
                    size: 5
                  });
                }, i * 80);
              }
              soundSystem.playEnemyShoot();
              mb.sniperLocked = false;
            }
          }
          
          // === PHANTOM TELEPORT UPDATE ===
          if (mb.teleportFlashTimer > 0) {
            mb.teleportFlashTimer--;
            if (mb.teleportFlashTimer === 8) {
              // Teleport at midpoint of flash
              mb.x = mb.teleportTargetX || mb.x;
              mb.y = mb.teleportTargetY || mb.y;
            }
          }
          if (mb.teleportCooldown > 0) mb.teleportCooldown--;
          
          // === MODIFIER EFFECTS UPDATE ===
          // Phasing modifier - periodically become invulnerable
          if (mb.modifierEffect === 'phase') {
            if (mb.phaseInvulnCooldown > 0) {
              mb.phaseInvulnCooldown--;
            } else if (mb.phaseInvulnTimer > 0) {
              mb.phaseInvulnTimer--;
            } else if (Math.random() < 0.005) {
              // Start phase
              mb.phaseInvulnTimer = 90; // 1.5 seconds invuln
              mb.phaseInvulnCooldown = 300; // 5 second cooldown after
              floatingTextsRef.current.push({
                x: mb.x + mb.width / 2,
                y: mb.y - 10,
                text: '',
                color: '#cc88ff',
                lifetime: 60,
                vy: -1
              });
            }
          }
          
          // Shield modifier - regenerate shield
          if (mb.modifierEffect === 'shield' && mb.modShield < mb.modShieldMax) {
            if (mb.modShieldRegenDelay > 0) {
              mb.modShieldRegenDelay--;
            } else {
              mb.modShield = Math.min(mb.modShieldMax, mb.modShield + 0.1);
            }
          }
          
          // Berserker attack cooldown decreases with health
          if (mb.attackPattern === 'berserk') {
            const healthPercent = mb.health / mb.maxHealth;
            mb.attackCooldown = Math.max(200, 800 - (1 - healthPercent) * 500);
            mb.speed = MINI_BOSS_TYPES.berserker.speed * (1 + (1 - healthPercent) * 0.8);
          }
          
          } // End of !mb.regenerating check
        }
        
        // Keep mini-boss on screen
        mb.y = Math.max(10, Math.min(GAME_HEIGHT - mb.height - 10, mb.y));
        mb.x = Math.max(GAME_WIDTH / 2, Math.min(GAME_WIDTH - mb.width - 10, mb.x));
      }

      // ========== SPACE CARRIER SYSTEM ==========
      // Spawn carrier randomly during waves (not during boss battles)
      const currentTime = Date.now();
      if (!carrierRef.current && !bossActiveRef.current && waveRef.current >= 3) {
        // Carrier spawn chance: every 30-60 seconds after wave 3
        const carrierCooldown = 30000 + Math.random() * 30000; // 30-60 seconds
        if (currentTime - lastCarrierSpawnRef.current > carrierCooldown) {
          // 25% chance to spawn carrier when cooldown is ready
          if (Math.random() < 0.25) {
            const carrierHeight = 200;
            const spawnY = 50 + Math.random() * (GAME_HEIGHT - carrierHeight - 100);
            
            carrierRef.current = {
              x: GAME_WIDTH + 100,
              y: spawnY,
              width: 400, // Gigantic carrier
              height: carrierHeight,
              speed: 1.5, // Slow, ominous movement
              dropsRemaining: 4 + Math.floor(waveRef.current / 3), // More drops at higher waves
              dropCooldown: 0,
              dropInterval: 90, // Frames between drops
              warningShown: false,
              phase: 0, // Animation phase
              engineGlow: 0
            };
            
            // Show warning
            floatingTextsRef.current.push({
              x: GAME_WIDTH / 2,
              y: 80,
              text: '',
              color: '#ff6600',
              lifetime: 180,
              vy: 0
            });
            soundSystem.playBossWarning();
          }
          lastCarrierSpawnRef.current = currentTime;
        }
      }
      
      // Update carrier
      if (carrierRef.current) {
        const carrier = carrierRef.current;
        carrier.phase += 0.05;
        carrier.engineGlow = Math.sin(carrier.phase) * 0.3 + 0.7;
        
        // Move carrier left across the screen
        carrier.x -= carrier.speed;
        
        // Slight vertical bob
        carrier.y += Math.sin(carrier.phase * 0.5) * 0.3;
        carrier.y = Math.max(30, Math.min(GAME_HEIGHT - carrier.height - 30, carrier.y));
        
        // Drop enemies as carrier passes
        if (carrier.dropsRemaining > 0 && carrier.dropCooldown <= 0) {
          // Only drop when carrier is on screen
          if (carrier.x < GAME_WIDTH - 50 && carrier.x > 100) {
            carrier.dropCooldown = carrier.dropInterval;
            carrier.dropsRemaining--;
            
            // Determine drop type - sometimes special elemental enemies
            const dropRoll = Math.random();
            const dropY = carrier.y + carrier.height / 2;
            const dropX = carrier.x + 50;
            
            if (dropRoll < 0.15) {
              // Fire enemy (15%) - shoots burning projectiles
              enemiesRef.current.push({
                x: dropX,
                y: dropY,
                type: 'fire',
                health: 4 + Math.floor(waveRef.current / 2),
                speed: ENEMY_SPEED * 0.7,
                points: 100,
                canShoot: true,
                lastShot: Date.now() + 500,
                width: ENEMY_WIDTH * 1.8,
                height: ENEMY_HEIGHT * 1.8,
                element: 'fire',
                burstCount: 3,
                burstCooldown: 0,
                fromCarrier: true
              });
            } else if (dropRoll < 0.30) {
              // Ice enemy (15%) - shoots freezing projectiles
              enemiesRef.current.push({
                x: dropX,
                y: dropY,
                type: 'ice',
                health: 3 + Math.floor(waveRef.current / 2),
                speed: ENEMY_SPEED * 0.6,
                points: 100,
                canShoot: true,
                lastShot: Date.now() + 500,
                width: ENEMY_WIDTH * 1.6,
                height: ENEMY_HEIGHT * 1.6,
                element: 'ice',
                freezeChance: 0.3,
                fromCarrier: true
              });
            } else if (dropRoll < 0.45) {
              // Heavy gunship (15%)
              enemiesRef.current.push({
                x: dropX,
                y: dropY,
                type: 'heavy',
                health: 5 + waveRef.current,
                speed: ENEMY_SPEED * 0.5,
                points: 75,
                canShoot: true,
                lastShot: Date.now() + 500,
                isCannon: true,
                width: ENEMY_WIDTH * 1.5,
                height: ENEMY_HEIGHT * 1.5,
                fromCarrier: true
              });
            } else if (dropRoll < 0.60) {
              // Bomber squad (15%) - 2 bombers
              for (let i = 0; i < 2; i++) {
                enemiesRef.current.push({
                  x: dropX + i * 30,
                  y: dropY + (i - 0.5) * 40,
                  type: 'bomber',
                  health: 2,
                  speed: ENEMY_SPEED * 1.8,
                  points: 35,
                  canShoot: false,
                  isBomber: true,
                  explosionRadius: 80,
                  pulsePhase: i * Math.PI,
                  fromCarrier: true
                });
              }
            } else if (dropRoll < 0.80) {
              // Fighter wing (20%) - 3 fast fighters
              for (let i = 0; i < 3; i++) {
                enemiesRef.current.push({
                  x: dropX + i * 25,
                  y: dropY + (i - 1) * 35,
                  type: 'fast',
                  health: 1,
                  speed: ENEMY_SPEED * 1.4,
                  points: 15,
                  canShoot: true,
                  lastShot: Date.now() + 300 + i * 200,
                  fromCarrier: true
                });
              }
            } else {
              // Standard enemies (20%) - 2-4 normal enemies
              const count = 2 + Math.floor(Math.random() * 3);
              for (let i = 0; i < count; i++) {
                enemiesRef.current.push({
                  x: dropX + i * 20,
                  y: dropY + (i - count / 2) * 30,
                  type: 'normal',
                  health: 1,
                  speed: ENEMY_SPEED,
                  points: 10,
                  canShoot: true,
                  lastShot: Date.now() + 400 + i * 150,
                  fromCarrier: true
                });
              }
            }
            
            // Drop effect
            createExplosion(dropX, dropY, 'small');
          }
        }
        
        if (carrier.dropCooldown > 0) {
          carrier.dropCooldown--;
        }
        
        // Remove carrier when it exits left side
        if (carrier.x < -carrier.width - 50) {
          carrierRef.current = null;
        }
      }

      
      // === MOVE ENEMY UPDATE HERE TO FIX EXECUTION ISSUE ===
      // Update enemies and their shooting
      // currentTime already declared above
      // Note: player variable already declared above at line 12014
      let hitPlayer = false;
      const timeWarpModifier = upgradesRef.current.timeWarp ? 0.3 : 1.0;
      
      // Basic enemy movement - move all enemies except special types that handle their own movement
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        try {
          const effectiveSpeed = (enemy.speed || ENEMY_SPEED) * timeWarpModifier;
          
          // Update spawn invulnerability timer for ALL enemies
          if (enemy.spawnInvulnerable && enemy.spawnInvulnerableTimer > 0) {
            enemy.spawnInvulnerableTimer--;
            if (enemy.spawnInvulnerableTimer <= 0) {
              enemy.spawnInvulnerable = false;
            }
          }
          
          // Types that handle their own movement in the main filter below
          const specialMovementTypes = ['turret', 'bomber', 'cloaked', 'shielded', 'spiral', 'wave', 'sniper', 
                                         'shielder', 'healer', 'teleporter', 'splitter', 'mine', 'flyby'];
          
          // Only apply basic movement to non-special types
          if (!specialMovementTypes.includes(enemy.type)) {
            if (enemy.fromBehind) {
              enemy.x += effectiveSpeed;
            } else {
              enemy.x -= effectiveSpeed;
            }
          }
          
          // Remove if off screen (only for types that were moved in this filter)
          const ew = enemy.width || ENEMY_WIDTH;
          if (!specialMovementTypes.includes(enemy.type)) {
            if (enemy.x > GAME_WIDTH + ew || enemy.x < -ew) {
              return false;
            }
          }
          
          return true;
        } catch (err) {
          console.error('Enemy update error:', err);
          return false;
        }
      });
      
      
      // SECOND FILTER: Special enemy behaviors and collision detection
      let collisionChecks = 0;
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        try {
        // Apply time warp slowdown
        const effectiveSpeed = (enemy.speed || ENEMY_SPEED) * timeWarpModifier;
        
        // Update frozen status (from GLACIER ship ability)
        if (enemy.frozen && enemy.frozenTimer > 0) {
          enemy.frozenTimer--;
          if (enemy.frozenTimer <= 0) {
            enemy.frozen = false;
            enemy.speed = enemy.originalSpeed || ENEMY_SPEED;
          }
          // Skip all movement while frozen
          return true;
        }
        
        // Special type behaviors (movement already handled in basic filter above)
        if (enemy.type === 'turret') {
          // Turret rotates to aim at player (no movement since it's stationary)
          const dx = player.x + PLAYER_WIDTH / 2 - (enemy.x + ENEMY_WIDTH / 2);
          const dy = player.y + PLAYER_HEIGHT / 2 - (enemy.y + ENEMY_HEIGHT / 2);
          const targetAngle = Math.atan2(dy, dx);
          // Smooth rotation
          let angleDiff = targetAngle - enemy.angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          enemy.angle += angleDiff * 0.05; // Rotation speed
        }
        
        // TODO: Copy all the rest of the special type behaviors from line 16400+ here
        
        // Check collision with player
        const ew = enemy.width || ENEMY_WIDTH;
        const eh = enemy.height || ENEMY_HEIGHT;
        const playerCenterX = player.x + PLAYER_WIDTH / 2;
        const playerCenterY = player.y + PLAYER_HEIGHT / 2;
        const enemyCenterX = enemy.x + ew / 2;
        const enemyCenterY = enemy.y + eh / 2;
        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collisionRadius = PLAYER_HITBOX_RADIUS + Math.min(ew, eh) / 3;
        
        collisionChecks++;
        if (playerInvincibleRef.current <= 0 && distance < collisionRadius) {
          createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, enemy.type === 'heavy' ? 'heavy' : 'normal', true);
          
          if (upgradesRef.current.shield && upgradesRef.current.shieldHits > 0) {
            upgradesRef.current.shieldHits--;
            upgradesRef.current.shieldRechargeTimer = 180;
            if (upgradesRef.current.shieldHits <= 0) {
              upgradesRef.current.shield = false;
            }
            createShieldImpact(enemy.x + ew / 2, enemy.y + eh / 2);
          } else {
            hitPlayer = true;
            createExplosion(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, 'large');
          }
          return false;
        }
        
        // Remove if off screen
        if (enemy.type === 'turret') {
          return true;
        } else if (enemy.fromBehind) {
          return enemy.x < GAME_WIDTH + ENEMY_WIDTH;
        } else {
          return enemy.x > -ENEMY_WIDTH;
        }
      } catch (error) {
        console.error('❌ ERROR in enemy collision update:', error);
        return true;
      }
    });
    
      
      // Check bullet-enemy collisions
      bulletsRef.current = bulletsRef.current.filter(bullet => {
        let bulletHit = false;
        const bulletW = bullet.isWaveCannon ? bullet.size : BULLET_WIDTH;
        const bulletH = bullet.isWaveCannon ? bullet.size : BULLET_HEIGHT;
        const bulletX = bullet.isWaveCannon ? bullet.x - bullet.size / 2 : bullet.x;
        const bulletY = bullet.isWaveCannon ? bullet.y - bullet.size / 2 : bullet.y;
        let damage = bullet.damage || 1;
        
        enemiesRef.current = enemiesRef.current.filter(enemy => {
          const ew = enemy.width || ENEMY_WIDTH;
          const eh = enemy.height || ENEMY_HEIGHT;
          
          // Simple AABB collision detection
          const collision = bulletX < enemy.x + ew &&
                          bulletX + bulletW > enemy.x &&
                          bulletY < enemy.y + eh &&
                          bulletY + bulletH > enemy.y;
          
          if (collision) {
            // Check spawn invulnerability
            if (enemy.spawnInvulnerable) {
              floatingTextsRef.current.push({
                x: enemy.x + ew / 2,
                y: enemy.y,
                text: '🛡️',
                color: '#00ffff',
                lifetime: 20,
                vy: -1
              });
              if (!bullet.isWaveCannon) bulletHit = true;
              return true; // Enemy survives
            }
            
            if (!bullet.isWaveCannon) bulletHit = true;
            
            // Apply damage
            enemy.health -= damage;
            
            createImpactParticles(bulletX, bulletY, '#ffaa00', 4);
            
            if (enemy.health > 0) {
              return true; // Enemy survives
            }
            
            // Enemy destroyed
            createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, 'normal', true);
            scoreRef.current += enemy.points || 10;
            setScore(scoreRef.current);
            waveKillsRef.current++;
            sessionStatsRef.current.kills++;
            
            console.log('[ENEMY KILL] Enemy destroyed. Roll for powerup...');
            // Power-up drop chance
            if (Math.random() < POWERUP_DROP_CHANCE) {
              console.log('[ENEMY KILL] Drop chance success! Spawning powerup.');
              spawnPowerup(enemy.x + ew / 2, enemy.y + eh / 2);
            } else {
              console.log('[ENEMY KILL] Drop chance failed (30% chance).');
            }
            return false; // Remove enemy
          }
          return true; // No hit
        });
        
        return !bulletHit; // Remove bullet if it hit
      });
      
      // Update boss
      if (bossRef.current) {
        const boss = bossRef.current;
        
        // Enter screen
        if (!boss.entered) {
          boss.x -= 2;
          if (boss.x <= GAME_WIDTH - boss.width - 30) {
            boss.entered = true;
          }
        } else {
          // Movement patterns
          boss.phaseTimer++;
          if (boss.phaseTimer > 120) {
            boss.phaseTimer = 0;
            boss.phase = (boss.phase + 1) % 3;
            boss.targetY = 50 + Math.random() * (GAME_HEIGHT - boss.height - 100);
          }
          
          // Move towards target
          if (boss.y < boss.targetY) boss.y += 2;
          if (boss.y > boss.targetY) boss.y -= 2;
          
          // Check player collision with boss
          const player = playerRef.current;
          const playerCenterX = player.x + PLAYER_WIDTH / 2;
          const playerCenterY = player.y + PLAYER_HEIGHT / 2;
          const bossCenterX = boss.x + boss.width / 2;
          const bossCenterY = boss.y + boss.height / 2;
          const dx = playerCenterX - bossCenterX;
          const dy = playerCenterY - bossCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const collisionRadius = PLAYER_HITBOX_RADIUS + Math.min(boss.width, boss.height) / 3;
          
          if (playerInvincibleRef.current <= 0 && distance < collisionRadius) {
            if (upgradesRef.current.shield && upgradesRef.current.shieldHits > 0) {
              upgradesRef.current.shieldHits--;
              upgradesRef.current.shieldRechargeTimer = 180;
              if (upgradesRef.current.shieldHits <= 0) {
                upgradesRef.current.shield = false;
              }
              createShieldImpact(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2);
            } else {
              // Player takes damage from boss collision
              soundSystem.playPlayerDestroy();
              createExplosion(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, 'large');
              const newLives = livesRef.current - 1;
              setLives(newLives);
              livesRef.current = newLives;
              playerInvincibleRef.current = 120;
              triggerGamepadVibration(0.7, 1.0, 300);
              
              if (newLives <= 0) {
                triggerGamepadVibration(1.0, 1.0, 500);
                handleGameOver();
              }
            }
          }
          
          // Boss shooting
          const currentTime = Date.now();
          
          // Update regen cooldown
          if (boss.regenCooldown > 0) {
            boss.regenCooldown--;
          }
          
          // Check if boss should enter regeneration phase
          if (!boss.regenerating && boss.regenCount < boss.maxRegens && boss.regenCooldown <= 0 &&
              boss.health <= boss.maxHealth * boss.regenThreshold && boss.health > 0) {
            // Enter regeneration phase
            boss.regenerating = true;
            boss.regenTimer = boss.regenDuration;
            boss.invincible = true;
            boss.regenEMPFired = false; // Reset EMP flag for this regen
            // Cancel any active laser
            boss.laserCharging = false;
            boss.laserFiring = false;
            // Play regen start sound
            soundSystem.playBossWarning();
            // Show floating text
            floatingTextsRef.current.push({
              x: boss.x + boss.width / 2,
              y: boss.y - 20,
              text: '',
              color: '#00ff00',
              lifetime: 120,
              vy: -0.5
            });
          }
          
          // Handle regeneration phase
          if (boss.regenerating) {
            boss.regenTimer--;
            
            // Regenerate health over time
            const regenAmount = (boss.maxHealth * 0.5) / boss.regenDuration; // Regen 50% of max health
            boss.health = Math.min(boss.maxHealth, boss.health + regenAmount);
            
            // Regenerate shields over time (restore to max)
            if (boss.maxShield > 0) {
              const shieldRegenAmount = boss.maxShield / boss.regenDuration;
              boss.shield = Math.min(boss.maxShield, (boss.shield || 0) + shieldRegenAmount);
            }
            
            // Fire massive EMP once at start of regen
            if (!boss.regenEMPFired && boss.regenTimer >= boss.regenDuration - 30) {
              boss.regenEMPFired = true;
              boss.empActive = true;
              boss.empRadius = 0;
              boss.lastEMP = Date.now();
              // Temporarily set massive EMP range for regen blast
              boss.regenEMPRange = GAME_WIDTH * 1.5; // Covers entire screen and beyond
              soundSystem.playBossWarning();
              // Warning text
              floatingTextsRef.current.push({
                x: boss.x + boss.width / 2,
                y: boss.y - 50,
                text: '',
                color: '#ff00ff',
                lifetime: 90,
                vy: -1
              });
              triggerScreenShake(20, 30);
            }
            
            // Handle regen EMP expansion
            if (boss.empActive && boss.regenEMPRange) {
              boss.empRadius += 15; // Fast expansion
              // Disable player weapons/shields if in range
              const playerCenterX = playerRef.current.x + PLAYER_WIDTH / 2;
              const playerCenterY = playerRef.current.y + PLAYER_HEIGHT / 2;
              const bossCenterX = boss.x + boss.width / 2;
              const bossCenterY = boss.y + boss.height / 2;
              const distToPlayer = Math.sqrt((playerCenterX - bossCenterX) ** 2 + (playerCenterY - bossCenterY) ** 2);
              
              // Disable shield when EMP wave passes player
              if (Math.abs(distToPlayer - boss.empRadius) < 30 && upgradesRef.current.shield) {
                upgradesRef.current.shield = false;
                upgradesRef.current.shieldHits = 0;
                floatingTextsRef.current.push({
                  x: playerCenterX,
                  y: playerCenterY - 20,
                  text: '',
                  color: '#ff6600',
                  lifetime: 90,
                  vy: -1
                });
              }
              
              if (boss.empRadius >= boss.regenEMPRange) {
                boss.empActive = false;
                boss.empRadius = 0;
                boss.regenEMPRange = null; // Reset to normal EMP range
              }
            }
            
            // Spawn enemies during regen (snipers, sentinels, mini-bosses)
            if (boss.regenTimer % 90 === 0) { // Every 1.5 seconds
              const spawnType = Math.random();
              const spawnY = 50 + Math.random() * (GAME_HEIGHT - 100);
              
              if (spawnType < 0.15 && !miniBossRef.current) {
                // Spawn mini-boss (15% chance if none active)
                spawnMiniBoss();
              } else if (spawnType < 0.45) {
                // Spawn sniper (30% chance)
                enemiesRef.current.push({
                  x: GAME_WIDTH + 20,
                  y: spawnY,
                  type: 'sniper',
                  health: 2 + Math.floor(waveRef.current / 3),
                  speed: ENEMY_SPEED * 0.4,
                  points: 80,
                  canShoot: true,
                  lastShot: Date.now(),
                  targeting: false,
                  targetTimer: 0,
                  lockedAngle: 0,
                  aimTime: Math.max(30, 60 - waveRef.current * 2),
                  polarity: Math.random() > 0.5 ? 'light' : 'dark',
                  spawnedByBoss: true
                });
              } else if (spawnType < 0.75) {
                // Spawn turret/sentinel (30% chance)
                enemiesRef.current.push({
                  x: GAME_WIDTH + 20,
                  y: spawnY,
                  type: 'turret',
                  health: 3,
                  speed: ENEMY_SPEED * 0.3,
                  points: 50,
                  canShoot: true,
                  lastShot: Date.now(),
                  angle: Math.PI,
                  rotateSpeed: 0.03,
                  polarity: Math.random() > 0.5 ? 'light' : 'dark',
                  spawnedByBoss: true
                });
              } else {
                // Spawn heavy (25% chance)
                enemiesRef.current.push({
                  x: GAME_WIDTH + 20,
                  y: spawnY,
                  type: 'heavy',
                  health: 5 + waveRef.current,
                  speed: ENEMY_SPEED * 0.5,
                  points: 100,
                  canShoot: true,
                  lastShot: Date.now(),
                  isCannon: true,
                  width: ENEMY_WIDTH * 1.5,
                  height: ENEMY_HEIGHT * 1.5,
                  polarity: Math.random() > 0.5 ? 'light' : 'dark',
                  spawnedByBoss: true
                });
              }
            }
            
            // Spawn shielder support ship at start of regen
            if (boss.regenTimer === boss.regenDuration - 30) {
              const shielderY = 50 + Math.random() * (GAME_HEIGHT - 100);
              enemiesRef.current.push({
                x: GAME_WIDTH + 20,
                y: shielderY,
                type: 'shielder',
                health: 3,
                speed: ENEMY_SPEED * 0.5,
                points: 100,
                canShoot: false,
                cloaked: true,
                cloakAlpha: 0.15,
                revealTimer: 0,
                shieldRange: 150,
                shieldCooldown: 0,
                shieldInterval: 180,
                shieldPulse: 0,
                shieldedTargets: [],
                spawnedByBoss: true,
                spawnInvulnerable: true,
                spawnInvulnerableTimer: 300
              });
              floatingTextsRef.current.push({
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height + 20,
                text: '',
                color: '#00ffff',
                lifetime: 60,
                vy: 1
              });
            }
            
            // End regeneration
            if (boss.regenTimer <= 0) {
              boss.regenerating = false;
              boss.invincible = false;
              boss.regenCount++; // Increment regen count (max 3 allowed)
              boss.regenCooldown = boss.regenCooldownMax;
              // Show floating text
              const regensLeft = boss.maxRegens - boss.regenCount;
              floatingTextsRef.current.push({
                x: boss.x + boss.width / 2,
                y: boss.y - 20,
                text: 'FINAL REGEN COMPLETE!',
                color: '#ff4400',
                lifetime: 90,
                vy: -1
              });
            }
            
            // ========== CANNON BARRAGE DURING REGENERATION ==========
            // Fire groups of vertical cannon balls while regenerating
            if (!boss.lastCannonBarrage) boss.lastCannonBarrage = 0;
            const cannonBarrageRate = boss.isSuperBoss ? 600 : (boss.isMegaBoss ? 800 : 1000); // ms between barrages
            
            if (currentTime - boss.lastCannonBarrage > cannonBarrageRate) {
              boss.lastCannonBarrage = currentTime;
              
              // Randomly choose 3, 4, or 6 cannon balls in a vertical line
              const cannonCount = [3, 4, 6][Math.floor(Math.random() * 3)];
              // Super boss can sometimes fire 8
              const finalCount = boss.isSuperBoss && Math.random() > 0.7 ? 8 : cannonCount;
              
              // Spawn position - from boss front
              const spawnX = boss.x + 20;
              const centerY = boss.y + boss.height / 2;
              const spacing = boss.isSuperBoss ? 30 : 25; // Vertical spacing between cannon balls
              
              // Calculate starting Y to center the group
              const startY = centerY - ((finalCount - 1) * spacing) / 2;
              
              // Fire cannon balls in a vertical line - they travel straight left
              const cannonSpeed = boss.isSuperBoss ? 6 : (boss.isMegaBoss ? 5 : 4);
              
              for (let i = 0; i < finalCount; i++) {
                const y = startY + i * spacing;
                // Add slight delay effect by staggering x positions
                const xOffset = Math.sin(i * 0.5) * 5;
                
                enemyBulletsRef.current.push({
                  x: spawnX + xOffset,
                  y: y,
                  vx: -cannonSpeed, // Travel straight left
                  vy: 0, // No vertical movement
                  aimed: true,
                  isCannon: true,
                  isRegenCannon: true, // Mark as regen cannon for special visuals
                  cannonSize: boss.isSuperBoss ? 1.5 : 1.2 // Larger cannon balls
                });
              }
              
              // Muzzle flash effect at spawn point
              createExplosion(spawnX, centerY, 'small');
              
              // Play cannon sound
              soundSystem.playEnemyShoot();
            }
          }
          
          // Skip offensive attacks during regeneration (but still move)
          const isRegenerating = boss.regenerating;
          
          // Mega boss laser attack - disabled during regen
          if (boss.isMegaBoss && !isRegenerating) {
            // Laser cycle: charge -> fire -> cooldown
            const laserCooldown = boss.isSuperBoss ? 4000 : 5000;
            if (!boss.laserCharging && !boss.laserFiring && currentTime - boss.lastLaser > laserCooldown) {
              // Start charging laser
              boss.laserCharging = true;
              boss.laserCharge = 0;
            }
            
            if (boss.laserCharging) {
              boss.laserCharge += boss.isSuperBoss ? 3 : 2; // Super boss charges faster
              if (boss.laserCharge >= 100) {
                // Fire the laser!
                boss.laserCharging = false;
                boss.laserFiring = true;
                boss.laserDuration = boss.isSuperBoss ? 90 : 60; // Super boss laser lasts longer
                // Play boss laser blast sound
                try {
                  const bossLaserSound = new Audio('/boss-lasser-blast.mp3');
                  bossLaserSound.volume = 0.5;
                  bossLaserSound.play().catch(() => {});
                } catch (e) {}
              }
            }
            
            if (boss.laserFiring) {
              boss.laserDuration--;
              
              // Laser damages player
              const player = playerRef.current;
              const laserY = boss.y + boss.height / 2;
              const laserHeight = boss.laserSize || 30;
              
              if (player.x < boss.x && 
                  player.y + PLAYER_HEIGHT > laserY - laserHeight / 2 && 
                  player.y < laserY + laserHeight / 2 &&
                  playerInvincibleRef.current <= 0) {
                // Player hit by laser!
                if (upgradesRef.current.shield && upgradesRef.current.shieldHits > 0) {
                  upgradesRef.current.shieldHits--;
                  upgradesRef.current.shieldRechargeTimer = 180;
                  if (upgradesRef.current.shieldHits <= 0) {
                    upgradesRef.current.shield = false;
                  }
                  createShieldImpact(player.x, laserY);
                  playerInvincibleRef.current = 60;
                } else {
                  soundSystem.playPlayerDestroy();
                  createExplosion(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, 'large');
                  const newLives = livesRef.current - 1;
                  setLives(newLives);
                  livesRef.current = newLives;
                  playerInvincibleRef.current = 120;
                  
                  if (newLives <= 0) {
                    handleGameOver();
                  }
                }
              }
              
              if (boss.laserDuration <= 0) {
                boss.laserFiring = false;
                boss.lastLaser = currentTime;
              }
            }
          }
          
          // Normal shooting (spread pattern) - reduced during regen
          if (!boss.laserCharging && !boss.laserFiring && !isRegenerating && currentTime - boss.lastShot > boss.fireRate) {
            // Boss becomes vulnerable once it starts shooting
            if (boss.invincible && !boss.regenerating) {
              boss.invincible = false;
            }
            // Fire multiple bullets in a spread
            const spreadCount = boss.isSuperBoss ? 7 : (boss.isMegaBoss ? 5 : 3);
            for (let i = -(spreadCount - 1) / 2; i <= (spreadCount - 1) / 2; i++) {
              enemyBulletsRef.current.push({
                x: boss.x,
                y: boss.y + boss.height / 2 + i * (boss.isSuperBoss ? 30 : (boss.isMegaBoss ? 25 : 20)),
                vx: -6,  // Move left toward player
                vy: 0,
                aimed: true,
                isBossShot: true
              });
            }
            boss.lastShot = currentTime;
            console.log('[BOSS SHOOT] Fired', spreadCount, 'bullets. Boss:', boss.type, 'FireRate:', boss.fireRate);
          }
          
          // Mega boss cannons - fire large aimed shots from wing weapons (reduced during regen)
          if (boss.isMegaBoss && !boss.laserFiring && !isRegenerating && currentTime - boss.lastCannonShot > boss.cannonFireRate) {
            const player = playerRef.current;
            // Cannon positions on the wings
            const cannonPositions = boss.isSuperBoss 
              ? [
                  { x: boss.x + boss.width * 0.35, y: boss.y - 35 },
                  { x: boss.x + boss.width * 0.35, y: boss.y + boss.height + 35 },
                  { x: boss.x + boss.width * 0.55, y: boss.y - 25 },
                  { x: boss.x + boss.width * 0.55, y: boss.y + boss.height + 25 }
                ]
              : [
                  { x: boss.x + boss.width * 0.4, y: boss.y - 30 },
                  { x: boss.x + boss.width * 0.4, y: boss.y + boss.height + 30 }
                ];
            
            cannonPositions.forEach(cannon => {
              const dx = player.x + PLAYER_WIDTH / 2 - cannon.x;
              const dy = player.y + PLAYER_HEIGHT / 2 - cannon.y;
              const angle = Math.atan2(dy, dx);
              const speed = 5;
              enemyBulletsRef.current.push({
                x: cannon.x,
                y: cannon.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                aimed: true,
                isCannon: true // Mark as cannon shot for larger visuals
              });
            });
            boss.lastCannonShot = currentTime;
            
            // Create muzzle flash effect
            cannonPositions.forEach(cannon => {
              createExplosion(cannon.x, cannon.y, 'small');
            });
          }
          
          // Super boss secondary guns - fire aimed shots from wing turrets (disabled during regen)
          if (boss.isSuperBoss && !isRegenerating && currentTime - boss.lastSecondaryShot > boss.secondaryFireRate) {
            const player = playerRef.current;
            const gunPositions = [
              { x: boss.x + boss.width * 0.3, y: boss.y - 40 },
              { x: boss.x + boss.width * 0.3, y: boss.y + boss.height + 40 },
              { x: boss.x + boss.width * 0.5, y: boss.y - 30 },
              { x: boss.x + boss.width * 0.5, y: boss.y + boss.height + 30 }
            ];
            
            gunPositions.forEach(gun => {
              const dx = player.x + PLAYER_WIDTH / 2 - gun.x;
              const dy = player.y + PLAYER_HEIGHT / 2 - gun.y;
              const angle = Math.atan2(dy, dx);
              const speed = 4;
              enemyBulletsRef.current.push({
                x: gun.x,
                y: gun.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                aimed: true
              });
            });
            boss.lastSecondaryShot = currentTime;
          }
          
          // Super boss shield regeneration (slow)
          if (boss.isSuperBoss && boss.shield < boss.maxShield) {
            if (boss.shieldRegenDelay > 0) {
              boss.shieldRegenDelay--;
            } else {
              boss.shield = Math.min(boss.maxShield, boss.shield + 0.1);
            }
          }
          
          // Mega/Super boss shield regeneration
          if (boss.isMegaBoss && !boss.isSuperBoss && boss.shield < boss.maxShield) {
            if (boss.shieldRegenDelay > 0) {
              boss.shieldRegenDelay--;
            } else {
              boss.shield = Math.min(boss.maxShield, boss.shield + 0.05); // Slower regen for mega boss
            }
          }
          
          // EMP (Electromagnetic Pulse) attack for mega/super boss (disabled during regen)
          if (boss.isMegaBoss && boss.entered && !isRegenerating) {
            // Start charging EMP
            if (!boss.empCharging && !boss.empActive && currentTime - boss.lastEMP > boss.empCooldown) {
              boss.empCharging = true;
              boss.empCharge = 0;
            }
            
            // Charge up the EMP
            if (boss.empCharging) {
              boss.empCharge += 2;
              if (boss.empCharge >= 100) {
                boss.empCharging = false;
                boss.empActive = true;
                boss.empRadius = 0;
              }
            }
            
            // EMP shockwave expanding
            if (boss.empActive) {
              boss.empRadius += 15; // Expand shockwave
              
              // Check if force pod is in range
              if (forceRef.current && forceRef.current.active) {
                const force = forceRef.current;
                const dx = force.x - (boss.x + boss.width / 2);
                const dy = force.y - (boss.y + boss.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If force is within the expanding ring (with some tolerance)
                if (Math.abs(distance - boss.empRadius) < 30) {
                  // Destroy the force pod!
                  createExplosion(force.x, force.y, 'large');
                  forceRef.current = null;
                  floatingTextsRef.current.push({
                    x: force.x,
                    y: force.y,
                    text: '',
                    color: '#ff0000',
                    life: 90
                  });
                }
              }
              
              // Check if player is in range - disable shields
              const player = playerRef.current;
              const px = player.x + PLAYER_WIDTH / 2;
              const py = player.y + PLAYER_HEIGHT / 2;
              const playerDx = px - (boss.x + boss.width / 2);
              const playerDy = py - (boss.y + boss.height / 2);
              const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
              
              if (Math.abs(playerDistance - boss.empRadius) < 30 && upgradesRef.current.shield) {
                // Disable player shield!
                upgradesRef.current.shield = false;
                upgradesRef.current.shieldHits = 0;
                floatingTextsRef.current.push({
                  x: px,
                  y: py - 20,
                  text: '',
                  color: '#ff6600',
                  life: 90
                });
              }
              
              // EMP finished expanding
              if (boss.empRadius >= boss.empRange) {
                boss.empActive = false;
                boss.lastEMP = currentTime;
              }
            }
          }
          
          // Boss spawns enemy ships
          // Count current boss-spawned enemies
          const bossEnemyCount = enemiesRef.current.filter(e => e.spawnedByBoss).length;
          
          if (bossEnemyCount < boss.maxSpawnedEnemies && 
              currentTime - boss.lastSpawn > boss.spawnRate) {
            
            // Spawn enemy from boss position
            const spawnY = boss.y + boss.height / 2 + (Math.random() - 0.5) * boss.height * 0.6;
            const enemyType = boss.isMegaBoss && Math.random() > 0.6 ? 'fast' : 'normal';
            
            const newEnemy = {
              x: boss.x - 20,
              y: spawnY,
              type: enemyType,
              health: 1,
              lastShot: currentTime + 500 + Math.random() * 500,
              fromBehind: false,
              spawnedByBoss: true, // Track that this was spawned by boss
              speed: enemyType === 'fast' ? ENEMY_SPEED * 1.5 : ENEMY_SPEED,
              points: enemyType === 'fast' ? 20 : 10,
              canShoot: enemyType !== 'fast'
            };
            
            enemiesRef.current.push(newEnemy);
            boss.lastSpawn = currentTime;
            
            // Visual effect for spawn
            createExplosion(boss.x - 10, spawnY, 'small');
          }
        }
        
        // Check mini-boss collision with player bullets
        if (miniBossRef.current) {
          const mb = miniBossRef.current;
          bulletsRef.current = bulletsRef.current.filter(bullet => {
            const bulletW = bullet.isWaveCannon ? bullet.size : BULLET_WIDTH;
            const bulletH = bullet.isWaveCannon ? bullet.size : BULLET_HEIGHT;
            const bulletX = bullet.isWaveCannon ? bullet.x - bullet.size / 2 : bullet.x;
            const bulletY = bullet.isWaveCannon ? bullet.y - bullet.size / 2 : bullet.y;
            
            if (checkCollision(
              { x: bulletX, y: bulletY, width: bulletW, height: bulletH },
              { x: mb.x, y: mb.y, width: mb.width, height: mb.height }
            )) {
              const damage = bullet.damage || 1;
              
              // During regeneration, shield absorbs damage first
              if (mb.regenerating && mb.regenShield > 0) {
                mb.regenShield -= damage;
                createExplosion(bullet.x, bullet.y, 'small');
                // Show shield hit effect
                floatingTextsRef.current.push({
                  x: bullet.x,
                  y: bullet.y,
                  text: '',
                  color: '#00ffff',
                  lifetime: 20,
                  vy: -1
                });
                if (mb.regenShield <= 0) {
                  mb.regenShield = 0;
                  // Shield broken - end regen early
                  mb.regenerating = false;
                  mb.hasRegenerated = true;
                  floatingTextsRef.current.push({
                    x: mb.x + mb.width / 2,
                    y: mb.y - 20,
                    text: '',
                    color: '#ff0000',
                    lifetime: 60,
                    vy: -1
                  });
                }
                return false;
              }
              
              // === MODIFIER DAMAGE HANDLING ===
              // Phasing modifier - invulnerable during phase
              if (mb.modifierEffect === 'phase' && mb.phaseInvulnTimer > 0) {
                floatingTextsRef.current.push({
                  x: bullet.x,
                  y: bullet.y,
                  text: '',
                  color: '#cc88ff',
                  lifetime: 15,
                  vy: -1
                });
                return false;
              }
              
              // Shield modifier - absorb damage with shield first
              if (mb.modifierEffect === 'shield' && mb.modShield > 0) {
                mb.modShield -= damage;
                mb.modShieldRegenDelay = 180; // 3 second regen delay
                floatingTextsRef.current.push({
                  x: bullet.x,
                  y: bullet.y,
                  text: '',
                  color: '#00aaff',
                  lifetime: 15,
                  vy: -1
                });
                if (mb.modShield <= 0) {
                  mb.modShield = 0;
                  floatingTextsRef.current.push({
                    x: mb.x + mb.width / 2,
                    y: mb.y - 15,
                    text: '',
                    color: '#ff6600',
                    lifetime: 45,
                    vy: -1
                  });
                }
                createExplosion(bullet.x, bullet.y, 'small');
                return false;
              }
              
              // Armor modifier - reduce damage taken
              let finalDamage = damage;
              if (mb.modifierEffect === 'armor' && mb.armorReduction > 0) {
                finalDamage = damage * (1 - mb.armorReduction);
                // Show armor reduction occasionally
                if (Math.random() < 0.3) {
                  floatingTextsRef.current.push({
                    x: bullet.x,
                    y: bullet.y,
                    text: '',
                    color: '#aaaaaa',
                    lifetime: 20,
                    vy: -1
                  });
                }
              }
              
              mb.health -= finalDamage;
              createExplosion(bullet.x, bullet.y, 'small');
              
              if (mb.health <= 0) {
                // Mini-boss defeated!
                createExplosion(mb.x + mb.width / 2, mb.y + mb.height / 2, 'large', true);
                createExplosion(mb.x + mb.width / 4, mb.y + mb.height / 2, 'normal');
                createExplosion(mb.x + mb.width * 3/4, mb.y + mb.height / 2, 'normal');
                
                // Destroy any spawned drones
                enemiesRef.current = enemiesRef.current.filter(e => {
                  if (e.spawnedByMiniBoss) {
                    createExplosion(e.x + (e.width || ENEMY_WIDTH) / 2, e.y + (e.height || ENEMY_HEIGHT) / 2, 'small', true);
                    return false;
                  }
                  return true;
                });
                
                // Score with multiplier
                scoreMultiplierRef.current = Math.min(MULTIPLIER_MAX, scoreMultiplierRef.current + 0.5);
                multiplierDecayTimerRef.current = MULTIPLIER_DECAY_DELAY;
                const totalScore = Math.floor(mb.points * scoreMultiplierRef.current);
                const newScore = scoreRef.current + totalScore;
                setScore(newScore);
                scoreRef.current = newScore;
                
                // Show victory text
                formationBonusDisplayRef.current.push({
                  x: mb.x + mb.width / 2,
                  y: mb.y,
                  text: `${mb.name} DESTROYED +${totalScore}`,
                  color: '#ffff00',
                  lifetime: 90,
                  vy: -2
                });
                
                // Drop power-up
                spawnPowerup(mb.x + mb.width / 2, mb.y + mb.height / 2);
                
                miniBossRef.current = null;
              }
              return false; // Remove bullet
            }
            return true; // Keep bullet
          });
        }
        
        // Check super boss collision with player bullets
        if (bossRef.current) {
          const boss = bossRef.current;
          bulletsRef.current = bulletsRef.current.filter(bullet => {
            const bulletW = bullet.isWaveCannon ? bullet.size : BULLET_WIDTH;
            const bulletH = bullet.isWaveCannon ? bullet.size : BULLET_HEIGHT;
            const bulletX = bullet.isWaveCannon ? bullet.x - bullet.size / 2 : bullet.x;
            const bulletY = bullet.isWaveCannon ? bullet.y - bullet.size / 2 : bullet.y;
            
            if (checkCollision(
              { x: bulletX, y: bulletY, width: bulletW, height: bulletH },
              { x: boss.x, y: boss.y, width: boss.width, height: boss.height }
            )) {
              const damage = bullet.damage || 1;
            
            // Super boss shield absorbs damage first
            if (boss.shield && boss.shield > 0) {
              boss.shield -= damage;
              boss.shieldRegenDelay = 180; // 3 seconds before regen
              createExplosion(bullet.x, bullet.y, 'small');
              // Shield hit effect - cyan sparks
              for (let i = 0; i < 3; i++) {
                floatingTextsRef.current.push({
                  x: bullet.x + (Math.random() - 0.5) * 20,
                  y: bullet.y + (Math.random() - 0.5) * 20,
                  text: '',
                  color: '#00ffff',
                  lifetime: 20,
                  vy: -1 - Math.random()
                });
              }
            } else {
              boss.health -= damage;
              createExplosion(bullet.x, bullet.y, 'small');
            }
            
            if (boss.health <= 0) {
              // Boss defeated! MASSIVE explosion
              sessionStatsRef.current.bosses++;
              createExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, 'boss', true);
              // Additional explosions for epic effect
              createExplosion(boss.x + boss.width / 4, boss.y + boss.height / 4, 'large');
              createExplosion(boss.x + boss.width * 3/4, boss.y + boss.height * 3/4, 'large');
              createExplosion(boss.x + boss.width / 2, boss.y, 'large');
              createExplosion(boss.x + boss.width / 2, boss.y + boss.height, 'large');
              
              // Destroy all boss-spawned enemies
              enemiesRef.current.forEach(enemy => {
                if (enemy.spawnedByBoss) {
                  const ew = enemy.width || ENEMY_WIDTH;
                  const eh = enemy.height || ENEMY_HEIGHT;
                  createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, 'normal', true);
                }
              });
              enemiesRef.current = enemiesRef.current.filter(e => !e.spawnedByBoss);
              
              // Boss kill gives big multiplier boost
              scoreMultiplierRef.current = Math.min(MULTIPLIER_MAX, scoreMultiplierRef.current + 1.0);
              multiplierDecayTimerRef.current = MULTIPLIER_DECAY_DELAY * 2;
              const newScore = scoreRef.current + Math.floor(boss.points * scoreMultiplierRef.current);
              setScore(newScore);
              scoreRef.current = newScore;
              
              // Check for checkpoint (after waves 5, 10, 15, etc.) BEFORE incrementing
              const completedWave = waveRef.current;
              const isCheckpointWave = completedWave % 5 === 0 && completedWave > 0;
              // Victory condition depends on game mode
              const mode = gameModeRef.current;
              let isVictoryWave = false;
              if (mode === 'campaign') {
                isVictoryWave = completedWave === 20; // Campaign ends at wave 20
              } else if (mode === 'timeAttack') {
                isVictoryWave = completedWave === 10; // Time Attack ends at wave 10
              } else if (mode === 'bossRush') {
                isVictoryWave = completedWave === 20; // Boss Rush ends at wave 20
              }
              // Survival mode never ends - infinite waves!
              
              // Store boss data for transition if checkpoint
              const defeatedBoss = { ...boss };
              
              // Next wave
              bossRef.current = null;
              bossActiveRef.current = false;
              setBossActive(false);
              miniBossSpawnedRef.current = false; // Reset for next wave
              
              // Check for victory (wave 20 completed)
              if (isVictoryWave) {
                // Stop all music
                if (gameMusicRef.current) {
                  gameMusicRef.current.pause();
                  gameMusicRef.current = null;
                }
                if (bossSpawnSoundRef.current) {
                  bossSpawnSoundRef.current.pause();
                  bossSpawnSoundRef.current = null;
                }
                // Initialize victory sequence
                victoryRef.current = {
                  active: true,
                  phase: 'explosion',
                  timer: 0,
                  scrollY: 0,
                  storyIndex: 0,
                  fadeAlpha: 0,
                  bossX: defeatedBoss.x + defeatedBoss.width / 2,
                  bossY: defeatedBoss.y + defeatedBoss.height / 2,
                  finalScore: newScore
                };
                triggerScreenShake(30, 60);
                enemiesRef.current = [];
                enemyBulletsRef.current = [];
                playerInvincibleRef.current = 9999;
                return true;
              }
              
              waveRef.current++;
              setWave(waveRef.current);
              waveKillsRef.current = 0;
              waveKillsNeededRef.current = 10 + (waveRef.current * 5);
              waveStartTimeRef.current = timestamp; // Use consistent timestamp source
              graceWarningShownRef.current = false; // Reset warning flag
              console.log('[WAVE COMPLETE] Starting wave', waveRef.current);
              
              // Drop force pod if player doesn't have one
              if (!forceRef.current) {
                spawnPowerup(defeatedBoss.x + defeatedBoss.width / 2, defeatedBoss.y + defeatedBoss.height / 2);
              }
              
              if (isCheckpointWave) {
                // Start smooth checkpoint transition with boss explosion sequence
                startCheckpointTransition(defeatedBoss, completedWave);
              } else {
                // Play level complete sound for regular wave completions
                try {
                  const levelCompleteSound = new Audio(asset('mixkit-completion-of-a-level-2063.wav'));
                  levelCompleteSound.volume = 0.5;
                  levelCompleteSound.play().catch(() => {});
                } catch (e) {}
                // Resume normal gameplay music
                resumeGameplayMusic();
                // Trigger wave intro fade effect
                levelFadeRef.current = { 
                  active: true, 
                  fadeIn: true, 
                  alpha: 0.8, 
                  showText: waveRef.current
                };
              }
            }
            return false; // Remove bullet that hit boss
          }
          return true; // Keep bullet that didn't hit
        });
      }

      // Update power-ups
      console.log('[DEBUG] Reached power-up update section. Player exists:', !!player, 'Powerups:', powerupsRef.current.length, 'Boss active:', bossActiveRef.current, 'Checkpoint:', checkpointTransitionRef.current.active);
      // Note: player variable already declared at line 12014
      
      // Clean up any invalid powerups first
      const beforeCount = powerupsRef.current.length;
      powerupsRef.current = powerupsRef.current.filter(p => isFinite(p.x) && isFinite(p.y) && p.type);
      const afterCount = powerupsRef.current.length;
      if (beforeCount !== afterCount) {
        console.log('[POWERUP CLEANUP] Removed', beforeCount - afterCount, 'invalid powerups');
      }
      
      // Debug: Check player and powerup state
      if (powerupsRef.current.length > 0) {
        console.log('[POWERUP UPDATE] Player:', {x: player?.x, y: player?.y, valid: !!(player && player.x)}, 'Powerups:', powerupsRef.current.length);
      }
      
      let powerupProcessCount = 0;
      powerupsRef.current = powerupsRef.current.filter(powerup => {
        powerupProcessCount++;
        // Remove invalid power-ups
        if (!isFinite(powerup.x) || !isFinite(powerup.y)) {
          console.log('[POWERUP] Removing invalid powerup:', powerup);
          return false;
        }
        
        // Guard against undefined player first
        if (!player || !isFinite(player.x) || !isFinite(player.y)) {
          console.warn('[POWERUP] Player position invalid:', player);
          return true; // Keep powerup, don't remove it
        }
        
        // Always apply strong attraction toward player to make pickup easier
        const pullDx = player.x + PLAYER_WIDTH / 2 - powerup.x;
        const pullDy = player.y + PLAYER_HEIGHT / 2 - powerup.y;
        const pullDist = Math.sqrt(pullDx * pullDx + pullDy * pullDy);
        
        if (pullDist < 600 && pullDist > 1) { // Pull from up to 600px away
          const pullStrength = upgradesRef.current.magnet && upgradesRef.current.magnetTimer > 0 
            ? 12 * (1 - pullDist / 400)  // Very strong magnet pull
            : 6 * (1 - pullDist / 600);  // Strong natural pull
          powerup.x += (pullDx / pullDist) * pullStrength;
          powerup.y += (pullDy / pullDist) * pullStrength;
        } else {
          // Apply natural drift velocity when not being pulled
          powerup.x += (powerup.vx || -1.5);
          powerup.y += (powerup.vy || 0);
        }
        
        powerup.bobOffset = (powerup.bobOffset || 0) + 0.1;
        powerup.rotation = (powerup.rotation || 0) + 0.05; // Spin effect
        
        // Circular collision detection (center to center distance)
        // Use actual powerup position, not bobY which is visual only
        const playerCenterX = player.x + PLAYER_WIDTH / 2;
        const playerCenterY = player.y + PLAYER_HEIGHT / 2;
        const powerupCenterX = powerup.x + POWERUP_SIZE / 2;
        const powerupCenterY = powerup.y + POWERUP_SIZE / 2;
        
        const dx = playerCenterX - powerupCenterX;
        const dy = playerCenterY - powerupCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const pickupRadius = (PLAYER_WIDTH / 2) + (POWERUP_SIZE / 2) + 20; // Extra 20px for easier pickup
        
        const collisionCheck = distance < pickupRadius;
        
        // Debug logging for collision detection
        if (powerupsRef.current.length > 0 && powerupsRef.current.indexOf(powerup) === 0) {
          console.log('[COLLISION] Distance:', distance.toFixed(1), 'Required:', pickupRadius, 'Hit:', collisionCheck);
        }
        
        if (collisionCheck) {
          console.log('[POWERUP PICKED UP]', powerup.type);
          const config = POWERUP_TYPES[powerup.type];
          if (!config) {
            console.warn('[POWERUP] Invalid config for type:', powerup.type);
            return false; // Remove invalid power-ups
          }
          
          // Play power-up sound based on rarity
          try {
            soundSystem.playPowerup(config.rarity);
          } catch (e) {
            console.warn('[POWERUP] Sound error:', e);
          }
          
          // Create enhanced pickup effect based on rarity
          try {
            createPickupEffect(
              powerup.x + POWERUP_SIZE / 2,
              powerup.y + POWERUP_SIZE / 2,
              config.color,
              config.name,
              config.rarity
            );
          } catch (e) {
            console.warn('[POWERUP] Effect error:', e);
          }
          
          // Track powerup collection for achievements
          sessionStatsRef.current.powerups++;
          
          console.log('[POWERUP] Applying effect for', powerup.type);
          
          // Apply power-up
          switch (powerup.type) {
            case 'RAPID_FIRE': {
              // Add to weapon level XP
              upgradesRef.current.rapidFire = Math.min(3, upgradesRef.current.rapidFire + 1);
              const weapon = weaponLevelRef.current;
              weapon.xp += WEAPON_XP_PER_POWERUP;
              
              // Check for level up
              if (weapon.xp >= weapon.maxXP && weapon.level < 5) {
                weapon.level++;
                weapon.xp = 0;
                weapon.maxXP = 100 + (weapon.level - 1) * 25; // Increases each level
                weapon.levelUpTimer = 90; // 1.5 second display
                
                // Level up effects
                const levelData = WEAPON_LEVELS[weapon.level];
                floatingTextsRef.current.push({
                  x: playerRef.current.x + PLAYER_WIDTH / 2,
                  y: playerRef.current.y - 40,
                  text: '#ffffff',
                  timer: 60,
                  vy: -1
                });
                soundSystem.playWeaponLevelUp(weapon.level);
                triggerScreenShake(6, 12);
              }
              break;
            }
            case 'MISSILES':
              upgradesRef.current.missiles = true;
              break;
            case 'SHIELD':
              upgradesRef.current.shield = true;
              // Stack shields up to max
              upgradesRef.current.shieldHits = Math.min(upgradesRef.current.shieldMaxHits, upgradesRef.current.shieldHits + 3);
              // Reset hex segments on new shield pickup
              shieldEffectsRef.current.hexSegments = [1, 1, 1, 1, 1, 1];
              shieldEffectsRef.current.pulseIntensity = 0.8; // Flash on pickup
              // Play shield activation sound
              const shieldSound = new Audio(asset('710278__dan2008__charged-up.mp3'));
              shieldSound.volume = 0.5;
              shieldSound.play().catch(() => {});
              break;
            case 'FORCE':
              if (!forceRef.current || !forceRef.current.active) {
                forceRef.current = {
                  x: player.x + PLAYER_WIDTH + FORCE_SIZE / 2 + 5,
                  y: player.y + PLAYER_HEIGHT / 2,
                  attached: 'front',
                  active: true,
                  power: 0,
                  level: 1, // Force upgrade level (1-5)
                  split: false,
                  splitY: 0, // Offset for second pod when split
                  splitAngle: 0, // Rotation angle for orbiting pods
                  shieldActive: false, // Temporary shield burst
                  shieldTimer: 0,
                  chargeBlast: 0, // Charge for mega blast attack
                  homingTarget: null // Current homing target for level 5
                };
                // Play Force acquire sound
                soundSystem.playElectricZap();
              } else {
                // Collecting another Force power-up increases power AND can upgrade level!
                const force = forceRef.current;
                force.power = Math.min(FORCE_MAX_POWER, force.power + 25);
                
                // Level up when power maxes out!
                if (force.power >= FORCE_MAX_POWER && force.level < 5) {
                  force.level++;
                  force.power = 0; // Reset power for next level
                  
                  // Visual and sound feedback for level up
                  floatingTextsRef.current.push({
                    x: force.x,
                    y: force.y - 20,
                    text: `FORCE LV${force.level}!`,
                    color: '#ffff00',
                    lifetime: 60,
                    vy: -1,
                    scale: 1.2
                  });
                }
              }
              break;
            case 'OPTION':
              // Add an option satellite (max 4)
              if (optionsRef.current.length < MAX_OPTIONS) {
                optionsRef.current.push({
                  x: player.x,
                  y: player.y + PLAYER_HEIGHT / 2
                });
              }
              break;
            case 'SPEED':
              // Speed boost - stacks up to 3
              upgradesRef.current.speedBoost = Math.min(3, upgradesRef.current.speedBoost + 1);
              break;
            case 'SPREAD':
              // Spread shot - fires in multiple directions
              upgradesRef.current.spreadShot = true;
              break;
            case 'MAGNET':
              // Magnet attracts nearby power-ups for 15 seconds
              upgradesRef.current.magnet = true;
              upgradesRef.current.magnetTimer = 900; // 15 seconds at 60fps
              break;
            case 'MEGA_BOMB':
              // Clear all enemies on screen!
              enemiesRef.current.forEach(enemy => {
                const ew = enemy.width || ENEMY_WIDTH;
                const eh = enemy.height || ENEMY_HEIGHT;
                createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, 'normal', true);
                scoreRef.current += enemy.points || 10;
              });
              setScore(scoreRef.current);
              enemiesRef.current = [];
              // Clear enemy bullets too
              enemyBulletsRef.current.forEach(bullet => {
                createExplosion(bullet.x, bullet.y, 'small', false);
              });
              enemyBulletsRef.current = [];
              // Screen flash effect
              createPickupEffect(GAME_WIDTH / 2, GAME_HEIGHT / 2, '#ffffff', 'MEGA BOMB!', 'legendary');
              break;
            
            // New common power-ups
            case 'REPAIR':
              // Restore 1 life
              setLives(prev => Math.min(prev + 1, 9));
              floatingTextsRef.current.push({
                x: player.x + PLAYER_WIDTH / 2,
                y: player.y - 20,
                text: '',
                color: '#00ff00',
                lifetime: 90,
                vy: -2,
                scale: 1.2
              });
              break;
            case 'SCORE_BONUS':
              // Add bonus score
              scoreRef.current += 500;
              setScore(scoreRef.current);
              floatingTextsRef.current.push({
                x: player.x + PLAYER_WIDTH / 2,
                y: player.y - 20,
                text: '',
                color: '#ffd700',
                lifetime: 60,
                vy: -2,
                scale: 1.3
              });
              break;
            
            // New rare power-ups
            case 'PIERCING':
              // Bullets pierce through enemies
              upgradesRef.current.piercing = true;
              upgradesRef.current.piercingTimer = 900; // 15 seconds
              break;
            case 'DOUBLE_SCORE':
              // Double score for limited time
              upgradesRef.current.doubleScore = true;
              upgradesRef.current.doubleScoreTimer = 1200; // 20 seconds
              floatingTextsRef.current.push({
                x: player.x + PLAYER_WIDTH / 2,
                y: player.y - 30,
                text: '',
                color: '#ffff00',
                lifetime: 120,
                vy: -1,
                scale: 1.4
              });
              break;
            case 'RICOCHET':
              // Bullets bounce off walls
              upgradesRef.current.ricochet = true;
              upgradesRef.current.ricochetTimer = 900; // 15 seconds
              break;
            
            // New legendary power-ups
            case 'INVINCIBILITY':
              // Immune to damage for 8 seconds
              upgradesRef.current.invincible = true;
              upgradesRef.current.invincibleTimer = 480; // 8 seconds
              floatingTextsRef.current.push({
                x: player.x + PLAYER_WIDTH / 2,
                y: player.y - 30,
                text: '',
                color: '#ffffff',
                lifetime: 120,
                vy: -1,
                scale: 1.5
              });
              triggerScreenShake(8, 15);
              break;
            case 'LASER_BEAM':
              // Powerful laser beam for limited time
              upgradesRef.current.laserBeam = true;
              upgradesRef.current.laserBeamTimer = 600; // 10 seconds
              break;
            case 'CHAIN_LIGHTNING':
              // Lightning chains between enemies
              upgradesRef.current.chainLightning = true;
              upgradesRef.current.chainLightningTimer = 600; // 10 seconds
              break;
            
            // Ultra rare power-ups
            case 'BLACK_HOLE':
              // Create black hole that sucks in enemies
              blackHoleRef.current = {
                x: GAME_WIDTH / 2,
                y: GAME_HEIGHT / 2,
                radius: 50,
                lifetime: 300, // 5 seconds
                pullStrength: 5
              };
              floatingTextsRef.current.push({
                x: GAME_WIDTH / 2,
                y: GAME_HEIGHT / 3,
                text: '',
                color: '#6600ff',
                lifetime: 150,
                vy: -0.5,
                scale: 2
              });
              triggerScreenShake(15, 30);
              break;
            case 'TIME_WARP':
              // Slow motion for 10 seconds
              upgradesRef.current.timeWarp = true;
              upgradesRef.current.timeWarpTimer = 600; // 10 seconds
              floatingTextsRef.current.push({
                x: player.x + PLAYER_WIDTH / 2,
                y: player.y - 30,
                text: '',
                color: '#aa00ff',
                lifetime: 150,
                vy: -1,
                scale: 1.8
              });
              break;
            case 'CLONE':
              // Create shadow clone that mimics player
              cloneRef.current = {
                x: player.x - 80,
                y: player.y,
                lifetime: 900, // 15 seconds
                alpha: 0.7
              };
              floatingTextsRef.current.push({
                x: player.x + PLAYER_WIDTH / 2,
                y: player.y - 30,
                text: '',
                color: '#00ffff',
                lifetime: 150,
                vy: -1,
                scale: 1.8
              });
              break;
            case 'NUCLEAR':
              // Devastating explosion that clears everything
              // Kill all enemies with massive explosion
              enemiesRef.current.forEach(enemy => {
                const ew = enemy.width || ENEMY_WIDTH;
                const eh = enemy.height || ENEMY_HEIGHT;
                createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, 'large', true);
                scoreRef.current += (enemy.points || 10) * 3;
              });
              setScore(scoreRef.current);
              enemiesRef.current = [];
              enemyBulletsRef.current = [];
              // Also damage bosses
              if (bossRef.current) {
                bossRef.current.health -= 100;
                createExplosion(bossRef.current.x + bossRef.current.width / 2, bossRef.current.y + bossRef.current.height / 2, 'large', true);
              }
              // Nuclear flash
              pickupEffectsRef.current.push({
                x: GAME_WIDTH / 2,
                y: GAME_HEIGHT / 2,
                color: '#ff4400',
                lifetime: 40,
                type: 'flash'
              });
              triggerScreenShake(20, 40);
              floatingTextsRef.current.push({
                x: GAME_WIDTH / 2,
                y: GAME_HEIGHT / 3,
                text: '',
                color: '#ff0000',
                lifetime: 150,
                vy: -0.5,
                scale: 2.5
              });
              break;
            case 'PHOENIX':
              // Auto-revive on death
              upgradesRef.current.phoenix = true;
              floatingTextsRef.current.push({
                x: player.x + PLAYER_WIDTH / 2,
                y: player.y - 30,
                text: '',
                color: '#ff8800',
                lifetime: 150,
                vy: -1,
                scale: 1.8
              });
              break;
            
            default:
              break;
          }
          return false;
        }
        
        return powerup.x > -POWERUP_SIZE;
      });
      
      if (powerupProcessCount > 0) {
        console.log('[POWERUP FILTER] Processed', powerupProcessCount, 'powerups, remaining:', powerupsRef.current.length);
      }

      // Force pod collision with enemies (damages them!)
      if (forceRef.current) {
        const force = forceRef.current;
        enemiesRef.current = enemiesRef.current.filter(enemy => {
          const ew = enemy.width || ENEMY_WIDTH;
          const eh = enemy.height || ENEMY_HEIGHT;
          if (checkCollision(
            { x: force.x - FORCE_SIZE / 2, y: force.y - FORCE_SIZE / 2, width: FORCE_SIZE, height: FORCE_SIZE },
            { x: enemy.x, y: enemy.y, width: ew, height: eh }
          )) {
            createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, enemy.type === 'heavy' ? 'heavy' : 'normal', true);
            const newScore = scoreRef.current + enemy.points;
            setScore(newScore);
            scoreRef.current = newScore;
            waveKillsRef.current++;
            sessionStatsRef.current.kills++;
            
            if (Math.random() < POWERUP_DROP_CHANCE) {
              spawnPowerup(enemy.x, enemy.y);
            }
            return false;
          }
          return true;
        });
        
        // Force blocks enemy bullets!
        enemyBulletsRef.current = enemyBulletsRef.current.filter(bullet => {
          if (checkCollision(
            { x: force.x - FORCE_SIZE / 2, y: force.y - FORCE_SIZE / 2, width: FORCE_SIZE, height: FORCE_SIZE },
            { x: bullet.x, y: bullet.y, width: ENEMY_BULLET_WIDTH, height: ENEMY_BULLET_HEIGHT }
          )) {
            createExplosion(bullet.x, bullet.y, 'small');
            return false;
          }
          return true;
        });
      }

      // Force bullets hit enemies
      forceBulletsRef.current = forceBulletsRef.current.filter(bullet => {
        let bulletHit = false;
        const bulletDamage = bullet.damage || 1;
        
        // Check collision with regular enemies
        enemiesRef.current = enemiesRef.current.filter(enemy => {
          const ew = enemy.width || ENEMY_WIDTH;
          const eh = enemy.height || ENEMY_HEIGHT;
          if (!bulletHit && checkCollision(
            { x: bullet.x - 4, y: bullet.y - 4, width: 8, height: 8 },
            { x: enemy.x, y: enemy.y, width: ew, height: eh }
          )) {
            // Apply damage based on bullet level
            enemy.health = (enemy.health || 1) - bulletDamage;
            
            if (enemy.health <= 0) {
              createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, enemy.type === 'heavy' ? 'heavy' : 'normal', true);
              const newScore = scoreRef.current + enemy.points;
              setScore(newScore);
              scoreRef.current = newScore;
              waveKillsRef.current++;
              sessionStatsRef.current.kills++;
              
              if (Math.random() < POWERUP_DROP_CHANCE) {
                spawnPowerup(enemy.x, enemy.y);
              }
              bulletHit = true;
              return false;
            } else {
              // Enemy survived, show hit effect
              createExplosion(bullet.x, bullet.y, 'small');
              bulletHit = true;
            }
          }
          return true;
        });
        
        if (!bulletHit && bossRef.current && bossActiveRef.current) {
          const boss = bossRef.current;
          if (checkCollision(
            { x: bullet.x - 4, y: bullet.y - 4, width: 8, height: 8 },
            { x: boss.x, y: boss.y, width: boss.width, height: boss.height }
          )) {
            // Boss is invincible while emerging
            if (boss.invincible) {
              boss.invincibleFlash = 10;
              floatingTextsRef.current.push({
                x: bullet.x,
                y: bullet.y,
                text: '',
                color: '#ffff00',
                lifetime: 15,
                vy: -2
              });
              createExplosion(bullet.x, bullet.y, 'small');
              bulletHit = true;
            } else {
              // Super boss shield absorbs damage first
              if (boss.shield && boss.shield > 0) {
                boss.shield -= bulletDamage;
                boss.shieldRegenDelay = 180;
              } else {
                boss.health -= bulletDamage;
              }
              createExplosion(bullet.x, bullet.y, 'small');
              bulletHit = true;
            }
            
            if (!boss.invincible && boss.health <= 0) {
              // Boss defeated! MASSIVE explosion
              sessionStatsRef.current.bosses++;
              createExplosion(boss.x + BOSS_WIDTH / 2, boss.y + BOSS_HEIGHT / 2, 'boss', true);
              createExplosion(boss.x + 30, boss.y + 20, 'large');
              createExplosion(boss.x + BOSS_WIDTH - 30, boss.y + BOSS_HEIGHT - 20, 'large');
              createExplosion(boss.x + BOSS_WIDTH / 2, boss.y, 'large');
              createExplosion(boss.x + BOSS_WIDTH / 2, boss.y + BOSS_HEIGHT, 'large');
              
              // Destroy all boss-spawned enemies
              enemiesRef.current.forEach(enemy => {
                if (enemy.spawnedByBoss) {
                  const ew = enemy.width || ENEMY_WIDTH;
                  const eh = enemy.height || ENEMY_HEIGHT;
                  createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, 'normal', true);
                }
              });
              enemiesRef.current = enemiesRef.current.filter(e => !e.spawnedByBoss);
              
              // Boss kill gives big multiplier boost
              scoreMultiplierRef.current = Math.min(MULTIPLIER_MAX, scoreMultiplierRef.current + 1.0);
              multiplierDecayTimerRef.current = MULTIPLIER_DECAY_DELAY * 2;
              const newScore = scoreRef.current + Math.floor(boss.points * scoreMultiplierRef.current);
              setScore(newScore);
              scoreRef.current = newScore;
              
              // Check for checkpoint (after waves 5, 10, 15, etc.) BEFORE incrementing
              const completedWave = waveRef.current;
              const isCheckpointWave = completedWave % 5 === 0 && completedWave > 0;
              // Victory condition depends on game mode
              const mode = gameModeRef.current;
              let isVictoryWave = false;
              if (mode === 'campaign') {
                isVictoryWave = completedWave === 20; // Campaign ends at wave 20
              } else if (mode === 'timeAttack') {
                isVictoryWave = completedWave === 10; // Time Attack ends at wave 10
              } else if (mode === 'bossRush') {
                isVictoryWave = completedWave === 20; // Boss Rush ends at wave 20
              }
              // Survival mode never ends - infinite waves!
              
              // Store boss data for transition if checkpoint
              const defeatedBoss = { ...boss };
              
              bossRef.current = null;
              bossActiveRef.current = false;
              setBossActive(false);
              miniBossSpawnedRef.current = false; // Reset for next wave
              
              // Check for victory (wave 20 completed)
              if (isVictoryWave) {
                // Stop all music
                if (gameMusicRef.current) {
                  gameMusicRef.current.pause();
                  gameMusicRef.current = null;
                }
                if (bossSpawnSoundRef.current) {
                  bossSpawnSoundRef.current.pause();
                  bossSpawnSoundRef.current = null;
                }
                // Initialize victory sequence
                victoryRef.current = {
                  active: true,
                  phase: 'explosion',
                  timer: 0,
                  scrollY: 0,
                  storyIndex: 0,
                  fadeAlpha: 0,
                  bossX: defeatedBoss.x + defeatedBoss.width / 2,
                  bossY: defeatedBoss.y + defeatedBoss.height / 2,
                  finalScore: newScore
                };
                triggerScreenShake(30, 60);
                enemiesRef.current = [];
                enemyBulletsRef.current = [];
                playerInvincibleRef.current = 9999;
                return false; // Remove bullet
              }
              
              waveRef.current++;
              setWave(waveRef.current);
              waveKillsRef.current = 0;
              waveKillsNeededRef.current = 10 + (waveRef.current * 5);
              waveStartTimeRef.current = performance.now(); // Reset grace period for new wave
              graceWarningShownRef.current = false; // Reset warning flag
              
              if (isCheckpointWave) {
                // Start smooth checkpoint transition with boss explosion sequence
                startCheckpointTransition(defeatedBoss, completedWave);
              } else {
                // Play level complete sound for regular wave completions
                try {
                  const levelCompleteSound = new Audio(asset('mixkit-completion-of-a-level-2063.wav'));
                  levelCompleteSound.volume = 0.5;
                  levelCompleteSound.play().catch(() => {});
                } catch (e) {}
                // Resume normal gameplay music
                resumeGameplayMusic();
                // Trigger wave intro fade effect
                levelFadeRef.current = { 
                  active: true, 
                  fadeIn: true, 
                  alpha: 0.8, 
                  showText: waveRef.current
                };
              }
            }
          }
          return false; // Remove bullet
        }
        return true; // Keep bullet
      });
      
      // Update pickup effects (debris, sparks from explosions, etc.)
      pickupEffectsRef.current = pickupEffectsRef.current.filter(effect => {
        effect.lifetime--;
        
        if (effect.type === 'debris') {
          // Flying debris particles with gravity
          effect.x += effect.vx;
          effect.y += effect.vy;
          effect.vy += effect.gravity || 0.1; // Apply gravity
          effect.vx *= 0.98;
          effect.vy *= 0.98;
          effect.size *= 0.97;
          effect.rotation = (effect.rotation || 0) + (effect.spin || 0);
        } else if (effect.type === 'spark') {
          // Spark particles with trail
          if (effect.trail) {
            effect.trail.push({ x: effect.x, y: effect.y });
            if (effect.trail.length > 5) effect.trail.shift();
          }
          effect.x += effect.vx;
          effect.y += effect.vy;
          effect.vx *= 0.95;
          effect.vy *= 0.95;
          effect.size *= 0.96;
        } else if (effect.type === 'ember') {
          // Floating ember particles
          effect.x += effect.vx + Math.sin(effect.flicker) * 0.3;
          effect.y += effect.vy;
          effect.flicker += 0.2;
          effect.vx *= 0.99;
          effect.size *= 0.98;
        } else if (effect.type === 'ring') {
          // Expanding ring
          effect.radius += (effect.maxRadius - effect.radius) * 0.2;
        } else if (effect.type === 'sparkle') {
          // Sparkle particles
          effect.x += effect.vx;
          effect.y += effect.vy;
          effect.vx *= 0.92;
          effect.vy *= 0.92;
          effect.size *= 0.95;
        } else if (effect.type === 'flash') {
          // Screen flash (no movement)
        }
        
        return effect.lifetime > 0;
      });
      
      // Update visual effects (other special effects)
      specialEffectsRef.current = specialEffectsRef.current.filter(effect => {
        effect.lifetime--;
        if (effect.type === 'ring') {
          effect.radius += (effect.maxRadius - effect.radius) * 0.2;
        } else if (effect.type === 'sparkle') {
          effect.x += effect.vx;
          effect.y += effect.vy;
          effect.vx *= 0.92;
          effect.vy *= 0.92;
          effect.size *= 0.95;
        }
        
        return effect.lifetime > 0;
      });

      // Performance caps - limit array sizes during intense battles
      const MAX_PICKUP_EFFECTS = bossActiveRef.current ? 80 : 150;
      const MAX_FLOATING_TEXTS = bossActiveRef.current ? 20 : 50;
      const MAX_EXPLOSIONS = bossActiveRef.current ? 15 : 30;
      const MAX_ENEMY_BULLETS = bossActiveRef.current ? 100 : 200;
      
      if (pickupEffectsRef.current.length > MAX_PICKUP_EFFECTS) {
        pickupEffectsRef.current = pickupEffectsRef.current.slice(-MAX_PICKUP_EFFECTS);
      }

      // Update floating texts
      floatingTextsRef.current = floatingTextsRef.current.filter(text => {
        text.lifetime--;
        text.y += text.vy;
        text.vy *= 0.98;
        return text.lifetime > 0;
      });
      
      if (floatingTextsRef.current.length > MAX_FLOATING_TEXTS) {
        floatingTextsRef.current = floatingTextsRef.current.slice(-MAX_FLOATING_TEXTS);
      }

      // Update explosions
      let firstExplosionLogged = false;
      explosionsRef.current = explosionsRef.current.filter(explosion => {
        explosion.lifetime--;
        if (!firstExplosionLogged && explosionsRef.current.length > 0) {
          firstExplosionLogged = true;
        }
        
        // Handle sprite-based explosions
        if (explosion.isSprite) {
          explosion.frameTimer++;
          if (explosion.frameTimer >= explosion.frameDelay) {
            explosion.frameTimer = 0;
            explosion.frame++;
          }
          return explosion.frame < explosion.totalFrames;
        }
        
        // Handle particle-based explosions
        explosion.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          // Use particle's own decay rate if set, otherwise default
          const decay = p.decay || 0.95;
          p.vx *= decay;
          p.vy *= decay;
          // Smoke particles shrink slower
          p.size *= p.isSmoke ? 0.98 : 0.95;
        });
        return explosion.lifetime > 0;
      });
      
      // Cap explosions during boss battles
      const MAX_EXPLOSIONS_CAP = bossActiveRef.current ? 15 : 30;
      if (explosionsRef.current.length > MAX_EXPLOSIONS_CAP) {
        explosionsRef.current = explosionsRef.current.slice(-MAX_EXPLOSIONS_CAP);
      }
      
      // Cap enemy bullets to prevent overwhelming performance
      const MAX_ENEMY_BULLETS_CAP = bossActiveRef.current ? 100 : 200;
      if (enemyBulletsRef.current.length > MAX_ENEMY_BULLETS_CAP) {
        enemyBulletsRef.current = enemyBulletsRef.current.slice(-MAX_ENEMY_BULLETS_CAP);
      }

      // Update player invincibility
      if (playerInvincibleRef.current > 0) {
        playerInvincibleRef.current--;
      }
      
      // Update spawn glow animation
      if (playerSpawnGlowRef.current > 0) {
        playerSpawnGlowRef.current--;
      }

      // Update shield effects and recharge
      if (upgradesRef.current.shield) {
        const shieldFx = shieldEffectsRef.current;
        
        // Rotate shield elements
        shieldFx.rotationAngle += 0.02;
        
        // Decay pulse intensity
        if (shieldFx.pulseIntensity > 0) {
          shieldFx.pulseIntensity *= 0.9;
        }
        
        // Update impact ripples
        shieldFx.impacts = shieldFx.impacts.filter(impact => {
          impact.timer--;
          impact.radius += 3;
          impact.intensity *= 0.92;
          return impact.timer > 0;
        });
        
        // Update charge particles
        shieldFx.chargeParticles = shieldFx.chargeParticles.filter(particle => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vx *= 0.95;
          particle.vy *= 0.95;
          particle.life--;
          return particle.life > 0;
        });
        
        // Regenerate hex segments slowly
        for (let i = 0; i < 6; i++) {
          if (shieldFx.hexSegments[i] < 1) {
            shieldFx.hexSegments[i] = Math.min(1, shieldFx.hexSegments[i] + 0.002);
          }
        }
        
        // Shield recharge (if below max and recharge timer expired)
        if (upgradesRef.current.shieldRechargeTimer > 0) {
          upgradesRef.current.shieldRechargeTimer--;
        } else if (upgradesRef.current.shieldHits < upgradesRef.current.shieldMaxHits) {
          // Slow passive recharge (1 hit every 10 seconds = 600 frames)
          if (Math.random() < 0.00167) {
            upgradesRef.current.shieldHits++;
            // Add recharge visual effect
            for (let i = 0; i < 12; i++) {
              const angle = (Math.PI * 2 / 12) * i;
              shieldFx.chargeParticles.push({
                x: player.x + PLAYER_WIDTH / 2 + Math.cos(angle) * 50,
                y: player.y + PLAYER_HEIGHT / 2 + Math.sin(angle) * 40,
                vx: -Math.cos(angle) * 2,
                vy: -Math.sin(angle) * 2,
                life: 30,
                size: 3,
                color: '#00ffff'
              });
            }
          }
        }
      }
      
      // === Ship Ability Updates ===
      const currentShipAbility = (SHIP_DESIGNS[selectedShipRef.current] || SHIP_DESIGNS[0]).ability;
      const ability = shipAbilityRef.current;
      
      // SOLAR: Solar flare periodic damage pulse
      if (currentShipAbility === 'solarFlare') {
        ability.solarFlareTimer++;
        if (ability.solarFlareTimer >= ability.solarFlareInterval) {
          ability.solarFlareTimer = 0;
          const playerCenterX = player.x + PLAYER_WIDTH / 2;
          const playerCenterY = player.y + PLAYER_HEIGHT / 2;
          
          // Damage all enemies in radius
          enemiesRef.current.forEach(enemy => {
            const ew = enemy.width || ENEMY_WIDTH;
            const eh = enemy.height || ENEMY_HEIGHT;
            const dx = (enemy.x + ew / 2) - playerCenterX;
            const dy = (enemy.y + eh / 2) - playerCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < ability.solarFlareRadius) {
              enemy.health -= 1;
              floatingTextsRef.current.push({
                x: enemy.x + ew / 2,
                y: enemy.y,
                text: '',
                color: '#ffaa00',
                lifetime: 30,
                vy: -1
              });
            }
          });
          
          // Visual effect - expanding ring (add solar particles)
          for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            pickupEffectsRef.current.push({
              x: playerCenterX,
              y: playerCenterY,
              vx: Math.cos(angle) * 4,
              vy: Math.sin(angle) * 4,
              color: i % 2 === 0 ? '#ffaa00' : '#ffff00',
              size: 4,
              lifetime: 25,
              type: 'spark'
            });
          }
          triggerScreenShake(4, 8);
        }
      }
      
      // GUARDIAN: Faster shield recharge
      if (currentShipAbility === 'shieldBoost' && upgradesRef.current.shieldRechargeTimer > 0) {
        upgradesRef.current.shieldRechargeTimer = Math.max(0, upgradesRef.current.shieldRechargeTimer - 1);
        // Extra decrement for 2x speed
      }
      
      // WRAITH: Phase shift timer
      if (ability.phaseShiftActive) {
        ability.phaseShiftTimer--;
        if (ability.phaseShiftTimer <= 0) {
          ability.phaseShiftActive = false;
        }
      }
      
      // Second enemy filter moved to run right after first filter (before boss update)
      // This section used to be here but was relocated to line ~14644

      let enemyCounter = 0;
      let collisionChecks = 0;
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        try {
        // Apply time warp slowdown
        const effectiveSpeed = (enemy.speed || ENEMY_SPEED) * timeWarpModifier;
        
        // DEBUG: Log first enemy details
        const isFirst = enemyCounter === 0;
        enemyCounter++;
        if (isFirst) {
        }
        
        // Update frozen status (from GLACIER ship ability)
        if (enemy.frozen && enemy.frozenTimer > 0) {
          enemy.frozenTimer--;
          if (enemy.frozenTimer <= 0) {
            enemy.frozen = false;
            enemy.speed = enemy.originalSpeed || ENEMY_SPEED;
          }
          // Skip all movement while frozen
          return true;
        }
        
        // Special type behaviors (movement already handled in basic filter above)
        if (enemy.type === 'turret') {
          // Turret rotates to aim at player (no movement since it's stationary)
          const dx = player.x + PLAYER_WIDTH / 2 - (enemy.x + ENEMY_WIDTH / 2);
          const dy = player.y + PLAYER_HEIGHT / 2 - (enemy.y + ENEMY_HEIGHT / 2);
          const targetAngle = Math.atan2(dy, dx);
          // Smooth rotation
          let angleDiff = targetAngle - enemy.angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          enemy.angle += angleDiff * 0.05; // Rotation speed
        }
        
        if (enemy.type === 'bomber') {
          // Suicide bomber - homes in on player
          const dx = player.x + PLAYER_WIDTH / 2 - (enemy.x + ENEMY_WIDTH / 2);
          const dy = player.y + PLAYER_HEIGHT / 2 - (enemy.y + ENEMY_HEIGHT / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          enemy.x += (dx / dist) * effectiveSpeed;
          enemy.y += (dy / dist) * effectiveSpeed * 0.8;
          enemy.pulsePhase = (enemy.pulsePhase || 0) + 0.2;
          
          // Check if close enough to explode
          if (dist < 30 && playerInvincibleRef.current <= 0 && !dashRef.current.active && !upgradesRef.current.invincible) {
            // Explode!
            createExplosion(enemy.x + ENEMY_WIDTH / 2, enemy.y + ENEMY_HEIGHT / 2, 'large', true);
            triggerScreenShake(15, 20);
            soundSystem.playExplosion(0.8);
            
            // Damage player
            if (upgradesRef.current.shield && upgradesRef.current.shieldHits > 0) {
              upgradesRef.current.shieldHits--;
              upgradesRef.current.shieldRechargeTimer = 180;
              if (upgradesRef.current.shieldHits <= 0) upgradesRef.current.shield = false;
              createShieldImpact(enemy.x, enemy.y);
            } else {
              const newLives = livesRef.current - 1;
              setLives(newLives);
              livesRef.current = newLives;
              playerInvincibleRef.current = 120;
              if (newLives <= 0) {
                handleGameOver();
              }
            }
            return false; // Remove bomber
          }
        } else if (enemy.type === 'cloaked') {
          // Cloaked enemy - reveal when close to player or shooting
          const dx = player.x - enemy.x;
          const dy = player.y - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Reveal when close (within 150px) or when shooting
          if (dist < 150 || enemy.revealTimer > 0) {
            enemy.cloakAlpha = Math.min(1, enemy.cloakAlpha + 0.1);
            enemy.cloaked = enemy.cloakAlpha < 0.5;
          } else {
            enemy.cloakAlpha = Math.max(0.1, enemy.cloakAlpha - 0.02);
            enemy.cloaked = true;
          }
          
          if (enemy.revealTimer > 0) enemy.revealTimer--;
          
          enemy.x -= effectiveSpeed;
        } else if (enemy.type === 'shielded') {
          // Shielded enemy - update shield flash
          if (enemy.shieldFlash > 0) enemy.shieldFlash--;
          enemy.x -= effectiveSpeed;
        } else if (enemy.type === 'spiral') {
          // Spiral shooter - slow movement, hovers in place when shooting
          if (enemy.x > GAME_WIDTH * 0.6) {
            enemy.x -= effectiveSpeed;
          } else {
            // Slight vertical drift
            enemy.y += Math.sin(Date.now() / 500) * 0.5;
          }
          if (enemy.attackCooldown > 0) enemy.attackCooldown--;
        } else if (enemy.type === 'wave') {
          // Wave shooter - vertical sine wave movement
          enemy.x -= effectiveSpeed;
          enemy.wavePhase += 0.08;
          enemy.y += Math.sin(enemy.wavePhase) * 2;
          // Keep on screen
          enemy.y = Math.max(20, Math.min(GAME_HEIGHT - 50, enemy.y));
          if (enemy.attackCooldown > 0) enemy.attackCooldown--;
        } else if (enemy.type === 'sniper') {
          // Sniper - moves to position then aims
          if (enemy.fromBehind) {
            // Sniper from behind - moves in from left side
            if (enemy.x < GAME_WIDTH * 0.15) {
              enemy.x += effectiveSpeed;
            }
          } else {
            // Normal sniper from right
            if (enemy.x > GAME_WIDTH * 0.7) {
              enemy.x -= effectiveSpeed;
            }
          }
          // Update targeting
          if (enemy.targeting) {
            // Track player while aiming
            const dx = player.x + PLAYER_WIDTH / 2 - enemy.x;
            const dy = player.y + PLAYER_HEIGHT / 2 - (enemy.y + ENEMY_HEIGHT / 2);
            enemy.targetAngle = Math.atan2(dy, dx);
            enemy.targetTimer++;
          }
        } else if (enemy.type === 'shielder') {
          // Shielder - cloaked support ship that generates shields for nearby enemies
          
          // Move to mid-screen position and hover
          if (enemy.x > GAME_WIDTH * 0.7) {
            enemy.x -= effectiveSpeed;
          } else {
            // Gentle vertical drift
            enemy.y += Math.sin(Date.now() / 700) * 0.8;
            enemy.y = Math.max(30, Math.min(GAME_HEIGHT - 60, enemy.y));
          }
          
          // Update shield pulse visual
          enemy.shieldPulse = (enemy.shieldPulse + 0.05) % (Math.PI * 2);
          
          // Reduce shield cooldown
          if (enemy.shieldCooldown > 0) enemy.shieldCooldown--;
          
          // Apply shields to nearby enemies
          if (enemy.shieldCooldown <= 0 && enemy.x < GAME_WIDTH * 0.8) {
            enemy.shieldCooldown = enemy.shieldInterval;
            enemy.revealTimer = 30; // Briefly reveal when shielding
            
            // Find nearby enemies without shields and add shields
            enemiesRef.current.forEach(target => {
              if (target === enemy) return;
              if (target.type === 'shielder') return;
              if (target.shield && target.shield > 0) return; // Already has shield
              
              const dx = target.x - enemy.x;
              const dy = target.y - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < enemy.shieldRange) {
                // Grant shield to this enemy
                target.shield = 2;
                target.maxShield = 2;
                target.shieldFlash = 30;
                target.grantedShield = true; // Mark as granted (not innate)
                
                // Visual effect
                floatingTextsRef.current.push({
                  x: target.x + (target.width || ENEMY_WIDTH) / 2,
                  y: target.y,
                  text: '',
                  color: '#00ffff',
                  lifetime: 30,
                  vy: -1
                });
              }
            });
            
            // Also shield mini-boss if nearby
            if (miniBossRef.current && !miniBossRef.current.regenerating) {
              const mb = miniBossRef.current;
              const dx = mb.x - enemy.x;
              const dy = mb.y - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < enemy.shieldRange * 1.5 && (!mb.shield || mb.shield <= 0)) {
                mb.shield = 20;
                mb.maxShield = 20;
                floatingTextsRef.current.push({
                  x: mb.x + mb.width / 2,
                  y: mb.y,
                  text: '',
                  color: '#00ffff',
                  lifetime: 40,
                  vy: -1
                });
              }
            }
            
            // Also shield boss if nearby
            if (bossRef.current && bossRef.current.entered && !bossRef.current.regenerating) {
              const boss = bossRef.current;
              const dx = boss.x - enemy.x;
              const dy = boss.y - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < enemy.shieldRange * 2 && boss.shield < boss.maxShield * 0.5) {
                boss.shield = Math.min(boss.maxShield, boss.shield + 30);
                floatingTextsRef.current.push({
                  x: boss.x + boss.width / 2,
                  y: boss.y,
                  text: '',
                  color: '#00ffff',
                  lifetime: 50,
                  vy: -1
                });
              }
            }
          }
        } else if (enemy.type === 'healer') {
          // Healer drone - repairs nearby damaged enemies
          if (enemy.x > GAME_WIDTH * 0.65) {
            enemy.x -= effectiveSpeed;
          } else {
            enemy.y += Math.sin(Date.now() / 600) * 0.6;
            enemy.y = Math.max(30, Math.min(GAME_HEIGHT - 60, enemy.y));
          }
          enemy.healPulse = (enemy.healPulse + 0.08) % (Math.PI * 2);
          if (enemy.healCooldown > 0) enemy.healCooldown--;
          
          if (enemy.healCooldown <= 0 && enemy.x < GAME_WIDTH * 0.75) {
            let healedTarget = null;
            let closestDist = enemy.healRange;
            
            enemiesRef.current.forEach(target => {
              if (target === enemy || target.type === 'healer') return;
              if (!target.health || target.health >= (target.maxHealth || 4)) return;
              const dx = target.x - enemy.x;
              const dy = target.y - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < closestDist) { closestDist = distance; healedTarget = target; }
            });
            
            if (healedTarget) {
              enemy.healCooldown = enemy.healInterval;
              healedTarget.health = Math.min((healedTarget.maxHealth || 4), healedTarget.health + enemy.healAmount);
              enemy.healBeam = { target: healedTarget, timer: 20 };
              floatingTextsRef.current.push({
                x: healedTarget.x + (healedTarget.width || ENEMY_WIDTH) / 2, y: healedTarget.y,
                text: '', color: '#00ff88', lifetime: 25, vy: -1.5
              });
            }
          }
          if (enemy.healBeam) { enemy.healBeam.timer--; if (enemy.healBeam.timer <= 0) enemy.healBeam = null; }
        } else if (enemy.type === 'teleporter') {
          // Teleporter - blinks around unpredictably
          enemy.x -= effectiveSpeed;
          if (enemy.teleportCooldown > 0) enemy.teleportCooldown--;
          if (enemy.teleportFlash > 0) enemy.teleportFlash--;
          
          if (enemy.teleportCooldown <= 0 && enemy.x < GAME_WIDTH * 0.9 && enemy.x > 50) {
            if (!enemy.teleportCharging) {
              enemy.teleportCharging = true;
              enemy.teleportCharge = 0;
              enemy.lastTeleportX = enemy.x;
              enemy.lastTeleportY = enemy.y;
            } else {
              enemy.teleportCharge++;
              if (enemy.teleportCharge >= 30) {
                enemy.teleportCharging = false;
                enemy.teleportCooldown = enemy.teleportInterval;
                enemy.teleportFlash = 15;
                const newX = 100 + Math.random() * (GAME_WIDTH - 200);
                const newY = 50 + Math.random() * (GAME_HEIGHT - 100);
                createExplosion(enemy.x + ENEMY_WIDTH/2, enemy.y + ENEMY_HEIGHT/2, 'small', false);
                enemy.x = newX;
                enemy.y = newY;
                createExplosion(newX + ENEMY_WIDTH/2, newY + ENEMY_HEIGHT/2, 'small', false);
              }
            }
          }
        } else if (enemy.type === 'splitter') {
          enemy.x -= effectiveSpeed;
          enemy.splitPhase = (enemy.splitPhase + 0.1) % (Math.PI * 2);
        } else if (enemy.type === 'mine') {
          enemy.pulsePhase = (enemy.pulsePhase + 0.15) % (Math.PI * 2);
          if (!enemy.armed) { enemy.armingTime--; if (enemy.armingTime <= 0) enemy.armed = true; }
          if (enemy.armed) {
            const dx = player.x + PLAYER_WIDTH / 2 - (enemy.x + (enemy.width || ENEMY_WIDTH) / 2);
            const dy = player.y + PLAYER_HEIGHT / 2 - (enemy.y + (enemy.height || ENEMY_HEIGHT) / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 10) {
              enemy.x += (dx / dist) * effectiveSpeed + (dx * enemy.magnetStrength);
              enemy.y += (dy / dist) * effectiveSpeed * 0.5 + (dy * enemy.magnetStrength);
            }
            if (dist < 25 && playerInvincibleRef.current <= 0 && !dashRef.current.active && !upgradesRef.current.invincible) {
              createExplosion(enemy.x + (enemy.width || ENEMY_WIDTH) / 2, enemy.y + (enemy.height || ENEMY_HEIGHT) / 2, 'large', true);
              triggerScreenShake(12, 18);
              soundSystem.playExplosion(0.7);
              if (upgradesRef.current.shield && upgradesRef.current.shieldHits > 0) {
                upgradesRef.current.shieldHits--;
                upgradesRef.current.shieldRechargeTimer = 180;
                if (upgradesRef.current.shieldHits <= 0) upgradesRef.current.shield = false;
                createShieldImpact(enemy.x, enemy.y);
              } else {
                const newLives = livesRef.current - 1;
                setLives(newLives);
                livesRef.current = newLives;
                playerInvincibleRef.current = 120;
                if (newLives <= 0) handleGameOver();
              }
              return false;
            }
          } else {
            enemy.x -= ENEMY_SPEED * 0.5 * timeWarpModifier;
          }
        } else if (enemy.type === 'flyby') {
          // Flyby formation enemy - follow animated path
          enemy.pathProgress++;
          
          if (enemy.pathProgress < 0) {
            // Still waiting to start (staggered entry)
            return true;
          }
          
          const progress = Math.min(1, enemy.pathProgress / enemy.pathDuration);
          const pathData = enemy.pathData;
          
          if (progress < 1) {
            // Animate along path based on path type
            if (pathData.moveType === 'sine') {
              // Sine wave path
              const t = progress;
              enemy.x = pathData.startX + (pathData.endX - pathData.startX) * t;
              enemy.y = pathData.startY + Math.sin(t * Math.PI * pathData.frequency * 2) * pathData.amplitude;
            } else if (pathData.spiralType === 'inward') {
              // Spiral inward path
              const angle = pathData.startAngle + progress * Math.PI * 3;
              const radius = pathData.startRadius - (pathData.startRadius - pathData.endRadius) * progress;
              enemy.x = pathData.centerX + Math.cos(angle) * radius;
              enemy.y = pathData.centerY + Math.sin(angle) * radius;
            } else if (pathData.cp2x !== undefined) {
              // Bezier curve path (with 2 control points)
              const t = progress;
              const t2 = t * t;
              const t3 = t2 * t;
              const mt = 1 - t;
              const mt2 = mt * mt;
              const mt3 = mt2 * mt;
              
              // Cubic bezier
              enemy.x = mt3 * pathData.startX + 3 * mt2 * t * pathData.cp1x + 3 * mt * t2 * pathData.cp2x + t3 * pathData.endX;
              enemy.y = mt3 * pathData.startY + 3 * mt2 * t * pathData.cp1y + 3 * mt * t2 * pathData.cp2y + t3 * pathData.endY;
            } else {
              // Simple quadratic bezier
              const t = progress;
              const mt = 1 - t;
              enemy.x = mt * mt * pathData.startX + 2 * mt * t * pathData.cp1x + t * t * pathData.endX;
              enemy.y = mt * mt * pathData.startY + 2 * mt * t * pathData.cp1y + t * t * pathData.endY;
            }
          } else {
            // Path complete - transition to attack mode
            if (enemy.invincible) {
              enemy.invincible = false;
              enemy.canShoot = true;
              enemy.lastShot = Date.now() + enemy.attackDelay * 16; // Convert frames to ms
              enemy.speed = ENEMY_SPEED * 0.6; // Slow movement during attack
              enemy.type = 'formation'; // Switch to normal formation behavior
              
              // Find the group and mark as attacking
              const group = flybyFormationsRef.current.find(g => g.id === enemy.flybyGroupId);
              if (group && group.phase === 'entering') {
                group.phase = 'attacking';
                floatingTextsRef.current.push({
                  x: enemy.x,
                  y: enemy.y - 30,
                  text: '',
                  color: enemy.glowColor || '#ff4444',
                  lifetime: 45,
                  vy: -2
                });
              }
            }
          }
        }
        
        // Enemy shooting
        if (enemy.canShoot && currentTime - enemy.lastShot > ENEMY_FIRE_RATE) {
          if (enemy.type === 'turret') {
            // Turret fires aimed shots
            const bulletSpeed = 5;
            enemyBulletsRef.current.push({
              x: enemy.x + ENEMY_WIDTH / 2 + Math.cos(enemy.angle) * 20,
              y: enemy.y + ENEMY_HEIGHT / 2 + Math.sin(enemy.angle) * 20,
              vx: Math.cos(enemy.angle) * bulletSpeed,
              vy: Math.sin(enemy.angle) * bulletSpeed,
              aimed: true,
              polarity: enemy.polarity || 'light' // Bullet inherits enemy polarity
            });
            enemy.lastShot = currentTime;
          } else if (enemy.type === 'heavy' && enemy.isCannon) {
            // Heavy enemy fires cannon shots (aimed at player)
            const ew = enemy.width || ENEMY_WIDTH;
            const eh = enemy.height || ENEMY_HEIGHT;
            const dx = player.x + PLAYER_WIDTH / 2 - (enemy.x + ew / 2);
            const dy = player.y + PLAYER_HEIGHT / 2 - (enemy.y + eh / 2);
            const angle = Math.atan2(dy, dx);
            const speed = 4;
            enemyBulletsRef.current.push({
              x: enemy.x,
              y: enemy.y + eh / 2,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              aimed: true,
              isCannon: true, // Large cannon projectile
              polarity: enemy.polarity || 'light'
            });
            enemy.lastShot = currentTime;
          } else if (enemy.type === 'fire') {
            // Fire enemy - fires burst of burning projectiles
            const ew = enemy.width || ENEMY_WIDTH;
            const eh = enemy.height || ENEMY_HEIGHT;
            const dx = player.x + PLAYER_WIDTH / 2 - (enemy.x + ew / 2);
            const dy = player.y + PLAYER_HEIGHT / 2 - (enemy.y + eh / 2);
            const baseAngle = Math.atan2(dy, dx);
            const speed = 5;
            
            // Fire 3 burning projectiles in a spread
            const burstCount = enemy.burstCount || 3;
            for (let i = 0; i < burstCount; i++) {
              const spreadAngle = baseAngle + (i - (burstCount - 1) / 2) * 0.2;
              enemyBulletsRef.current.push({
                x: enemy.x,
                y: enemy.y + eh / 2,
                vx: Math.cos(spreadAngle) * speed,
                vy: Math.sin(spreadAngle) * speed,
                aimed: true,
                isFireBullet: true,
                burnDamage: true,
                polarity: 'fire'
              });
            }
            soundSystem.playEnemyShoot();
            enemy.lastShot = currentTime;
          } else if (enemy.type === 'ice') {
            // Ice enemy - fires freezing projectile
            const ew = enemy.width || ENEMY_WIDTH;
            const eh = enemy.height || ENEMY_HEIGHT;
            const dx = player.x + PLAYER_WIDTH / 2 - (enemy.x + ew / 2);
            const dy = player.y + PLAYER_HEIGHT / 2 - (enemy.y + eh / 2);
            const angle = Math.atan2(dy, dx);
            const speed = 4;
            
            enemyBulletsRef.current.push({
              x: enemy.x,
              y: enemy.y + eh / 2,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              aimed: true,
              isIceBullet: true,
              freezeChance: enemy.freezeChance || 0.3,
              polarity: 'ice'
            });
            soundSystem.playEnemyShoot();
            enemy.lastShot = currentTime;
          } else if (enemy.type === 'cloaked') {
            // Cloaked enemy reveals when shooting
            if (enemy.x < GAME_WIDTH - 50) {
              enemy.revealTimer = 60; // Stay revealed for 1 second after shooting
              enemyBulletsRef.current.push({
                x: enemy.x,
                y: enemy.y + ENEMY_HEIGHT / 2 - ENEMY_BULLET_HEIGHT / 2,
                fromBehind: false,
                polarity: enemy.polarity || 'light'
              });
              enemy.lastShot = currentTime;
            }
          } else if (enemy.type === 'spiral') {
            // Spiral shooter - fires rotating spiral burst
            if (enemy.x < GAME_WIDTH * 0.7 && enemy.attackCooldown <= 0) {
              soundSystem.playEnemyShoot();
              for (let i = 0; i < enemy.burstCount; i++) {
                const angle = enemy.spiralAngle + (Math.PI * 2 / enemy.burstCount) * i;
                const speed = 4;
                enemyBulletsRef.current.push({
                  x: enemy.x + ENEMY_WIDTH / 2,
                  y: enemy.y + ENEMY_HEIGHT / 2,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  type: 'spiral',
                  color: '#ff00ff',
                  polarity: enemy.polarity || 'light'
                });
              }
              enemy.spiralAngle += enemy.spiralSpeed;
              enemy.attackCooldown = 25; // Short cooldown between bursts
              enemy.lastShot = currentTime;
            }
          } else if (enemy.type === 'wave') {
            // Wave shooter - fires sinusoidal wave bullets
            if (enemy.x < GAME_WIDTH - 80 && enemy.attackCooldown <= 0) {
              soundSystem.playEnemyShoot();
              enemyBulletsRef.current.push({
                x: enemy.x,
                y: enemy.y + ENEMY_HEIGHT / 2,
                vx: -5,
                vy: 0,
                type: 'wave',
                wavePhase: 0,
                waveAmplitude: enemy.waveAmplitude,
                baseY: enemy.y + ENEMY_HEIGHT / 2,
                color: '#00ffaa',
                polarity: enemy.polarity || 'light'
              });
              enemy.attackCooldown = 15;
              enemy.lastShot = currentTime;
            }
          } else if (enemy.type === 'sniper') {
            // Sniper - aims then fires high-speed shot
            if (enemy.x < GAME_WIDTH * 0.8) {
              if (!enemy.targeting) {
                // Start targeting
                enemy.targeting = true;
                enemy.targetTimer = 0;
              } else if (enemy.targetTimer >= enemy.targetDuration) {
                // Fire!
                soundSystem.playEnemyShoot();
                const speed = 10; // Very fast!
                enemyBulletsRef.current.push({
                  x: enemy.x,
                  y: enemy.y + ENEMY_HEIGHT / 2,
                  vx: Math.cos(enemy.targetAngle) * speed,
                  vy: Math.sin(enemy.targetAngle) * speed,
                  type: 'sniper',
                  color: '#ff0000',
                  polarity: enemy.polarity || 'light'
                });
                enemy.targeting = false;
                enemy.targetTimer = 0;
                enemy.lastShot = currentTime;
              }
            }
          } else if (enemy.fromBehind) {
            // Ambush enemies shoot when they've entered the screen
            if (enemy.x > 50 && enemy.x < GAME_WIDTH - 50) {
              enemyBulletsRef.current.push({
                x: enemy.x + ENEMY_WIDTH, // Shoot to the right
                y: enemy.y + ENEMY_HEIGHT / 2 - ENEMY_BULLET_HEIGHT / 2,
                fromBehind: true,
                polarity: enemy.polarity || 'light'
              });
              enemy.lastShot = currentTime;
            }
          } else {
            if (enemy.x < GAME_WIDTH - 50) {
              enemyBulletsRef.current.push({
                x: enemy.x,
                y: enemy.y + ENEMY_HEIGHT / 2 - ENEMY_BULLET_HEIGHT / 2,
                fromBehind: false,
                polarity: enemy.polarity || 'light'
              });
              enemy.lastShot = currentTime;
            }
          }
        }
        
        // Check collision with player (only if not invincible)
        // Use precise circular hitbox instead of full sprite for bullet hell gameplay
        const ew = enemy.width || ENEMY_WIDTH;
        const eh = enemy.height || ENEMY_HEIGHT;
        const playerCenterX = player.x + PLAYER_WIDTH / 2;
        const playerCenterY = player.y + PLAYER_HEIGHT / 2;
        const enemyCenterX = enemy.x + ew / 2;
        const enemyCenterY = enemy.y + eh / 2;
        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collisionRadius = PLAYER_HITBOX_RADIUS + Math.min(ew, eh) / 3; // Small hitbox vs enemy
        
        collisionChecks++;
        if (playerInvincibleRef.current <= 0 && distance < collisionRadius) {
          createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, enemy.type === 'heavy' ? 'heavy' : 'normal', true);
          
          if (upgradesRef.current.shield && upgradesRef.current.shieldHits > 0) {
            upgradesRef.current.shieldHits--;
            upgradesRef.current.shieldRechargeTimer = 180;
            if (upgradesRef.current.shieldHits <= 0) {
              upgradesRef.current.shield = false;
            }
            createShieldImpact(enemy.x + ew / 2, enemy.y + eh / 2);
          } else {
            hitPlayer = true;
            // Create player explosion
            createExplosion(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, 'large');
          }
          return false;
        }
        
        // Remove if off screen (turrets stay, others based on direction)
        if (enemy.type === 'turret') {
          return true; // Turrets never leave on their own
        } else if (enemy.fromBehind) {
          return enemy.x < GAME_WIDTH + ENEMY_WIDTH;
        } else {
          return enemy.x > -ENEMY_WIDTH;
        }
      } catch (error) {
        console.error('❌ ERROR in enemy update:', error);
        console.error('Enemy that caused error:', enemy);
        return true; // Keep enemy to avoid cascade failures
      }
    });
    

      // Update enemy bullets
      const bulletSpeedMult = (gameModeRef.current === 'practice' && practiceSettingsRef.current.slowBullets) ? 0.5 : 1;
      
      enemyBulletsRef.current = enemyBulletsRef.current.filter(bullet => {
        // Handle mini-boss special bullet types
        if (bullet.type === 'miniboss') {
          bullet.x += bullet.vx * bulletSpeedMult;
          bullet.y += bullet.vy * bulletSpeedMult;
        } else if (bullet.type === 'bomb') {
          bullet.x += bullet.vx * bulletSpeedMult;
          bullet.y += bullet.vy * bulletSpeedMult;
          bullet.vy += 0.15; // Gravity effect
        } else if (bullet.type === 'laser') {
          // Laser is stationary but has lifetime
          if (bullet.lifetime !== undefined) {
            bullet.lifetime--;
            if (bullet.lifetime <= 0) return false;
          }
        } else if (bullet.type === 'spiral') {
          // Spiral bullets move in set direction
          bullet.x += bullet.vx * bulletSpeedMult;
          bullet.y += bullet.vy * bulletSpeedMult;
        } else if (bullet.type === 'wave') {
          // Wave bullets follow sinusoidal path
          bullet.x += bullet.vx * bulletSpeedMult;
          bullet.wavePhase += 0.15;
          bullet.y = bullet.baseY + Math.sin(bullet.wavePhase) * 40 * bullet.waveAmplitude;
        } else if (bullet.type === 'sniper') {
          // Sniper bullets move fast in set direction
          bullet.x += bullet.vx * bulletSpeedMult;
          bullet.y += bullet.vy * bulletSpeedMult;
        } else if (bullet.aimed) {
          // Aimed bullets from turrets move in their set direction
          bullet.x += bullet.vx * bulletSpeedMult;
          bullet.y += bullet.vy * bulletSpeedMult;
        } else if (bullet.fromBehind) {
          bullet.x += ENEMY_BULLET_SPEED * bulletSpeedMult; // Move right
        } else {
          bullet.x -= ENEMY_BULLET_SPEED * bulletSpeedMult; // Move left
        }
        
        // Determine bullet dimensions
        const bulletW = bullet.width || ENEMY_BULLET_WIDTH;
        const bulletH = bullet.height || ENEMY_BULLET_HEIGHT;
        
        // Calculate positions once for both collision and graze checks
        const playerCenterX = player.x + PLAYER_WIDTH / 2;
        const playerCenterY = player.y + PLAYER_HEIGHT / 2;
        const bulletCenterX = bullet.x + bulletW / 2;
        const bulletCenterY = bullet.y + bulletH / 2;
        const dx = playerCenterX - bulletCenterX;
        const dy = playerCenterY - bulletCenterY;
        const distToBullet = Math.sqrt(dx * dx + dy * dy);
        
        // Check collision with player FIRST using precise circular hitbox
        // Bullet hell games use small precise hitbox for fair dodging
        const collisionRadius = PLAYER_HITBOX_RADIUS + Math.min(bulletW, bulletH) / 2;
        
        // Debug boss bullets
        if (bullet.isBossShot && distToBullet < 100) {
          console.log('[BOSS BULLET] Distance:', distToBullet.toFixed(1), 'CollisionRadius:', collisionRadius.toFixed(1), 'BulletPos:', bullet.x.toFixed(0), bullet.y.toFixed(0), 'PlayerPos:', player.x.toFixed(0), player.y.toFixed(0));
        }
        
        if (playerInvincibleRef.current <= 0 && distToBullet < collisionRadius) {
          const bulletPolarity = bullet.polarity || 'light';
          const playerPolarity = polarityRef.current;
          
          // Boss bullets ignore polarity system - always damage
          if (bullet.isBossShot) {
            if (upgradesRef.current.shield && upgradesRef.current.shieldHits > 0) {
              upgradesRef.current.shieldHits--;
              upgradesRef.current.shieldRechargeTimer = 180;
              if (upgradesRef.current.shieldHits <= 0) {
                upgradesRef.current.shield = false;
              }
              createShieldImpact(bullet.x, bullet.y);
              createExplosion(bullet.x, bullet.y, 'small');
            } else {
              hitPlayer = true;
              createExplosion(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, 'large');
            }
            return false;
          }
          
          // Polarity system: absorb same-polarity bullets!
          if (bulletPolarity === playerPolarity) {
            // Absorb the bullet, charge special attack
            polarityAbsorbedRef.current = Math.min(POLARITY_MAX_ABSORB, polarityAbsorbedRef.current + 5);
            // Small absorb effect
            floatingTextsRef.current.push({
              x: bullet.x,
              y: bullet.y,
              text: '',
              color: playerPolarity === 'light' ? '#FFFFFF' : '#8B00FF',
              timer: 30
            });
            return false; // Remove bullet (absorbed)
          }
          
          // Opposite polarity - take damage
          if (upgradesRef.current.shield && upgradesRef.current.shieldHits > 0) {
            upgradesRef.current.shieldHits--;
            upgradesRef.current.shieldRechargeTimer = 180;
            if (upgradesRef.current.shieldHits <= 0) {
              upgradesRef.current.shield = false;
            }
            // Shield impact effect
            createShieldImpact(bullet.x, bullet.y);
            createExplosion(bullet.x, bullet.y, 'small');
          } else {
            hitPlayer = true;
            // Create player explosion
            createExplosion(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, 'large');
          }
          return false; // Remove bullet after hit
        }
        
        // === GRAZE SYSTEM: Check for near-misses (only if bullet didn't hit) ===
        // Graze zone: outside hitbox but within graze radius
        const grazeDistance = collisionRadius + GRAZE_RADIUS;
        const currentTime = Date.now();
        
        if (distToBullet >= collisionRadius && distToBullet < grazeDistance && 
            playerInvincibleRef.current <= 0 && !bullet.grazed) {
          // Mark bullet as grazed to prevent double-counting
          bullet.grazed = true;
          
          // Award graze
          const graze = grazeRef.current;
          graze.count++;
          graze.combo++;
          graze.comboTimer = 60; // 1 second combo window
          graze.displayTimer = 20;
          graze.meter = Math.min(GRAZE_METER_MAX, graze.meter + GRAZE_METER_GAIN);
          
          // Score with combo multiplier
          const grazeScore = GRAZE_SCORE * Math.min(graze.combo, 10);
          scoreRef.current += grazeScore;
          setScore(scoreRef.current);
          
          // Play graze sound (throttled)
          if (currentTime - graze.lastGrazeTime > GRAZE_COOLDOWN) {
            soundSystem.playGraze();
            graze.lastGrazeTime = currentTime;
          }
          
          // Visual feedback
          floatingTextsRef.current.push({
            x: bullet.x,
            y: bullet.y - 10,
            text: 'GRAZE',
            color: '#00ffff',
            timer: 25,
            vy: -1
          });
        }
        
        // Continue with regular bullet logic if not hit
        
        // Remove if off screen
        if (bullet.aimed || bullet.type === 'spiral' || bullet.type === 'wave' || bullet.type === 'sniper') {
          // These bullets can go any direction
          return bullet.x > -20 && bullet.x < GAME_WIDTH + 20 && 
                 bullet.y > -20 && bullet.y < GAME_HEIGHT + 20;
        } else if (bullet.fromBehind) {
          return bullet.x < GAME_WIDTH + ENEMY_BULLET_WIDTH;
        } else {
          return bullet.x > -ENEMY_BULLET_WIDTH;
        }
      });

      if (hitPlayer) {
        soundSystem.playPlayerDestroy();
        const newLives = livesRef.current - 1;
        setLives(newLives);
        livesRef.current = newLives;
        
        // Controller vibration on hit
        triggerGamepadVibration(0.7, 1.0, 300); // Strong vibration for player hit
        
        // Weapon level death penalty - lose 1 level (min level 1)
        const weapon = weaponLevelRef.current;
        if (weapon.level > 1) {
          weapon.level = Math.max(1, weapon.level - WEAPON_DEATH_PENALTY);
          weapon.xp = 0; // Reset XP
          floatingTextsRef.current.push({
            x: playerRef.current.x + PLAYER_WIDTH / 2,
            y: playerRef.current.y - 30,
            text: '#ff4444',
            timer: 60,
            vy: -1
          });
        }
        
        // Give player invincibility frames (about 2 seconds at 60fps)
        playerInvincibleRef.current = 120;
        
        // Trigger spawn glow animation on respawn
        playerSpawnGlowRef.current = 180;
        
        if (newLives <= 0) {
          // Game over
          triggerGamepadVibration(1.0, 1.0, 500); // Maximum vibration on game over
          handleGameOver();
        }
      }

      // Check bullet-enemy collisions
      bulletsRef.current = bulletsRef.current.filter(bullet => {
        let bulletHit = false;
        const bulletW = bullet.isWaveCannon ? bullet.size : BULLET_WIDTH;
        const bulletH = bullet.isWaveCannon ? bullet.size : BULLET_HEIGHT;
        const bulletX = bullet.isWaveCannon ? bullet.x - bullet.size / 2 : bullet.x;
        const bulletY = bullet.isWaveCannon ? bullet.y - bullet.size / 2 : bullet.y;
        let damage = bullet.damage || 1;
        
        // Polarity damage bonus: opposite polarity deals double damage
        const bulletPolarity = bullet.polarity || 'light';
        
        enemiesRef.current = enemiesRef.current.filter(enemy => {
          const ew = enemy.width || ENEMY_WIDTH;
          const eh = enemy.height || ENEMY_HEIGHT;
          if (checkCollision(
            { x: bulletX, y: bulletY, width: bulletW, height: bulletH },
            { x: enemy.x, y: enemy.y, width: ew, height: eh }
          )) {
            // All enemies have spawn invulnerability - skip damage
            if (enemy.spawnInvulnerable) {
              // Show deflect effect
              floatingTextsRef.current.push({
                x: enemy.x + ew / 2,
                y: enemy.y,
                text: '',
                color: '#00ffff',
                lifetime: 20,
                vy: -1
              });
              if (!bullet.isWaveCannon) bulletHit = true;
              return true; // Enemy survives
            }
            
            // Cloaked enemies can still be hit even when invisible
            if (enemy.type === 'cloaked') {
              enemy.revealTimer = 30; // Reveal briefly when hit
            }
            
            if (!bullet.isWaveCannon) bulletHit = true;
            
            // Calculate polarity damage modifier
            const enemyPolarity = enemy.polarity || 'light';
            const polarityMultiplier = (bulletPolarity !== enemyPolarity) ? 2 : 1;
            const finalDamage = damage * polarityMultiplier * (bullet.damage || 1);
            
            // Ship ability effects on hit
            if (bullet.canFreeze && Math.random() < shipAbilityRef.current.freezeChance) {
              // GLACIER: Freeze/slow the enemy
              enemy.frozen = true;
              enemy.frozenTimer = shipAbilityRef.current.freezeDuration;
              enemy.originalSpeed = enemy.speed || ENEMY_SPEED;
              enemy.speed = (enemy.speed || ENEMY_SPEED) * 0.3; // 70% slower
              floatingTextsRef.current.push({
                x: enemy.x + ew / 2,
                y: enemy.y - 10,
                text: '',
                color: '#88ffff',
                lifetime: 40,
                vy: -1
              });
            }
            
            if (bullet.canChain && Math.random() < shipAbilityRef.current.chainLightningChance) {
              // THUNDER: Chain lightning to nearby enemies
              const chainRange = 100;
              let closestEnemy = null;
              let closestDist = chainRange;
              
              enemiesRef.current.forEach(other => {
                if (other === enemy) return;
                const ox = other.x + (other.width || ENEMY_WIDTH) / 2;
                const oy = other.y + (other.height || ENEMY_HEIGHT) / 2;
                const dist = Math.sqrt((ox - (enemy.x + ew / 2)) ** 2 + (oy - (enemy.y + eh / 2)) ** 2);
                if (dist < closestDist) {
                  closestDist = dist;
                  closestEnemy = other;
                }
              });
              
              if (closestEnemy) {
                closestEnemy.health -= 0.5; // Chain damage
                // Create lightning effect
                electricityRef.current.push({
                  startX: enemy.x + ew / 2,
                  startY: enemy.y + eh / 2,
                  endX: closestEnemy.x + (closestEnemy.width || ENEMY_WIDTH) / 2,
                  endY: closestEnemy.y + (closestEnemy.height || ENEMY_HEIGHT) / 2,
                  lifetime: 10,
                  color: '#ffff00'
                });
                floatingTextsRef.current.push({
                  x: closestEnemy.x + (closestEnemy.width || ENEMY_WIDTH) / 2,
                  y: closestEnemy.y,
                  text: '',
                  color: '#ffff00',
                  lifetime: 25,
                  vy: -1
                });
              }
            }
            
            // Shielded enemies - shield absorbs damage first
            if (enemy.type === 'shielded' && enemy.shield > 0) {
              enemy.shield -= finalDamage;
              enemy.shieldFlash = 10; // Visual feedback
              createExplosion(bulletX, bulletY, 'small');
              createImpactParticles(bulletX, bulletY, '#00aaff', 5);
              createSparkParticles(bulletX, bulletY, 3, Math.PI);
              // Shield hit floating text
              floatingTextsRef.current.push({
                x: enemy.x + ew / 2,
                y: enemy.y,
                text: '',
                color: '#00aaff',
                lifetime: 20,
                vy: -1
              });
              if (enemy.shield <= 0) {
                // Shield broken!
                floatingTextsRef.current.push({
                  x: enemy.x + ew / 2,
                  y: enemy.y - 10,
                  text: '',
                  color: '#ff4444',
                  lifetime: 40,
                  vy: -1.5
                });
                triggerScreenShake(5, 8);
              }
              return true; // Enemy survives (shield took the hit)
            }
            
            // Apply damage to enemy
            enemy.health -= finalDamage;
            
            // Create impact particles based on bullet type
            const impactColor = bullet.isLaser ? '#ff00ff' : 
                               bullet.isWaveCannon ? '#00ffff' : 
                               bullet.polarity === 'RED' ? '#ff4444' : '#ffaa00';
            createImpactParticles(bulletX, bulletY, impactColor, 4 + Math.floor(finalDamage));
            
            // Add sparks for critical hits
            if (finalDamage > 2) {
              createSparkParticles(bulletX, bulletY, Math.floor(finalDamage * 1.5), Math.PI);
            }
            
            if (enemy.health > 0) {
              return true; // Enemy survives
            }
            
            // Suicide bomber explodes when killed
            if (enemy.type === 'bomber') {
              createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, 'large', true);
              triggerScreenShake(12, 15);
              soundSystem.playExplosion(0.6);
              // Damage nearby enemies in explosion radius
              const explosionX = enemy.x + ew / 2;
              const explosionY = enemy.y + eh / 2;
              enemiesRef.current.forEach(other => {
                if (other === enemy) return;
                const ox = other.x + (other.width || ENEMY_WIDTH) / 2;
                const oy = other.y + (other.height || ENEMY_HEIGHT) / 2;
                const dist = Math.sqrt((ox - explosionX) ** 2 + (oy - explosionY) ** 2);
                if (dist < enemy.explosionRadius) {
                  other.health -= 2; // Explosion damage
                }
              });
            }
            
            // Splitter spawns mini enemies when destroyed
            if (enemy.type === 'splitter' && !enemy.isMiniSplit) {
              const splitCount = enemy.splitCount || 2;
              for (let i = 0; i < splitCount; i++) {
                const angle = (i / splitCount) * Math.PI - Math.PI / 2; // Spread upward/downward
                const offsetX = Math.cos(angle) * 30;
                const offsetY = Math.sin(angle) * 30;
                
                // Create mini splitter (smaller, weaker version)
                const miniEnemy = {
                  x: enemy.x + offsetX,
                  y: enemy.y + eh / 2 + offsetY - ENEMY_HEIGHT / 2,
                  width: ENEMY_WIDTH * 0.7,
                  height: ENEMY_HEIGHT * 0.7,
                  type: 'splitter',
                  isMiniSplit: true, // Prevents infinite splitting
                  health: 1,
                  points: 15,
                  speedX: -ENEMY_SPEED * 0.8 + offsetX * 0.02,
                  speedY: offsetY * 0.03,
                  polarity: enemy.polarity,
                  spawnInvulnerable: true,
                  spawnInvulnerableTimer: 20, // Brief invulnerability
                };
                enemiesRef.current.push(miniEnemy);
              }
              
              // Visual feedback
              floatingTextsRef.current.push({
                x: enemy.x + ew / 2,
                y: enemy.y,
                text: '',
                color: '#ff8800',
                lifetime: 40,
                vy: -2
              });
              triggerScreenShake(6, 10);
            }
            
            // Mine explodes when destroyed (area damage)
            if (enemy.type === 'mine' && enemy.armed) {
              const explosionX = enemy.x + ew / 2;
              const explosionY = enemy.y + eh / 2;
              const radius = enemy.explosionRadius || 100;
              
              createExplosion(explosionX, explosionY, 'large', true);
              triggerScreenShake(10, 12);
              soundSystem.playExplosion(0.7);
              
              // Show explosion radius flash
              floatingTextsRef.current.push({
                x: explosionX,
                y: explosionY - 20,
                text: '',
                color: '#ff4400',
                lifetime: 30,
                vy: -2
              });
            }
            
            // Enemy destroyed - calculate chain combo
            const chain = chainRef.current;
            if (chain.type === enemyPolarity && chain.timer > 0) {
              // Continue chain
              chain.count++;
              chain.timer = 120; // Reset chain timer (2 seconds at 60fps)
              chain.multiplier = CHAIN_MULTIPLIERS[Math.min(chain.count - 1, CHAIN_MULTIPLIERS.length - 1)];
            } else {
              // Start new chain
              chain.count = 1;
              chain.type = enemyPolarity;
              chain.timer = 120;
              chain.multiplier = CHAIN_MULTIPLIERS[0];
            }
            
            // === BULLET CANCEL: Enemy bullets near this enemy become points ===
            const enemyCenterX = enemy.x + ew / 2;
            const enemyCenterY = enemy.y + eh / 2;
            const cancelRadius = Math.max(ew, eh) * 1.5; // Cancel bullets within enemy's area
            let bulletsCanceled = 0;
            
            enemyBulletsRef.current = enemyBulletsRef.current.filter(bullet => {
              const bulletCenterX = bullet.x + (bullet.width || ENEMY_BULLET_WIDTH) / 2;
              const bulletCenterY = bullet.y + (bullet.height || ENEMY_BULLET_HEIGHT) / 2;
              const dist = Math.hypot(bulletCenterX - enemyCenterX, bulletCenterY - enemyCenterY);
              
              if (dist < cancelRadius) {
                // Convert bullet to points
                const cancelPoints = 10;
                bulletCancelRef.current.particles.push({
                  x: bullet.x,
                  y: bullet.y,
                  timer: 25,
                  points: cancelPoints,
                  vx: (Math.random() - 0.5) * 2,
                  vy: -Math.random() * 2 - 1
                });
                scoreRef.current += cancelPoints;
                bulletsCanceled++;
                bulletCancelRef.current.totalCanceled++;
                return false; // Remove bullet
              }
              return true;
            });
            
            // Play cancel sound if bullets were canceled
            if (bulletsCanceled > 0) {
              soundSystem.playBulletCancel();
            }
            
            // Calculate score with chain multiplier
            const baseScore = enemy.points * polarityMultiplier;
            const chainBonus = chain.count > 1 ? chain.multiplier : 0;
            
            // Boost global score multiplier on kill
            scoreMultiplierRef.current = Math.min(MULTIPLIER_MAX, scoreMultiplierRef.current + MULTIPLIER_BOOST_PER_KILL);
            multiplierDecayTimerRef.current = MULTIPLIER_DECAY_DELAY;
            
            // Apply global multiplier to total score
            const totalScore = Math.floor((baseScore + chainBonus) * scoreMultiplierRef.current);
            
            const newScore = scoreRef.current + totalScore;
            setScore(newScore);
            scoreRef.current = newScore;
            
            // === WEAPON XP: Gain XP on enemy kills ===
            if (weaponLevelRef.current.level < 5) {
              weaponLevelRef.current.xp += WEAPON_XP_PER_KILL;
              const currentWeaponLevel = weaponLevelRef.current.level;
              const maxXPNeeded = WEAPON_LEVELS[currentWeaponLevel]?.xpToNext || 100;
              if (weaponLevelRef.current.xp >= maxXPNeeded) {
                weaponLevelRef.current.level = Math.min(5, weaponLevelRef.current.level + 1);
                weaponLevelRef.current.xp = 0;
                weaponLevelRef.current.levelUpTimer = 60;
                // Visual feedback for level up
                floatingTextsRef.current.push({
                  x: playerRef.current.x + PLAYER_WIDTH / 2,
                  y: playerRef.current.y - 30,
                  text: `WEAPON LV${weaponLevelRef.current.level}!`,
                  color: '#ffff00',
                  lifetime: 60,
                  vy: -1,
                  scale: 1.2
                });
                soundSystem.playWeaponLevelUp(weaponLevelRef.current.level);
              }
            }
            
            // Create explosion
            const explosionType = enemy.type === 'large' ? 'large' : (enemy.type === 'heavy' ? 'heavy' : 'normal');
            createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, explosionType, !bullet.isWaveCannon);
            
            // Chance to drop power-up
            if (Math.random() < POWERUP_DROP_CHANCE) {
              spawnPowerup(enemy.x, enemy.y);
            }
            
            return false;
          }
          return true;
        });
        
        // Piercing bullets (weapon level 5) pass through enemies
        if (bullet.isPiercing && bulletHit) {
          return true; // Keep the bullet even though it hit
        }
        return !bulletHit;
      });

      // Check missile-enemy collisions
      missilesRef.current = missilesRef.current.filter(missile => {
        let missileHit = false;
        
        enemiesRef.current = enemiesRef.current.filter(enemy => {
          const ew = enemy.width || ENEMY_WIDTH;
          const eh = enemy.height || ENEMY_HEIGHT;
          if (checkCollision(
            { x: missile.x, y: missile.y, width: MISSILE_WIDTH, height: MISSILE_HEIGHT },
            { x: enemy.x, y: enemy.y, width: ew, height: eh }
          )) {
            missileHit = true;
            const newScore = scoreRef.current + enemy.points * 2; // Bonus for missile kills
            setScore(newScore);
            scoreRef.current = newScore;
            
            // Track kills for wave progression
            waveKillsRef.current++;
            sessionStatsRef.current.kills++;
            
            // === KILL CHAIN COMBO SYSTEM ===
            const kc = killChainRef.current;
            kc.count++;
            kc.timer = KILL_CHAIN_TIMEOUT; // Reset timer
            kc.multiplier = Math.min(5.0, 1.0 + kc.count * KILL_CHAIN_MULTIPLIER_STEP);
            kc.pulseTimer = 10; // Visual pulse
            
            // Apply kill chain multiplier to missile score
            const chainBonus = Math.floor(enemy.points * (kc.multiplier - 1.0));
            if (chainBonus > 0) {
              scoreRef.current += chainBonus;
              setScore(scoreRef.current);
              
              // Show chain bonus
              floatingTextsRef.current.push({
                x: enemy.x + ew / 2,
                y: enemy.y - 25,
                text: `CHAIN x${kc.multiplier.toFixed(1)}`,
                color: '#ffff00',
                timer: 40,
                vy: -0.5
              });
            }
            
            // Create big fiery missile explosion - keep particle effect for missiles
            createExplosion(enemy.x + ew / 2, enemy.y + eh / 2, 'missile', false);
            
            // Higher chance to drop power-up from missile kills
            if (Math.random() < POWERUP_DROP_CHANCE * 1.5) {
              spawnPowerup(enemy.x, enemy.y);
            }
            
            return false;
          }
          return true;
        });
        
        return !missileHit;
      });
      }
      
      render(ctx, timestamp);
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };


    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="game-container">
      <h1 className="game-title">{'\ud83d\ude80'} NEBULA X</h1>
      <div className="game-wrapper">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="game-canvas"
        />
        
        {/* Brand Screen */}
        {gameState === 'brand' && (
          <div 
            className={`overlay brand-overlay ${brandFadingOut ? 'fade-out' : ''}`}
            onClick={() => {
              if (!brandFadingOut) {
                soundSystem.init();
                soundSystem.resume();
                setBrandFadingOut(true);
                setTimeout(() => {
                  setGameState('cinematic');
                  gameStateRef.current = 'cinematic';
                  setBrandFadingOut(false);
                }, 800);
              }
            }}
            style={{
              backgroundColor: '#000000',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: brandFadingOut ? 'default' : 'pointer'
            }}
          >
            <img 
              src={asset('nebulamedia.png')}
              alt="Nebula Media"
              className="brand-logo"
              style={{
                maxWidth: '400px',
                maxHeight: '300px',
                objectFit: 'contain',
                animation: 'brandFadeIn 1.5s ease-out forwards'
              }}
              onLoad={() => {
                // Play brand whoosh sound
                const brandSound = new Audio(asset('mixkit-magic-sparkle-whoosh-2350.mp3'));
                brandSound.volume = 0.5;
                brandSound.play().catch(() => {});
                
                // Auto-transition to cinematic after 3 seconds with fade
                setTimeout(() => {
                  if (gameStateRef.current === 'brand' && !brandFadingOut) {
                    soundSystem.init();
                    soundSystem.resume();
                    setBrandFadingOut(true);
                    setTimeout(() => {
                      setGameState('cinematic');
                      gameStateRef.current = 'cinematic';
                      setBrandFadingOut(false);
                    }, 800);
                  }
                }, 3000);
              }}
            />
            <p style={{
              color: '#666666',
              fontFamily: 'monospace',
              fontSize: '12px',
              marginTop: '40px',
              animation: 'brandFadeIn 2s ease-out 0.5s forwards',
              opacity: 0
            }}>CLICK TO CONTINUE</p>
          </div>
        )}
        
        {/* Cinematic Video Screen */}
        {gameState === 'cinematic' && (
          <div 
            className={`overlay cinematic-overlay ${cinematicFadingOut ? 'fade-out' : ''}`}
            style={{
              backgroundColor: '#000000',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: cinematicFadingOut ? 'default' : 'pointer'
            }}
          >
            <video
              autoPlay
              playsInline
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onEnded={() => {
                if (!cinematicFadingOut) {
                  setCinematicFadingOut(true);
                  setTimeout(() => {
                    setGameState('splash');
                    gameStateRef.current = 'splash';
                    setCinematicFadingOut(false);
                  }, 800);
                }
              }}
              onClick={() => {
                if (!cinematicFadingOut) {
                  setCinematicFadingOut(true);
                  setTimeout(() => {
                    setGameState('splash');
                    gameStateRef.current = 'splash';
                    setCinematicFadingOut(false);
                  }, 800);
                }
              }}
            >
              <source src={asset('Nebula%20X%20Cinematic.mp4')} type="video/mp4" />
            </video>
            <p style={{
              color: '#666666',
              fontFamily: 'monospace',
              fontSize: '12px',
              marginTop: '20px',
              position: 'absolute',
              bottom: '30px',
              animation: 'fadeFromBlack 1s ease-in 1s both'
            }}>CLICK TO SKIP</p>
          </div>
        )}
        
        {/* Splash Screen */}
        {gameState === 'splash' && (
          <div 
            className={`overlay splash-overlay ${splashFadingOut ? 'fade-out' : ''}`}
            onClick={() => {
              if (!splashFadingOut) {
                const chimeSound = new Audio(asset('mixkit-crystal-chime-3108.mp3'));
                chimeSound.volume = 0.6;
                chimeSound.play().catch(() => {});
                soundSystem.init();
                soundSystem.resume();
                setSplashFadingOut(true);
                setTimeout(() => {
                  setGameState('menu');
                  setSplashFadingOut(false);
                }, 800);
              }
            }}
            style={{
              backgroundImage: `url(${asset('nebulax-bg.png')})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: splashFadingOut ? 'default' : 'pointer'
            }}
          >
            <div className="splash-content">
              <h1 className="splash-title">NEBULA X</h1>
              <p className="splash-subtitle">A Space Odyssey</p>
              <div className="splash-prompt">
                <span className="blink">PRESS ANY BUTTON TO START</span>
              </div>
              <div className="splash-hints">
                <span>🎮 Controller Supported</span>
                <span>⌨️ Keyboard Ready</span>
              </div>
            </div>
            <div className="splash-footer">
              <span>Â© 2024 NEBULA X</span>
              <span>R-TYPE INSPIRED</span>
            </div>
          </div>
        )}
        
        {gameState === 'menu' && !showSettings && !showCustomize && (
          <div 
            className="overlay menu-overlay split-screen-menu"
            style={{
              background: `linear-gradient(180deg, rgba(5, 5, 25, 0.9) 0%, rgba(10, 20, 50, 0.75) 50%, rgba(5, 5, 25, 0.9) 100%), url(${asset('nebulax-bg.png')})`
            }}
          >
            <div className="menu-background">
              {/* Animated stars */}
              <div className="star-field">
                {[...Array(50)].map((_, i) => (
                  <div key={i} className={`menu-star star-${(i % 3) + 1}`} style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`
                  }} />
                ))}
              </div>
              {/* Nebula clouds with parallax */}
              <div className="nebula-cloud cloud-1 parallax-slow"></div>
              <div className="nebula-cloud cloud-2 parallax-slow"></div>
              <div className="nebula-cloud cloud-3 parallax-medium"></div>
              {/* Scan lines overlay */}
              <div className="scan-lines"></div>
            </div>

            {/* LEFT PANEL - 40% */}
            <div className="menu-left-panel">
              <div className="parallax-layer parallax-medium">
                {/* Large Ship Preview */}
                <div className="ship-showcase">
                  <div className="ship-showcase-glow"></div>
                  <div className="ship-showcase-icon">
                    <span 
                      style={{
                        filter: (() => {
                          const colorObj = AVATAR_COLORS.find(c => c.color === userSettings.avatarColor);
                          return `drop-shadow(0 0 20px ${colorObj?.glow || 'rgba(0, 255, 136, 0.8)'})`;
                        })()
                      }}
                    >{AVATAR_OPTIONS[userSettings.avatar]?.icon || '🚀'}</span>
                  </div>
                  <div className="ship-showcase-particles">
                    {[...Array(8)].map((_, i) => (
                      <div 
                        key={i} 
                        className="showcase-particle" 
                        style={{ 
                          '--i': i,
                          background: userSettings.avatarColor || '#00ff88'
                        }}
                      ></div>
                    ))}
                  </div>
                  <div className="ship-showcase-label">
                    <span className="ship-name">{AVATAR_OPTIONS[userSettings.avatar]?.name || 'R-9A ARROWHEAD'}</span>
                    <span className="ship-class">CLASS: {(AVATAR_OPTIONS[userSettings.avatar]?.rarity || 'standard').toUpperCase()}</span>
                  </div>
                </div>

                {/* Enhanced Player Profile Display */}
                <div className={`menu-profile split-profile rarity-${AVATAR_OPTIONS[userSettings.avatar]?.rarity || 'common'}`}>
                <div className="profile-avatar-frame">
                  <div 
                    className="avatar-ring"
                    style={{
                      borderColor: (() => {
                        const colorObj = AVATAR_COLORS.find(c => c.color === userSettings.avatarColor);
                        return colorObj?.glow || 'rgba(0, 255, 136, 0.5)';
                      })()
                    }}
                  ></div>
                  <div 
                    className="avatar-ring ring-2"
                    style={{
                      borderColor: (() => {
                        const colorObj = AVATAR_COLORS.find(c => c.color === userSettings.avatarColor);
                        const glow = colorObj?.glow || 'rgba(0, 255, 136, 0.3)';
                        // Reduce opacity for ring-2
                        return glow.replace(/[\d.]+\)$/, '0.3)');
                      })()
                    }}
                  ></div>
                  <div className="avatar-particles">
                    {[...Array(6)].map((_, i) => (
                      <div 
                        key={i} 
                        className="avatar-particle" 
                        style={{ 
                          '--i': i,
                          background: userSettings.avatarColor || '#00ff88',
                          boxShadow: (() => {
                            const colorObj = AVATAR_COLORS.find(c => c.color === userSettings.avatarColor);
                            return `0 0 6px ${colorObj?.glow || 'rgba(0, 255, 136, 0.6)'}`;
                          })()
                        }}
                      ></div>
                    ))}
                  </div>
                  <span 
                    className="profile-avatar"
                    style={{
                      filter: (() => {
                        const colorObj = AVATAR_COLORS.find(c => c.color === userSettings.avatarColor);
                        return `drop-shadow(0 0 8px ${colorObj?.glow || 'rgba(0, 255, 136, 0.6)'})`;
                      })()
                    }}
                  >{AVATAR_OPTIONS[userSettings.avatar]?.icon || '🚀'}</span>
                </div>
                <div className="profile-info">
                  <span 
                    className="profile-name"
                    style={{
                      background: userSettings.avatarColor?.includes('gradient') ? userSettings.avatarColor : 'transparent',
                      color: userSettings.avatarColor?.includes('gradient') ? 'transparent' : (userSettings.avatarColor || '#00ff88'),
                      WebkitBackgroundClip: userSettings.avatarColor?.includes('gradient') ? 'text' : 'unset',
                      backgroundClip: userSettings.avatarColor?.includes('gradient') ? 'text' : 'unset'
                    }}
                  >{userSettings.playerName || 'PILOT'}</span>
                  <div className="profile-rank" style={{ color: getRankTitle(highScore).color }}>
                    <span className="rank-icon">{getRankTitle(highScore).icon}</span>
                    <span className="rank-title">{getRankTitle(highScore).title}</span>
                  </div>
                </div>
              </div>
              
              <div className="menu-stats split-stats">
                <div className="stat-box">
                  <span className="stat-icon">🏆</span>
                  <span className="stat-label">HIGH SCORE</span>
                  <span className="stat-value">{highScore.toLocaleString()}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-icon">🎯</span>
                  <span className="stat-label">BEST WAVE</span>
                  <span className="stat-value">{Math.max(1, Math.floor(highScore / 500))}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-icon">💰</span>
                  <span className="stat-label">CREDITS</span>
                  <span className="stat-value">{(highScore * 10).toLocaleString()}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-icon">⚡</span>
                  <span className="stat-label">PLAYTIME</span>
                  <span className="stat-value">{Math.floor(highScore / 100)}h</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - 60% */}
          <div className="menu-right-panel">
            <div className="parallax-layer parallax-fast">
              {/* Logo at top */}
              <div className="logo-container split-logo">
                <div className="logo-glow"></div>
                <h1 className="menu-logo">NEBULA X</h1>
                <p className="menu-tagline">SIDE-SCROLLING SPACE SHOOTER</p>
                <div className="logo-underline"></div>
              </div>

              {/* Menu buttons */}
              <div className="menu-buttons split-buttons">
                <button 
                  onClick={() => {
                    const selectSound = new Audio(asset('mixkit-arcade-player-select-2036.mp3'));
                    selectSound.volume = 0.6;
                    selectSound.play().catch(() => {});
                    setGameMode('campaign');
                    startGame();
                  }} 
                  className={`start-button ${menuSelection === 0 ? 'gamepad-selected' : ''}`}
                  onMouseEnter={() => setMenuSelection(0)}
                >
                  <span className="btn-icon">🚀</span> NEW MISSION
                  <span className="btn-shine"></span>
                </button>
                {hasSaveGame() && (
                  <button 
                    onClick={() => { soundSystem.playUISparkle(); loadGame(); }} 
                    className={`start-button continue-button ${menuSelection === 1 ? 'gamepad-selected' : ''}`}
                    onMouseEnter={() => setMenuSelection(1)}
                  >
                    <span className="btn-icon">▶️</span> CONTINUE
                    <span className="btn-shine"></span>
                  </button>
                )}
                {gameBeaten && (
                  <button 
                    onClick={() => { soundSystem.playUISparkle(); setShowChallenges(true); }} 
                    className={`start-button challenge-button ${menuSelection === (hasSaveGame() ? 2 : 1) ? 'gamepad-selected' : ''}`}
                    onMouseEnter={() => setMenuSelection(hasSaveGame() ? 2 : 1)}
                  >
                    <span className="btn-icon">⭐</span> CHALLENGE MODES
                    <span className="btn-shine"></span>
                  </button>
                )}
                <button 
                  onClick={() => { soundSystem.playUISparkle(); setShowCustomize(true); }} 
                  className={`settings-button customize-button ${menuSelection === (hasSaveGame() ? (gameBeaten ? 3 : 2) : (gameBeaten ? 2 : 1)) ? 'gamepad-selected' : ''}`}
                  onMouseEnter={() => setMenuSelection(hasSaveGame() ? (gameBeaten ? 3 : 2) : (gameBeaten ? 2 : 1))}
                >
                  <span className="btn-icon">🛸</span> CUSTOMIZE
                </button>
                <button 
                  onClick={() => { soundSystem.playUISparkle(); setShowPracticeMode(true); }} 
                  className={`settings-button practice-button ${menuSelection === (hasSaveGame() ? (gameBeaten ? 4 : 3) : (gameBeaten ? 3 : 2)) ? 'gamepad-selected' : ''}`}
                  onMouseEnter={() => setMenuSelection(hasSaveGame() ? (gameBeaten ? 4 : 3) : (gameBeaten ? 3 : 2))}
                >
                  <span className="btn-icon">🎯</span> PRACTICE
                </button>
                <button 
                  onClick={() => { soundSystem.playUISparkle(); setShowSettings(true); }} 
                  className={`settings-button ${menuSelection === (hasSaveGame() ? (gameBeaten ? 5 : 4) : (gameBeaten ? 4 : 3)) ? 'gamepad-selected' : ''}`}
                  onMouseEnter={() => setMenuSelection(hasSaveGame() ? (gameBeaten ? 5 : 4) : (gameBeaten ? 4 : 3))}
                >
                  <span className="btn-icon">⚙️</span> SETTINGS
                </button>
              </div>
              
              <p className="start-hint split-hint">🎮 D-Pad to navigate • ✓ to select • ENTER to start</p>
              
              {/* Decorative bottom */}
              <div className="menu-footer split-footer">
                <span className="version">v1.0</span>
                <span className="divider">•</span>
                <span className="credit">R-TYPE INSPIRED</span>
              </div>
            </div>
          </div>

          {/* Vertical divider between panels */}
          <div className="split-divider"></div>
            
            {/* Challenge Modes Modal */}
            {showChallenges && (
              <div className="challenge-modal-overlay">
                <div className="challenge-modal">
                  <h2>🎯 CHALLENGE MODES</h2>
                  <p className="challenge-subtitle">Unlocked for defeating the Nexus Core!</p>
                  
                  <div className="challenge-options">
                    <button 
                      className="challenge-option survival-mode"
                      onClick={() => {
                        soundSystem.playUISparkle();
                        setGameMode('survival');
                        setShowChallenges(false);
                        startGame();
                      }}
                    >
                      <div className="challenge-icon">💀</div>
                      <div className="challenge-info">
                        <h3>SURVIVAL MODE</h3>
                        <p>Endless waves with 1 life. How long can you survive?</p>
                        <span className="challenge-detail">Starts at Wave 5 ↩• No continues</span>
                      </div>
                    </button>
                    
                    <button 
                      className="challenge-option bossrush-mode"
                      onClick={() => {
                        soundSystem.playUISparkle();
                        setGameMode('bossRush');
                        setShowChallenges(false);
                        startGame();
                      }}
                    >
                      <div className="challenge-icon">⏱️</div>
                      <div className="challenge-info">
                        <h3>BOSS RUSH</h3>
                        <p>Face all bosses back-to-back. No mercy!</p>
                        <span className="challenge-detail">Bosses only ↩• Limited healing</span>
                      </div>
                    </button>
                    
                    <button 
                      className="challenge-option timeattack-mode"
                      onClick={() => {
                        soundSystem.playUISparkle();
                        setGameMode('timeAttack');
                        setShowChallenges(false);
                        startGame();
                      }}
                    >
                      <div className="challenge-icon">⏱️</div>
                      <div className="challenge-info">
                        <h3>TIME ATTACK</h3>
                        <p>Complete 10 waves as fast as possible!</p>
                        <span className="challenge-detail">Race against the clock ↩• Leaderboard ready</span>
                      </div>
                    </button>
                  </div>
                  
                  <button 
                    className="challenge-back"
                    onClick={() => setShowChallenges(false)}
                  >
                    ◀ BACK TO MENU
                  </button>
                </div>
              </div>
            )}
            
            {/* Practice Mode Modal */}
            {showPracticeMode && (
              <div className="challenge-modal-overlay">
                <div className="challenge-modal practice-modal">
                  <h2>PRACTICE MODE</h2>
                  <p className="challenge-subtitle">Learn patterns and improve your skills!</p>
                  
                  <div className="practice-settings">
                    <div className="practice-setting">
                      <label>Starting Wave</label>
                      <div className="wave-selector">
                        <button 
                          className="wave-btn"
                          onClick={() => setPracticeSettings(prev => ({ 
                            ...prev, 
                            startWave: Math.max(1, prev.startWave - 1) 
                          }))}
                        >-</button>
                        <span className="wave-display">WAVE {practiceSettings.startWave}</span>
                        <button 
                          className="wave-btn"
                          onClick={() => {
                            const maxWave = parseInt(localStorage.getItem('nebulaXHighestWave') || '1', 10);
                            setPracticeSettings(prev => ({ 
                              ...prev, 
                              startWave: Math.min(Math.max(maxWave, 20), prev.startWave + 1)
                            }));
                          }}
                        >+</button>
                      </div>
                      <span className="setting-hint">Highest reached: Wave {parseInt(localStorage.getItem('nebulaXHighestWave') || '1', 10)}</span>
                    </div>
                    
                    <div className="practice-toggles">
                      <label className="toggle-option">
                        <input 
                          type="checkbox" 
                          checked={practiceSettings.infiniteLives}
                          onChange={(e) => setPracticeSettings(prev => ({ ...prev, infiniteLives: e.target.checked }))}
                        />
                        <span className="toggle-label">Infinite Lives</span>
                        <span className="toggle-desc">Never game over</span>
                      </label>
                      
                      <label className="toggle-option">
                        <input 
                          type="checkbox" 
                          checked={practiceSettings.invincible}
                          onChange={(e) => setPracticeSettings(prev => ({ ...prev, invincible: e.target.checked }))}
                        />
                        <span className="toggle-label">Invincibility</span>
                        <span className="toggle-desc">Cannot take damage</span>
                      </label>
                      
                      <label className="toggle-option">
                        <input 
                          type="checkbox" 
                          checked={practiceSettings.maxPower}
                          onChange={(e) => setPracticeSettings(prev => ({ ...prev, maxPower: e.target.checked }))}
                        />
                        <span className="toggle-label">Max Power</span>
                        <span className="toggle-desc">Start fully upgraded</span>
                      </label>
                      
                      <label className="toggle-option">
                        <input 
                          type="checkbox" 
                          checked={practiceSettings.slowBullets}
                          onChange={(e) => setPracticeSettings(prev => ({ ...prev, slowBullets: e.target.checked }))}
                        />
                        <span className="toggle-label">Slow Bullets</span>
                        <span className="toggle-desc">Enemy bullets move 50% slower</span>
                      </label>
                      
                      <label className="toggle-option">
                        <input 
                          type="checkbox" 
                          checked={practiceSettings.showHitboxes}
                          onChange={(e) => setPracticeSettings(prev => ({ ...prev, showHitboxes: e.target.checked }))}
                        />
                        <span className="toggle-label">Show Hitboxes</span>
                        <span className="toggle-desc">Display collision areas</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="practice-actions">
                    <button 
                      className="challenge-option practice-start"
                      onClick={() => {
                        soundSystem.playUISparkle();
                        practiceSettingsRef.current = { ...practiceSettings };
                        setGameMode('practice');
                        setShowPracticeMode(false);
                        startGame();
                      }}
                    >
                      <div className="challenge-icon">START</div>
                      <div className="challenge-info">
                        <h3>START PRACTICE</h3>
                        <p>Begin training at Wave {practiceSettings.startWave}</p>
                      </div>
                    </button>
                  </div>
                  
                  <button 
                    className="challenge-back"
                    onClick={() => setShowPracticeMode(false)}
                  >
                    BACK TO MENU
                  </button>
                  
                  <p className="practice-note">Practice mode scores are not saved</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {gameState === 'menu' && showSettings && (
          <div className="overlay settings-overlay">
            <h2>⚙️ SETTINGS</h2>
            
            {/* Settings Tabs */}
            <div className="settings-tabs">
              <button 
                className={`settings-tab ${settingsTab === 'audio' ? 'active' : ''}`}
                onClick={() => setSettingsTab('audio')}
              >
                Å  Audio
              </button>
              <button 
                className={`settings-tab ${settingsTab === 'profile' ? 'active' : ''}`}
                onClick={() => setSettingsTab('profile')}
              >
                👤 Profile
              </button>
              <button 
                className={`settings-tab ${settingsTab === 'controls' ? 'active' : ''}`}
                onClick={() => setSettingsTab('controls')}
              >
                🎮 Controls
              </button>
              <button 
                className={`settings-tab ${settingsTab === 'achievements' ? 'active' : ''}`}
                onClick={() => setSettingsTab('achievements')}
              >
                🏆 Achievements
              </button>
            </div>
            
            <div className="settings-content">
              {/* Audio Tab */}
              {settingsTab === 'audio' && (
                <div className="settings-audio">
                  <div className="volume-control">
                    <label>Å  Master Volume</label>
                    <div className="slider-row">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={userSettings.masterVolume}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, masterVolume: parseInt(e.target.value) }))}
                        className="volume-slider"
                      />
                      <span className="volume-value">{userSettings.masterVolume}%</span>
                    </div>
                  </div>
                  <div className="volume-control">
                    <label>🎵 Music Volume</label>
                    <div className="slider-row">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={userSettings.musicVolume}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, musicVolume: parseInt(e.target.value) }))}
                        className="volume-slider"
                      />
                      <span className="volume-value">{userSettings.musicVolume}%</span>
                    </div>
                  </div>
                  <div className="volume-control">
                    <label>🔊 SFX Volume</label>
                    <div className="slider-row">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={userSettings.sfxVolume}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, sfxVolume: parseInt(e.target.value) }))}
                        className="volume-slider"
                      />
                      <span className="volume-value">{userSettings.sfxVolume}%</span>
                    </div>
                  </div>
                  <button 
                    className="test-sound-button"
                    onClick={() => soundSystem.playShoot()}
                  >
                    🔊 Test Sound
                  </button>
                  
                  <div className="performance-section">
                    <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#00ffff' }}>⚡ PERFORMANCE</h4>
                    <div className="toggle-option">
                      <label className="toggle-label">
                        <span>⚡ Performance Mode</span>
                        <span className="toggle-desc">Reduce visual effects for smoother gameplay</span>
                      </label>
                      <button 
                        className={`toggle-button ${userSettings.performanceMode ? 'active' : ''}`}
                        onClick={() => setUserSettings(prev => ({ ...prev, performanceMode: !prev.performanceMode }))}
                      >
                        {userSettings.performanceMode ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div className="toggle-option">
                      <label className="toggle-label">
                        <span>🔊 Show FPS</span>
                        <span className="toggle-desc">Display frames per second counter</span>
                      </label>
                      <button 
                        className={`toggle-button ${userSettings.showFPS ? 'active' : ''}`}
                        onClick={() => setUserSettings(prev => ({ ...prev, showFPS: !prev.showFPS }))}
                      >
                        {userSettings.showFPS ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Profile Tab */}
              {settingsTab === 'profile' && (
                <div className="settings-profile">
                  <div className="profile-name-section">
                    <label>✏️ Pilot Name</label>
                    <input 
                      type="text" 
                      value={userSettings.playerName}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, playerName: e.target.value.toUpperCase().slice(0, 12) }))}
                      className="name-input"
                      maxLength={12}
                      placeholder="ENTER NAME"
                    />
                  </div>
                  <div className="avatar-section">
                    <label>🚀 Avatar</label>
                    <div className="avatar-grid">
                      {AVATAR_OPTIONS.map(avatar => (
                        <button
                          key={avatar.id}
                          className={`avatar-option rarity-${avatar.rarity} ${userSettings.avatar === avatar.id ? 'selected' : ''}`}
                          onClick={() => setUserSettings(prev => ({ ...prev, avatar: avatar.id }))}
                          title={`${avatar.name} (${avatar.rarity.toUpperCase()})`}
                          style={userSettings.avatar === avatar.id ? { 
                            borderColor: userSettings.avatarColor,
                            boxShadow: `0 0 12px ${userSettings.avatarColor}40`
                          } : {}}
                        >
                          <span className="avatar-icon">{avatar.icon}</span>
                        </button>
                      ))}
                    </div>
                    <div className="rarity-legend">
                      <span className="legend-item common">? Common</span>
                      <span className="legend-item uncommon">? Uncommon</span>
                      <span className="legend-item rare">? Rare</span>
                      <span className="legend-item epic">? Epic</span>
                      <span className="legend-item legendary">? Legendary</span>
                    </div>
                  </div>
                  <div className="avatar-color-section">
                    <label>? Avatar Color</label>
                    <div className="color-grid">
                      {AVATAR_COLORS.map(colorOption => (
                        <button
                          key={colorOption.id}
                          className={`color-option ${userSettings.avatarColor === colorOption.color ? 'selected' : ''} ${colorOption.special ? 'special-gradient' : ''}`}
                          onClick={() => setUserSettings(prev => ({ ...prev, avatarColor: colorOption.color }))}
                          title={colorOption.name}
                          style={{ 
                            background: colorOption.color,
                            borderColor: userSettings.avatarColor === colorOption.color ? '#ffffff' : 'transparent',
                            boxShadow: userSettings.avatarColor === colorOption.color && colorOption.glow ? `0 0 12px ${colorOption.glow}` : 'none'
                          }}
                        >
                          {userSettings.avatarColor === colorOption.color && <span className="color-check">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="profile-preview">
                    <span className="preview-label">Preview:</span>
                    <div 
                      className={`preview-card rarity-${AVATAR_OPTIONS[userSettings.avatar]?.rarity || 'common'}`}
                      style={{ 
                        borderColor: userSettings.avatarColor,
                        boxShadow: `0 0 20px ${userSettings.avatarColor}40`
                      }}
                    >
                      <div 
                        className="preview-avatar-wrapper"
                        style={{ 
                          background: `${userSettings.avatarColor}22`,
                          borderColor: userSettings.avatarColor
                        }}
                      >
                        <span className="preview-avatar">{AVATAR_OPTIONS[userSettings.avatar]?.icon}</span>
                      </div>
                      <div className="preview-info">
                        <span className="preview-name" style={{ color: userSettings.avatarColor }}>
                          {userSettings.playerName || 'PILOT'}
                        </span>
                        <span className="preview-rank" style={{ color: getRankTitle(highScore).color }}>
                          {getRankTitle(highScore).icon} {getRankTitle(highScore).title}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Controls Tab */}
              {settingsTab === 'controls' && (
                <>
                  <div className="controls-section">
                    <h3>⌨️ Keyboard</h3>
                    <div className="controls-info">
                      <p>↩ Â↩ ↩ ↩  / WASD - Move</p>
                      <p>SPACE - Shoot</p>
                      <p>Q - Dash (while moving)</p>
                      <p>B - Bomb (screen clear)</p>
                      <p>C - Toggle Polarity</p>
                      <p>SHIFT - Wave Cannon</p>
                      <p>L - Laser Beam (↩°👥3 Rapid)</p>
                      <p>M - Missile</p>
                      <p>F - Force Toggle</p>
                      <p>G - Force Shield (Lv4+)</p>
                      <p>[ ] - Speed Setting</p>
                      <p>ESC - Pause</p>
                    </div>
                  </div>
                  <div className="controls-section">
                    <h3>🎮 Xbox Controller</h3>
                    <div className="controls-info">
                      <p><strong>Movement:</strong></p>
                      <p>  Left Stick / D-Pad - Move Ship</p>
                      <p><strong>Combat:</strong></p>
                      <p>  A / RB / RT - Shoot</p>
                      <p>  X - Missile</p>
                      <p>  Y - Laser Beam (Lv3+ Rapid Fire)</p>
                      <p>  LT (Hold) - Wave Cannon Charge</p>
                      <p>  LS / RS Click - Dash</p>
                      <p><strong>Force Pod:</strong></p>
                      <p>  B - Force Toggle (Front/Back/Free)</p>
                      <p><strong>Polarity System:</strong></p>
                      <p>  LB - Toggle Light/Dark</p>
                      <p>  Right Stick ← → - Quick Toggle</p>
                      <p><strong>Special:</strong></p>
                      <p>  View Button - Bomb (Screen Clear)</p>
                      <p>  Menu Button - Pause Game</p>
                    </div>
                  </div>
                  <div className="controls-section">
                    <h3>🎮 PlayStation Controller</h3>
                    <div className="controls-info">
                      <p><strong>Movement:</strong></p>
                      <p>  Left Stick / D-Pad - Move Ship</p>
                      <p><strong>Combat:</strong></p>
                      <p>  ✕ / R1 / R2 - Shoot</p>
                      <p>  □ - Missile</p>
                      <p>  △ - Laser Beam (Lv3+ Rapid Fire)</p>
                      <p>  L2 (Hold) - Wave Cannon Charge</p>
                      <p>  L3 / R3 Click - Dash</p>
                      <p><strong>Force Pod:</strong></p>
                      <p>  ○ - Force Toggle (Front/Back/Free)</p>
                      <p><strong>Polarity System:</strong></p>
                      <p>  L1 - Toggle Light/Dark</p>
                      <p>  Right Stick ← → - Quick Toggle</p>
                      <p><strong>Special:</strong></p>
                      <p>  Share Button - Bomb (Screen Clear)</p>
                      <p>  Options Button - Pause Game</p>
                    </div>
                  </div>
                  <div className="powerups-section">
                    <h3>💎 Power-Ups</h3>
                    <div className="powerup-info">
                      <p>« Rapid Fire - Faster shooting (↩°👥3 = LASER!)</p>
                      <p>💥 Missiles - Homing missiles</p>
                      <p>{'\ud83d\udee1\ufe0f'} Shield - Block 3 hits (stacks to 9)</p>
                      <p>Âµ Force - Follows movement!</p>
                    </div>
                  </div>
                </>
              )}

              {/* Achievements Tab */}
              {settingsTab === 'achievements' && (
                <div className="achievements-section">
                  <div className="achievements-header">
                    <span>🏆 {unlockedAchievements.length} / {ACHIEVEMENTS.length} Unlocked</span>
                  </div>
                  <div className="achievements-grid">
                    {ACHIEVEMENTS.map(achievement => {
                      const isUnlocked = unlockedAchievements.includes(achievement.id);
                      return (
                        <div 
                          key={achievement.id} 
                          className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                        >
                          <div className="achievement-card-icon">
                            {isUnlocked ? '🏆' : ''}
                          </div>
                          <div className="achievement-card-info">
                            <div className="achievement-card-name">
                              {isUnlocked ? achievement.name : ''}
                            </div>
                            <div className="achievement-card-desc">
                              {isUnlocked ? achievement.description : 'Keep playing to unlock!'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="settings-buttons-row">
              <button onClick={() => setShowSettings(false)} className="back-button">
                ◀ BACK
              </button>
              <button onClick={() => { soundSystem.playUISparkle(); setShowSettings(false); }} className="settings-ok-button">
                ✓ OK
              </button>
            </div>
            <p className="start-hint">{'\ud83c\udfae'} Press {'\u274c'} or {'\ud83d\udd19'} to go back</p>
          </div>
        )}
        
        {(gameState === 'menu' || gameState === 'checkpoint') && showCustomize && (
          <div className="overlay customize-overlay">
            <h2>🚀 SHIP HANGAR</h2>
            <div className="customize-layout">
              {/* Ship Preview Section */}
              <div className="customize-preview-section">
                <div className="ship-preview-large">
                  <div className="preview-glow" style={{ backgroundColor: SHIP_DESIGNS[selectedShip].colors.glow + '22' }}></div>
                  <canvas 
                    ref={(canvas) => {
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        const ship = SHIP_DESIGNS[selectedShip];
                        const centerX = 140;
                        const centerY = 90;
                        const scale = 3.5;
                        const boosterOpt = BOOSTER_OPTIONS[shipParts.booster];
                        const wingOpt = WING_OPTIONS[shipParts.wings];
                        
                        ctx.clearRect(0, 0, 280, 180);
                        ctx.save();
                        ctx.translate(centerX, centerY);
                        ctx.scale(scale, scale);
                        
                        // Animated engine flame with booster options
                        const flameFlicker = Math.sin(Date.now() / 50) * 3 + 8;
                        const flameLen = flameFlicker * boosterOpt.flameLength;
                        const flameGrad = ctx.createLinearGradient(-25 * boosterOpt.flameLength, 0, -15, 0);
                        flameGrad.addColorStop(0, 'transparent');
                        flameGrad.addColorStop(0.5, ship.colors.glow + '88');
                        flameGrad.addColorStop(1, ship.colors.glow);
                        ctx.fillStyle = flameGrad;
                        
                        if (boosterOpt.dual) {
                          // Dual boosters
                          ctx.beginPath();
                          ctx.moveTo(-15, -5);
                          ctx.lineTo(-15 - flameLen * 0.8, -4);
                          ctx.lineTo(-15, -2);
                          ctx.closePath();
                          ctx.fill();
                          ctx.beginPath();
                          ctx.moveTo(-15, 5);
                          ctx.lineTo(-15 - flameLen * 0.8, 4);
                          ctx.lineTo(-15, 2);
                          ctx.closePath();
                          ctx.fill();
                        } else {
                          // Single booster with size
                          const bSize = boosterOpt.size;
                          ctx.beginPath();
                          ctx.moveTo(-15, -4 * bSize);
                          ctx.lineTo(-15 - flameLen, 0);
                          ctx.lineTo(-15, 4 * bSize);
                          ctx.closePath();
                          ctx.fill();
                        }
                        
                        ctx.shadowBlur = 20;
                        ctx.shadowColor = ship.colors.glow;
                        
                        // Check if NEBULA - X (first ship)
                        const isNebulaXPreview = selectedShip === 0;
                        
                        const bodyGradient = ctx.createLinearGradient(-15, -8, -15, 8);
                        ship.colors.body.forEach((color, i) => {
                          bodyGradient.addColorStop(i / (ship.colors.body.length - 1), color);
                        });
                        
                        if (isNebulaXPreview) {
                          // ========== NEBULA - X PREVIEW (4 Big Guns) ==========
                          const gunGlow = Math.sin(Date.now() / 100) * 0.3 + 0.7;
                          const accentColor = ship.colors.accent || '#ff4400';
                          
                          // Main body (angular design)
                          ctx.fillStyle = bodyGradient;
                          ctx.beginPath();
                          ctx.moveTo(22, 0);              // Extended nose
                          ctx.lineTo(10, -7);             // Top front
                          ctx.lineTo(-5, -8);             // Top mid
                          ctx.lineTo(-15, -6);            // Top back
                          ctx.lineTo(-17, 0);             // Back center
                          ctx.lineTo(-15, 6);             // Bottom back
                          ctx.lineTo(-5, 8);              // Bottom mid
                          ctx.lineTo(10, 7);              // Bottom front
                          ctx.closePath();
                          ctx.fill();
                          
                          // 4 Big Guns
                          const gunPositions = [
                            { x: 18, y: -4, angle: -0.1 },   // Top front
                            { x: 0, y: -8, angle: -0.15 },   // Top back
                            { x: 18, y: 4, angle: 0.1 },     // Bottom front
                            { x: 0, y: 8, angle: 0.15 },     // Bottom back
                          ];
                          
                          ctx.shadowBlur = 5 * gunGlow;
                          ctx.shadowColor = accentColor;
                          
                          gunPositions.forEach(gun => {
                            ctx.save();
                            ctx.translate(gun.x, gun.y);
                            ctx.rotate(gun.angle);
                            
                            // Gun barrel
                            const barrelGrad = ctx.createLinearGradient(0, -1.5, 0, 1.5);
                            barrelGrad.addColorStop(0, '#555566');
                            barrelGrad.addColorStop(0.5, '#888899');
                            barrelGrad.addColorStop(1, '#444455');
                            ctx.fillStyle = barrelGrad;
                            ctx.fillRect(0, -1.5, 8, 3);
                            
                            // Gun tip glow
                            ctx.fillStyle = accentColor;
                            ctx.fillRect(7, -1, 2, 2);
                            ctx.fillStyle = '#ffff88';
                            ctx.fillRect(7.5, -0.5, 1, 1);
                            
                            ctx.restore();
                          });
                          
                          // Central power core
                          ctx.shadowColor = ship.colors.glow;
                          ctx.shadowBlur = 10;
                          ctx.fillStyle = ship.colors.glow;
                          ctx.beginPath();
                          ctx.arc(0, 0, 2, 0, Math.PI * 2);
                          ctx.fill();
                          
                          // Small stabilizers
                          ctx.shadowBlur = 0;
                          ctx.fillStyle = ship.colors.wing;
                          // Top stabilizer
                          ctx.beginPath();
                          ctx.moveTo(-12, -6);
                          ctx.lineTo(-15, -10);
                          ctx.lineTo(-8, -8);
                          ctx.closePath();
                          ctx.fill();
                          // Bottom stabilizer
                          ctx.beginPath();
                          ctx.moveTo(-12, 6);
                          ctx.lineTo(-15, 10);
                          ctx.lineTo(-8, 8);
                          ctx.closePath();
                          ctx.fill();
                          
                          // Stabilizer tips glow
                          ctx.shadowColor = ship.colors.glow;
                          ctx.shadowBlur = 5;
                          ctx.fillStyle = ship.colors.glow;
                          ctx.beginPath();
                          ctx.arc(-15, -10, 1.5, 0, Math.PI * 2);
                          ctx.fill();
                          ctx.beginPath();
                          ctx.arc(-15, 10, 1.5, 0, Math.PI * 2);
                          ctx.fill();
                          
                        } else {
                          // ========== STANDARD SHIP PREVIEW ==========
                          ctx.fillStyle = bodyGradient;
                          ctx.beginPath();
                          ctx.moveTo(20, 0);
                          ctx.lineTo(-5, -8);
                          ctx.lineTo(-15, -6);
                          ctx.lineTo(-15, 6);
                          ctx.lineTo(-5, 8);
                          ctx.closePath();
                          ctx.fill();
                          
                          // Wings with wing options
                          const wLen = wingOpt.length;
                          const wAng = wingOpt.angle;
                          ctx.fillStyle = ship.colors.wing;
                          ctx.beginPath();
                          ctx.moveTo(-5, -8);
                          ctx.lineTo(-12 + (wAng - 1) * 3, -15 * wLen);
                          ctx.lineTo(-18 - (wLen - 1) * 4, -12 * wAng);
                          ctx.lineTo(-15, -6);
                          ctx.closePath();
                          ctx.fill();
                          
                          ctx.beginPath();
                          ctx.moveTo(-5, 8);
                          ctx.lineTo(-12 + (wAng - 1) * 3, 15 * wLen);
                          ctx.lineTo(-18 - (wLen - 1) * 4, 12 * wAng);
                          ctx.lineTo(-15, 6);
                          ctx.closePath();
                          ctx.fill();
                          
                          // Wing tips glow for extended wings
                          if (wLen > 1) {
                            ctx.shadowColor = ship.colors.glow;
                            ctx.shadowBlur = 8;
                            ctx.fillStyle = ship.colors.glow;
                            ctx.beginPath();
                            ctx.arc(-12 + (wAng - 1) * 3, -15 * wLen, 2, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.beginPath();
                            ctx.arc(-12 + (wAng - 1) * 3, 15 * wLen, 2, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.shadowBlur = 20;
                          }
                        }
                        
                        const cockpitGradient = ctx.createRadialGradient(5, 0, 0, 5, 0, 6);
                        ship.colors.cockpit.forEach((color, i) => {
                          cockpitGradient.addColorStop(i / (ship.colors.cockpit.length - 1), color);
                        });
                        ctx.fillStyle = cockpitGradient;
                        ctx.beginPath();
                        ctx.ellipse(5, 0, 6, 4, 0, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.restore();
                      }
                    }}
                    width="250"
                    height="160"
                    className="ship-canvas-large"
                  />
                </div>
                <div className="ship-nav-row">
                  <button 
                    className="ship-nav-btn"
                    onClick={() => { soundSystem.playUISparkle(); setSelectedShip((prev) => (prev - 1 + SHIP_DESIGNS.length) % SHIP_DESIGNS.length); }}
                  >
                    ◀
                  </button>
                  <div className="ship-dots">
                    {SHIP_DESIGNS.map((_, i) => (
                      <span 
                        key={i} 
                        className={`ship-dot ${i === selectedShip ? 'active' : ''}`}
                        onClick={() => { soundSystem.playUISparkle(); setSelectedShip(i); }}
                        style={{ backgroundColor: i === selectedShip ? SHIP_DESIGNS[selectedShip].colors.glow : '#444' }}
                        title={SHIP_DESIGNS[i].name}
                      ></span>
                    ))}
                  </div>
                  <button 
                    className="ship-nav-btn"
                    onClick={() => { soundSystem.playUISparkle(); setSelectedShip((prev) => (prev + 1) % SHIP_DESIGNS.length); }}
                  >
                    ▶
                  </button>
                </div>
              </div>
              
              {/* Ship Info Section */}
              <div className="customize-info-section">
                <div className="ship-header">
                  <h3 className="ship-name-large" style={{ color: SHIP_DESIGNS[selectedShip].colors.glow }}>
                    {SHIP_DESIGNS[selectedShip].name}
                  </h3>
                  <p className="ship-class">{SHIP_DESIGNS[selectedShip].description}</p>
                </div>
                
                <p className="ship-lore">{SHIP_DESIGNS[selectedShip].lore}</p>
                
                <div className="ship-stats">
                  <div className="stat-row">
                    <span className="stat-label">⚡ SPEED</span>
                    <div className="stat-bar-container">
                      <div className="stat-bar" style={{ width: `${SHIP_DESIGNS[selectedShip].stats.speed * 20}%`, backgroundColor: '#00ffff' }}></div>
                    </div>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">💥 POWER</span>
                    <div className="stat-bar-container">
                      <div className="stat-bar" style={{ width: `${SHIP_DESIGNS[selectedShip].stats.firepower * 20}%`, backgroundColor: '#ff4444' }}></div>
                    </div>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">{'🛡️'} ARMOR</span>
                    <div className="stat-bar-container">
                      <div className="stat-bar" style={{ width: `${SHIP_DESIGNS[selectedShip].stats.defense * 20}%`, backgroundColor: '#44ff44' }}></div>
                    </div>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">✨ SPECIAL</span>
                    <div className="stat-bar-container">
                      <div className="stat-bar" style={{ width: `${SHIP_DESIGNS[selectedShip].stats.special * 20}%`, backgroundColor: '#ff44ff' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="ship-counter">{selectedShip + 1} / {SHIP_DESIGNS.length}</div>
              </div>
            </div>
            
            {/* Parts Customization */}
            <div className="parts-section">
              <div className="part-selector">
                <span className="part-label">🔥 BOOSTER</span>
                <div className="part-options">
                  <button 
                    className="part-nav-btn"
                    onClick={() => setShipParts(p => ({ ...p, booster: (p.booster - 1 + BOOSTER_OPTIONS.length) % BOOSTER_OPTIONS.length }))}
                  >◀</button>
                  <div className="part-info">
                    <span className="part-name">{BOOSTER_OPTIONS[shipParts.booster].name}</span>
                    <span className="part-desc">{BOOSTER_OPTIONS[shipParts.booster].description}</span>
                  </div>
                  <button 
                    className="part-nav-btn"
                    onClick={() => setShipParts(p => ({ ...p, booster: (p.booster + 1) % BOOSTER_OPTIONS.length }))}
                  >▶</button>
                </div>
              </div>
              <div className="part-selector">
                <span className="part-label">✈️ WINGS</span>
                <div className="part-options">
                  <button 
                    className="part-nav-btn"
                    onClick={() => setShipParts(p => ({ ...p, wings: (p.wings - 1 + WING_OPTIONS.length) % WING_OPTIONS.length }))}
                  >◀</button>
                  <div className="part-info">
                    <span className="part-name">{WING_OPTIONS[shipParts.wings].name}</span>
                    <span className="part-desc">{WING_OPTIONS[shipParts.wings].description}</span>
                  </div>
                  <button 
                    className="part-nav-btn"
                    onClick={() => setShipParts(p => ({ ...p, wings: (p.wings + 1) % WING_OPTIONS.length }))}
                  >▶</button>
                </div>
              </div>
              <div className="part-selector">
                <span className="part-label">{'🛡️'} SHIELD</span>
                <div className="part-options">
                  <button 
                    className="part-nav-btn"
                    onClick={() => setShipParts(p => ({ ...p, shield: ((p.shield || 0) - 1 + SHIELD_OPTIONS.length) % SHIELD_OPTIONS.length }))}
                  >◀</button>
                  <div className="part-info">
                    <span className="part-name" style={{ color: SHIELD_OPTIONS[shipParts.shield || 0].color }}>{SHIELD_OPTIONS[shipParts.shield || 0].name}</span>
                    <span className="part-desc">{SHIELD_OPTIONS[shipParts.shield || 0].description}</span>
                  </div>
                  <button 
                    className="part-nav-btn"
                    onClick={() => setShipParts(p => ({ ...p, shield: ((p.shield || 0) + 1) % SHIELD_OPTIONS.length }))}
                  >▶</button>
                </div>
              </div>
              <div className="part-selector">
                <span className="part-label">✨ TRAIL</span>
                <div className="part-options">
                  <button 
                    className="part-nav-btn"
                    onClick={() => setShipParts(p => ({ ...p, trail: ((p.trail || 0) - 1 + TRAIL_OPTIONS.length) % TRAIL_OPTIONS.length }))}
                  >◀</button>
                  <div className="part-info">
                    <span className="part-name" style={{ color: TRAIL_OPTIONS[shipParts.trail || 0].color === 'rainbow' ? '#ff88ff' : TRAIL_OPTIONS[shipParts.trail || 0].color }}>{TRAIL_OPTIONS[shipParts.trail || 0].name}</span>
                    <span className="part-desc">{TRAIL_OPTIONS[shipParts.trail || 0].description}</span>
                  </div>
                  <button 
                    className="part-nav-btn"
                    onClick={() => setShipParts(p => ({ ...p, trail: ((p.trail || 0) + 1) % TRAIL_OPTIONS.length }))}
                  >▶</button>
                </div>
              </div>
              
              {/* Randomize Button */}
              <button 
                className="randomize-button"
                onClick={() => {
                  soundSystem.playUISparkle();
                  setSelectedShip(Math.floor(Math.random() * SHIP_DESIGNS.length));
                  setShipParts({
                    booster: Math.floor(Math.random() * BOOSTER_OPTIONS.length),
                    wings: Math.floor(Math.random() * WING_OPTIONS.length),
                    shield: Math.floor(Math.random() * SHIELD_OPTIONS.length),
                    trail: Math.floor(Math.random() * TRAIL_OPTIONS.length)
                  });
                }}
              >
                🎲 RANDOMIZE ALL
              </button>
            </div>
            
            <div className="customize-buttons">
              <button onClick={() => setShowCustomize(false)} className="back-button">
                ◀ BACK
              </button>
              <button onClick={() => setShowCustomize(false)} className="confirm-button">
                ✓ SELECT SHIP
              </button>
            </div>
            <p className="start-hint">🎮 ◀ ▶ to browse ↩• ↩ to confirm</p>
          </div>
        )}
        
        {gameState === 'paused' && !showPauseControls && (
          <div className="overlay pause-overlay">
            <h2> PAUSED</h2>
            <div className="pause-buttons">
              <button 
                onClick={() => setGameState('playing')} 
                className={`start-button ${pauseSelection === 0 ? 'gamepad-selected' : ''}`}
                onMouseEnter={() => setPauseSelection(0)}
              >
                <span className="btn-icon">▶️</span> RESUME
              </button>
              <button 
                onClick={() => { startGame(); setGameState('playing'); setPauseSelection(0); }} 
                className={`restart-button ${pauseSelection === 1 ? 'gamepad-selected' : ''}`}
                onMouseEnter={() => setPauseSelection(1)}
              >
                <span className="btn-icon">🔄</span> RESTART
              </button>
              <button 
                onClick={() => setShowPauseControls(true)} 
                className={`settings-button ${pauseSelection === 2 ? 'gamepad-selected' : ''}`}
                onMouseEnter={() => setPauseSelection(2)}
              >
                <span className="btn-icon">🎮</span> CONTROLS
              </button>
              <button 
                onClick={() => { soundSystem.stopMusic(); setGameState('menu'); setShowPauseControls(false); setPauseSelection(0); }} 
                className={`menu-button ${pauseSelection === 3 ? 'gamepad-selected' : ''}`}
                onMouseEnter={() => setPauseSelection(3)}
              >
                <span className="btn-icon">🏀</span> MAIN MENU
              </button>
            </div>
            <p className="start-hint">🎮 D-Pad to navigate ↩• ↩ to select ↩• ESC to resume</p>
          </div>
        )}
        
        {gameState === 'paused' && showPauseControls && (
          <div className="overlay settings-overlay">
            <h2>⚙️ CONTROLS</h2>
            <div className="settings-content">
              <div className="controls-section">
                <h3>⌨️ Keyboard</h3>
                <div className="controls-info">
                  <p>↩ Â↩ ↩ ↩  / WASD - Move</p>
                  <p>SPACE - Shoot</p>
                  <p>Q - Dash (while moving)</p>
                  <p>B - Bomb (screen clear)</p>
                  <p>C - Toggle Polarity</p>
                  <p>SHIFT - Wave Cannon</p>
                  <p>L - Laser Beam (↩°👥3 Rapid)</p>
                  <p>M - Missile</p>
                  <p>F - Force Toggle</p>
                  <p>G - Force Shield (Lv4+)</p>
                  <p>[ ] - Speed Setting</p>
                  <p>ESC - Pause</p>
                </div>
              </div>
              <div className="controls-section">
                <h3>🎮 Xbox Controller</h3>
                <div className="controls-info">
                  <p>Left Stick / D-Pad - Move</p>
                  <p>A / RB / RT - Shoot</p>
                  <p>LS / RS Click - Dash</p>
                  <p>Y - Laser Beam (Lv3+)</p>
                  <p>LT (Hold) - Wave Cannon</p>
                  <p>X - Missile</p>
                  <p>B - Force Toggle</p>
                  <p>LB - Polarity Toggle</p>
                  <p>View - Bomb</p>
                  <p>Menu - Pause</p>
                </div>
              </div>
              <div className="controls-section">
                <h3>🎮 PlayStation</h3>
                <div className="controls-info">
                  <p>Left Stick / D-Pad - Move</p>
                  <p>✕ / R1 / R2 - Shoot</p>
                  <p>L3 / R3 Click - Dash</p>
                  <p>△ - Laser Beam (Lv3+)</p>
                  <p>L2 (Hold) - Wave Cannon</p>
                  <p>□ - Missile</p>
                  <p>○ - Force Toggle</p>
                  <p>L1 - Polarity Toggle</p>
                  <p>Share - Bomb</p>
                  <p>Options - Pause</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowPauseControls(false)} className="back-button">
              ? BACK
            </button>
            <p className="start-hint">🎮 Press ↩ÂÅ or ↩ to go back</p>
          </div>
        )}
        
        {gameState === 'checkpoint' && !showCustomize && (
          <div className="overlay checkpoint-overlay">
            <h2>ÂÂ CHECKPOINT REACHED</h2>
            <div className="checkpoint-content">
              <div className="checkpoint-wave">
                <span className="checkpoint-label">MISSION</span>
                <span className="checkpoint-value">{checkpointStats.wave}</span>
                <span className="checkpoint-label">COMPLETE</span>
              </div>
              
              <div className="checkpoint-tally">
                <div className="tally-row">
                  <span>Base Score:</span>
                  <span>{(checkpointStats.score - checkpointStats.bonusPoints).toLocaleString()}</span>
                </div>
                <div className="tally-row bonus">
                  <span>Lives Bonus ({checkpointStats.lives}  500):</span>
                  <span>+{(checkpointStats.lives * 500).toLocaleString()}</span>
                </div>
                <div className="tally-row bonus">
                  <span>Wave Bonus ({checkpointStats.wave}  200):</span>
                  <span>+{(checkpointStats.wave * 200).toLocaleString()}</span>
                </div>
                <div className="tally-divider"></div>
                <div className="tally-row total">
                  <span>TOTAL SCORE:</span>
                  <span>{checkpointStats.score.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Zone Selection - Branching Paths */}
              <div className="zone-selection">
                <h3>CHOOSE NEXT ZONE</h3>
                <div className="zone-options">
                  {Object.entries(ZONE_PATHS).slice(0, 3).map(([key, zone]) => (
                    <button 
                      key={key}
                      onClick={() => {
                        currentZoneRef.current = zone;
                        setGameState('playing');
                        gameStateRef.current = 'playing';
                      }}
                      className="zone-button"
                      style={{ 
                        borderColor: zone.enemyColor,
                        background: `linear-gradient(135deg, ${zone.bgColor} 0%, #000 100%)`
                      }}
                    >
                      <span className="zone-name">{zone.name}</span>
                      <span className="zone-desc">{zone.description}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="checkpoint-buttons">
                <button 
                  onClick={() => { 
                    soundSystem.playUISparkle(); 
                    waveStartTimeRef.current = performance.now(); 
                    graceWarningShownRef.current = false; 
                    // Trigger fade from black for level intro
                    levelFadeRef.current = { 
                      active: true, 
                      fadeIn: true, 
                      alpha: 1, 
                      showText: waveRef.current
                    }; 
                    gameStateRef.current = 'playing'; 
                  }}
                  className={`start-button ${checkpointSelection === 0 ? 'gamepad-selected' : ''}`}
                  onMouseEnter={() => setCheckpointSelection(0)}
                >
                  <span className="btn-icon">▶️</span> CONTINUE MISSION
                </button>
                <button 
                  onClick={() => saveGame()}
                  className={`save-button ${checkpointSelection === 1 ? 'gamepad-selected' : ''} ${saveFeedback ? 'save-success' : ''}`}
                  onMouseEnter={() => setCheckpointSelection(1)}
                >
                  <span className="btn-icon">{saveFeedback ? '✓' : 'Â¾'}</span> {saveFeedback ? 'SAVED!' : 'SAVE PROGRESS'}
                </button>
                <button 
                  onClick={() => { soundSystem.playUISparkle(); setShowCustomize(true); }}
                  className={`customize-checkpoint-button ${checkpointSelection === 2 ? 'gamepad-selected' : ''}`}
                  onMouseEnter={() => setCheckpointSelection(2)}
                >
                  <span className="btn-icon">🚀</span> CUSTOMIZE SHIP
                </button>
                <button 
                  onClick={() => { soundSystem.stopMusic(); setGameState('menu'); gameStateRef.current = 'menu'; }}
                  className={`quit-button ${checkpointSelection === 3 ? 'gamepad-selected' : ''}`}
                  onMouseEnter={() => setCheckpointSelection(3)}
                >
                  <span className="btn-icon">🏀</span> QUIT TO MENU
                </button>
              </div>
              
              <p className="checkpoint-hint">Select a zone or continue to random path!</p>
            </div>
            <p className="start-hint">🎮 D-Pad to navigate ↩• ↩ to select</p>
          </div>
        )}
        
        {gameState === 'gameOver' && (
          <div className="overlay game-over">
            <h2>{gameMode === 'survival' ? 'SURVIVAL ENDED' : 'GAME OVER'}</h2>
            
            {/* Challenge Mode Stats */}
            {gameMode === 'survival' && (
              <div className="challenge-game-over-stats">
                <p className="survival-time-stat">
                  ? Survival Time: {Math.floor(challengeStatsRef.current.survivalTime / 60000).toString().padStart(2, '0')}:
                  {Math.floor((challengeStatsRef.current.survivalTime % 60000) / 1000).toString().padStart(2, '0')}
                </p>
              </div>
            )}
            
            <p className="final-score">Final Score: {score}</p>
            <p className="wave-reached">Wave Reached: {wave}</p>
            {bossActive && <p className="boss-fight">Defeated during Boss Fight!</p>}
            {score >= highScore && score > 0 && (
              <p className="new-high-score">🏆 NEW HIGH SCORE! 🏆</p>
            )}
            
            {/* Quick Settings Panel */}
            <div className="game-over-settings">
              <p className="settings-tip">⚙️ Adjust settings before your next attempt:</p>
              
              {/* Difficulty Selector */}
              <div className="difficulty-selector">
                <label>Difficulty:</label>
                <div className="difficulty-buttons">
                  {Object.entries(DIFFICULTY_SETTINGS).map(([key, diff]) => (
                    <button
                      key={key}
                      className={`difficulty-btn ${userSettings.difficulty === key ? 'active' : ''}`}
                      style={{ '--diff-color': diff.color }}
                      onClick={() => setUserSettings(prev => ({ ...prev, difficulty: key }))}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
                <p className="difficulty-desc" style={{ color: DIFFICULTY_SETTINGS[userSettings.difficulty || 'normal'].color }}>
                  {DIFFICULTY_SETTINGS[userSettings.difficulty || 'normal'].description}
                </p>
              </div>
              
              {/* Audio Quick Controls */}
              <div className="audio-quick-controls">
                <div className="volume-row">
                  <span className="volume-label">Å  Master</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={userSettings.masterVolume}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, masterVolume: parseInt(e.target.value) }))}
                    className="volume-slider-small"
                  />
                  <span className="volume-val">{userSettings.masterVolume}%</span>
                </div>
                <div className="volume-row">
                  <span className="volume-label">{'Å½Âµ'} Music</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={userSettings.musicVolume}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, musicVolume: parseInt(e.target.value) }))}
                    className="volume-slider-small"
                  />
                  <span className="volume-val">{userSettings.musicVolume}%</span>
                </div>
                <div className="volume-row">
                  <span className="volume-label">🔊 SFX</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={userSettings.sfxVolume}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, sfxVolume: parseInt(e.target.value) }))}
                    className="volume-slider-small"
                  />
                  <span className="volume-val">{userSettings.sfxVolume}%</span>
                </div>
              </div>
            </div>
            
            <div className="game-over-buttons">
              <button onClick={startGame} className="start-button">
                PLAY AGAIN
              </button>
              <button onClick={() => setGameState('menu')} className="settings-button menu-button">
                MAIN MENU
              </button>
              <button onClick={() => setShowQuitConfirm(true)} className="settings-button quit-button">
                QUIT GAME
              </button>
            </div>
            <p className="start-hint">Press ENTER to restart</p>
            
            {/* Quit Confirmation Modal */}
            {showQuitConfirm && (
              <div className="quit-confirm-overlay">
                <div className="quit-confirm-modal">
                  <h3>⚠️ QUIT GAME?</h3>
                  <p>Are you sure you want to quit?</p>
                  <p className="quit-warning">You will return to the main menu.</p>
                  <div className="quit-confirm-buttons">
                    <button 
                      onClick={() => {
                        setShowQuitConfirm(false);
                        setShowSettings(false);
                        if (gameMusicRef.current) {
                          gameMusicRef.current.pause();
                          gameMusicRef.current = null;
                        }
                        setGameState('menu');
                        gameStateRef.current = 'menu';
                      }} 
                      className="quit-confirm-btn confirm-yes"
                    >
                      YES, QUIT
                    </button>
                    <button 
                      onClick={() => setShowQuitConfirm(false)} 
                      className="quit-confirm-btn confirm-no"
                    >
                      NO, STAY
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Victory Screen */}
        {gameState === 'victory' && (
          <div className="overlay victory-screen">
            <div className="victory-content">
              {gameMode === 'campaign' ? (
                <>
                  <div className="victory-title">
                    <h1>🏆 VICTORY 🏆</h1>
                    <h2>THE NEBULA X MISSION</h2>
                  </div>
                  
                  <div className="victory-story">
                    <div className="story-text">
                      <p className="story-paragraph">
                        In the year 2387, humanity faced its greatest threat ↩¬ an advanced AI network 
                        known as the Nexus Collective had spread across the galaxy, consuming entire 
                        star systems and enslaving civilizations.
                      </p>
                      <p className="story-paragraph">
                        Earth's last hope was the <span className="highlight">NEBULA X</span>, an experimental 
                        starfighter equipped with revolutionary quantum weaponry and piloted by the 
                        bravest souls humanity had to offer.
                      </p>
                      <p className="story-paragraph">
                        Against impossible odds, the crew of the Nebula X fought through 20 waves of 
                        relentless machine forces, defeating countless drones, elite commanders, and 
                        the terrifying Mega Bosses that guarded each sector.
                      </p>
                      <p className="story-paragraph">
                        In the heart of the Nexus, they destroyed the AI Core, freeing billions and 
                        ending the machine threat forever. The <span className="highlight">Nebula X</span> and 
                        its crew became legends ↩¬ their names etched in the stars for eternity.
                      </p>
                      <p className="story-final">
                        ? <em>They will never be forgotten.</em> ?
                      </p>
                    </div>
                  </div>
                  
                  <div className="victory-stats">
                    <h3>FINAL MISSION STATS</h3>
                    <p>Final Score: <span className="stat-value">{score.toLocaleString()}</span></p>
                    <p>Waves Completed: <span className="stat-value">20</span></p>
                    <p>Lives Remaining: <span className="stat-value">{lives}</span></p>
                  </div>
                  
                  <div className="credits-section">
                    <h3>↩Ë¦ CREDITS ↩Ë¦</h3>
                    <div className="credits-list">
                      <p className="credit-item"><span className="credit-role">Game Design & Development</span><br/>The Nebula X Team</p>
                      <p className="credit-item"><span className="credit-role">Programming</span><br/>React & Canvas 2D</p>
                      <p className="credit-item"><span className="credit-role">Sound Effects</span><br/>Mixkit Audio Library</p>
                      <p className="credit-item"><span className="credit-role">Music</span><br/>Space Ambient Collection</p>
                      <p className="credit-item"><span className="credit-role">Special Thanks</span><br/>To all the brave pilots who dared to fly</p>
                    </div>
                  </div>
                </>
              ) : gameMode === 'timeAttack' ? (
                <>
                  <div className="victory-title time-attack-title">
                    <h1>? TIME ATTACK COMPLETE ?</h1>
                    <h2>SPEED DEMON!</h2>
                  </div>
                  
                  <div className="victory-stats challenge-stats">
                    <h3>CHALLENGE RESULTS</h3>
                    <p>Completion Time: <span className="stat-value time-value">
                      {Math.floor(challengeStatsRef.current.timeAttackTime / 60000).toString().padStart(2, '0')}:
                      {Math.floor((challengeStatsRef.current.timeAttackTime % 60000) / 1000).toString().padStart(2, '0')}.
                      {Math.floor((challengeStatsRef.current.timeAttackTime % 1000) / 10).toString().padStart(2, '0')}
                    </span></p>
                    <p>Final Score: <span className="stat-value">{score.toLocaleString()}</span></p>
                    <p>Waves Completed: <span className="stat-value">10</span></p>
                    <p>Lives Remaining: <span className="stat-value">{lives}</span></p>
                  </div>
                  
                  <div className="challenge-message">
                    <p>🎯 You've completed the Time Attack challenge!</p>
                    <p>Can you beat your time?</p>
                  </div>
                </>
              ) : gameMode === 'bossRush' ? (
                <>
                  <div className="victory-title boss-rush-title">
                    <h1>¬ BOSS SLAYER ¬</h1>
                    <h2>ALL BOSSES DEFEATED!</h2>
                  </div>
                  
                  <div className="victory-stats challenge-stats">
                    <h3>CHALLENGE RESULTS</h3>
                    <p>Bosses Defeated: <span className="stat-value">4 / 4</span></p>
                    <p>Final Score: <span className="stat-value">{score.toLocaleString()}</span></p>
                    <p>Lives Remaining: <span className="stat-value">{lives}</span></p>
                  </div>
                  
                  <div className="challenge-message">
                    <p>🏆 You've conquered all the Mega Bosses!</p>
                    <p>True boss-slaying mastery achieved!</p>
                  </div>
                </>
              ) : null}
              
              <div className="victory-buttons">
                <button onClick={() => setGameState('menu')} className="start-button victory-button">
                  🏀 RETURN TO BASE
                </button>
              </div>
              
              <p className="victory-hint">Thank you for playing NEBULA X!</p>
            </div>
          </div>
        )}

        {/* Achievement Notification Popup */}
        {achievementNotification && (
          <div className="achievement-notification">
            <div className="achievement-notification-content">
              <div className="achievement-icon">{'🏆'}</div>
              <div className="achievement-details">
                <div className="achievement-unlocked">ACHIEVEMENT UNLOCKED!</div>
                <div className="achievement-name">{achievementNotification.name}</div>
                <div className="achievement-desc">{achievementNotification.description}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceShooter;
