export interface StadiumPreset {
  id: string;
  name: string;
  url: string;
  description: string;
}

export const STADIUM_BACKGROUND_PRESETS: StadiumPreset[] = [
  {
    id: 'stadium-night',
    name: 'Estadio Nocturno y Reflectores',
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    description: 'Iluminación profesional de noche con graderías',
  },
  {
    id: 'pitch-turf',
    name: 'Cancha y Césped Pro',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    description: 'Césped verde impecable con líneas de juego',
  },
  {
    id: 'monumental',
    name: 'Estadio Monumental y Gradas',
    url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
    description: 'Gran capacidad y ambiente de final',
  },
  {
    id: 'action-lights',
    name: 'Jugadores, Pasión y Focos',
    url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80',
    description: 'Atmósfera épica con balón y focos de estadio',
  },
  {
    id: 'champions-night',
    name: 'Noche Épica de Partido',
    url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
    description: 'Luces deslumbrantes en el campo',
  },
];

export interface ColorPreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
}

export const COLOR_THEME_PRESETS: ColorPreset[] = [
  { id: 'club-blue', name: 'Azul Rayo', primary: '#1877F2', secondary: '#0866FF' },
  { id: 'fury-red', name: 'Rojo Pasión', primary: '#DC2626', secondary: '#991B1B' },
  { id: 'emerald-green', name: 'Verde Césped', primary: '#059669', secondary: '#047857' },
  { id: 'golden-glory', name: 'Oro y Negro', primary: '#D97706', secondary: '#B45309' },
  { id: 'electric-purple', name: 'Morado Galáctico', primary: '#7C3AED', secondary: '#5B21B6' },
  { id: 'cyan-fire', name: 'Cyan Eléctrico', primary: '#0891B2', secondary: '#0E7490' },
  { id: 'obsidian-gold', name: 'Negro Élite', primary: '#0F172A', secondary: '#334155' },
];

/**
 * Safely loads an image for HTML5 Canvas with CORS and Blob support.
 * Ensures the canvas NEVER becomes tainted by using blob URLs or safe fallbacks.
 * Returns null if the image cannot be loaded.
 */
export async function loadCanvasImageSafe(url: string): Promise<HTMLImageElement | null> {
  if (!url || typeof url !== 'string') return null;

  // 1. If it's already a data URL or blob URL, load directly
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  // 2. Try fetching as Blob first (converts external image to same-origin blob: URL, preventing canvas taint)
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };
        img.src = objectUrl;
      });
    }
  } catch {
    // If fetch failed (e.g. strict CORS), try image element with crossOrigin and cache-buster
  }

  // 3. Fallback to standard Image with anonymous crossOrigin and timestamp
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timer = setTimeout(() => {
      resolve(null);
    }, 4500);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    const separator = url.includes('?') ? '&' : '?';
    img.src = `${url}${separator}_t=${Date.now()}`;
  });
}

export interface CanvasExportResult {
  blob: Blob;
  blobUrl: string;
  dataUrl: string;
}

/**
 * Triggers a browser download without risking iframe navigation or application unmounting.
 */
export function triggerBrowserFileDownload(
  blob: Blob,
  url: string,
  fileName: string
): boolean {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    // CRITICAL: target="_blank" prevents the browser or iframe sandbox from navigating the current page
    // if the download attribute is restricted, keeping the user in the app preview!
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';

    link.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1500);
    return true;
  } catch (err) {
    console.warn('triggerBrowserFileDownload error:', err);
    return false;
  }
}

/**
 * Exports an HTML5 Canvas as PNG, attempts automatic browser download safely,
 * and returns Blob and URL references for preview and fallback operations.
 */
export function downloadCanvasOrBlob(
  canvas: HTMLCanvasElement,
  fileName: string,
  autoTrigger = true
): Promise<CanvasExportResult | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => {
          let dataUrl = '';
          try {
            dataUrl = canvas.toDataURL('image/png', 0.95);
          } catch {
            // ignore
          }

          if (!blob) {
            if (dataUrl) {
              const fallbackBlob = new Blob([], { type: 'image/png' });
              if (autoTrigger) {
                triggerBrowserFileDownload(fallbackBlob, dataUrl, fileName);
              }
              resolve({ blob: fallbackBlob, blobUrl: dataUrl, dataUrl });
            } else {
              resolve(null);
            }
            return;
          }

          const blobUrl = URL.createObjectURL(blob);
          if (!dataUrl) dataUrl = blobUrl;

          // Attempt safe download
          if (autoTrigger) {
            triggerBrowserFileDownload(blob, blobUrl, fileName);
          }

          resolve({ blob, blobUrl, dataUrl });
        },
        'image/png',
        0.95
      );
    } catch (e) {
      console.error('Failed to export canvas to blob:', e);
      resolve(null);
    }
  });
}
