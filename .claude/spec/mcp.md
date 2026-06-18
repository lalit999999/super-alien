MCP Adapters

Connect Corsair to any AI framework or agent runtime using MCP adapters.
Corsair provides first-class adapters for the most popular AI SDKs and agent runtimes. Each adapter exposes Corsair’s tools in the format that framework expects — no manual schema wiring required.
​
Available Adapters
Adapter	Use case
Anthropic SDK	Native tool use with Claude models
Claude Agent SDK	In-process MCP with the Claude Agent SDK
OpenAI Agents	OpenAI Agents SDK tool integration
OpenAI	OpenAI function calling
Vercel AI SDK	Tools for useChat and streamText
Mastra	Mastra agent tool integration
​
Coding Agents
For coding agents that use the MCP stdio protocol, see the Coding Agents section.
​
Tools
Every adapter exposes the same four tools automatically:
Tool	What it does
corsair_setup	Check auth status and get credential instructions
list_operations	Discover every available API endpoint
get_schema	Inspect parameters for a specific endpoint
run_script	Execute a JS snippet with corsair in scope
Your agent calls corsair_setup first, then list_operations to discover what’s available, then run_script to execute. No code changes needed as you add plugins.
​
How the agent uses Corsair
Once connected, your agent follows this pattern automatically:

1. corsair_setup          → check auth, get instructions for missing credentials
2. list_operations        → discover available endpoints (github.repositories.list, slack.messages.post, ...)
3. get_schema             → inspect parameters for a specific endpoint
4. run_script             → execute: const repos = await corsair.github.api.repositories.list({ type: 'owner' })

No hard-coding required. As you add plugins, the agent discovers the new endpoints automatically.














Anthropic SDK

Connect Corsair to the Anthropic SDK using tool use.
Use AnthropicProvider to connect Corsair to the Anthropic SDK via native tool use.
​
Install

npm install @anthropic-ai/sdk

​
Usage
agent.ts

import Anthropic from '@anthropic-ai/sdk';
import { AnthropicProvider } from '@corsair-dev/mcp';
import { corsair } from './corsair';

const provider = new AnthropicProvider();
const tools = provider.build({ corsair });
const client = new Anthropic();

const message = await client.beta.messages.toolRunner({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    tools,
    messages: [
        {
            role: 'user',
            content: 'Setup corsair, then list all Slack channels.',
        },
    ],
});

for (const block of message.content) {
    if (block.type === 'text') console.log(block.text);
}

AnthropicProvider.build() is synchronous — it returns the tools array directly, ready to pass to any Anthropic API call. toolRunner handles the tool call loop automatically, invoking each tool and feeding results back until the model produces a final response.












Claude Agent SDK

Use Corsair with the Claude Agent SDK via an in-process MCP server — no HTTP transport needed.
Use ClaudeProvider to connect Corsair to the Claude Agent SDK with an in-process MCP server. No HTTP transport needed.
​
Install

npm install @anthropic-ai/claude-agent-sdk @corsair-dev/mcp

​
Usage
agent.ts

import { createSdkMcpServer, query } from '@anthropic-ai/claude-agent-sdk';
import { ClaudeProvider } from '@corsair-dev/mcp';
import { corsair } from './corsair';

const provider = new ClaudeProvider();
const tools = await provider.build({ corsair });
const server = createSdkMcpServer({ name: 'corsair', tools });

const stream = query({
    prompt: 'List my GitHub repos with the most open issues.',
    options: {
        model: 'claude-opus-4-6',
        mcpServers: { corsair: server },
    },
});

for await (const event of stream) {
    if ('result' in event) process.stdout.write(event.result);
}

ClaudeProvider.build() is async — it dynamically imports the Claude Agent SDK as an optional peer dependency. The Claude Agent SDK handles the tool-call loop automatically via query().












OpenAI Agents

Connect Corsair to the OpenAI Agents SDK.
Use OpenAIAgentsProvider to connect Corsair to the OpenAI Agents SDK.
​
Install

npm install @openai/agents

​
Usage
agent.ts

import { OpenAIAgentsProvider } from '@corsair-dev/mcp';
import { Agent, run, tool } from '@openai/agents';
import { corsair } from './corsair';

const provider = new OpenAIAgentsProvider();
const tools = provider.build({ corsair, tool });

const agent = new Agent({
    name: 'corsair-agent',
    model: 'gpt-4.1',
    instructions:
        'You have access to Corsair tools. Use list_operations to discover available APIs, get_schema to understand required arguments, and run_script to execute them. When referencing resources (like channels), always use their ID, not their name.',
    tools,
});

const result = await run(agent, 'Setup corsair, then list all Slack channels.');
console.log(result.finalOutput);

