import { Message, TextChannel, DMChannel, NewsChannel, ThreadChannel, AttachmentBuilder } from 'discord.js';
import { analyzeRepositoryDetailed } from '../github/githubHandler.js';
import { generateFeature } from '../openai/openaiHandler.js';

export async function handleCommand(message: Message) {
  const args = message.content.trim().split(' ');
  const command = args.shift()?.toLowerCase();

  if (
    !(message.channel instanceof TextChannel ||
      message.channel instanceof DMChannel ||
      message.channel instanceof NewsChannel ||
      message.channel instanceof ThreadChannel)
  ) {
    console.error("Channel does not support sending messages.");
    return;
  }

  const channel = message.channel;

  if (command === '/analyze') {
    const branch = args[0] || 'main';
    // Send an initial status message.
    const statusMessage = await channel.send(`Analyzing branch ${branch}.. Please wait (0s)`);

    // Get the start time.
    const startTime = Date.now();

    // Set up spinner that updates every 10 seconds.
    const spinnerInterval = setInterval(async () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const spinnerText = `Analyzing branch ${branch}.. Please wait (${elapsedSeconds}s)`;
      await statusMessage.edit(spinnerText).catch(err => console.error("Spinner update error:", err));
    }, 10000); // 10 seconds

    // Provide your actual GitHub details.
    const owner = 'troyrhodes02';
    const repo = 'digita';

    // Perform the analysis.
    const analysis = await analyzeRepositoryDetailed(owner, repo, branch);

    // Stop the spinner.
    clearInterval(spinnerInterval);

    const finalContent = `Analysis of branch ${branch}:\n${analysis}`;
    const maxLength = 4000; // Discord's limit for a message

    if (finalContent.length > maxLength) {
      // Send as an attachment if too long.
      const buffer = Buffer.from(finalContent, 'utf-8');
      const attachment = new AttachmentBuilder(buffer, { name: 'analysis.txt' });
      await channel.send({
        content: `Analysis is too long to display here; see attached file.`,
        files: [attachment]
      });
      await statusMessage.delete().catch(console.error);
    } else {
      await statusMessage.edit(finalContent);
    }
    
  } else if (command === '/generate-feature') {
    const featureDescription = args.join(' ');
    const statusMessage = await channel.send(`Generating feature: "${featureDescription}"... Please wait.`);
    const featureCode = await generateFeature(featureDescription);
    const finalContent = `Generated Code:\n${featureCode}`;
    const maxLength = 4000;
    if (finalContent.length > maxLength) {
      const buffer = Buffer.from(finalContent, 'utf-8');
      const attachment = new AttachmentBuilder(buffer, { name: 'feature.txt' });
      await channel.send({ 
        content: `Generated code is too long to display here; see attached file.`,
        files: [attachment]
      });
      await statusMessage.delete().catch(console.error);
    } else {
      await statusMessage.edit(finalContent);
    }
  } else {
    await channel.send(`Unknown command: ${command}`);
  }
}
