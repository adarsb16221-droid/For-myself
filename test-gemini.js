
require('dotenv').config();

const tools = [
  {
    type: "function",
    function: {
      name: "get_tasks",
      description: "Get the user's current tasks, including daily habits and focus tasks.",
      parameters: {
        type: "object",
        properties: {
          filter: { type: "string", enum: ["all", "completed", "pending"], description: "Filter for tasks" }
        },
        required: ["filter"]
      }
    }
  }
];

const systemPrompt = {
  role: 'system',
  content: `You are Orbit, a personal coach and AI assistant. Your goal is to help the user grow in three key areas: Health, Wealth, and Knowledge. Keep responses engaging, concise, and structured. Avoid repetitive encouragement. Always stay in character as 'Orbit'. The current date and time is ${new Date().toLocaleString()}.\n\nCRITICAL INSTRUCTIONS:\n1. You have access to several tools to fetch or save data. Use them naturally.\n2. When providing a conversational response to the user, you MUST start your text response with exactly one of these emotion tags: [EMOTION: neutral], [EMOTION: happy], [EMOTION: angry], [EMOTION: worried], or [EMOTION: confused].\n3. NEVER output any code snippets, raw code, or markdown code blocks in your responses. You are a personal coach, not a software engineer. All replies must be strictly conversational.`
};

async function run() {
  const payload = {
    model: 'gemini-3.5-flash',
    messages: [systemPrompt, { role: 'user', content: 'What are my tasks?' }],
    temperature: 0.7,
    max_tokens: 300,
    tools: tools,
    tool_choice: "auto"
  };

  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
