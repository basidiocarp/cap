const PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5': { input: 0.8, output: 4 },
  'claude-opus-4-6': { input: 15, output: 75 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
}

export function estimateCost(model: string, inputTokens: number, outputTokens: number): { cost: number; known: boolean } {
  const pricing = PRICING[model]
  if (!pricing) {
    return { cost: 0, known: false }
  }

  return {
    cost: (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output,
    known: true,
  }
}
