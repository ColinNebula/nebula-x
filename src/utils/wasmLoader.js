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

      // Spatial hashing
      this.spatialHashInsert = module.cwrap('spatialHashInsert', null,
        ['number', 'number', 'number', 'number', 'number']);
      this.spatialHashQuery = module.cwrap('spatialHashQuery', 'number',
        ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);
      this.spatialHashCollisions = module.cwrap('spatialHashCollisions', 'number',
        ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);

      // A* Pathfinding
      this.astarPathfind = module.cwrap('astarPathfind', 'number',
        ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);
      this.smoothPath = module.cwrap('smoothPath', null,
        ['number', 'number', 'number', 'number', 'number', 'number']);

      // Quadtree
      this.quadtreeInit = module.cwrap('quadtreeInit', 'number',
        ['number', 'number', 'number', 'number']);
      this.quadtreeInsert = module.cwrap('quadtreeInsert', 'number',
        ['number', 'number', 'number', 'number', 'number', 'number']);
      this.quadtreeQuery = module.cwrap('quadtreeQuery', 'number',
        ['number', 'number', 'number', 'number', 'number', 'number', 'number']);
      this.quadtreeClear = module.cwrap('quadtreeClear', null, []);

      // Advanced particles
      this.updatePhysicsParticles = module.cwrap('updatePhysicsParticles', null,
        ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number',
         'number', 'number', 'number', 'number', 'number', 'number', 'number']);
      this.spawnParticleBurst = module.cwrap('spawnParticleBurst', null,
        ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);

      // Procedural generation
      this.terrainHeight = module.cwrap('terrainHeight', 'number',
        ['number', 'number', 'number', 'number', 'number', 'number', 'number']);
      this.generateTilemap = module.cwrap('generateTilemap', null,
        ['number', 'number', 'number', 'number', 'number', 'number', 'number']);
      this.generateVoronoi = module.cwrap('generateVoronoi', null,
        ['number', 'number', 'number', 'number', 'number', 'number', 'number']);
      this.generateCaves = module.cwrap('generateCaves', null,
        ['number', 'number', 'number', 'number', 'number', 'number']);
      this.fbmNoise = module.cwrap('fbmNoise', 'number',
        ['number', 'number', 'number', 'number', 'number', 'number']);
      this.ridgeNoise = module.cwrap('ridgeNoise', 'number',
        ['number', 'number', 'number', 'number', 'number']);
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

      // Stubs for advanced features in fallback mode
      this.spatialHashInsert = () => {};
      this.spatialHashQuery = () => 0;
      this.spatialHashCollisions = () => 0;
      this.astarPathfind = () => 0;
      this.smoothPath = () => {};
      this.quadtreeInit = () => 0;
      this.quadtreeInsert = () => false;
      this.quadtreeQuery = () => 0;
      this.quadtreeClear = () => {};
      this.updatePhysicsParticles = () => {};
      this.spawnParticleBurst = () => {};
      this.terrainHeight = (x, y) => this.perlinNoise(x/50, y/50, 0);
      this.generateTilemap = () => {};
      this.generateVoronoi = () => {};
      this.generateCaves = () => {};
      this.fbmNoise = (x, y, octaves) => {
        let total = 0, freq = 1, amp = 1, max = 0;
        for (let i = 0; i < octaves; i++) {
          total += this.perlinNoise(x * freq, y * freq, i) * amp;
          max += amp;
          amp *= 0.5;
          freq *= 2;
        }
        return total / max;
      };
      this.ridgeNoise = (x, y, octaves) => {
        let total = 0, freq = 1, amp = 1, max = 0;
        for (let i = 0; i < octaves; i++) {
          let n = this.perlinNoise(x * freq, y * freq, i);
          n = 1 - Math.abs(n * 2 - 1);
          total += n * amp;
          max += amp;
          amp *= 0.5;
          freq *= 2;
        }
        return total / max;
      };
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

  // ============================================================
  // ADVANCED FEATURES - HIGH-LEVEL HELPERS
  // ============================================================

  // Spatial Hash: Create hash grid for entities
  createSpatialHash(entities, cellSize = 50) {
    if (!entities || entities.length === 0) return null;

    const x = new Float32Array(entities.length);
    const y = new Float32Array(entities.length);

    for (let i = 0; i < entities.length; i++) {
      x[i] = entities[i].x || 0;
      y[i] = entities[i].y || 0;
    }

    const cellIndices = new Int32Array(entities.length);

    if (!this.isFallback) {
      const xPtr = this.module._malloc(x.length * 4);
      const yPtr = this.module._malloc(y.length * 4);
      const outPtr = this.module._malloc(cellIndices.length * 4);

      this.module.HEAPF32.set(x, xPtr / 4);
      this.module.HEAPF32.set(y, yPtr / 4);

      this.spatialHashInsert(xPtr, yPtr, entities.length, cellSize, outPtr);

      cellIndices.set(this.module.HEAP32.subarray(outPtr / 4, outPtr / 4 + cellIndices.length));

      this.module._free(xPtr);
      this.module._free(yPtr);
      this.module._free(outPtr);
    }

    return { cellIndices, cellSize, entities };
  }

  // Find path between two points (A* pathfinding)
  findPath(startX, startY, goalX, goalY, obstacleGrid, gridWidth, gridHeight) {
    const maxPathLength = 100;
    const pathX = new Int32Array(maxPathLength);
    const pathY = new Int32Array(maxPathLength);

    if (!this.isFallback) {
      const gridPtr = this.module._malloc(obstacleGrid.length * 4);
      const pathXPtr = this.module._malloc(maxPathLength * 4);
      const pathYPtr = this.module._malloc(maxPathLength * 4);

      this.module.HEAP32.set(obstacleGrid, gridPtr / 4);

      const pathLength = this.astarPathfind(
        Math.floor(startX), Math.floor(startY),
        Math.floor(goalX), Math.floor(goalY),
        gridPtr, gridWidth, gridHeight,
        pathXPtr, pathYPtr, maxPathLength
      );

      if (pathLength > 0) {
        pathX.set(this.module.HEAP32.subarray(pathXPtr / 4, pathXPtr / 4 + pathLength));
        pathY.set(this.module.HEAP32.subarray(pathYPtr / 4, pathYPtr / 4 + pathLength));
      }

      this.module._free(gridPtr);
      this.module._free(pathXPtr);
      this.module._free(pathYPtr);

      return pathLength > 0 ? Array.from({ length: pathLength }, (_, i) => ({
        x: pathX[i],
        y: pathY[i]
      })) : [];
    }

    // Fallback: simple direct line
    return [{ x: startX, y: startY }, { x: goalX, y: goalY }];
  }

  // Create and manage Quadtree for spatial partitioning
  createQuadtree(bounds) {
    this.quadtreeInit(bounds.x, bounds.y, bounds.width, bounds.height);
    return {
      insert: (entity, entityId) => {
        return this.quadtreeInsert(0, entityId, entity.x, entity.y, 8, 0);
      },
      query: (x, y, radius, maxResults = 100) => {
        const results = new Int32Array(maxResults);
        if (!this.isFallback) {
          const resultsPtr = this.module._malloc(maxResults * 4);
          const count = this.quadtreeQuery(0, x, y, radius, resultsPtr, maxResults, 0);
          if (count > 0) {
            results.set(this.module.HEAP32.subarray(resultsPtr / 4, resultsPtr / 4 + count));
          }
          this.module._free(resultsPtr);
          return Array.from(results.slice(0, count));
        }
        return [];
      },
      clear: () => this.quadtreeClear()
    };
  }

  // Spawn advanced particle burst with physics
  createParticleBurst(x, y, count = 20, minSpeed = 2, maxSpeed = 8, seed = Date.now()) {
    const particles = {
      x: new Float32Array(count),
      y: new Float32Array(count),
      vx: new Float32Array(count),
      vy: new Float32Array(count),
      rotation: new Float32Array(count),
      angularVel: new Float32Array(count),
      life: new Float32Array(count).fill(60),
      maxLife: new Float32Array(count).fill(60)
    };

    if (!this.isFallback) {
      const xPtr = this.module._malloc(count * 4);
      const yPtr = this.module._malloc(count * 4);
      const vxPtr = this.module._malloc(count * 4);
      const vyPtr = this.module._malloc(count * 4);
      const rotPtr = this.module._malloc(count * 4);
      const angPtr = this.module._malloc(count * 4);

      this.spawnParticleBurst(x, y, count, xPtr, yPtr, vxPtr, vyPtr, rotPtr, angPtr,
                              minSpeed, maxSpeed, seed);

      particles.x.set(this.module.HEAPF32.subarray(xPtr / 4, xPtr / 4 + count));
      particles.y.set(this.module.HEAPF32.subarray(yPtr / 4, yPtr / 4 + count));
      particles.vx.set(this.module.HEAPF32.subarray(vxPtr / 4, vxPtr / 4 + count));
      particles.vy.set(this.module.HEAPF32.subarray(vyPtr / 4, vyPtr / 4 + count));
      particles.rotation.set(this.module.HEAPF32.subarray(rotPtr / 4, rotPtr / 4 + count));
      particles.angularVel.set(this.module.HEAPF32.subarray(angPtr / 4, angPtr / 4 + count));

      this.module._free(xPtr);
      this.module._free(yPtr);
      this.module._free(vxPtr);
      this.module._free(vyPtr);
      this.module._free(rotPtr);
      this.module._free(angPtr);
    } else {
      // Fallback: simple burst
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
        particles.x[i] = x;
        particles.y[i] = y;
        particles.vx[i] = Math.cos(angle) * speed;
        particles.vy[i] = Math.sin(angle) * speed;
        particles.rotation[i] = angle;
        particles.angularVel[i] = (Math.random() - 0.5) * 0.2;
      }
    }

    return particles;
  }

  // Update particles with advanced physics (gravity, attraction, repulsion)
  updateParticles(particles, options = {}) {
    const {
      gravity = 0.1,
      drag = 0.98,
      attractorX = 0,
      attractorY = 0,
      attractionStrength = 0,
      repulsorX = 0,
      repulsorY = 0,
      repulsionStrength = 0
    } = options;

    const count = particles.x.length;

    if (!this.isFallback) {
      const xPtr = this.module._malloc(count * 4);
      const yPtr = this.module._malloc(count * 4);
      const vxPtr = this.module._malloc(count * 4);
      const vyPtr = this.module._malloc(count * 4);
      const rotPtr = this.module._malloc(count * 4);
      const angPtr = this.module._malloc(count * 4);
      const lifePtr = this.module._malloc(count * 4);
      const maxLifePtr = this.module._malloc(count * 4);

      this.module.HEAPF32.set(particles.x, xPtr / 4);
      this.module.HEAPF32.set(particles.y, yPtr / 4);
      this.module.HEAPF32.set(particles.vx, vxPtr / 4);
      this.module.HEAPF32.set(particles.vy, vyPtr / 4);
      this.module.HEAPF32.set(particles.rotation, rotPtr / 4);
      this.module.HEAPF32.set(particles.angularVel, angPtr / 4);
      this.module.HEAPF32.set(particles.life, lifePtr / 4);
      this.module.HEAPF32.set(particles.maxLife, maxLifePtr / 4);

      this.updatePhysicsParticles(
        xPtr, yPtr, vxPtr, vyPtr, rotPtr, angPtr, lifePtr, maxLifePtr, count,
        gravity, drag, attractorX, attractorY, attractionStrength,
        repulsorX, repulsorY, repulsionStrength
      );

      particles.x.set(this.module.HEAPF32.subarray(xPtr / 4, xPtr / 4 + count));
      particles.y.set(this.module.HEAPF32.subarray(yPtr / 4, yPtr / 4 + count));
      particles.vx.set(this.module.HEAPF32.subarray(vxPtr / 4, vxPtr / 4 + count));
      particles.vy.set(this.module.HEAPF32.subarray(vyPtr / 4, vyPtr / 4 + count));
      particles.rotation.set(this.module.HEAPF32.subarray(rotPtr / 4, rotPtr / 4 + count));
      particles.angularVel.set(this.module.HEAPF32.subarray(angPtr / 4, angPtr / 4 + count));
      particles.life.set(this.module.HEAPF32.subarray(lifePtr / 4, lifePtr / 4 + count));

      this.module._free(xPtr);
      this.module._free(yPtr);
      this.module._free(vxPtr);
      this.module._free(vyPtr);
      this.module._free(rotPtr);
      this.module._free(angPtr);
      this.module._free(lifePtr);
      this.module._free(maxLifePtr);
    } else {
      // Fallback implementation
      for (let i = 0; i < count; i++) {
        if (particles.life[i] <= 0) continue;

        particles.vy[i] += gravity;
        particles.vx[i] *= drag;
        particles.vy[i] *= drag;
        particles.x[i] += particles.vx[i];
        particles.y[i] += particles.vy[i];
        particles.rotation[i] += particles.angularVel[i];
        particles.angularVel[i] *= drag;
        particles.life[i] -= 1;
      }
    }
  }

  // Generate procedural terrain/level
  generateLevel(width, height, options = {}) {
    const {
      type = 'perlin',  // 'perlin', 'voronoi', 'caves'
      scale = 50,
      octaves = 4,
      persistence = 0.5,
      seed = Date.now()
    } = options;

    const tiles = new Int32Array(width * height);

    if (type === 'caves') {
      if (!this.isFallback) {
        const tilesPtr = this.module._malloc(tiles.length * 4);
        this.generateCaves(width, height, 0.45, 4, seed, tilesPtr);
        tiles.set(this.module.HEAP32.subarray(tilesPtr / 4, tilesPtr / 4 + tiles.length));
        this.module._free(tilesPtr);
      }
    } else if (type === 'voronoi') {
      const numPoints = 20;
      const pointsX = new Float32Array(numPoints);
      const pointsY = new Float32Array(numPoints);

      if (!this.isFallback) {
        const pointsXPtr = this.module._malloc(numPoints * 4);
        const pointsYPtr = this.module._malloc(numPoints * 4);
        const regionsPtr = this.module._malloc(tiles.length * 4);

        this.generateVoronoi(width, height, numPoints, seed, pointsXPtr, pointsYPtr, regionsPtr);
        tiles.set(this.module.HEAP32.subarray(regionsPtr / 4, regionsPtr / 4 + tiles.length));

        this.module._free(pointsXPtr);
        this.module._free(pointsYPtr);
        this.module._free(regionsPtr);
      }
    } else {
      // Perlin/FBM
      if (!this.isFallback) {
        const tilesPtr = this.module._malloc(tiles.length * 4);
        this.generateTilemap(width, height, scale, octaves, persistence, seed, tilesPtr);
        tiles.set(this.module.HEAP32.subarray(tilesPtr / 4, tilesPtr / 4 + tiles.length));
        this.module._free(tilesPtr);
      } else {
        // Fallback
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const noise = this.fbmNoise(x, y, octaves, persistence, 2, seed);
            tiles[y * width + x] = noise < 0.3 ? 0 : noise < 0.5 ? 1 : noise < 0.7 ? 2 : 3;
          }
        }
      }
    }

    return { tiles, width, height };
  }

  // Get terrain height at position (for dynamic terrain)
  getTerrainHeight(x, y, options = {}) {
    const { octaves = 4, persistence = 0.5, lacunarity = 2, scale = 50, seed = 0 } = options;
    return this.terrainHeight(x, y, octaves, persistence, lacunarity, scale, seed);
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
