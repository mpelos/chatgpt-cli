# ChatGPT CLI

## Dependencies
It's necessary to have [Deno](https://deno.land/manual@v1.31.1/getting_started/installation) installed.


## Commands
### Configure OpenAI API key

```
./bin/chatgpt config
```

### Create a new chat
```
./bin/chatgpt new CHAT_NAME
```

### Lists all chats
```
./bin/chatgpt list
```

### Load existing chat

```
./bin/chatgpt load CHAT_ID
```
See the `CHAT_ID` using `list` command.

### Delete chat
```
./bin/chatgpt delete CHAT_ID
```

## Chat Example
```
➜  chatgpt git:(master) ✗ ./bin/chatgpt load 1
> Tell me a joke
Why don't scientists trust atoms?

Because they make up everything.

> That was a terrible joke.
I apologize if my joke wasn't to your liking. Let me try another one: What do you get when you cross a snowman and a shark? Frostbite!
```
