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
    AudioManager.getInstance().setGlobalMute(newMuted);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleMute}
      className="rounded-lg sm:rounded-xl h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10"
      title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
    >
      {isMuted ? <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" /> : <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />}
    </Button>
  );
};

export default MuteButton;
