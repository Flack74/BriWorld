import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Music, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import AudioManager from '@/lib/audioManager';

const Settings = () => {
  const navigate = useNavigate();
  const [bgMusicEnabled, setBgMusicEnabled] = useState(localStorage.getItem('bgMusicEnabled') !== 'false');
  const [bgMusicVolume, setBgMusicVolume] = useState(parseFloat(localStorage.getItem('bgMusicVolume') || '0.3'));
  const [bgMusicTrack, setBgMusicTrack] = useState(localStorage.getItem('bgMusicTrack') || '/Music/briworld-background-1.mp3');
  const [sfxVolume, setSfxVolume] = useState(parseFloat(localStorage.getItem('sfxVolume') || '0.5'));
  const [notificationEnabled, setNotificationEnabled] = useState(localStorage.getItem('notificationEnabled') !== 'false');
  const [correctAnswerEnabled, setCorrectAnswerEnabled] = useState(localStorage.getItem('correctAnswerEnabled') !== 'false');
  const [gameCompleteEnabled, setGameCompleteEnabled] = useState(localStorage.getItem('gameCompleteEnabled') !== 'false');

  const tracks = [
    { name: 'Background 1', path: '/Music/briworld-background-1.mp3' },
    { name: 'Background 2', path: '/Music/briworld-background-2.mp3' },
    { name: 'Background 3', path: '/Music/briworld-background-3-chopin-nocturne-in-e-flat-major-op-9.mp3' },
    { name: 'Background 4', path: '/Music/briworld-background-4.mp3' },
  ];

  useEffect(() => {
    const audio = AudioManager.getInstance();
    if (bgMusicEnabled) {
      audio.setBackgroundMusic(bgMusicTrack);
    } else {
      audio.stopBackgroundMusic();
    }
  }, [bgMusicEnabled, bgMusicTrack]);

  const handleBgMusicToggle = (enabled: boolean) => {
    setBgMusicEnabled(enabled);
    localStorage.setItem('bgMusicEnabled', enabled.toString());
  };

  const handleBgVolumeChange = (value: number[]) => {
    const vol = value[0];
    setBgMusicVolume(vol);
    AudioManager.getInstance().setBackgroundVolume(vol);
  };

  const handleSfxVolumeChange = (value: number[]) => {
    const vol = value[0];
    setSfxVolume(vol);
    AudioManager.getInstance().setSFXVolume(vol);
  };

  const handleTrackChange = (track: string) => {
    setBgMusicTrack(track);
    localStorage.setItem('bgMusicTrack', track);
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationEnabled(enabled);
    localStorage.setItem('notificationEnabled', enabled.toString());
  };

  const handleCorrectAnswerToggle = (enabled: boolean) => {
    setCorrectAnswerEnabled(enabled);
    localStorage.setItem('correctAnswerEnabled', enabled.toString());
  };

  const handleGameCompleteToggle = (enabled: boolean) => {
    setGameCompleteEnabled(enabled);
    localStorage.setItem('gameCompleteEnabled', enabled.toString());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="card-elevated p-8 space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          </div>

          {/* Background Music */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Background Music</h3>
                  <p className="text-sm text-muted-foreground">Play music during gameplay</p>
                </div>
              </div>
              <Switch checked={bgMusicEnabled} onCheckedChange={handleBgMusicToggle} />
            </div>

            {bgMusicEnabled && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Volume</label>
                  <Slider
                    value={[bgMusicVolume]}
                    onValueChange={handleBgVolumeChange}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Track</label>
                  <div className="grid gap-2">
                    {tracks.map((track) => (
                      <button
                        key={track.path}
                        onClick={() => handleTrackChange(track.path)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          bgMusicTrack === track.path
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        {track.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-border pt-6" />

          {/* Sound Effects */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Volume2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Sound Effects</h3>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">SFX Volume</label>
              <Slider
                value={[sfxVolume]}
                onValueChange={handleSfxVolumeChange}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Ping Notification</h4>
                  <p className="text-sm text-muted-foreground">Play sound when mentioned</p>
                </div>
              </div>
              <Switch checked={notificationEnabled} onCheckedChange={handleNotificationToggle} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h4 className="font-medium">Correct Answer</h4>
                  <p className="text-sm text-muted-foreground">Play sound on correct answer</p>
                </div>
              </div>
              <Switch checked={correctAnswerEnabled} onCheckedChange={handleCorrectAnswerToggle} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <h4 className="font-medium">Game Complete</h4>
                  <p className="text-sm text-muted-foreground">Play sound when game ends</p>
                </div>
              </div>
              <Switch checked={gameCompleteEnabled} onCheckedChange={handleGameCompleteToggle} />
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={() => navigate('/')} className="w-full gradient-primary">
              Save & Return
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
