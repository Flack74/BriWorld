class AudioManager {
  private static instance: AudioManager;
  private backgroundMusic: HTMLAudioElement | null = null;
  private notificationSound: HTMLAudioElement | null = null;
  private correctAnswerSound: HTMLAudioElement | null = null;
  private gameCompleteSound: HTMLAudioElement | null = null;
  private countdownSound: HTMLAudioElement | null = null;
  private isNotificationPlaying = false;
  private isCorrectAnswerPlaying = false;
  private isGameCompletePlaying = false;
  private isCountdownPlaying = false;

  private constructor() {
    this.notificationSound = new Audio('/Music/SFX/briworld-notification.wav');
    this.correctAnswerSound = new Audio('/Music/SFX/briworld-correct_answer.wav');
    this.gameCompleteSound = new Audio('/Music/SFX/briworld-game-complete.mp3');
    this.countdownSound = new Audio('/Music/SFX/briworld-last-3s-countdown-sound-.mp3');
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  setBackgroundMusic(track: string) {
    // If already playing the same track, don't restart
    if (this.backgroundMusic && this.backgroundMusic.src.endsWith(track)) {
      return;
    }
    
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic = null;
    }
    
    const volume = parseFloat(localStorage.getItem('bgMusicVolume') || '0.3');
    const muted = localStorage.getItem('audioMuted') === 'true';
    
    if (!muted && track) {
      this.backgroundMusic = new Audio(track);
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = volume;
      this.backgroundMusic.play().catch((err) => {
        console.log('Background music play failed:', err);
      });
    }
  }

  playNotification() {
    if (this.isNotificationPlaying || !this.notificationSound) return;
    
    const enabled = localStorage.getItem('notificationEnabled') !== 'false';
    const volume = parseFloat(localStorage.getItem('sfxVolume') || '0.5');
    
    if (!enabled) return;
    
    this.isNotificationPlaying = true;
    this.notificationSound.volume = volume;
    this.notificationSound.currentTime = 0;
    this.notificationSound.play().catch((err) => {
      console.log('Notification sound play failed:', err);
      this.isNotificationPlaying = false;
    });
    
    this.notificationSound.onended = () => {
      this.isNotificationPlaying = false;
    };
  }

  playCorrectAnswer() {
    if (this.isCorrectAnswerPlaying || !this.correctAnswerSound) return;
    
    const enabled = localStorage.getItem('correctAnswerEnabled') !== 'false';
    const volume = parseFloat(localStorage.getItem('sfxVolume') || '0.5');
    
    if (!enabled) return;
    
    this.isCorrectAnswerPlaying = true;
    this.correctAnswerSound.volume = volume;
    this.correctAnswerSound.currentTime = 0;
    this.correctAnswerSound.play().catch((err) => {
      console.log('Correct answer sound play failed:', err);
      this.isCorrectAnswerPlaying = false;
    });
    
    this.correctAnswerSound.onended = () => {
      this.isCorrectAnswerPlaying = false;
    };
  }

  pauseBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }

  resumeBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.play().catch((err) => {
        console.log('Background music resume failed:', err);
      });
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic = null;
    }
  }

  setBackgroundVolume(volume: number) {
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = volume;
    }
    localStorage.setItem('bgMusicVolume', volume.toString());
  }

  setSFXVolume(volume: number) {
    if (this.notificationSound) this.notificationSound.volume = volume;
    if (this.correctAnswerSound) this.correctAnswerSound.volume = volume;
    if (this.gameCompleteSound) this.gameCompleteSound.volume = volume;
    localStorage.setItem('sfxVolume', volume.toString());
  }

  playGameComplete() {
    if (this.isGameCompletePlaying || !this.gameCompleteSound) return;
    
    const enabled = localStorage.getItem('gameCompleteEnabled') !== 'false';
    const volume = parseFloat(localStorage.getItem('sfxVolume') || '0.5');
    
    if (!enabled) return;
    
    this.isGameCompletePlaying = true;
    this.gameCompleteSound.volume = volume;
    this.gameCompleteSound.currentTime = 0;
    this.gameCompleteSound.play().catch((err) => {
      console.log('Game complete sound play failed:', err);
      this.isGameCompletePlaying = false;
    });
    
    this.gameCompleteSound.onended = () => {
      this.isGameCompletePlaying = false;
    };
  }

  playCountdown() {
    if (this.isCountdownPlaying || !this.countdownSound) return;
    
    const volume = parseFloat(localStorage.getItem('sfxVolume') || '0.5');
    
    this.isCountdownPlaying = true;
    this.countdownSound.volume = volume;
    this.countdownSound.currentTime = 0;
    this.countdownSound.play().catch((err) => {
      console.log('Countdown sound play failed:', err);
      this.isCountdownPlaying = false;
    });
    
    this.countdownSound.onended = () => {
      this.isCountdownPlaying = false;
    };
  }

  stopCountdown() {
    if (this.countdownSound) {
      this.countdownSound.pause();
      this.countdownSound.currentTime = 0;
      this.isCountdownPlaying = false;
    }
  }
}

export default AudioManager;
