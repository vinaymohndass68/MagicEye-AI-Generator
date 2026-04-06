
/**
 * Generates the Depth Map (Hidden Image) based on text.
 * Returns a base64 data URL.
 */
export const generateDepthMap = (
  text: string,
  width: number,
  height: number,
  fontSize: number
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // 1. Background - Black (Far)
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  // 2. Text - White (Near)
  ctx.fillStyle = 'white';
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw text
  ctx.fillText(text, width / 2, height / 2);

  // 3. Apply Blur for smooth depth transitions (easier for eyes to lock)
  ctx.filter = 'blur(4px)';
  ctx.fillText(text, width / 2, height / 2);
  
  return canvas.toDataURL();
};

/**
 * Generates the Depth Map from an uploaded image.
 */
export const generateDepthMapFromImage = (
  base64Image: string,
  width: number,
  height: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("No context");

      // Fill background (Black = Far)
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);

      // Calculate centering/scaling
      const ratio = Math.min(width / img.width, height / img.height) * 0.8;
      const w = img.width * ratio;
      const h = img.height * ratio;
      const x = (width - w) / 2;
      const y = (height - h) / 2;

      // Draw image in Grayscale (treating luminance as depth)
      ctx.filter = 'grayscale(100%) brightness(1.2) blur(2px)';
      ctx.drawImage(img, x, y, w, h);

      resolve(canvas.toDataURL());
    };
    img.onerror = () => reject("Failed to load image for depth map");
    img.src = base64Image;
  });
};

/**
 * Generates the final Autostereogram.
 */
export const renderStereogram = (
  depthMapDataUrl: string,
  patternDataUrl: string | null,
  width: number,
  height: number,
  settings: { contrast: number; patternScale: number; isColorful?: boolean }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject("No context");
      return;
    }

    // --- The Core Magic Eye Algorithm ---
    const runAlgorithm = (depthPixels: Uint8ClampedArray, patternPixels: Uint8ClampedArray | null, pWidth: number, pHeight: number) => {
      // Magic Eye Parameters
      // Separation of background pixels (infinity). Approx 1/6th of screen width.
      const maxSeparation = Math.floor(width / 6); 

      // Prepare Output
      const outputData = ctx.createImageData(width, height);
      const outPixels = outputData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
           const depthIndex = (y * width + x) * 4;
           // Depth: 0 (Far/Black) -> 255 (Near/White)
           const depthValue = depthPixels[depthIndex] / 255.0;

           // Calculate pixel shift (stereoscopic parallax) based on depth
           // Closer objects (higher depth value) need smaller separation
           // 20 represents the maximum "pop out" shift
           const finalSeparation = Math.floor(maxSeparation - (depthValue * 20)); 

           let r, g, b;

           // If we are in the initial strip (left side), we generate/sample pattern
           if (x < finalSeparation) {
              if (patternPixels && pWidth > 0 && pHeight > 0) {
                 // Sample from tiled pattern
                 const py = y % pHeight;
                 const px = x % pWidth;
                 const pIdx = (py * pWidth + px) * 4;
                 r = patternPixels[pIdx];
                 g = patternPixels[pIdx + 1];
                 b = patternPixels[pIdx + 2];
              } else {
                 // Random Noise
                 if (settings.isColorful) {
                     r = Math.random() * 255;
                     g = Math.random() * 255;
                     b = Math.random() * 255;
                 } else {
                     const val = Math.random() * 255;
                     r = g = b = val;
                 }
              }
           } else {
              // Echo the previous pixel
              // pixel[x] = pixel[x - separation]
              const prevIdx = ((y * width) + (x - finalSeparation)) * 4;
              r = outPixels[prevIdx];
              g = outPixels[prevIdx + 1];
              b = outPixels[prevIdx + 2];
           }

           const idx = (y * width + x) * 4;
           outPixels[idx] = r;
           outPixels[idx + 1] = g;
           outPixels[idx + 2] = b;
           outPixels[idx + 3] = 255; // Alpha
        }
      }

      ctx.putImageData(outputData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    // --- Loading Logic (Nested to handle async properly) ---
    
    // 1. Load Depth Map
    const depthImg = new Image();
    
    depthImg.onload = () => {
      // Draw depth map to canvas to read pixel data
      ctx.drawImage(depthImg, 0, 0, width, height);
      const depthData = ctx.getImageData(0, 0, width, height);
      const depthPixels = depthData.data; // Uint8ClampedArray

      // 2. Load Pattern (if exists) or run with Noise
      if (patternDataUrl) {
         const patternImg = new Image();
         patternImg.crossOrigin = "Anonymous";
         
         patternImg.onload = () => {
            const pCanvas = document.createElement('canvas');
            // Scale pattern
            const size = Math.max(32, Math.floor(128 * settings.patternScale)); 
            pCanvas.width = size;
            pCanvas.height = size;
            const pCtx = pCanvas.getContext('2d');
            
            if(pCtx) {
                pCtx.drawImage(patternImg, 0, 0, size, size);
                const pData = pCtx.getImageData(0, 0, size, size);
                runAlgorithm(depthPixels, pData.data, size, size);
            } else {
                // Fallback to noise if context fails
                runAlgorithm(depthPixels, null, 0, 0);
            }
         };
         
         patternImg.onerror = () => {
             console.warn("Pattern failed to load, falling back to noise.");
             runAlgorithm(depthPixels, null, 0, 0);
         };

         // Set src AFTER handlers are attached to avoid race conditions
         patternImg.src = patternDataUrl;

      } else {
         // No pattern provided, use noise
         runAlgorithm(depthPixels, null, 0, 0);
      }
    };

    depthImg.onerror = (e) => reject(`Failed to load depth map: ${e}`);

    // Set src AFTER handlers are attached
    depthImg.src = depthMapDataUrl;
  });
};
