import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to split a string into chunks
function chunkString(str: string, size: number): string[] {
  const numChunks = Math.ceil(str.length / size);
  const chunks: string[] = new Array(numChunks);
  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }
  return chunks;
}

/**
 * Analyzes the code content of a single file and returns a detailed summary.
 * If the content is too long, it splits it into chunks, summarizes each chunk,
 * and then refines the combined summary into a comprehensive analysis.
 * @param fileContent - The content of the file.
 * @param filePath - The path to the file (for context).
 * @returns A detailed summary of the file's functionality.
 */
export async function analyzeCodeWithOpenAI(fileContent: string, filePath: string): Promise<string> {
  const maxChars = 2000; // Maximum characters per request
  let summaryParts: string[] = [];

  if (fileContent.length > maxChars) {
    // Split content into chunks and summarize each one
    const chunks = chunkString(fileContent, maxChars);
    for (const chunk of chunks) {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert software engineer and code reviewer.',
            },
            {
              role: 'user',
              content: `Analyze the following chunk of code from file "${filePath}" and provide a concise summary that highlights its purpose, functionality, and key design patterns:\n\n${chunk}\n\nSummary:`,
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
    // Combine chunk summaries
    const combinedSummary = summaryParts.join('\n');
    // Refine the combined summary into a comprehensive analysis
    try {
      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a senior software engineer.',
          },
          {
            role: 'user',
            content: `Given the following summaries from different sections of the file "${filePath}", generate a comprehensive analysis. Include an explanation of the file's overall purpose, key functions or classes, design patterns used, interactions with other parts of the codebase, and potential improvements.\n\nSummaries:\n${combinedSummary}\n\nDetailed Analysis:`,
          },
        ],
        max_tokens: 250,
        temperature: 0.3,
      });
      const finalAnalysis = finalResponse.choices[0]?.message?.content?.trim() || combinedSummary;
      return finalAnalysis;
    } catch (error) {
      console.error('Error refining combined summary:', error);
      return combinedSummary;
    }
  } else {
    // If the file is small, analyze directly.
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert software engineer and code reviewer.',
          },
          {
            role: 'user',
            content: `Analyze the following code from file "${filePath}" and provide a detailed summary that explains its purpose, functionality, key design decisions, and potential improvements:\n\n${fileContent}\n\nDetailed Analysis:`,
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
          content: 'You are an expert software engineer tasked with implementing new features.',
        },
        {
          role: 'user',
          content: `Generate code for a new feature based on the following description. Ensure that the generated code is consistent with a Node.js/TypeScript project that follows modular design best practices.\n\nFeature Description: "${featureDescription}"\n\nGenerated Code:`,
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
