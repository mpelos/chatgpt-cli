import { program } from 'npm:commander';
import chalk from 'npm:chalk';
import initChat from './chat.ts';
import path from 'node:path';
import process from 'node:process';

import { ChatConfig, Config } from './config.model.ts';

const DEFAULT_CONFIG_PATH = path.join(Deno.env.get('HOME') || '', '.chatgpt-cli');

program
  .name('ChatGPT')
  .description('CLI wrapper for ChatGPT')
  .version('0.0.1')
  .option('-f, --file <filename>', 'ChatGPT CLI configuration file', DEFAULT_CONFIG_PATH)

program.command('config')
  .description('Config CLI')
  .action((options) => {
    const apiKey = prompt(chalk.bgGray('ChatGPT API key: '));

    if (!apiKey) {
      console.log("It's necessary to provide the ChatGPT API key")
      return;
    }

    let config = loadConfig(options.filename);
    if (!config) { config = new Config({ apiKey }); }
    config.apiKey = apiKey;

    writeConfig(config, options.filename);

    console.log("ChatGPT CLI configured");
  });

program.command('new')
  .description('Creates a new chat')
  .argument('<chatName...>', 'chat name')
  .action((chatNameWords: string[], options) => {
    const config = loadConfig(options.filename);
    if (!config) { return; }

    const chatName = chatNameWords.join(' ');
    const chatConfig = newChat(chatName);
    config.chats.push(chatConfig);

    writeConfig(config, options.filename);

    initChat(config.apiKey, chatConfig.history, (history) => {
      chatConfig.history = history;
      chatConfig.updatedAt = new Date();
      writeConfig(config, options.filename);
    });
  });

program.command('load')
  .description('Load chat by index')
  .argument('<chatId>', 'Chat ID')
  .action((chatId, options) => {
    const config = loadConfig(options.filename);
    if (!config) { return; }

    const chatIndex = Number(chatId) - 1;
    const chatConfig = config.chats[chatIndex];

    if (!chatConfig) {
      console.log('Chat not found! The chats available are:\n');
      listChats(config);
      return;
    }

    initChat(config.apiKey, chatConfig.history, (history) => {
      chatConfig.history = history;
      chatConfig.updatedAt = new Date();
      writeConfig(config, options.filename);
    });
  });

program.command('list')
  .description('List chats')
  .action((options) => {
    const config = loadConfig(options.filename);
    if (!config) { return; }
    listChats(config);
  });

program.command('delete')
  .description('Delete chat')
  .argument('<chatId>', 'Chat ID')
  .action((chatId, options) => {
    const config = loadConfig(options.filename);
    if (!config) { return; }

    const chatIndex = Number(chatId) - 1;
    const chatConfig = config.chats[chatIndex];

    if (!chatConfig) {
      console.log('Chat not found! The chats available are:\n');
      listChats(config);
      return;
    }

    config.chats = [
      ...config.chats.slice(0, chatIndex),
      ...config.chats.slice(chatIndex + 1)
    ];

    writeConfig(config, options.filename);

    console.log(`Chat deleted: "${chatConfig.name}"`)
  });

  program.command('history')
    .description('Delete chat')
    .argument('<chatId>', 'Chat ID')
    .action((chatId, options) => {
      const config = loadConfig(options.filename);
      if (!config) { return; }

      const chatIndex = Number(chatId) - 1;
      const chatConfig = config.chats[chatIndex];

      if (!chatConfig) {
        console.log('Chat not found! The chats available are:\n');
        listChats(config);
        return;
      }

      chatConfig.history.forEach(message => {
        const messageColor = message.role === 'assistant' ? chalk.blueBright : chalk.white;

        if (message.role === 'user') {
          process.stdout.write(chalk.gray('> '));
        }

        console.log(messageColor(message.content));
        message.role === 'assistant' && process.stdout.write('\n');
      });
    });

program.parse();

function listChats(config: Config): void {
  if (config.chats.length === 0) {
    console.log(chalk.gray.italic('Empty chat list'));
    return;
  }

  console.log(chalk.gray('#ID  #Name'))

  config.chats.forEach((chat, index) => {
    console.log(`[${index + 1}] ${chat.name}`)
  });
}

function loadConfig(optionFilePath?: string): Config | undefined {
  const filePath = optionFilePath || DEFAULT_CONFIG_PATH;
  const decoder = new TextDecoder('utf-8')

  try {
    const data = Deno.readFileSync(filePath);
    const json = JSON.parse(decoder.decode(data));

    return Config.fromJson(json);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      console.log("ChatGPT CLI not configure. Please, run `chatgpt-cli config`");
      return;
    } else {
      throw new Error("Couldn't parse config file: " + filePath)
    }
  }
}

function newChat(chatName: string): ChatConfig {
  return {
    createdAt: new Date(),
    history: [],
    name: chatName,
    updatedAt: new Date(),
  }
}

function writeConfig(
  config: Config,
  optionFilePath?: string,
): void {
  const filePath = optionFilePath || DEFAULT_CONFIG_PATH;
  Deno.writeTextFileSync(filePath, JSON.stringify(config.toJson(), null, 4));
}
