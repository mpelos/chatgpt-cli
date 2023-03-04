// deno-lint-ignore-file no-explicit-any
import { ChatCompletionRequestMessage } from 'npm:openai@3.2';

export interface ChatConfig {
  createdAt: Date;
  history: ChatCompletionRequestMessage[];
  name: string;
  updatedAt: Date;
}

export class Config {
  apiKey: string;
  chats: ChatConfig[];

  constructor({
    apiKey,
    chats = [],
  }: {
    apiKey: string;
    chats?: ChatConfig[],
  }) {
    this.apiKey = apiKey;
    this.chats = chats;
  }

  static fromJson(json: any) {
    return new Config({
      apiKey: json.apiKey,
      chats: (json.chats || []).map((obj: any) => ({
        createdAt: new Date(obj.createdAt),
        updatedAt: new Date(obj.updatedAt),
        name: obj.name,
        history: obj.history,
      })),
    });
  }

  toJson(): any {
    return {
      apiKey: this.apiKey,
      chats: this.chats.map((chat) => ({
        ...chat,
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
      })),
    }
  }
}
