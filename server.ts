
import express from 'express';
import dotenv from 'dotenv';
import { analyzeRepositoryDetailed } from './github/githubHandler.js';
import { generateFeature } from './openai/openaiHandler.js';

dotenv.config();
const app = express();
app.use(express.json());

app.post('/analyze', async (req, res) => {
    const branch: string = req.body.branch || 'main';
    const owner = 'troyrhodes02';      // Replace with your GitHub username
    const repo = 'schedio-backend';    // Replace with your repository name
    const analysis = await analyzeRepositoryDetailed(owner, repo, branch);
    res.json({ analysis });
  });
  

app.post('/generate-feature', async (req, res) => {
  const featureDescription: string = req.body.feature;
  const featureCode = await generateFeature(featureDescription);
  res.json({ featureCode });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
