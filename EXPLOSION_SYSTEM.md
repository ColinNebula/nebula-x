# Explosion System - TexturePacker Integration

## Overview
The explosion system now supports **TexturePacker JSON format** in addition to legacy horizontal sprite strips. This makes it easy to use professionally packed sprite atlases.

## How It Works

### 1. **Asset Loading**
The system attempts to load assets in this order:
1. Fetch `spritesheet-explosion.json` (TexturePacker atlas data)
2. If successful, load `spritesheet-explosion.png` (the sprite image)
3. If JSON fails, fallback to `explosion2.png` (legacy format)

### 2. **Format Detection**
- **TexturePacker Format**: Uses JSON to define frame positions, sizes, and metadata
- **Legacy Format**: Horizontal strip with 8 equally-sized frames

### 3. **Current Setup**
Your `spritesheet-explosion.json` contains:
- **1 frame** named "explosion3.png"
- **Position**: x:2, y:2
- **Size**: 787x311 pixels
- **Full sprite**: 791x315 pixels

## Rendering Behavior

### Single-Frame Atlas (Current)
Since the atlas has only 1 frame, it's treated as a **static explosion overlay**:
- ✅ Fades out over lifetime
- ✅ Uses additive blending (`screen` mode) for glow effect
- ✅ Can have rotation and scale variations
- ✅ Combined with particle effects for dynamic appearance

### Multi-Frame Atlas (Future)
If you add more frames to the JSON:
1. Name them sequentially (e.g., "explosion1.png", "explosion2.png"...)
2. System will automatically cycle through frames
3. Animation speed controlled by `frameDelay` parameter

## Usage Examples

### Boss Explosion
```javascript
createExplosion(x, y, 'boss', true);
```
Creates:
- 1 large center explosion (180px)
- 4 secondary explosions in a circle pattern
- Each with random scale and rotation (atlas mode)
- Combined with particles, debris, shockwaves

### Normal Enemy Explosion
```javascript
createExplosion(x, y, 'normal', true);
```
Creates:
- 1 explosion (80px) with particles

### Sizes Available
- `'small'` - 56px
- `'normal'` - 80px
- `'heavy'` - 110px
- `'boss'` - 180px

## Extending the System

### Adding Animation Frames

To create a multi-frame explosion:

1. **Create frames** in your image editor
2. **Pack with TexturePacker** and export as JSON
3. **Name frames** consistently (e.g., explosion_001.png, explosion_002.png...)
4. **Update JSON** structure:
```json
{
  "frames": {
    "explosion_001.png": { "frame": { "x": 0, "y": 0, "w": 256, "h": 256 } },
    "explosion_002.png": { "frame": { "x": 256, "y": 0, "w": 256, "h": 256 } },
    "explosion_003.png": { "frame": { "x": 512, "y": 0, "w": 256, "h": 256 } }
  }
}
```

### Frame Mapping (Advanced)

For multi-frame atlases, you'll need to map frame indices to frame names:

```javascript
// In createExplosion function, around line 3990:
if (explosion.totalFrames > 1) {
  const atlas = explosionAtlasRef.current;
  const frameNames = Object.keys(atlas.frames).sort(); // Sort for consistency
  const frameIndex = Math.min(currentFrame, frameNames.length - 1);
  explosion.frameName = frameNames[frameIndex];
  explosion.frameData = atlas.frames[frameNames[frameIndex]];
}
```

## Technical Details

### New Refs Added
```javascript
explosionAtlasRef.current        // Stores parsed JSON data
explosionAtlasLoadedRef.current  // Boolean flag for atlas availability
```

### Explosion Object Properties
```javascript
{
  isAtlas: true,              // Using TexturePacker format
  frameName: "explosion3.png", // Current frame name
  frameData: { frame: {...} }, // Frame coordinates from JSON
  scale: 1.0,                  // Size multiplier
  rotation: 0,                 // Rotation in radians
  // ... standard properties
}
```

### Rendering Logic
```javascript
if (explosion.isAtlas) {
  // Extract from JSON
  srcX = frameData.frame.x;
  srcY = frameData.frame.y;
  frameWidth = frameData.frame.w;
  frameHeight = frameData.frame.h;
  
  // Apply effects
  ctx.globalAlpha = fadeAmount;
  ctx.globalCompositeOperation = 'screen';
} else {
  // Legacy horizontal strip
  frameWidth = sprite.width / totalFrames;
  srcX = currentFrame * frameWidth;
}
```

## Performance Notes

- ✅ **Fallback safe**: If JSON fails, uses legacy sprite
- ✅ **Cached**: Atlas loaded once at startup
- ✅ **Performance mode**: Reduces particles, not sprites
- ✅ **Memory efficient**: Single sprite sheet for all explosions

## Debugging

Enable debug logging:
```javascript
// In rendering code (line ~5930)
if (currentFrame === 0 && Math.random() < 0.01) {
  console.log('[SPRITE] Drawing explosion:', {
    isAtlas: explosion.isAtlas,
    frameData: explosion.frameData
  });
}
```

Watch console for:
- `[EXPLOSION] Atlas JSON loaded` - Success
- `[EXPLOSION] Legacy sprite loaded` - Fallback mode
- `[SPRITE] Drawing explosion` - Per-frame debug info

## Next Steps

To get animated explosions:

1. **Create an animation sequence** (8-12 frames recommended)
2. **Pack with TexturePacker**:
   - Use "JSON (Hash)" format
   - Enable trim/crop for optimization
   - Set max size appropriately
3. **Update frame mapping logic** (see "Frame Mapping" above)
4. **Test** with `createExplosion(x, y, 'boss', true)`

The system is now ready to handle professional sprite atlases! 🚀
