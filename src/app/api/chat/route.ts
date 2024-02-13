import { PromptGPT } from "@/features/chat/chat-api";

export async function POST(req: Request) {
  const body = await req.json();
  return await PromptGPT(body);
}
