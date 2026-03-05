import { openai } from "@/app/lib/openai";

const tools = [
  {
    type: "function" as const,
    function: {
      name: "calculator",
      description: "Use this tool when the user asks to do a mathematical calculation.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "The mathematical expression to calculate"
          }
        },
        required: ["expression"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "datetime",
      description: "Use this tool when the user asks for the current date and time.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "fakeDB",
      description: "Use this tool when the user asks for user information by its name that requires a fake database query.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the person to search for"
          }
        },
        required: ["name"]
      } 
    }
  }
];

export const POST = async (req: Request) => {
    try {
        const { question } = await req.json();

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: question }],
            tools: tools,
            tool_choice: "auto",
        });

        const message = response.choices[0].message;
        console.log("tool_calls:", message.tool_calls);
        let finalResponse;

        if (message.tool_calls && message.tool_calls.length > 0) {
            // GPT veut appeler un tool
            const toolCall = message.tool_calls[0] as any;
            const toolName = toolCall.function.name;

            let toolResult = "";

            if (toolName === "calculator") {
              const { expression } = JSON.parse(toolCall.function.arguments)
              toolResult = eval(expression).toString();
            } else if (toolName === "datetime") {
              toolResult = new Date().toString();
            } else if (toolName === "fakeDB") {
              const { name } = JSON.parse(toolCall.function.arguments);
              // Simulate a database query
              const fakeDB = [
                { name: "Alice", age: 30, city: "New York" },
                { name: "Bob", age: 25, city: "Los Angeles" },
                { name: "Charlie", age: 35, city: "Chicago" },
              ];
              const userInfo = fakeDB.find(user => user.name.toLowerCase() === name.toLowerCase());
              if (userInfo) {
                toolResult = `Name: ${userInfo.name}, Age: ${userInfo.age}, City: ${userInfo.city}`;
              } else {
                toolResult = `User information for ${name} not found.`;
              }
            }

            // On rappelle GPT avec le résultat du calcul
            finalResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "user", content: question },
                    { role: "assistant", content: null, tool_calls: message.tool_calls },
                    { role: "tool", tool_call_id: toolCall.id, content: toolResult }
                ],
            });
        } else {
            // GPT a répondu directement
            finalResponse = response;
        }

        const answer = finalResponse.choices[0].message.content;
        return new Response(JSON.stringify({ answer }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
}