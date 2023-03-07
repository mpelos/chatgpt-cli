// deno-lint-ignore-file no-explicit-any
import { ChatCompletionRequestMessage } from "npm:openai@3.2";
import https from 'node:https';

// #region typings
interface ChatGptClientDependencies {
  apiKey: string;
  hostname: string;
  systemMessage?: string;
}
// #endregion

export class ChatGptClient implements ChatGptClientDependencies {
  apiKey: string;
  hostname: string;
  systemMessage?: string;

  constructor({
    apiKey,
    hostname,
    systemMessage,
  }: ChatGptClientDependencies) {
    this.apiKey = apiKey;
    this.hostname = hostname;
    this.systemMessage = systemMessage;
  }

  chat(
    prompt: string,
    history: ChatCompletionRequestMessage[] = [],
    callback?: (chunk: string) => unknown,
  ): Promise<string> {
    const isStream = Boolean(callback);

    const systemMessage: ChatCompletionRequestMessage[] = this.systemMessage
      ? [{ role: 'system', content: this.systemMessage }]
      : [];
    const messages: ChatCompletionRequestMessage[] = [
      ...systemMessage,
      ...history,
      { role: 'user', content: prompt },
    ];

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          method: 'POST',
          hostname: this.hostname,
          path: '/v1/chat/completions',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
        (res) => {
          const chunks: string[] = [];

          res.on('error', (err) => reject(err));

          res.on('data', (chunk) => {
            if (res.statusCode && res.statusCode >= 400) {
              let json: { error: { message: string } } | undefined;

              try {
                json = JSON.parse(chunk.toString());
              } catch {
                throw new Error(chunk.toString().message)
              }

              if (json) { throw new Error(json.error.message); }
            }

            if (isStream) {
              chunk.toString()
                .split('data: ')
                .filter(Boolean)
                .map((c: string) => {
                  try {
                    return JSON.parse(c.trim());
                  } catch {
                    return undefined;
                  }
                })
                .forEach((json: any) => {
                  if (!json) { return; }

                  const messageChunk = json.choices[0].delta.content;

                  if (!messageChunk) { return; }

                  chunks.push(messageChunk);
                  if (callback) { callback(messageChunk); }
                });

              chunk.toString().replace(/^data: /, '');
            } else {
              try {
                const json = JSON.parse(chunk.toString());
                const message = json.choices[0].message?.content
                chunks.push(message);
              // deno-lint-ignore no-empty
              } catch { }
            }
          });

          res.on('end', () => {
            resolve(chunks.join(''));
          });
        },
      );

      req.write(JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        stream: isStream,
      }));

      req.end();
    });
  }
}
