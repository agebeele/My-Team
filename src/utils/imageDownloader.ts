import html2canvas from 'html2canvas';

export interface DownloadImageOptions {
  fileName?: string;
  backgroundColor?: string;
  scale?: number;
  onStart?: () => void;
  onSuccess?: (info?: { blobUrl?: string; dataUrl?: string }) => void;
  onError?: (err: any) => void;
}

/**
 * Captures an HTML DOM element and triggers an automatic image download (.png)
 * using Blob URLs. Never taints the canvas, ensuring toDataURL/toBlob won't throw SecurityError.
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

    // allowTaint: false is CRITICAL to prevent SecurityError: Tainted canvases may not be exported
    const canvas = await html2canvas(element, {
      backgroundColor,
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      imageTimeout: 8000,
    });

    // Create Blob directly from canvas for maximum browser and iframe compatibility
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png', 0.95);
    });

    let objectUrl = '';
    let dataUrl = '';

    if (blob) {
      objectUrl = URL.createObjectURL(blob);
    }

    try {
      dataUrl = canvas.toDataURL('image/png', 0.95);
    } catch {
      dataUrl = objectUrl;
    }

    const downloadUrl = objectUrl || dataUrl;

    // Trigger safe anchor download without navigating frame
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
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

    if (onSuccess) onSuccess({ blobUrl: objectUrl, dataUrl });
    return downloadUrl;
  } catch (error) {
    console.error('Error downloading element as image:', error);
    if (onError) onError(error);
    return null;
  }
}

