import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient();

export async function extractTextFromImage(filePath: string): Promise<string> {
  const [result] = await client.documentTextDetection(filePath);
  return result.fullTextAnnotation?.text?.trim() ?? "";
}

