/*
    LittleJS Hello World Starter Game
*/

'use strict';

glOverlay = !isChrome; // fix slow rendering when not chrome

let particleEmiter, overlayCanvas, overlayContext;

// zzfx sounds
const sound_click = [.5, 1];

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  // create overlay canvas for hud
  document.body.appendChild(overlayCanvas = document.createElement('canvas'));
  overlayCanvas.style = mainCanvas.style.cssText;
  overlayContext = overlayCanvas.getContext('2d');

  // create tile collision and visible tile layer
  initTileCollision(vec2(32, 16));
  const tileLayer = new TileLayer(vec2(), tileCollisionSize);
  const pos = vec2();

  // get level data from the tiles image
  const imageLevelDataRow = 1;
  mainContext.drawImage(tileImage, 0, 0);
  for (pos.x = tileCollisionSize.x; pos.x--;)
    for (pos.y = tileCollisionSize.y; pos.y--;) {
      const data = mainContext.getImageData(pos.x, 16 * (imageLevelDataRow + 1) - pos.y - 1, 1, 1).data;
      if (data[0]) {
        setTileCollisionData(pos, 1);

        const tileIndex = 1;
        const direction = randInt(4)
        const mirror = randInt(2);
        const color = randColor();
        const data = new TileLayerData(tileIndex, direction, mirror, color);
        tileLayer.setData(pos, data);
      }
    }
  tileLayer.redraw();

  // move camera to center of collision
  cameraPos = tileCollisionSize.scale(.5);
  cameraScale = 32;

  // enable gravity
  gravity = -.01;

  // create particle emitter
  const center = tileCollisionSize.scale(.5).add(vec2(0, 9));
  particleEmiter = new ParticleEmitter(
    center, 1, 0, 500, PI, // pos, emitSize, emitTime, emitRate, emiteCone
    2, vec2(16),                            // tileIndex, tileSize
    new Color, new Color(0, 0, 0),            // colorStartA, colorStartB
    new Color(1, 1, 1, 0), new Color(0, 0, 0, 0), // colorEndA, colorEndB
    2, .2, .2, .1, .05,  // particleTime, sizeStart, sizeEnd, particleSpeed, particleAngleSpeed
    .99, 1, 1, PI, .05,  // damping, angleDamping, gravityScale, particleCone, fadeRate, 
    .5, 1                // randomness, collide, additive, randomColorLinear, renderOrder
  );
  particleEmiter.elasticity = .3;
  particleEmiter.trailScale = 2;
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  // play sound when mouse is pressed
  if (mouseWasPressed(0)) {
    playSound(sound_click, mousePos);
    particleEmiter.colorStartA = new Color;
    particleEmiter.colorStartB = randColor();
    particleEmiter.colorEndA = particleEmiter.colorStartA.scale(1, 0);
    particleEmiter.colorEndB = particleEmiter.colorStartB.scale(1, 0);
  }

  // move particles to mouse location if on screen
  if (mousePosScreen.x || mousePosScreen.y)
    particleEmiter.pos = mousePos;
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {

}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {
  // draw a grey square without using webgl
  drawCanvas2D(cameraPos, tileCollisionSize.add(vec2(5)), 0, 0, (context) => {
    context.fillStyle = '#333'
    context.fillRect(-.5, -.5, 1, 1);
  });
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  // clear overlay canvas
  overlayCanvas.width = mainCanvas.width;
  overlayCanvas.height = mainCanvas.height;
  overlayCanvas.style.width = mainCanvas.style.width;
  overlayCanvas.style.height = mainCanvas.style.height;

  // draw to overlay canvas for hud rendering
  const drawOverlayText = (text, x, y, size = 70, shadow = 9) => {
    overlayContext.textAlign = 'center';
    overlayContext.textBaseline = 'top';
    overlayContext.font = size + 'px arial'
    overlayContext.fillStyle = '#fff';
    overlayContext.shadowColor = '#000';
    overlayContext.shadowBlur = shadow;
    overlayContext.fillText(text, x, y);
  }
  drawOverlayText('Hello World', overlayCanvas.width / 2, 40);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, 'tiles.png?2');