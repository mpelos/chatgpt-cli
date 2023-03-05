import chalk from 'npm:chalk@5';
import process from 'node:process';

import { ChatGptClient } from './chatgpt.client.ts';
import { ChatConfig } from './config.model.ts';

const promptFn = prompt;

const iterate = async (
  chatGptClient: ChatGptClient,
  history: ChatConfig['history'] = [],
  multilinePrompt?: Array<string | undefined>,
): Promise<{ history: ChatConfig['history'], multilinePrompt?: Array<string | undefined> }> => {
  const lineStart = multilinePrompt ? '…' : '>';
  let prompt = (await promptFn(chalk.gray(lineStart)) || '').trim() || undefined;
  if (multilinePrompt) { multilinePrompt.push(prompt); }

  // When prompt is empty it starts the multiline prompt
  if (prompt == null && !multilinePrompt) { multilinePrompt = []; }

  // When multiline prompt starts, it will end with two empty prompts
  if (
    prompt == null &&
    multilinePrompt?.length &&
    multilinePrompt.slice(-1).every(v => v == null)
  ) {
    prompt = multilinePrompt.join('\n');
    multilinePrompt = undefined;
  }

  // Sends prompt to ChatGPT
  if (prompt && !multilinePrompt) {
    history.push({ role: 'user', content: prompt })
    const response = await chatGptClient.chat(prompt, history, (chunk) => {
      process.stdout.write(chalk.blueBright(chunk));
    });
    process.stdout.write('\n\n');
    history.push({ role: 'assistant', content: response })
  }

  return { history, multilinePrompt };
};

const initChat = async (
  chatGptApiKey: string,
  history: ChatConfig['history'] = [],
  callback?: (history: ChatConfig['history']) => unknown,
) => {
  const chatGptClient = new ChatGptClient({
    apiKey: chatGptApiKey,
    hostname: 'api.openai.com',
  });
  let multilinePrompt: Array<string | undefined> | undefined = undefined;

  while (true) {
    const promise = iterate(chatGptClient, history, multilinePrompt);
    const params = await promise;
    multilinePrompt = params.multilinePrompt;
    if (callback) { callback(params.history); }
  }
};

export default initChat;
