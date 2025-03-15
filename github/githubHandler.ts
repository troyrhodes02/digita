// githubHandler.ts
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import { analyzeCodeWithOpenAI } from '../openai/openaiHandler.js';

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * Analyzes all files in a given branch and aggregates their summaries.
 * @param owner - The GitHub repository owner.
 * @param repo - The GitHub repository name.
 * @param branch - The branch to analyze.
 * @returns A comprehensive summary of the repository's code.
 */
export async function analyzeRepositoryDetailed(
  owner: string,
  repo: string,
  branch: string
): Promise<string> {
  try {
    // 1. Get the latest commit for the branch.
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const commitSha = refData.object.sha;

    // 2. Get the tree of files (recursive) from the commit.
    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: commitSha,
      recursive: 'true',
    });

    // Filter for files only (type: blob).
    const fileBlobs = treeData.tree.filter(item => item.type === 'blob');

    const fileSummaries: string[] = [];

    // 3. For each file, fetch and summarize its content.
    for (const blob of fileBlobs) {
      if (!blob.sha || !blob.path) continue;

      // 3a. Fetch the file content.
      const { data: blobData } = await octokit.git.getBlob({
        owner,
        repo,
        file_sha: blob.sha,
      });

      // 3b. Decode Base64 content.
      const fileContent = Buffer.from(blobData.content, 'base64').toString('utf-8');

      // Optionally, skip files that are too large or not of interest.
      if (fileContent.length > 50000) {
        // Skip very large files
        continue;
      }

      // 3c. Use OpenAI to analyze and summarize the file.
      const summary = await analyzeCodeWithOpenAI(fileContent, blob.path);
      fileSummaries.push(`**${blob.path}**: ${summary}`);
    }

    // 4. Combine all file summaries into a final overview.
    const finalAnalysis = fileSummaries.join('\n\n');
    return `**Analysis of ${owner}/${repo} (branch: ${branch})**\n\n${finalAnalysis}`;
  } catch (error) {
    console.error('Error analyzing repository:', error);
    return 'Error analyzing repository.';
  }
}
