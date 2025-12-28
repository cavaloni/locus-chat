# Swiss Army GPT

A ChatGPT-like interface with **conversation branching** and **tree visualization**. Explore alternative conversation paths, backtrack to previous states, and visualize your entire conversation history as an interactive tree.

## Features

- **ChatGPT-like UI** - Clean, modern chat interface similar to popular AI assistants
- **Conversation Branching** - Branch from any message to explore alternative responses
- **Tree Visualization** - "Zoom out" to see your entire conversation as an interactive tree graph
- **Backtracking** - Undo messages and return to previous conversation states
- **OpenRouter Integration** - Access multiple LLMs through a single API
- **Model Selection** - Choose from cost-effective models with pricing info
- **Persistent Storage** - Conversations are saved locally in your browser

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenRouter API key ([get one here](https://openrouter.ai/keys))

### Installation

```bash
npm install
npm run dev
```

### Configuration

1. Click the **Settings** button in the sidebar
2. Enter your OpenRouter API key
3. Select your preferred model (Gemini 2.0 Flash is recommended for best cost-performance)

## Usage

### Chat View
- Type messages and chat with the AI
- Hover over any message to see action buttons:
  - **Branch** - Create a new conversation branch from this point
  - **Backtrack** - Remove messages after this point
  - **Copy** - Copy message content

### Tree View
- Click the **Network** icon in the sidebar to toggle tree view
- See all conversation branches visualized as a graph
- Click any node to navigate to that branch
- Use mouse wheel to zoom, drag to pan

## Tech Stack

- **React 18** + TypeScript
- **Vite** for fast development
- **TailwindCSS** + shadcn/ui for styling
- **Zustand** for state management
- **React Flow** for tree visualization
- **OpenRouter API** for LLM access

## Recommended Models

| Model | Cost (per 1M tokens) | Best For |
|-------|---------------------|----------|
| Gemini 2.0 Flash | $0.10 in / $0.40 out | Best value |
| DeepSeek V3 | $0.14 in / $0.28 out | Complex reasoning |
| GPT-4o Mini | $0.15 in / $0.60 out | OpenAI compatibility |
| Llama 3.3 70B | $0.30 in / $0.40 out | Open source |
| Claude 3.5 Haiku | $0.80 in / $4.00 out | Anthropic quality |

## License

MIT
