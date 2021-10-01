const MOVE_ACCEL = .01;
const ROT_ACCEL = .07;

class Ship extends EngineObject {
  constructor(pos) {
    super(pos, vec2(1, 1), 2, vec2(16, 16));
    // your object init code here

    this._particleEmiter = new ParticleEmitter(
      this.pos, 1, 0, 200, PI / 6, // pos, emitSize, emitTime, emitRate, emiteCone
      2, vec2(16),                            // tileIndex, tileSize
      new Color, new Color(0, 0, 0),            // colorStartA, colorStartB
      new Color(1, 1, 1, 0), new Color(0, 0, 0, 0), // colorEndA, colorEndB
      2, .2, .2, .1, .05,  // particleTime, sizeStart, sizeEnd, particleSpeed, particleAngleSpeed
      .99, 1, 1, PI, .05,  // damping, angleDamping, gravityScale, particleCone, fadeRate, 
      .5, 1                // randomness, collide, additive, randomColorLinear, renderOrder
    );
    this._particleEmiter.elasticity = .3;
    this._particleEmiter.trailScale = 2;
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
  }

  render() {
    super.render(); // draw object as a sprite
    // your object render code here
  }

  _handleInputs() {
    // movement control
    this._moveInput = isUsingGamepad ? gamepadStick(0) :
      vec2(keyIsDown(39) - keyIsDown(37), keyIsDown(38) - keyIsDown(40));
  }
}
