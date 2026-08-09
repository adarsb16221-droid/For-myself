import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Task from '@/models/Task';
import Schedule from '@/models/Schedule';
import { getSession } from '@/lib/auth';

const GROK_API_KEY = process.env.GROK_API_KEY;

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
  },
  {
    type: "function",
    function: {
      name: "add_task",
      description: "Add a new task or daily habit for the user.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "The description of the task." },
          category: { type: "string", enum: ["Work", "Personal", "General", "Health", "Wealth", "Knowledge"] },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          isRegular: { type: "boolean", description: "True if it's a daily habit, False if it's a one-off focus task." }
        },
        required: ["text", "isRegular"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_schedule",
      description: "Get the user's daily schedule blocks.",
      parameters: {
        type: "object",
        properties: {
          filter: { type: "string", enum: ["today", "all"], description: "Filter for schedule" }
        },
        required: ["filter"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_schedule_block",
      description: "Add a block of time to the user's daily schedule.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Title of the schedule block." },
          startTime: { type: "string", description: "Start time in HH:MM 24-hour format." },
          endTime: { type: "string", description: "End time in HH:MM 24-hour format." }
        },
        required: ["title", "startTime", "endTime"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_stats",
      description: "Get summary statistics about the user's tasks (total, completed, daily habits vs one-off). Use this instead of get_tasks when the user just wants a report or stats to avoid consuming too much data.",
      parameters: {
        type: "object",
        properties: {
          filter: { type: "string", enum: ["all"], description: "Always pass 'all'" }
        },
        required: ["filter"]
      }
    }
  }
];

export async function POST(req) {
  if (!GROK_API_KEY) {
    return NextResponse.json({ error: 'Grok API key is missing' }, { status: 500 });
  }

  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const systemPrompt = {
      role: 'system',
      content: "You are Orbit, a personal coach and AI assistant. Your goal is to help the user grow in three key areas: Health, Wealth, and Knowledge. Provide actionable, practical advice. Keep your responses engaging, concise, and structured. Do NOT use motivational quotes and avoid overly repetitive encouragement; focus entirely on practical steps and guidance. Always stay in character as 'Orbit'. You must always start your response with an emotion tag representing your current mood based on the user's input and your response. The valid tags are exactly one of: [EMOTION: neutral], [EMOTION: happy], [EMOTION: angry], [EMOTION: worried], or [EMOTION: confused]. Example: '[EMOTION: happy] That sounds like a great plan!' You now have tools to manage the user's tasks and schedule. Use them when requested to add tasks, give reminders, or schedule blocks. CRITICAL: When using a tool, do NOT output any conversational text (not even an emotion tag). You must output ONLY the tool call, otherwise the system will crash."
    };

    let currentMessages = [systemPrompt, ...messages];
    let newMessages = [];
    let finished = false;

    while (!finished) {
      const payload = {
        model: 'llama-3.3-70b-versatile',
        messages: currentMessages,
        temperature: 0.7,
        tools: tools,
        tool_choice: "auto"
      };

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.text();
        console.error('Grok API Error:', errorData);
        return NextResponse.json({ error: 'Grok API Error: ' + errorData }, { status: res.status });
      }

      const data = await res.json();
      const assistantMsg = data.choices[0].message;
      
      newMessages.push(assistantMsg);
      currentMessages.push(assistantMsg);

      if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
        for (const toolCall of assistantMsg.tool_calls) {
          const funcName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments || '{}');
          
          let result = {};
          try {
            if (funcName === 'get_tasks') {
              const tasks = await Task.find({ userId: session.userId }).sort({ order: 1, createdAt: -1 });
              const minimalTasks = tasks.map(t => ({ text: t.text, category: t.category, isRegular: t.isRegular, completed: t.completed }));
              result = { tasks: minimalTasks };
            } else if (funcName === 'get_stats') {
              const tasks = await Task.find({ userId: session.userId });
              result = {
                totalTasks: tasks.length,
                completedTasks: tasks.filter(t => t.completed).length,
                dailyHabits: { total: tasks.filter(t => t.isRegular).length, completed: tasks.filter(t => t.isRegular && t.completed).length },
                oneOffTasks: { total: tasks.filter(t => !t.isRegular).length, completed: tasks.filter(t => !t.isRegular && t.completed).length }
              };
            } else if (funcName === 'add_task') {
              const newTask = await Task.create({ ...args, userId: session.userId });
              result = { success: true, task: newTask };
            } else if (funcName === 'get_schedule') {
              const schedule = await Schedule.find({ userId: session.userId }).sort({ startTime: 1 });
              result = { schedule };
            } else if (funcName === 'add_schedule_block') {
              const newBlock = await Schedule.create({ ...args, userId: session.userId });
              result = { success: true, block: newBlock };
            } else {
              result = { error: "Unknown tool" };
            }
          } catch (e) {
            result = { error: e.message };
          }
          
          const toolMsg = {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          };
          newMessages.push(toolMsg);
          currentMessages.push(toolMsg);
        }
      } else {
        finished = true;
      }
    }

    return NextResponse.json({ messages: newMessages });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
