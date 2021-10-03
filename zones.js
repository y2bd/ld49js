const ZONES_HORI = 25;
const ZONES_HORI_HALF = 12;
const ZONES_VERT = 25;
const ZONES_VERT_HALF = 12;

const ZONE_WIDTH = 30;
const ZONE_WIDTH_HALF = 15;
const ZONE_HEIGHT = 30;
const ZONE_HEIGHT_HALF = 15;

const ZONE_HALF_ACTIVE_DISTANCE_SQUARED = (ZONE_WIDTH_HALF * 1.5) ** 2;
const ZONE_ACTIVE_DISTANCE_SQUARED = (ZONE_WIDTH * 1.5) ** 2;

const COLOR_ZONE_MAP = {
  /** EMPTY */
  '#C2C3C7': () => EmptyZone,
  /** START */
  '#7E2553': () => EmptyZone,
  /** HEAVY */
  '#1D2B53': () => HeavyZone,
  /** RED GAS */
  '#FF004D': () => RedGasZone,
  /** LANCE QUEST */
  '#FFA300': () => LanceZone
}

function loadZoneMap() {
  return new Promise(resolve => {
    const zonesImage = new Image();
    zonesImage.src = "zones.png";
    zonesImage.onload = () => {
      const zonesCanvas = document.createElement('canvas');
      zonesCanvas.width = zonesImage.width;
      zonesCanvas.height = zonesImage.height;
      zonesCanvas.getContext('2d').drawImage(zonesImage, 0, 0, zonesImage.width, zonesImage.height);

      const zonesMap = []
      for (let row = 0; row < zonesImage.height; row++) {
        const zonesRow = [];
        for (let col = 0; col < zonesImage.width; col++) {
          const [r, g, b] = zonesCanvas.getContext('2d').getImageData(col, zonesImage.height - row - 1, 1, 1).data;
          zonesRow[col] = (COLOR_ZONE_MAP[rgbToHex(r, g, b).toUpperCase()] || COLOR_ZONE_MAP['#C2C3C7'])();
        }
        zonesMap[row] = zonesRow;
      }

      zonesImage.remove();
      zonesCanvas.remove();
      resolve(zonesMap);
    }
  });
}

class Zone extends EngineObject {
  constructor(row = 0, col = 0) {
    super(vec2());

    this._row = row;
    this._col = col;

    this._randTempColor = randColor();
    this._randTempColor.a = 0.2;

    this._hadEnteredActiveBoundary = false;
    this._hadShipEnteredZone = false;
  }

  get globalCenterX() {
    return (this._col - ZONES_HORI_HALF) * (ZONE_WIDTH);
  }

  get globalCenterY() {
    return (this._row - ZONES_VERT_HALF) * (ZONE_HEIGHT);
  }

  get globalCenter() {
    return vec2(this.globalCenterX, this.globalCenterY);
  }

  get globalTopLeftX() {
    return this.globalCenterX - ZONE_WIDTH_HALF;
  }

  get globalTopLeftY() {
    return this.globalCenterY - ZONE_HEIGHT_HALF;
  }

  get isActive() {
    if (this._isAlwaysActive) {
      return true;
    }

    return !!ship && ship.pos.distanceSquared(this.globalCenter) <= ZONE_ACTIVE_DISTANCE_SQUARED;
  }

  get isContainingShip() {
    return (
      ship &&
      ship.pos.x >= this.globalTopLeftX &&
      ship.pos.y >= this.globalTopLeftY &&
      ship.pos.x <= this.globalTopLeftX + ZONE_WIDTH &&
      ship.pos.y <= this.globalTopLeftY + ZONE_HEIGHT
    );
  }

