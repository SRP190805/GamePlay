import * as Tone from 'tone'

class SoundManager {
  private static instance: SoundManager
  private synth: Tone.PolySynth
  private noiseSynth: Tone.NoiseSynth
  private initialized: boolean = false

  private constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination()
    this.noiseSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
    }).toDestination()
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager()
    }
    return SoundManager.instance
  }

  init() {
    if (!this.initialized) {
      Tone.start().then(() => {
        this.initialized = true
        // Lower overall volume default
        Tone.Destination.volume.value = -10
      })
    }
  }

  setVolume(volume: number) {
    if (!this.initialized) return
    // Volume: -60 to 0 (dB). 0 is 100%, -60 is silent.
    // Convert 0-100 linear slider to -60 to 0 logarithmic
    const db = volume === 0 ? -Infinity : (Math.log10(volume / 100) * 20)
    Tone.Destination.volume.rampTo(db, 0.1)
  }

  playSelect() {
    if (!this.initialized) return
    this.synth.triggerAttackRelease("C5", "32n")
  }

  playHover() {
    if (!this.initialized) return
    // Very subtle click
    this.synth.triggerAttackRelease("G4", "64n", undefined, 0.1)
  }

  playSuccess() {
    if (!this.initialized) return
    const now = Tone.now()
    this.synth.triggerAttackRelease("C5", "16n", now)
    this.synth.triggerAttackRelease("E5", "16n", now + 0.1)
    this.synth.triggerAttackRelease("G5", "16n", now + 0.2)
  }

  playError() {
    if (!this.initialized) return
    this.synth.triggerAttackRelease("A3", "8n")
    this.synth.triggerAttackRelease("A2", "8n", "+0.1")
  }

  playExplosion() {
    if (!this.initialized) return
    this.noiseSynth.triggerAttackRelease("8n")
  }

  playAmbientDrone() {
    // Optional: continuous ambient sound
  }
}

export const soundManager = SoundManager.getInstance()
