/* =========================================================================
   Prompt Model
   ========================================================================= */

export const DEFAULT_PROMPT = `Write a concise explanation of how transformer attention works, aimed at a software engineer who has never studied deep learning. Use one concrete analogy and end with a one-line summary.`;

export const DEFAULT_CONTRACT = `contract PromptRequest {
  task: enum(general, code, summarize, translate, creative, analyze) = general
  prompt: string @min(1) @max(8000)
  max_tokens: int = 512 @range(1,4096)
  temperature: float = 0.7 @range(0.0,2.0)
  top_p: float? @range(0.0,1.0)
  system: string? @max(2000)
}`;

export function buildRequestBody(state) {
  return {
    task: state.taskType || "general",
    prompt: state.promptSrc || "",
    max_tokens: 512,
    temperature: 0.7,
    system: null
  };
}