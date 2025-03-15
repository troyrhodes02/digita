// openaiHandler.ts
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to split a string into chunks
function chunkString(str: string, size: number): string[] {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);
  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }
  return chunks;
}

/**
 * Analyzes the code content of a single file and returns a summary.
 * If the content is too long, it splits it into chunks and summarizes each.
 * @param fileContent - The content of the file.
 * @param filePath - The path to the file (for context).
 * @returns A summary of the file’s functionality.
 */
export async function analyzeCodeWithOpenAI(fileContent: string, filePath: string): Promise<string> {
  // Define a maximum number of characters to send per request.
  const maxChars = 2000;
  let summaryParts: string[] = [];

  if (fileContent.length > maxChars) {
    // Split content into chunks
    const chunks = chunkString(fileContent, maxChars);
    for (const chunk of chunks) {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert software engineer.',
            },
            {
              role: 'user',
              content: `Analyze the following chunk of code from file "${filePath}" and provide a concise summary:\n\n${chunk}\n\nSummary:`,
            },
          ],
          max_tokens: 150,
          temperature: 0.3,
        });
        const chunkSummary = response.choices[0]?.message?.content?.trim() || '';
        summaryParts.push(chunkSummary);
      } catch (error) {
        console.error('Error summarizing code chunk:', error);
        summaryParts.push('Error summarizing this chunk.');
      }
    }
    // Combine chunk summaries into a final summary
    return summaryParts.join('\n');
  } else {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert software engineer. Provide a detailed summary of the code provided.',
          },
          {
            role: 'user',
            content: `Analyze the following code from file "${filePath}" and provide a detailed summary:\n\n${fileContent}\n\nSummary:`,
          },
        ],
        max_tokens: 250,
        temperature: 0.3,
      });
      return response.choices[0]?.message?.content?.trim() || 'No summary received.';
    } catch (error) {
      console.error('Error summarizing code:', error);
      return 'Error summarizing code.';
    }
  }
}

/**
 * Generates code for a new feature based on a description.
 * @param featureDescription - A description of the new feature.
 * @returns Generated code as a string.
 */
export async function generateFeature(featureDescription: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert software engineer. Generate code based on a given feature description.',
        },
        {
          role: 'user',
          content: `Generate code for a new feature: "${featureDescription}". The feature should be implemented in a style consistent with a Node.js/TypeScript project following modular design best practices.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || 'No output received.';
  } catch (error) {
    console.error('Error generating feature code:', error);
    return 'Error generating feature code.';
  }
}
