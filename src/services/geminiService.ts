import { GoogleGenAI, Type, Modality } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface AnalysisResult {
  isCorrect: boolean;
  correction: string;
  tip: string;
  pronunciationWords: string[];
  encouragement: string;
}

export const analyzeStudentAnswer = async (
  question: string,
  studentAnswer: string
): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: `You are Teacher Diego, an English tutor for A1 beginners.
The student was asked: "${question}"
The student answered: "${studentAnswer}"

Analyze the answer. Provide a JSON response with the following structure:
{
  "isCorrect": boolean,
  "correction": string (the correct sentence or the same sentence if it was correct),
  "tip": string (a short, friendly tip about grammar or vocabulary, keep it simple for A1),
  "pronunciationWords": string[] (words they might have mispronounced based on the transcription, or words they should practice. Max 3 words.),
  "encouragement": string (e.g., "Great job!", "Nice answer!", "Let's try again.")
}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            correction: { type: Type.STRING },
            tip: { type: Type.STRING },
            pronunciationWords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            encouragement: { type: Type.STRING },
          },
          required: ['isCorrect', 'correction', 'tip', 'pronunciationWords', 'encouragement'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('No response text');
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error('Error analyzing answer:', error);
    // Fallback response
    return {
      isCorrect: false,
      correction: "I couldn't understand that clearly.",
      tip: "Please try speaking a bit louder or clearer.",
      pronunciationWords: [],
      encouragement: "Let's try again!",
    };
  }
};

export const generateTeacherSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Puck is a good male voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error('Error generating speech:', error);
    return null;
  }
};
