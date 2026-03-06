/**
 * CapitalRushMode.tsx — Capital city guessing game mode component.
 *
 * Players are shown a capital city image and must identify which country
 * the capital belongs to by guessing from the image alone.
 *
 * Features:
 * - Dynamic capital city images loaded from a static JSON manifest
 * - Random image selection from multiple images per capital
 * - No hints - pure visual recognition challenge
 * - Loading spinner while images load
 */

import { useState, useEffect } from 'react';
import { GameState } from '@/types/game';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/** Props for the CapitalRushMode component */
interface CapitalRushModeProps {
  /** Current game state from the server */
  gameState: GameState;
  /** The local player's username */
  username: string;
  /** Callback to submit an answer to the server */
  onSubmitAnswer: (answer: string) => void;
}

/** Shape of the capital images JSON data: code → { capital, images[] } */
interface CapitalData {
  capital: string;
  images: string[];
}

export function CapitalRushMode({ gameState, username, onSubmitAnswer }: CapitalRushModeProps) {
  /** Current answer text typed by the player */
  const [answer, setAnswer] = useState('');
  /** Whether the current capital image has finished loading */
  const [imageLoaded, setImageLoaded] = useState(false);
  /** Map of country codes to capital data (fetched once on mount) */
  const [capitalImages, setCapitalImages] = useState<Record<string, CapitalData>>({});
  /** The randomly selected image URL for the current round */
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  /**
   * Effect: Fetch the capital images manifest on first mount.
   * This JSON file maps country codes to their capital name and image URLs.
   */
  useEffect(() => {
    fetch('/capital-images.json')
      .then(res => res.json())
      .then(data => setCapitalImages(data))
      .catch(err => console.error('Failed to load capital images:', err));
  }, []);

  /**
   * Submit the current answer to the server and clear the input.
   * Does nothing if the input is empty/whitespace.
   */
  const handleSubmit = () => {
    if (!answer.trim()) return;
    onSubmitAnswer(answer);
    setAnswer('');
  };

  /**
   * Effect: Reset state and select a random image when the round changes.
   *
   * Uses the country code from the question to look up available capital
   * images, then picks one at random for visual variety.
   */
  useEffect(() => {
    /* Reset loading state and image selection for the new round */
    setImageLoaded(false);

    /* Look up the country code from the question data */
    const countryCode = gameState.question?.country_code || gameState.question?.flag_code;
    /* Find the matching capital data in our image manifest */
    const capitalData = countryCode ? capitalImages[countryCode] : null;

    if (capitalData?.images && capitalData.images.length > 0) {
      /* Pick a random image from the available options */
      const randomIndex = Math.floor(Math.random() * capitalData.images.length);
      setSelectedImage(capitalData.images[randomIndex]);
    } else {
      /* No images available for this country — fallback to placeholder */
      setSelectedImage(null);
    }
  }, [gameState.current_round, capitalImages, gameState.question]);



  /* Loading state: show animated spinner while waiting for question data */
  if (!gameState.question) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="text-5xl sm:text-6xl mb-4">⏳</div>
        <p className="text-muted-foreground text-sm sm:text-base">Loading next question...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 px-2">
      {/* Question Card — displays the capital city image or placeholder */}
      <Card className="glass-card overflow-hidden">
        {/* Image container with fixed max height */}
        <div className="relative w-full h-64 sm:h-80 bg-gradient-to-br from-primary/20 to-accent/20">
          {selectedImage ? (
            <>
              {/* Loading spinner — shown until image finishes loading */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
                </div>
              )}
              {/* Capital city photograph */}
              <img
                src={selectedImage}
                alt="Capital city"
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            </>
          ) : (
            /* Placeholder when no image is available */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-4 sm:p-8">
                <div className="text-5xl sm:text-8xl mb-2 sm:mb-4">🏛️</div>
                <div className="text-xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                  Guess the Country
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Capital city image
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Question prompt section */}
        <div className="p-3 sm:p-4 text-center">
          <div className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Which country is this?
          </div>
          {/* Time remaining counter */}
          <div className="text-xs text-muted-foreground mt-2">
            ⏱️ {gameState.time_remaining}s remaining
          </div>
        </div>
      </Card>

      {/* Answer Input Card — text input and submit button */}
      <Card className="glass-card p-3 sm:p-6 space-y-2 sm:space-y-3">
        <Input
          /* Key on round number to auto-clear between rounds */
          key={gameState.current_round}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Type the country name..."
          className="text-sm sm:text-lg h-10 sm:h-12"
          autoFocus
        />
        <Button
          onClick={handleSubmit}
          className="w-full h-10 sm:h-12 text-sm sm:text-lg font-bold"
          disabled={!answer.trim()}
        >
          🚀 Submit Answer
        </Button>
      </Card>
    </div>
  );
}
