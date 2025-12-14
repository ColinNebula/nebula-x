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
    } else {
      this.checkRectCollision = module.cwrap('checkRectCollision');
      this.checkCircleCollision = module.cwrap('checkCircleCollision');
      this.checkCircleRectCollision = module.cwrap('checkCircleRectCollision');
      this.distanceSquared = module.cwrap('distanceSquared');
      this.calculateAngle = module.cwrap('calculateAngle');
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
