const MOVE_ACCEL = .01;
const ROT_ACCEL = .07;

const PHYSICALLY_ACTIVE_DISTANCE_SQUARED = 600;
const VISUALLY_ACTIVE_DISTANCE_SQUARED = 400;

class Ship extends EngineObject {
  constructor(pos) {
    super(pos, vec2(1, 1), 2, vec2(16, 16));
    // your object init code here

    this._particleEmiter = new ParticleEmitter(
      this.pos, 1, 0, 10, PI / 6, // pos, emitSize, emitTime, emitRate, emiteCone
      2, vec2(16),                            // tileIndex, tileSize
      new Color, new Color(0, 0, 0),            // colorStartA, colorStartB
      new Color(1, 1, 1, 0), new Color(0, 0, 0, 0), // colorEndA, colorEndB
      .5, .2, .2, .1, .05,  // particleTime, sizeStart, sizeEnd, particleSpeed, particleAngleSpeed
      .99, 1, 1, PI, .05,  // damping, angleDamping, gravityScale, particleCone, fadeRate, 
      .5, 1                // randomness, collide, additive, randomColorLinear, renderOrder
    );
    this._particleEmiter.elasticity = .3;
    this._particleEmiter.trailScale = 2;

    this.setCollision(true, false);
  }

  update() {
    super.update(); // update object physics and position
    // player controls
    this._handleInputs();

    this.angleVelocity = ROT_ACCEL * this._moveInput.x;

    this.applyAcceleration(vec2(
      this._moveInput.y * MOVE_ACCEL * Math.cos(this.angle),
      this._moveInput.y * MOVE_ACCEL * -Math.sin(this.angle),
    ))

    this.damping = .95;
    this._particleEmiter.pos = this.pos;
    this._particleEmiter.emitRate = this._moveInput.y > 0 ? 250 : 0;
    this._particleEmiter.angle = this.angle - PI / 2;

    if (this._shootWasPressed) {
      new Bullet(this.pos, this.angle);
    }
  }

  render() {
    super.render(); // draw object as a sprite
    // your object render code here
  }

  _handleInputs() {
    // movement control
    this._moveInput = vec2(keyIsDown(39) - keyIsDown(37), keyIsDown(38) - keyIsDown(40));

    this._shootWasPressed = keyWasPressed(32);
  }
}

class Asteroid extends EngineObject {
  static Types = { LARGE: "L", MEDIUM: "M", SMALL: "S" };
  static RandType() {
    switch (randInt(0, 7)) {
      case 0:
        return Asteroid.Types.SMALL;
      case 1:
      case 2:
      case 3:
      case 4:
        return Asteroid.Types.MEDIUM;
      case 5:
      case 6:
      default:
        return Asteroid.Types.LARGE
    }
  }
  static SizeFromType(type = Asteroid.Types.LARGE) {
    switch (type) {
      case Asteroid.Types.LARGE: return vec2(4, 4);
      case Asteroid.Types.MEDIUM: return vec2(2, 2);
      case Asteroid.Types.SMALL: return vec2(1, 1);
    }
  }

  constructor(pos = vec2(), type = Asteroid.RandType()) {
    super(
      pos,
      Asteroid.SizeFromType(type),
      5,
      vec2(16),
      randInCircle().angle(),
      ASTEROID_COLORS[randInt(0, ASTEROID_COLORS.length)]
    );

    this.type = type;
    this.velocity = randInCircle(0.05, 0.001);
    this.angleVelocity = 0.02 * randSign();
    this.angleDamping = 1;
    this.damping = 1;

    this.setCollision(true, true);
  }

