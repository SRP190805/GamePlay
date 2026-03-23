import * as Tone from 'tone'

class SoundManager {
  private static instance: SoundManager
  private synth!: Tone.PolySynth
  private noiseSynth!: Tone.NoiseSynth
  private ambientDrone!: Tone.Oscillator
  private reverb!: Tone.Reverb
  private delay!: Tone.FeedbackDelay
  private initialized = false

  private constructor() {}

  static getInstance(): SoundManager {
    if (!SoundManager.instance) SoundManager.instance = new SoundManager()
    return SoundManager.instance
  }

  async init() {
    if (this.initialized) return
    await Tone.start()
    this.reverb = new Tone.Reverb({ decay: 4, wet: 0.4 }).toDestination()
    this.delay = new Tone.FeedbackDelay('8n', 0.3).connect(this.reverb)
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.2, release: 1.5 }
    }).connect(this.delay)
    this.noiseSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.2 }
    }).connect(this.reverb)
    this.ambientDrone = new Tone.Oscillator({ frequency: 55, type: 'sine' })
      .connect(new Tone.Volume(-30).toDestination())
    this.ambientDrone.start()
    Tone.Destination.volume.value = -10
    this.initialized = true
  }

  setVolume(volume: number) {
    if (!this.initialized) return
    const db = volume === 0 ? -Infinity : Math.log10(volume / 100) * 20
    Tone.Destination.volume.rampTo(db, 0.1)
  }

  playSelect() {
    if (!this.initialized) return
    this.synth.triggerAttackRelease('C5', '16n', undefined, 0.4)
  }

  playHover() {
    if (!this.initialized) return
    this.synth.triggerAttackRelease('G4', '64n', undefined, 0.08)
  }

  playSuccess() {
    if (!this.initialized) return
    const now = Tone.now()
    this.synth.triggerAttackRelease('C5', '8n', now, 0.5)
    this.synth.triggerAttackRelease('E5', '8n', now + 0.12, 0.5)
    this.synth.triggerAttackRelease('G5', '8n', now + 0.24, 0.5)
    this.synth.triggerAttackRelease('C6', '4n', now + 0.36, 0.6)
  }

  playError() {
    if (!this.initialized) return
    const now = Tone.now()
    this.synth.triggerAttackRelease('A3', '8n', now, 0.5)
    this.synth.triggerAttackRelease('A2', '8n', now + 0.15, 0.4)
  }

  playExplosion() {
    if (!this.initialized) return
    this.noiseSynth.triggerAttackRelease('4n', undefined, 0.8)
    const now = Tone.now()
    this.synth.triggerAttackRelease('C2', '2n', now, 0.6)
    this.synth.triggerAttackRelease('G1', '2n', now + 0.1, 0.5)
  }

  playSpawn() {
    if (!this.initialized) return
    const now = Tone.now()
    this.synth.triggerAttackRelease('G4', '16n', now, 0.3)
    this.synth.triggerAttackRelease('C5', '16n', now + 0.08, 0.4)
    this.synth.triggerAttackRelease('E5', '8n', now + 0.16, 0.5)
  }

  playEvent() {
    if (!this.initialized) return
    const now = Tone.now()
    this.synth.triggerAttackRelease('D4', '8n', now, 0.3)
    this.synth.triggerAttackRelease('F4', '8n', now + 0.1, 0.3)
    this.synth.triggerAttackRelease('A4', '4n', now + 0.2, 0.4)
  }

  playTick() {
    if (!this.initialized) return
    this.synth.triggerAttackRelease('C3', '64n', undefined, 0.05)
  }

  playUnlock() {
    if (!this.initialized) return
    const now = Tone.now()
    this.synth.triggerAttackRelease('E5', '16n', now, 0.4)
    this.synth.triggerAttackRelease('G5', '16n', now + 0.1, 0.4)
    this.synth.triggerAttackRelease('B5', '16n', now + 0.2, 0.4)
    this.synth.triggerAttackRelease('E6', '8n', now + 0.3, 0.6)
  }

  playMerge() {
    if (!this.initialized) return
    const now = Tone.now()
    this.noiseSynth.triggerAttackRelease('16n', now, 0.4)
    this.synth.triggerAttackRelease('G3', '8n', now, 0.5)
    this.synth.triggerAttackRelease('D4', '4n', now + 0.1, 0.6)
    this.synth.triggerAttackRelease('G4', '4n', now + 0.25, 0.5)
  }

  playFusion() {
    if (!this.initialized) return
    const now = Tone.now()
    this.noiseSynth.triggerAttackRelease('8n', now, 0.7)
    this.synth.triggerAttackRelease('C2', '4n', now, 0.6)
    this.synth.triggerAttackRelease('G3', '4n', now + 0.15, 0.5)
    this.synth.triggerAttackRelease('E4', '4n', now + 0.3, 0.5)
    this.synth.triggerAttackRelease('C5', '2n', now + 0.5, 0.7)
    this.synth.triggerAttackRelease('G5', '2n', now + 0.7, 0.6)
  }

  setAmbientFrequency(freq: number) {
    if (!this.initialized || !this.ambientDrone) return
    this.ambientDrone.frequency.rampTo(freq, 2)
  }

  playBigBangSound() {
    if (!this.initialized) return
    const now = Tone.now()
    // Deep sub-bass rumble building up
    this.synth.triggerAttackRelease('C1', '1n', now, 0.8)
    this.synth.triggerAttackRelease('G1', '1n', now + 0.2, 0.7)
    this.synth.triggerAttackRelease('C2', '2n', now + 0.5, 0.9)
    // Noise burst — the bang itself
    this.noiseSynth.triggerAttackRelease('2n', now + 0.8, 1.0)
    this.noiseSynth.triggerAttackRelease('4n', now + 1.2, 0.8)
    // High harmonic shimmer — the "light" of the big bang
    this.synth.triggerAttackRelease('C5', '4n', now + 1.0, 0.6)
    this.synth.triggerAttackRelease('G5', '4n', now + 1.2, 0.5)
    this.synth.triggerAttackRelease('C6', '2n', now + 1.4, 0.4)
    // Fade-out rumble
    this.synth.triggerAttackRelease('C1', '1m', now + 1.8, 0.3)
  }
}

export const soundManager = SoundManager.getInstance()
