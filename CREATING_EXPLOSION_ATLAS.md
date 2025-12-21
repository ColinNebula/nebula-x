# Creating Multi-Frame Explosion Atlas

## What You Need

A **TexturePacker atlas** with 6-12 bright explosion frames showing:
1. **Initial flash** (bright white/yellow center)
2. **Expanding fireball** (orange/red sphere growing)
3. **Peak explosion** (maximum size, bright colors)
4. **Secondary burst** (debris, sparks flying)
5. **Cooling phase** (darker oranges, embers)
6. **Dissipation** (smoke trails fading)

## Option 1: Use Free Explosion Sprites

### Recommended Sources:
1. **OpenGameArt.org** - Search "explosion sprite sheet"
2. **Kenney.nl** - Free game assets including explosions
3. **itch.io** - Many free game asset packs
4. **Craftpix.net** - Free section has explosion sprites

### Look For:
- **Frame count**: 6-12 frames
- **Format**: PNG sequence or sprite sheet
- **Colors**: Bright yellows, oranges, reds (not just smoke)
- **Resolution**: 128x128 or 256x256 per frame

## Option 2: Create With TexturePacker

If you have individual explosion frames:

1. **Download TexturePacker** (free version works): https://www.codeandweb.com/texturepacker

2. **Prepare your frames**:
   - Name them sequentially: `explosion_001.png`, `explosion_002.png`, etc.
   - All same size (128x128 or 256x256 recommended)
   - Bright colors with transparency

3. **Pack the sprites**:
   ```
   - Open TexturePacker
   - Drag your explosion frames into the window
   - Set "Data Format" to "JSON (Hash)"
   - Set "Data file" to "spritesheet-explosion.json"
   - Set "Texture file" to "spritesheet-explosion.png"
   - Click "Publish sprite sheet"
   ```

4. **Replace files**:
   - Copy both files to `/public/` folder
   - Overwrite existing files

## Option 3: Use AI Generation

Generate explosion frames with AI tools:

### DALL-E / Midjourney Prompts:
```
"2D game explosion sprite, frame 1, initial bright flash, 
transparent background, pixel art style, vibrant colors"

"2D game explosion sprite, frame 2, expanding fireball, 
orange and yellow, transparent background, game asset"
```

Generate 8 frames with progressive expansion and cooling.

## Option 4: Use the Template

I've created `explosion-atlas-template.json` showing the structure:

### Structure:
```json
{
  "frames": {
    "explosion_001.png": { "frame": { "x": 0, "y": 0, "w": 128, "h": 128 } },
    "explosion_002.png": { "frame": { "x": 128, "y": 0, "w": 128, "h": 128 } },
    // ... more frames
  },
  "meta": {
    "image": "spritesheet-explosion.png",
    "size": { "w": 512, "h": 256 }
  }
}
```

### Create matching PNG:
- 512x256 sprite sheet (for 8 frames at 128x128)
- Arrange frames left-to-right, top-to-bottom
- Match coordinates in JSON

## Quick Solution: Use Legacy Format

Your current `explosion2.png` likely has 8 frames already. The system automatically falls back to it if atlas loading fails.

To force legacy mode:
1. Rename `spritesheet-explosion.json` to `spritesheet-explosion.json.backup`
2. System will use `explosion2.png` automatically

## Testing Your Atlas

Once you have a new atlas:

1. **Place files** in `/public/`:
   - `spritesheet-explosion.json`
   - `spritesheet-explosion.png`

2. **Reload game** - check console for:
   ```
   [EXPLOSION] Atlas JSON loaded: {frames: 8, imageSize: {w: 512, h: 256}}
   [EXPLOSION] Sprite loaded successfully: {size: "512x256", atlasFrames: 8}
   ```

3. **Destroy enemies** - you should see animated explosions cycling through frames

## What the Code Now Does

✅ **Sorts frame names** - ensures consistent animation order
✅ **Cycles through frames** - uses explosion.frame counter
✅ **Extracts frame data** - reads x, y, w, h from JSON for each frame
✅ **Full opacity** - multi-frame explosions shown at 100% alpha
✅ **Frame timing** - controlled by frameDelay (3-4 frames per animation frame)

## Recommended Frame Timing

For 8-frame explosion at 60 FPS:
- `frameDelay: 3` = ~0.4 seconds total (fast)
- `frameDelay: 4` = ~0.5 seconds total (standard)
- `frameDelay: 5` = ~0.7 seconds total (slow)

Current settings:
- Normal/Small: 3 frames delay
- Boss: 4 frames delay

---

**Need Help?** Share where you found explosion sprites and I can help you format them correctly!
