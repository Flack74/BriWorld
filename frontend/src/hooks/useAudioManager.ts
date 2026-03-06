import { useEffect } from 'react';
import AudioManager from '@/lib/audioManager';
import { getMusicUrl } from '@/lib/api';

export const useAudioManager = () => {
  useEffect(() => {
    const initAudio = () => {
      const bgMusicEnabled = localStorage.getItem('bgMusicEnabled') !== 'false';
      const audioMuted = localStorage.getItem('audioMuted') === 'true';

      if (bgMusicEnabled && !audioMuted) {
        const bgTrack = localStorage.getItem('bgMusicTrack') || getMusicUrl('/Music/briworld-background-1.mp3');
        localStorage.setItem('bgMusicTrack', bgTrack);
        AudioManager.getInstance().setBackgroundMusic(bgTrack);
      }

      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
  }, []);
};
