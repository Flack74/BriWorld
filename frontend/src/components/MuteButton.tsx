import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AudioManager from '@/lib/audioManager';

const MuteButton = () => {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const muted = localStorage.getItem('audioMuted') === 'true';
    setIsMuted(muted);
  }, []);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('audioMuted', newMuted.toString());
    
    if (newMuted) {
      AudioManager.getInstance().pauseBackgroundMusic();
    } else {
      AudioManager.getInstance().resumeBackgroundMusic();
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleMute}
      className="rounded-xl"
      title={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </Button>
  );
};

export default MuteButton;
