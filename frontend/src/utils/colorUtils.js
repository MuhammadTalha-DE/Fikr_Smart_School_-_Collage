export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function generatePalette(baseHex, lightHex) {
  const base = hexToRgb(baseHex);
  const light = hexToRgb(lightHex);
  if (!base || !light) return {};

  const mix = (ratio) => {
    // ratio < 1 makes lighter, > 1 makes darker? Actually, we'll use a simple algorithm:
    // For lighter shades, blend with white; for darker, blend with black.
    // But here we keep it simple: linear interpolation between base and light for light shades,
    // and between base and dark (black) for dark shades.
    const mixBase = ratio >= 0 ? base : { r: 0, g: 0, b: 0 }; // black for dark shades
    const mixLight = ratio >= 0 ? light : { r: 0, g: 0, b: 0 };
    const r = Math.round(light.r * ratio + base.r * (1 - ratio));
    const g = Math.round(light.g * ratio + base.g * (1 - ratio));
    const b = Math.round(light.b * ratio + base.b * (1 - ratio));
    return `${r},${g},${b}`;
  };

  return {
    '--color-primary-50':  mix(0.95),
    '--color-primary-100': mix(0.85),
    '--color-primary-200': mix(0.70),
    '--color-primary-300': mix(0.50),
    '--color-primary-400': mix(0.25),
    '--color-primary-500': mix(0),       // base
    '--color-primary-600': mix(-0.15),   // slightly darker
    '--color-primary-700': mix(-0.35),
    '--color-primary-800': mix(-0.55),
    '--color-primary-900': mix(-0.75),   // darkest
  };
}