  update() {
    // handle active culling
    if (!this.isActive) {
      if (this._hadEnteredActiveBoundary) {
        this._hadEnteredActiveBoundary = false;
        this.onExitActiveBoundary();
      }

      return;
    }

    if (!this._hadEnteredActiveBoundary) {
      this._hadEnteredActiveBoundary = true;
      this.onEnterActiveBoundary();
    }

    // handle ship going in and leaving
    if (!this.isContainingShip) {
      if (this._hadShipEnteredZone) {
        this._hadShipEnteredZone = false;
        this.onShipExit();
      }
    } else if (!this._hadShipEnteredZone) {
      this._hadShipEnteredZone = true;
      this.onShipEnter();
    }
  }

  onEnterActiveBoundary() {
    console.log('ZONE', this._row, this._col, 'BECAME ACTIVE');
  }

  onExitActiveBoundary() {
    console.log('ZONE', this._row, this._col, 'BECAME INACTIVE');
  }

  onShipEnter() {
    console.log('ZONE', this._row, this._col, 'HOLDS SHIP');
  }

  onShipExit() {
    console.log('ZONE', this._row, this._col, 'LOST SHIP');
  }

  render() {
    if (debugOverlay) {
      drawRect(this.globalCenter, vec2(ZONE_WIDTH, ZONE_HEIGHT), this._randTempColor);
    }
  }
}

class EmptyZone extends Zone {
  static AsteroidLimit = 8;

  constructor(row = 0, col = 0) {
    super(row, col);
    this._asteroids = [];
  }

  onEnterActiveBoundary() {
    super.onEnterActiveBoundary();
    this._clearAsteroids();

    while (this._asteroids.length < EmptyZone.AsteroidLimit) {
      const circleOffset = randInCircle(16, 2);
      this._asteroids.push(new Asteroid(this.globalCenter.add(circleOffset)));
    }
  }

  onExitActiveBoundary() {
    super.onExitActiveBoundary();

    // we clear on exit to get rid of em early
    // and clear again on entrance to get rid of stragglers
    this._clearAsteroids();
  }

  _clearAsteroids() {
    const asteroidCountBefore = this._asteroids.length;
    this._asteroids = this._asteroids.filter(asteroid => !asteroid.destroyed);
    console.log("CLEARED", asteroidCountBefore - this._asteroids.length, "ASTEROIDS");
  }
}

class HeavyZone extends Zone {
  static AsteroidLimit = 15;

  constructor(row = 0, col = 0) {
    super(row, col);
    this._asteroids = [];
  }

  onEnterActiveBoundary() {
    super.onEnterActiveBoundary();
    const asteroidCountBefore = this._asteroids.length;
    this._asteroids = this._asteroids.filter(asteroid => !asteroid.destroyed);
    console.log("CLEARED", asteroidCountBefore - this._asteroids.length, "BIG ASTEROIDS")

    while (this._asteroids.length < EmptyZone.AsteroidLimit) {
      const circleOffset = randInCircle(16, 2);
      this._asteroids.push(new Asteroid(this.globalCenter.add(circleOffset), Asteroid.Types.LARGE));
    }
  }

  onExitActiveBoundary() {
    super.onExitActiveBoundary();
  }
}

class RedGasZone extends Zone {
  static RedColor = (() => { const color = rgb(255, 0, 117); color.a = 0.3; return color; })();
  static InSomeRedFog = false;

  constructor(row = 0, col = 0) {
    super(row, col);
  }

  onShipEnter() {
    super.onShipEnter();

    if (!RedGasZone.InSomeRedFog) {
      RedGasZone.InSomeRedFog = false;
      addLog('I enter a red fog, corrosive to my ship. If I stay here too long, I will perish.', SEVERITY.ERROR);
    }
  }

  onShipExit() {
    super.onShipExit();
    RedGasZone.InSomeRedFog = false;
  }

  render() {
    super.render();
    drawRect(this.globalCenter, vec2(ZONE_WIDTH, ZONE_HEIGHT), RedGasZone.RedColor);
  }
}

class LanceZone extends Zone {
  constructor(row = 0, col = 0) {
    super(row, col);
    this._isAlwaysActive = true;

    new Lance(this.globalCenter);
  }
}