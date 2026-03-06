import { useState, useEffect } from 'react';
import { GameState } from '@/types/game';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import * as topojson from 'topojson-client';
import { feature } from 'topojson-client';
import { geoPath, geoMercator } from 'd3-geo';

interface SilhouetteModeProps {
  gameState: GameState;
  username: string;
  onSubmitAnswer: (answer: string) => void;
}

export function SilhouetteMode({ gameState, username, onSubmitAnswer }: SilhouetteModeProps) {
  const [answer, setAnswer] = useState('');
  const [worldData, setWorldData] = useState<any>(null);
  const [countryPath, setCountryPath] = useState<string>('');

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(data => setWorldData(data))
      .catch(err => console.error('Failed to load world data:', err));
  }, []);

  useEffect(() => {
    if (!worldData || !gameState.question?.country_code) return;

    const countries = feature(worldData, worldData.objects.countries);
    const country = countries.features.find(
      (f: any) => f.properties.name === gameState.question?.country_name || f.id === gameState.question?.country_code
    );

    if (country) {
      const projection = geoMercator().fitSize([600, 400], country);
      const pathGenerator = geoPath().projection(projection);
      const path = pathGenerator(country);
      if (path && path !== 'M100,100 L150,100 L150,150 L100,150 Z') {
        setCountryPath(path);
      } else {
        console.warn('Failed to generate valid silhouette for', gameState.question?.country_code);
        setCountryPath('');
      }
    } else {
      console.warn('Country not found in world data:', gameState.question?.country_code);
      setCountryPath('');
    }
  }, [worldData, gameState.question]);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    onSubmitAnswer(answer);
    setAnswer('');
  };

  if (!gameState.question) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-muted-foreground">Loading next question...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 px-2">
      {/* Silhouette Display */}
      <Card className="glass-card p-4 sm:p-8 flex flex-col items-center justify-center">
        <div className="text-center space-y-3 sm:space-y-4 w-full">
          {countryPath ? (
            <div className="flex items-center justify-center w-full h-52 sm:h-64">
              <svg viewBox="0 0 600 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <path
                  d={countryPath}
                  fill="currentColor"
                  className="text-primary"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </svg>
            </div>
          ) : (
            <div className="space-y-2 py-8">
              <div className="text-5xl sm:text-6xl">🗾</div>
              <p className="text-xs text-yellow-500">⚠️ Silhouette unavailable - Free point for everyone!</p>
            </div>
          )}
          <p className="text-muted-foreground text-sm sm:text-base">Guess the country by its silhouette</p>
          
          <div className="text-xs text-muted-foreground">
            ⏱️ {gameState.time_remaining}s remaining
          </div>
        </div>
      </Card>

      {/* Answer Input */}
      <Card className="glass-card p-4 sm:p-6 space-y-3">
        <Input
          key={gameState.current_round}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Type the country name..."
          className="text-base sm:text-lg h-10 sm:h-12"
          autoFocus
        />
        <Button
          onClick={handleSubmit}
          className="w-full h-10 sm:h-12 text-base sm:text-lg font-bold"
          disabled={!answer.trim()}
        >
          Submit Answer
        </Button>
      </Card>
    </div>
  );
}