  collideWithObject(other) {
    const physicallyActive = !!ship && this.pos.distanceSquared(ship.pos) < 128;
    if (!physicallyActive) {
      return 0;
    }

    if (other instanceof Bullet) {
      if (this.type === Asteroid.Types.LARGE) {
        addLog('I shoot a large asteroid and it splits in half.', SEVERITY.VERBOSE);
        this._splitAsteroid(other, Asteroid.Types.MEDIUM);
      } else if (this.type === Asteroid.Types.MEDIUM) {
        addLog('I shoot a medium asteroid and it breaks into two.', SEVERITY.VERBOSE);
        this._splitAsteroid(other, Asteroid.Types.SMALL);
      } else if (this.type === Asteroid.Types.SMALL) {
        addLog('I shoot a small asteroid and it fizzles out.', SEVERITY.VERBOSE);
      }

      this.destroy();
      this._particleExplosion();
      return 0;
    }

    if (other instanceof Ship) {
      if (this.type === Asteroid.Types.LARGE) {
        addLog('I crash into a large asteroid and take damage.', SEVERITY.WARNING);
        this._splitAsteroid(other, Asteroid.Types.MEDIUM);
      } else if (this.type === Asteroid.Types.MEDIUM) {
        addLog('I hit a medium asteroid, taking damage.', SEVERITY.WARNING);
        this._splitAsteroid(other, Asteroid.Types.SMALL);
      } else if (this.type === Asteroid.Types.SMALL) {
        addLog('I run into a small asteroid and lose some health.', SEVERITY.WARNING);
      }

      this.destroy();
      this._particleExplosion();
      return 0;
    }

    return 1;
  }

  update() {
    // the distance check has to be greater than the zone spawn distance or 
    // we'll never spawn in asteroids lol
    if (ship && this.pos.distanceSquared(ship.pos) >= (ZONE_ACTIVE_DISTANCE_SQUARED * 2)) {
      this.destroy();
    }

    super.update();
  }

  render() {
    const visuallyActive = !!ship && this.pos.distanceSquared(ship.pos) < ZONE_HALF_ACTIVE_DISTANCE_SQUARED;
    if (!visuallyActive) {
      return;
    }

    super.render();
  }

  _splitAsteroid(other, targetType) {
    const bulletVelocity = other.velocity.normalize();

    const leftOffset = bulletVelocity.rotate(-PI / 2.0);
    console.log(leftOffset);

    const leftAsteroidPos = this.pos.add(leftOffset.scale(.5));
    const rightAsteroidPos = this.pos.subtract(leftOffset.scale(.5));

    const left = new Asteroid(
      leftAsteroidPos,
      targetType
    );

    const right = new Asteroid(
      rightAsteroidPos,
      targetType
    );

    left.color = this.color;
    right.color = this.color;

    left.applyAcceleration(leftOffset.scale(0.1).rotate(PI / randInt(4, 8)).add(this.velocity));
    right.applyAcceleration(leftOffset.scale(-0.1).rotate(-PI / randInt(4, 8)).add(this.velocity))
  }

  _particleExplosion() {
    const particleColor = this.color;
    new ParticleEmitter(
      this.pos, this.size, .1, 250, PI,
      5, vec2(16),
      particleColor, particleColor,
      particleColor.scale(1, 0), particleColor.scale(1, 0),
      .5, .6, .3, .1, .05,
      .99, .95, .4, PI, .1,
      1, 0, 1
    );
  }
}

class Bullet extends EngineObject {
  static Speed = .8;

  constructor(pos = vec2(), shipAngle = 0.0) {
    super(
      pos,
      vec2(0.7, 0.3),
      6,
      defaultTileSize,
      shipAngle
    );

    this.velocity = vec2(
      Bullet.Speed * Math.cos(shipAngle),
      Bullet.Speed * -Math.sin(shipAngle)
    );

    this.setCollision(true, false);
  }

  update() {
    super.update();

    if (ship && this.pos.distanceSquared(ship.pos) >= ZONE_HALF_ACTIVE_DISTANCE_SQUARED) {
      this.destroy();
    }
  }

  collideWithObject(other) {
    if (other instanceof Asteroid) {
      this.destroy();
    }

    return 1;
  }
}

class Lance extends EngineObject {
  constructor(pos = vec2()) {
    super(
      pos,
      vec2(2),
      2,
      defaultTileSize,
      0,
      FRIEND_GREEN
    )
  }

  update() {
    // the distance check has to be greater than the zone spawn distance or 
    // we'll never spawn in asteroids lol
    if (!ship || this.pos.distanceSquared(ship.pos) >= ZONE_ACTIVE_DISTANCE_SQUARED) {
      return;
    }

    super.update();

    this.angle = this.pos.subtract(ship.pos).rotate(-PI / 2).angle();
  }

  render() {
    super.render();
  }
}