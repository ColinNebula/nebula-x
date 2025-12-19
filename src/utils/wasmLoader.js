// WASM Physics Module Loader
let physicsModule = null;
let isLoading = false;
let loadPromise = null;

// Load the WASM module
export async function loadPhysicsModule() {
  // Return cached module if already loaded
  if (physicsModule) return physicsModule;
  
  // Return existing promise if currently loading
  if (isLoading) return loadPromise;
  
  isLoading = true;
  loadPromise = (async () => {
    try {
      // Dynamically import the Emscripten-generated JS wrapper
      const createPhysicsModule = (await import('/game_physics.js')).default;
      
      // Initialize the WASM module
      physicsModule = await createPhysicsModule();
      
      console.log('✅ WASM Physics Module loaded successfully');
      return physicsModule;
    } catch (error) {
      console.warn('⚠️ WASM module not available, using JavaScript fallback:', error);
      // Return a fallback object with JavaScript implementations
      return createJavaScriptFallback();
    } finally {
      isLoading = false;
    }
  })();
  
  return loadPromise;
}

// JavaScript fallback implementations
function createJavaScriptFallback() {
  return {
    ccall: () => {},
    cwrap: (name) => {
      const fallbacks = {
        checkRectCollision: (x1, y1, w1, h1, x2, y2, w2, h2) => {
          return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
        },
        checkCircleCollision: (x1, y1, r1, x2, y2, r2) => {
          const dx = x1 - x2;
          const dy = y1 - y2;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < (r1 + r2);
        },
        checkCircleRectCollision: (cx, cy, radius, rx, ry, rw, rh) => {
          const closestX = Math.max(rx, Math.min(cx, rx + rw));
          const closestY = Math.max(ry, Math.min(cy, ry + rh));
          const dx = cx - closestX;
          const dy = cy - closestY;
          return (dx * dx + dy * dy) < (radius * radius);
        },
        distanceSquared: (x1, y1, x2, y2) => {
          const dx = x2 - x1;
          const dy = y2 - y1;
          return dx * dx + dy * dy;
        },
        calculateAngle: (x1, y1, x2, y2) => {
          return Math.atan2(y2 - y1, x2 - x1);
        },
        perlinNoise: (x, y, seed) => {
          const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
          return n - Math.floor(n);
        },
        easeInOutQuad: (t) => {
          return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        },
        easeInOutCubic: (t) => {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        },
        easeOutElastic: (t) => {
          const c4 = (2 * Math.PI) / 3;
          return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        },
        easeOutBounce: (t) => {
          const n1 = 7.5625;
          const d1 = 2.75;
          if (t < 1 / d1) {
            return n1 * t * t;
          } else if (t < 2 / d1) {
            t -= 1.5 / d1;
            return n1 * t * t + 0.75;
          } else if (t < 2.5 / d1) {
            t -= 2.25 / d1;
            return n1 * t * t + 0.9375;
          } else {
            t -= 2.625 / d1;
            return n1 * t * t + 0.984375;
          }
        },
        clamp: (value, min, max) => Math.max(min, Math.min(value, max)),
        smoothstep: (edge0, edge1, x) => {
          x = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
          return x * x * (3 - 2 * x);
        },
        checkLineCircleIntersection: (x1, y1, x2, y2, cx, cy, radius) => {
          const dx = cx - x1;
          const dy = cy - y1;
          const lx = x2 - x1;
          const ly = y2 - y1;
          const lineLength = Math.sqrt(lx * lx + ly * ly);
          if (lineLength === 0) return false;
          const lxn = lx / lineLength;
          const lyn = ly / lineLength;
          let projection = dx * lxn + dy * lyn;
          projection = Math.max(0, Math.min(lineLength, projection));
          const closestX = x1 + lxn * projection;
          const closestY = y1 + lyn * projection;
          const distSq = (cx - closestX) ** 2 + (cy - closestY) ** 2;
          return distSq <= radius * radius;
        }
      };
      return fallbacks[name] || (() => {});
    },
    _isFallback: true
  };
}

// Wrapper functions for easy use
export class PhysicsEngine {
  constructor(module) {
    this.module = module;
    this.isFallback = module._isFallback || false;
    
    // Wrap C++ functions for easy calling
    if (!this.isFallback) {
      // Basic collision detection
      this.checkRectCollision = module.cwrap('checkRectCollision', 'number', 
        ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);
      this.checkCircleCollision = module.cwrap('checkCircleCollision', 'number',
        ['number', 'number', 'number', 'number', 'number', 'number']);
      this.checkCircleRectCollision = module.cwrap('checkCircleRectCollision', 'number',
        ['number', 'number', 'number', 'number', 'number', 'number', 'number']);
      this.distanceSquared = module.cwrap('distanceSquared', 'number',
        ['number', 'number', 'number', 'number']);
      this.calculateAngle = module.cwrap('calculateAngle', 'number',
        ['number', 'number', 'number', 'number']);
      
      // Advanced features
      this.perlinNoise = module.cwrap('perlinNoise', 'number', ['number', 'number', 'number']);
      this.smoothNoise = module.cwrap('smoothNoise', 'number', 
        ['number', 'number', 'number', 'number', 'number']);
      this.easeInOutQuad = module.cwrap('easeInOutQuad', 'number', ['number']);
      this.easeInOutCubic = module.cwrap('easeInOutCubic', 'number', ['number']);
      this.easeOutElastic = module.cwrap('easeOutElastic', 'number', ['number']);
      this.easeOutBounce = module.cwrap('easeOutBounce', 'number', ['number']);
      this.lerpEased = module.cwrap('lerpEased', 'number', 
        ['number', 'number', 'number', 'number']);
      this.clamp = module.cwrap('clamp', 'number', ['number', 'number', 'number']);
      this.smoothstep = module.cwrap('smoothstep', 'number', 
        ['number', 'number', 'number']);
      this.checkLineCircleIntersection = module.cwrap('checkLineCircleIntersection', 'number',
        ['number', 'number', 'number', 'number', 'number', 'number', 'number']);
    } else {
      // Fallback implementations
      this.checkRectCollision = module.cwrap('checkRectCollision');
      this.checkCircleCollision = module.cwrap('checkCircleCollision');
      this.checkCircleRectCollision = module.cwrap('checkCircleRectCollision');
      this.distanceSquared = module.cwrap('distanceSquared');
      this.calculateAngle = module.cwrap('calculateAngle');
      this.perlinNoise = module.cwrap('perlinNoise');
      this.easeInOutQuad = module.cwrap('easeInOutQuad');
      this.easeInOutCubic = module.cwrap('easeInOutCubic');
      this.easeOutElastic = module.cwrap('easeOutElastic');
      this.easeOutBounce = module.cwrap('easeOutBounce');
      this.clamp = module.cwrap('clamp');
      this.smoothstep = module.cwrap('smoothstep');
      this.checkLineCircleIntersection = module.cwrap('checkLineCircleIntersection');
    }
  }
  
