import { ChatCompletionRequestMessage } from 'npm:openai@3.2';
import chalk from 'npm:chalk@5';
import process from 'node:process';

import { ChatGptClient } from './chatgpt.client.ts';

const promptFn = prompt;

const iterate = async (
  chatGptClient: ChatGptClient,
  history: ChatCompletionRequestMessage[] = [],
) => {
  const prompt = await promptFn(chalk.gray('>'));

  if (prompt) {
    history.push({ role: 'user', content: prompt })
    const response = await chatGptClient.chat(prompt, history, (chunk) => {
      process.stdout.write(chalk.blueBright(chunk));
    });
    process.stdout.write('\n\n');
    history.push({ role: 'assistant', content: response })
  }

  return history;
};

const initChat = async (
  chatGptApiKey: string,
  history: ChatCompletionRequestMessage[] = [],
  callback?: (history: ChatCompletionRequestMessage[]) => unknown,
) => {
  const chatGptClient = new ChatGptClient({
    apiKey: chatGptApiKey,
    hostname: 'api.openai.com',
  });

  while (true) {
    history = await iterate(chatGptClient, history);
    if (callback) { callback(history); }
  }
};

export default initChat;
