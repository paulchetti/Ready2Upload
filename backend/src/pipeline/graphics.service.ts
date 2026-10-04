import fs from 'fs';
import path from 'path';

export interface MapStop {
  name: string;
  xPercent: number; // 0 - 100
  yPercent: number; // 0 - 100
}

export class GraphicsService {
  /**
   * Generates a high-contrast, cinematic Map Graphic (SVG) with trade routes and waypoints.
   */
  public generateMapSVG(
    title: string,
    region: string,
    stops: MapStop[] = [
      { name: "Chang'an", xPercent: 20, yPercent: 45 },
      { name: "Dunhuang", xPercent: 38, yPercent: 40 },
      { name: "Samarkand", xPercent: 55, yPercent: 48 },
      { name: "Baghdad", xPercent: 72, yPercent: 55 },
      { name: "Antioch", xPercent: 85, yPercent: 50 }
    ],
    width = 1920,
    height = 1080
  ): string {
    const pointsStr = stops.map((s) => `${(s.xPercent * width) / 100},${(s.yPercent * height) / 100}`).join(' ');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c111d"/>
      <stop offset="50%" stop-color="#141c2e"/>
      <stop offset="100%" stop-color="#070a12"/>
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background Map Grid -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
  <rect width="${width}" height="${height}" fill="url(#glowGrad)"/>

  <!-- Subtle Coordinate Grid Lines -->
  <g stroke="#ffffff" stroke-opacity="0.05" stroke-width="1" stroke-dasharray="8 8">
    <line x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.25}"/>
    <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}"/>
    <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}"/>
    <line x1="${width * 0.25}" y1="0" x2="${width * 0.25}" y2="${height}"/>
    <line x1="${width * 0.5}" y1="0" x2="${width * 0.5}" y2="${height}"/>
    <line x1="${width * 0.75}" y1="0" x2="${width * 0.75}" y2="${height}"/>
  </g>

  <!-- Map Title Banner -->
  <text x="120" y="140" fill="#f59e0b" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="28" letter-spacing="4">HISTORICAL CARTOGRAPHY &amp; GEOGRAPHY</text>
  <text x="120" y="200" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="52" letter-spacing="1">${title.toUpperCase()}</text>
  <text x="120" y="245" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="24">${region}</text>

  <!-- Trade Route Polyline -->
  <polyline points="${pointsStr}" fill="none" stroke="#f59e0b" stroke-width="5" stroke-dasharray="12 6" filter="url(#glow)"/>

  <!-- Waypoints -->
  ${stops
    .map((s, idx) => {
      const cx = (s.xPercent * width) / 100;
      const cy = (s.yPercent * height) / 100;
      return `
    <g transform="translate(${cx}, ${cy})">
      <circle r="18" fill="#f59e0b" fill-opacity="0.2"/>
      <circle r="8" fill="#f59e0b" stroke="#ffffff" stroke-width="3"/>
      <rect x="-70" y="20" width="140" height="34" rx="6" fill="#0f172a" fill-opacity="0.85" stroke="#334155" stroke-width="1"/>
      <text x="0" y="43" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="14" text-anchor="middle">${s.name.toUpperCase()}</text>
    </g>`;
    })
    .join('\n')}

  <!-- Legend & Scale -->
  <rect x="${width - 360}" y="${height - 180}" width="240" height="80" rx="8" fill="#0f172a" fill-opacity="0.9" stroke="#334155" stroke-width="1"/>
  <text x="${width - 340}" y="${height - 145}" fill="#e2e8f0" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="14">PRIMARY TRADE ARTERY</text>
  <line x1="${width - 340}" y1="${height - 125}" x2="${width - 140}" y2="${height - 125}" stroke="#f59e0b" stroke-width="4" stroke-dasharray="8 4"/>
</svg>`;
  }

  /**
   * Generates a sleek, programmatic Statistical Callout Card (SVG).
   */
  public generateStatisticsSVG(
    statNumber: string,
    statLabel: string,
    context: string,
    width = 1920,
    height = 1080
  ): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#cardGrad)"/>

  <!-- Centered Glass Card -->
  <rect x="${width * 0.15}" y="${height * 0.2}" width="${width * 0.7}" height="${height * 0.6}" rx="24" fill="#0f172a" fill-opacity="0.75" stroke="#38bdf8" stroke-opacity="0.3" stroke-width="2"/>

  <!-- Metric Accent Bar -->
  <rect x="${width * 0.2}" y="${height * 0.28}" width="80" height="8" rx="4" fill="#38bdf8"/>

  <text x="${width * 0.2}" y="${height * 0.42}" fill="#38bdf8" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="100" letter-spacing="-2">${statNumber}</text>
  <text x="${width * 0.2}" y="${height * 0.52}" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="44">${statLabel.toUpperCase()}</text>
  <text x="${width * 0.2}" y="${height * 0.62}" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="28">${context}</text>
</svg>`;
  }

  /**
   * Generates an Architectural or Process Diagram (SVG).
   */
  public generateDiagramSVG(
    title: string,
    steps: { label: string; desc: string }[],
    width = 1920,
    height = 1080
  ): string {
    const cardWidth = Math.min(320, (width * 0.7) / Math.max(1, steps.length));

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#0b0f19"/>

  <text x="140" y="160" fill="#a855f7" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="24" letter-spacing="3">STRUCTURAL ANALYSIS</text>
  <text x="140" y="220" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="48">${title.toUpperCase()}</text>

  <!-- Process Steps -->
  ${steps
    .map((step, idx) => {
      const x = 140 + idx * (cardWidth + 40);
      const y = height * 0.4;
      return `
    <g transform="translate(${x}, ${y})">
      <rect width="${cardWidth}" height="280" rx="16" fill="#131b2e" stroke="#6366f1" stroke-width="2"/>
      <circle cx="40" cy="40" r="20" fill="#6366f1"/>
      <text x="40" y="47" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="18" text-anchor="middle">0${idx + 1}</text>
      <text x="30" y="110" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="22">${step.label}</text>
      <text x="30" y="150" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="16">${step.desc}</text>
    </g>`;
    })
    .join('\n')}
</svg>`;
  }

  /**
   * Saves SVG to disk in project directory for direct consumption by FFmpeg.
   */
  public saveGraphicFile(outputPath: string, svgContent: string): string {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, svgContent, 'utf-8');
    return outputPath;
  }
}

export const graphicsService = new GraphicsService();