  // High-level collision detection
  checkCollision(obj1, obj2) {
    if (obj1.radius && obj2.radius) {
      // Circle-circle collision
      return this.checkCircleCollision(obj1.x, obj1.y, obj1.radius, obj2.x, obj2.y, obj2.radius);
    } else if (obj1.radius) {
      // Circle-rect collision
      return this.checkCircleRectCollision(obj1.x, obj1.y, obj1.radius, 
        obj2.x, obj2.y, obj2.width, obj2.height);
    } else if (obj2.radius) {
      // Rect-circle collision (swap params)
      return this.checkCircleRectCollision(obj2.x, obj2.y, obj2.radius,
        obj1.x, obj1.y, obj1.width, obj1.height);
    } else {
      // Rect-rect collision
      return this.checkRectCollision(obj1.x, obj1.y, obj1.width, obj1.height,
        obj2.x, obj2.y, obj2.width, obj2.height);
    }
  }
  
  getDistance(x1, y1, x2, y2) {
    return Math.sqrt(this.distanceSquared(x1, y1, x2, y2));
  }
  
  getAngle(x1, y1, x2, y2) {
    return this.calculateAngle(x1, y1, x2, y2);
  }
  
  // Helper: Generate circular bullet pattern
  generateCircularPattern(bulletCount, centerX, centerY, radius, angleOffset = 0) {
    const bullets = [];
    const angleStep = (2 * Math.PI) / bulletCount;
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = angleStep * i + angleOffset;
      bullets.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        angle: angle,
        vx: Math.cos(angle),
        vy: Math.sin(angle)
      });
    }
    
    return bullets;
  }
  
  // Helper: Generate spiral pattern
  generateSpiralPattern(bulletCount, centerX, centerY, startRadius, radiusGrowth, rotationSpeed, angleOffset = 0) {
    const bullets = [];
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = rotationSpeed * i + angleOffset;
      const radius = startRadius + radiusGrowth * i;
      bullets.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        angle: angle,
        vx: Math.cos(angle),
        vy: Math.sin(angle)
      });
    }
    
    return bullets;
  }
  
  // Helper: Cubic Bezier curve point
  cubicBezier(t, p0, p1, p2, p3) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    
    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
    };
  }
  
  // Helper: Quadratic Bezier curve point
  quadraticBezier(t, p0, p1, p2) {
    const u = 1 - t;
    const uu = u * u;
    const tt = t * t;
    
    return {
      x: uu * p0.x + 2 * u * t * p1.x + tt * p2.x,
      y: uu * p0.y + 2 * u * t * p1.y + tt * p2.y
    };
  }
  
  // Helper: Screen shake
  calculateScreenShake(intensity, decay, time) {
    const shake = intensity * Math.exp(-decay * time);
    return {
      x: (this.perlinNoise(time * 10, 0, 0) - 0.5) * shake * 2,
      y: (this.perlinNoise(0, time * 10, 1) - 0.5) * shake * 2
    };
  }
  
  // Helper: Rotate point around center
  rotatePoint(x, y, centerX, centerY, angle) {
    const dx = x - centerX;
    const dy = y - centerY;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    
    return {
      x: centerX + dx * cosA - dy * sinA,
      y: centerY + dx * sinA + dy * cosA
    };
  }
  
  // Helper: Lerp with easing
  // easingType: 0=linear, 1=quad, 2=cubic, 3=elastic, 4=bounce
  lerp(start, end, t, easingType = 0) {
    if (this.isFallback || easingType === 0) {
      return start + (end - start) * t;
    }
    return this.lerpEased(start, end, t, easingType);
  }
  
  // Helper: Reflect velocity (for bouncing)
  reflectVelocity(vx, vy, nx, ny, bounciness = 1) {
    const nLen = Math.sqrt(nx * nx + ny * ny);
    if (nLen > 0) {
      nx /= nLen;
      ny /= nLen;
    }
    
    const dot = vx * nx + vy * ny;
    return {
      vx: (vx - 2 * dot * nx) * bounciness,
      vy: (vy - 2 * dot * ny) * bounciness
    };
  }
}

// Initialize and export singleton
let physicsEngine = null;

export async function getPhysicsEngine() {
  if (!physicsEngine) {
    const module = await loadPhysicsModule();
    physicsEngine = new PhysicsEngine(module);
  }
  return physicsEngine;
}