OpenAIAgentsProvider.build() is async — it dynamically imports @openai/agents as an optional peer dependency. Pass the tool function from @openai/agents so the provider can wrap each Corsair tool in the correct format.
Claude Agent SDK
Previous




















Vercel AI SDK

Connect Corsair to the Vercel AI SDK over HTTP.
Use createVercelAiMcpClient to connect Corsair to the Vercel AI SDK via HTTP transport. Unlike the direct SDK adapters, Vercel AI connects over HTTP — you expose Corsair as an MCP server endpoint and the client connects to it.
​
Install

npm install ai @ai-sdk/mcp

​
Server
Expose Corsair as an MCP HTTP endpoint using createBaseMcpServer and createMcpRouter.
server.ts

import express from 'express';
import { createBaseMcpServer, createMcpRouter } from '@corsair-dev/mcp';
import { corsair } from './corsair';

const app = express();
app.use(express.json());

app.use('/mcp', createMcpRouter(() => createBaseMcpServer({ corsair })));

app.listen(3000, () => console.log('MCP server running on :3000'));

​
Client
Connect from your Vercel AI application using createVercelAiMcpClient.
agent.ts

import { generateText, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createVercelAiMcpClient } from '@corsair-dev/mcp';

const client = await createVercelAiMcpClient({
    url: 'http://localhost:3000/mcp',
});

const tools = await client.tools();

const { text } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    tools,
    prompt: 'Setup corsair, then list all Slack channels.',
    stopWhen: stepCountIs(10),
});

console.log(text);
await client.close();

createVercelAiMcpClient returns a client that speaks the MCP protocol over HTTP. Call client.tools() to retrieve the tool definitions, then pass them to any Vercel AI generateText or streamText call.
​
AI SDK 6
In AI SDK 6, maxSteps was replaced by stopWhen. Without it, tool-calling agents may never complete or return output. Use stopWhen: stepCountIs(10) to cap the number of tool-call steps, or stopWhen: isLoopFinished() to run until the model finishes naturally:

import { generateText, isLoopFinished } from 'ai';

const { text } = await generateText({
  model: anthropic('claude-sonnet-4-6'),
  tools,
  prompt: 'List my GitHub repos with the most open issues.',
  stopWhen: isLoopFinished(),
});



Mastra

Connect Corsair to the Mastra agent framework.
Use MastraProvider to connect Corsair to Mastra.
​
Install

npm install @mastra/core

​
Usage
agent.ts

import { Agent } from '@mastra/core/agent';
import { anthropic } from '@ai-sdk/anthropic';
import { MastraProvider } from '@corsair-dev/mcp';
import { corsair } from './corsair';

const provider = new MastraProvider();
const tools = await provider.build({ corsair });

const agent = new Agent({
    name: 'corsair-agent',
    model: anthropic('claude-sonnet-4-6'),
    instructions:
        'You have access to Corsair tools. Use list_operations to discover available APIs, get_schema to understand required arguments, and run_script to execute them.',
    tools: Object.fromEntries(tools.map((t) => [t.id, t])),
});

const response = await agent.generate(
    'Setup corsair, then list all Slack channels.',
);
console.log(response.text);

MastraProvider.build() is async — it dynamically imports @mastra/core as an optional peer dependency. The returned tools are standard Mastra createTool 























OpenAI

Connect Corsair to the OpenAI API over HTTP.
Use getOpenAIMcpConfig to connect Corsair to the OpenAI API via HTTP transport. Like Vercel AI, OpenAI’s MCP support connects over HTTP — you expose Corsair as an MCP server endpoint and pass the config to the OpenAI client.
​
Install

npm install openai

​
Server
Expose Corsair as an MCP HTTP endpoint using createBaseMcpServer and createMcpRouter.
server.ts

import express from 'express';
import { createBaseMcpServer, createMcpRouter } from '@corsair-dev/mcp';
import { corsair } from './corsair';

const app = express();
app.use(express.json());

app.use('/mcp', createMcpRouter(() => createBaseMcpServer({ corsair })));

app.listen(3000, () => console.log('MCP server running on :3000'));

​
Client
agent.ts

import OpenAI from 'openai';
import { getOpenAIMcpConfig } from '@corsair-dev/mcp';

const client = new OpenAI();

const response = await client.responses.create({
    model: 'gpt-4.1',
    tools: [
        {
            type: 'mcp',
            ...getOpenAIMcpConfig('http://localhost:3000/mcp'),
        },
    ],
    input: 'Setup corsair, then list all Slack channels.',
});

console.log(response.output_text);

getOpenAIMcpConfig returns the serverLabel and serverUrl fields expected by OpenAI’s mcp tool type.