const hexToColor = (hex) => {
  return new Color(
    parseInt(hex.substr(1, 2), 16) / 255,
    parseInt(hex.substr(3, 2), 16) / 255,
    parseInt(hex.substr(5, 2), 16) / 255)
}

const colorToHex = (color) => {
  const componentToHex = (c) => {
    const hex = (c * 255 | 0).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  return ("#" + componentToHex(color.r) + componentToHex(color.g) + componentToHex(color.b)).toUpperCase();
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function delay(ms = 500) {
  return new Promise(resolve => setTimeout(resolve, ms));
}