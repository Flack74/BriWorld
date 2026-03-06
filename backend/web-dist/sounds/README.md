# Team Battle Mode - Sound Files

## Required Audio Files

Place these files in `frontend/public/sounds/`:

### 1. team_battle_ambient.mp3
- **Purpose**: Background music during Team Battle gameplay
- **Duration**: 2-3 minutes (looping)
- **Volume**: 0.3 (30%)
- **Loop**: Yes
- **Format**: MP3, 128kbps
- **Mood**: Competitive, energetic, team-oriented
- **Suggested**: Upbeat electronic music, team sports theme

### 2. vote_cast.mp3
- **Purpose**: Sound effect when player casts vote
- **Duration**: 0.5-1 second
- **Volume**: 0.5 (50%)
- **Loop**: No
- **Format**: MP3, 128kbps
- **Mood**: Satisfying, confirmation
- **Suggested**: Button click, stamp, checkmark sound

## Implementation

```typescript
// Ambient sound (plays on component mount)
const audio = new Audio('/sounds/team_battle_ambient.mp3');
audio.volume = 0.3;
audio.loop = true;
audio.play().catch(() => {});

// Vote sound (plays on vote submission)
const audio = new Audio('/sounds/vote_cast.mp3');
audio.volume = 0.5;
audio.play().catch(() => {});
```

## Fallback Behavior

If audio files are missing or fail to load:
- No error thrown (graceful degradation)
- Game continues without sound
- `.catch(() => {})` prevents console errors

## Audio Sources (Royalty-Free)

- **Freesound.org**: Community sound effects
- **Incompetech.com**: Royalty-free music
- **Zapsplat.com**: Free sound effects
- **YouTube Audio Library**: Free music and effects

## File Size Recommendations

- **Ambient**: 2-4 MB (2-3 min loop)
- **Vote Cast**: 10-50 KB (short effect)
- **Total**: ~4 MB for Team Battle mode

## Browser Compatibility

- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support (may require user interaction)
- ✅ Mobile: Full support (iOS may require user gesture)

## Testing

```bash
# Check if files exist
ls -lh frontend/public/sounds/

# Expected output:
# team_battle_ambient.mp3  (2-4 MB)
# vote_cast.mp3            (10-50 KB)
```

---

**Note**: Sound files are optional. The game will work without them, but they enhance the player experience significantly.
