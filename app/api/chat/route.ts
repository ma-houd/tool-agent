import { openai } from "@/app/lib/openai";

const tool_calculator = [
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
  }
]

export const POST = async (req: Request) => {
    try {
        const { question } = await req.json();

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: question }],
            tools: tool_calculator,
            tool_choice: "auto",
        });

        const message = response.choices[0].message;
        console.log("tool_calls:", message.tool_calls);
        let finalResponse;

        if (message.tool_calls && message.tool_calls.length > 0) {
            // GPT veut appeler un tool
            const toolCall = message.tool_calls[0] as any;
            const { expression } = JSON.parse(toolCall.function.arguments)
            
            const result = eval(expression);
            
            // On rappelle GPT avec le résultat du calcul
            finalResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "user", content: question },
                    { role: "assistant", content: null, tool_calls: message.tool_calls },
                    { role: "tool", tool_call_id: toolCall.id, content: result.toString() }
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