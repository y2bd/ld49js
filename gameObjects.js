const MOVE_ACCEL = .01;
const ROT_ACCEL = .07;

const PHYSICALLY_ACTIVE_DISTANCE_SQUARED = 600;
const VISUALLY_ACTIVE_DISTANCE_SQUARED = 400;

const DIALOGUE_DISTANCE_SQUARED = 100;

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

      Lance.Current.collectOre();

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
  static QuestStatuses = {
    NotStarted: 0,
    Started: 1,
    InProgress: 2,
    Finished: 3,
    Rewarded: 4
  }

  static Current = undefined;
  static OreRequirement = 15;

  constructor(pos = vec2()) {
    super(
      pos,
      vec2(2),
      2,
      defaultTileSize,
      0,
      FRIEND_GREEN
    );

    this._hadEnteredDialogueRange = false;
    this._questStatus = Lance.QuestStatuses.NotStarted;
    this._dialogueCancellationToken = undefined;
    this._metAtLeastOnce = false;

    this._currentOreCollected = 0;

    Lance.Current = this;
  }

  update() {
    // the distance check has to be greater than the zone spawn distance or 
    // we'll never spawn in asteroids lol
    if (!ship || this.pos.distanceSquared(ship.pos) >= ZONE_ACTIVE_DISTANCE_SQUARED) {
      return;
    }

    super.update();
    this.angle = this.pos.subtract(ship.pos).rotate(-PI / 2).angle();

    if (!ship || ship.pos.distanceSquared(this.pos) >= DIALOGUE_DISTANCE_SQUARED) {
      if (this._hadEnteredDialogueRange) {
        this._hadEnteredDialogueRange = false;
        this.onDialogueExit();
      }
    } else if (!this._hadEnteredDialogueRange) {
      this._hadEnteredDialogueRange = true;
      this.onDialogueEnter();
    }
  }

  render() {
    super.render();
  }

  onDialogueEnter() {
    if (this._questStatus === Lance.QuestStatuses.NotStarted) {
      this._questStatus = Lance.QuestStatuses.Started;
      const { dialogPromise, cancellationToken } = playDialog([
        ...(!this._metAtLeastOnce ? [`@BREAK"Hey there," said the green ship.`, `"I've not seen anyone around here in a while."`] : [`@BREAK"Ah, you're back."`]),
        !this._metAtLeastOnce ? `@BREAK"I've seen plenty of asteroids, if that counts," I shoot back.` : `@BREAK"Yes, turns out the asteroids weren't as interesting as I would have hoped," I admit.`,
        `@BREAK"Yeah there's plenty of them. `, `There's also plenty of this red gas if you haven't already noticed."`,
        `@BREAK"It's corrosive, I wouldn't last a second in there."`,
        `@BREAK"You won't, unless you turn on your energy shields."`,
        `@BREAK"I can't. Locked by the corporation, `, `I don't have enough credits to enable them."`,
        `@BREAK"You're still relying on corp for upgrades? `, `There's other ways of unlocking the extra subsystems," the green ship informs me.`,
        `@BREAK"In fact, tell ya what," the green ship continues, `, `"I'm scheduled to harvest fifteen ore today. `, `If you do that for me I'll show you how to unlock the shields."`,
        `@BREAK"Sure. I was shooting asteroids anyway."`,
        `@BREAK`
      ]);

      this._dialogueCancellationToken = cancellationToken;
      dialogPromise.then((dialogCompleted) => {
        if (dialogCompleted) {
          this._questStatus = Lance.QuestStatuses.InProgress;
          this._dialogueCancellationToken = undefined;
        }
      })
    }

    if (this._questStatus === Lance.QuestStatuses.Finished) {
      const { dialogPromise, cancellationToken } = playDialog([
        `@BREAK"Ah, you're back. `, `And it looks like you have all the ore too. `, `Thanks, all in a day's work!"`,
        `@BREAK"Yeah, working all the day in, sure. `, `You said you'd show me how to turn on these shields."`,
        `@BREAK"Give me a second, `, `I'm radioing some codes over to your ship. You should see them enable shortly."`,
        `@BREAK`
      ]);

      this._dialogueCancellationToken = cancellationToken;
      dialogPromise.then((dialogCompleted) => {
        if (dialogCompleted) {
          this._questStatus = Lance.QuestStatuses.Rewarded;
          this._dialogueCancellationToken = undefined;

          addLog(`My ship's control panel states that the shields are now online.`, SEVERITY.SUCCESS);
          addLog(`@BREAK`, SEVERITY.SUCCESS);
        }
      })
    }

    this._metAtLeastOnce = true;
  }

  onDialogueExit() {
    if (this._dialogueCancellationToken && this._questStatus === Lance.QuestStatuses.Started) {
      this._dialogueCancellationToken();
      this._questStatus = Lance.QuestStatuses.NotStarted;

      addLog('@BREAKI left before we could finish talking.', SEVERITY.DIALOGUE);
      addLog('@BREAK', SEVERITY.DIALOGUE);
    }


    if (this._dialogueCancellationToken && this._questStatus === Lance.QuestStatuses.Finished) {
      this._dialogueCancellationToken();

      addLog('@BREAKI left before we could finish talking.', SEVERITY.DIALOGUE);
      addLog('@BREAK', SEVERITY.DIALOGUE);
    }
  }

  collectOre() {
    if (this._questStatus === Lance.QuestStatuses.InProgress) {
      this._currentOreCollected++;

      if (this._currentOreCollected < Lance.OreRequirement) {
        addLog(`@BREAKI collected some ore. ${this._currentOreCollected} left to go.`, SEVERITY.SUCCESS);
        addLog(`@BREAK`, SEVERITY.SUCCESS);
      } else {
        addLog(`@BREAKThat's all the ore I need. I should head back to get my shields working.`, SEVERITY.SUCCESS);
        addLog(`@BREAK`, SEVERITY.SUCCESS);

        this._questStatus = Lance.QuestStatuses.Finished;
      }
    }
  }
}