/*
    LittleJS Hello World Starter Game
*/

'use strict';

glOverlay = !isChrome; // fix slow rendering when not chrome

let particleEmiter, overlayCanvas, overlayContext;

// zzfx sounds
const sound_click = [.5, 1];

let ship;

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  // create overlay canvas for hud
  document.body.appendChild(overlayCanvas = document.createElement('canvas'));
  overlayCanvas.style = mainCanvas.style.cssText;
  overlayContext = overlayCanvas.getContext('2d');

  // create tile collision and visible tile layer
  initTileCollision(vec2(32, 16));
  const tileLayer = new TileLayer(vec2(), tileCollisionSize);
  tileLayer.redraw();

  // move camera to center of collision
  cameraPos = tileCollisionSize.scale(.5);
  cameraScale = 32;

  // enable gravity
  gravity = 0;

  ship = new Ship(cameraPos);
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  // play sound when mouse is pressed
  if (mouseWasPressed(0)) {
    playSound(sound_click, mousePos);
    cameraPos = cameraPos.subtract(vec2(4, 0));
  }
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

  drawRect(tileCollisionSize.scale(.5).subtract(vec2(48, 0)), vec2(4, 4), new Color(0.5, 0, 0), 0);
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
  drawOverlayText('Hello World ' + cameraPos.x, overlayCanvas.width / 2, 40);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, 'tiles.png?2');