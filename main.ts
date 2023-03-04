import { ChatCompletionRequestMessage } from "npm:openai@3.2";
import { ChatGptClient } from "./src/chatgpt.client.ts";
import chalk from 'npm:chalk@5';
import process from 'node:process';

const promptFn = prompt;

const chatGptClient = new ChatGptClient({
  apiKey: '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',
  hostname: 'api.openai.com',
});
const history: ChatCompletionRequestMessage[] = [];

const iterate = async () => {
  const prompt = await promptFn(chalk.gray('>'));

  if (prompt) {
    history.push({ role: 'user', content: prompt })
    process.stdout.write('\n');
    const response = await chatGptClient.chat(prompt, history, (chunk) => {
      process.stdout.write(chalk.blueBright(chunk));
    });
    process.stdout.write('\n\n');
    history.push({ role: 'assistant', content: response })
  }

  await iterate();
};

(async () => {
  await iterate();
})();
