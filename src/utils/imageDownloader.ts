import html2canvas from 'html2canvas';

export interface DownloadImageOptions {
  fileName?: string;
  backgroundColor?: string;
  scale?: number;
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (err: any) => void;
}

/**
 * Captures an HTML DOM element and triggers an automatic image download (.png)
 * to the user's gallery / downloads folder. Also attempts native sharing if supported.
 */
export async function downloadElementAsImage(
  element: HTMLElement,
  options: DownloadImageOptions = {}
): Promise<string | null> {
  const {
    fileName = `teamgol_${Date.now()}.png`,
    backgroundColor = '#0A0A0B',
    scale = 2,
    onStart,
    onSuccess,
    onError,
  } = options;

  try {
    if (onStart) onStart();

    const canvas = await html2canvas(element, {
      backgroundColor,
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const dataUrl = canvas.toDataURL('image/png', 0.95);

    // Try native file share for mobile devices (allows "Guardar imagen" directly to camera roll)
    if (navigator.share && navigator.canShare) {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: fileName.replace('.png', ''),
            files: [file],
          });
          if (onSuccess) onSuccess();
          return dataUrl;
        }
      } catch (shareErr) {
        // Fallback to standard anchor download
        console.warn('Native share declined or not supported, falling back to download', shareErr);
      }
    }

    // Standard download link
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onSuccess) onSuccess();
    return dataUrl;
  } catch (error) {
    console.error('Error downloading element as image:', error);
    if (onError) onError(error);
    return null;
  }
}
