// Sound Effects Manager for BriWorld
class SoundManager {
  private static instance: SoundManager;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private volume: number = 0.5;
  private muted: boolean = false;

  private constructor() {
    this.loadSounds();
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private loadSounds() {
    const soundFiles = {
      correct: '/sounds/correct.mp3',
      wrong: '/sounds/wrong.mp3',
      timeout: '/sounds/timeout.mp3',
      complete: '/sounds/complete.mp3',
      click: '/sounds/click.mp3',
      join: '/sounds/join.mp3',
      leave: '/sounds/leave.mp3',
    };

    Object.entries(soundFiles).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.volume = this.volume;
      this.sounds.set(name, audio);
    });
  }

  play(soundName: string) {
    if (this.muted) return;

    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.currentTime = 0;
      sound.volume = this.volume;
      sound.play().catch((error) => {
        console.warn(`Failed to play sound: ${soundName}`, error);
      });
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((sound) => {
      sound.volume = this.volume;
    });
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }
}

export default SoundManager;
