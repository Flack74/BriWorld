import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Music, Bell, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import AudioManager from '@/lib/audioManager';

const Settings = () => {
  const navigate = useNavigate();
  const [audioMuted, setAudioMuted] = useState(localStorage.getItem('audioMuted') === 'true');
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

  const handleGlobalMuteToggle = (muted: boolean) => {
    setAudioMuted(muted);
    AudioManager.getInstance().setGlobalMute(muted);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl">
        <div className="card-elevated p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-xl h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
          </div>

          {/* Global Audio Mute */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-destructive shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-destructive text-sm sm:text-base">Mute All Audio</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Disable all sounds and music</p>
                </div>
              </div>
              <Switch checked={audioMuted} onCheckedChange={handleGlobalMuteToggle} className="shrink-0" />
            </div>
          </div>

          <div className="border-t border-border pt-6" />

          {/* Background Music */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <Music className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base">Background Music</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Play music during gameplay</p>
                </div>
              </div>
              <Switch checked={bgMusicEnabled} onCheckedChange={handleBgMusicToggle} className="shrink-0" />
            </div>

            {bgMusicEnabled && !audioMuted && (
              <>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Volume</label>
                  <Slider
                    value={[bgMusicVolume]}
                    onValueChange={handleBgVolumeChange}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Track</label>
                  <div className="grid gap-1 sm:gap-2">
                    {tracks.map((track) => (
                      <button
                        key={track.path}
                        onClick={() => handleTrackChange(track.path)}
                        className={`p-2 sm:p-3 rounded-lg border text-left transition-colors text-xs sm:text-sm ${
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
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h3 className="font-semibold text-sm sm:text-base">Sound Effects</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium">SFX Volume</label>
              <Slider
                value={[sfxVolume]}
                onValueChange={handleSfxVolumeChange}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-medium text-xs sm:text-sm">Ping Notification</h4>
                  <p className="text-xs text-muted-foreground">Play sound when mentioned</p>
                </div>
              </div>
              <Switch checked={notificationEnabled} onCheckedChange={handleNotificationToggle} className="shrink-0" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <span className="text-lg sm:text-2xl shrink-0">✅</span>
                <div className="min-w-0">
                  <h4 className="font-medium text-xs sm:text-sm">Correct Answer</h4>
                  <p className="text-xs text-muted-foreground">Play sound on correct answer</p>
                </div>
              </div>
              <Switch checked={correctAnswerEnabled} onCheckedChange={handleCorrectAnswerToggle} className="shrink-0" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <span className="text-lg sm:text-2xl shrink-0">🎉</span>
                <div className="min-w-0">
                  <h4 className="font-medium text-xs sm:text-sm">Game Complete</h4>
                  <p className="text-xs text-muted-foreground">Play sound when game ends</p>
                </div>
              </div>
              <Switch checked={gameCompleteEnabled} onCheckedChange={handleGameCompleteToggle} className="shrink-0" />
            </div>
          </div>

          <div className="pt-3 sm:pt-4">
            <Button onClick={() => navigate('/')} className="w-full gradient-primary h-10 sm:h-12 text-sm sm:text-base">
              Save & Return
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
