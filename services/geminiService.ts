import { GoogleGenAI } from "@google/genai";

export const generateTexturePattern = async (prompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Using Imagen 3 (via Gemini API) for high quality texture generation
  // We ask for a tileable texture to make the stereogram look better
  const enhancedPrompt = `A seamless, tileable, high-contrast texture pattern of ${prompt}. Flat lighting, repetitive pattern, abstract or organic. No text. High resolution.`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    // Fallback to a standard generation method if Imagen fails or isn't available on the key
    // Note: For this demo, if Imagen fails, we bubble up the error so UI can switch to Noise mode
    throw error;
  }
};