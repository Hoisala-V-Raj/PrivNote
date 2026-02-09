import axios, { AxiosError } from 'axios';

interface OllamaResponse {
  response: string;
}

export class LlmService {
  private static instance: LlmService;
  private ollamaUrl: string;
  private ollamaModel: string = 'llama3';
  private maxRetries = 3;
  private retryDelay = 1000;

  private constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    console.log(`✓ LlmService initialized (Llama 3 @ ${this.ollamaUrl})`);
  }

  public static getInstance(): LlmService {
    if (!LlmService.instance) {
      LlmService.instance = new LlmService();
    }
    return LlmService.instance;
  }

  async summarizeNote(noteText: string): Promise<string> {
    return await this.llamaSummarize(noteText);
  }

  private async llamaSummarize(noteText: string): Promise<string> {
    const prompt = `Summarize the following text.

Rules:
- Maximum 3 bullet points
- Each bullet must be under 6 words
- No full sentences
- No explanations
- Use simple phrases
Text:
"${noteText}"`;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post<OllamaResponse>(
          `${this.ollamaUrl}/api/generate`,
          {
            model: this.ollamaModel,
            prompt,
            stream: false,
            temperature: 0,
          },
          { timeout: 120000 }
        );

        let summary = response.data.response?.trim();
if (!summary) throw new Error('Empty Llama response');

const formatted = this.formatSummary(summary, 150);
console.log("FINAL SUMMARY:\n", formatted);

return formatted;

      } catch (error) {
        const axiosError = error as AxiosError;

        if (attempt === this.maxRetries) {
          if (axiosError.response?.status === 404) {
            throw new Error('Run: ollama run llama3');
          }
          if (axiosError.code === 'ECONNABORTED') {
            throw new Error('Llama request timed out.');
          }
          if (axiosError.message?.includes('ECONNREFUSED')) {
            throw new Error(`Cannot connect to Ollama at ${this.ollamaUrl}`);
          }
          throw new Error('Failed to generate summary');
        }

        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    throw new Error('Summarization failed');
  }

  /**
   * Deterministic formatter
   * Guarantees:
   * ≤3 bullets
   * ≤150 characters
   */
  private formatSummary(summary: string, maxChars: number): string {
  // Normalize whitespace
  summary = summary.replace(/\r/g, '').trim();

  let candidates: string[] = [];

  // Try newline split first
  candidates = summary
    .split('\n')
    .map(l => l.replace(/^[-*•0-9.]\s*/, '').trim())
    .filter(l => this.isNotNarration(l));

  // If model returned paragraph → split sentences
  if (candidates.length <= 1) {
    candidates = summary
      .split(/[.!?]/)
      .map(s => s.trim())
      .filter(l => this.isNotNarration(l));
  }

  // Ensure at least something exists
  if (candidates.length === 0) {
    return '• Summary unavailable';
  }

  // Enforce bullet count
  const bullets = candidates.slice(0, 3).map(s => `• ${s}`);

  let result = bullets.join('\n');

  // Enforce character limit
  if (result.length > maxChars) {
    result = result.slice(0, maxChars);

    const lastSpace = result.lastIndexOf(' ');
    if (lastSpace > 10) {
      result = result.slice(0, lastSpace);
    }

    result = result.trim() + '...';
  }

  return result;
}

private isNotNarration(line: string): boolean {
  if (!line || line.length === 0) return false;
  
  // Filter out meta-commentary about the summary itself
  const narrationPatterns = [
    /^here\s+is/i,
    /^this\s+is/i,
    /^the\s+following/i,
    /summary\s+of/i,
    /bullet\s+points?/i,
    /three\s+bullet/i,
    /each\s+under/i,
    /^in\s+(three|3)/i,
    /^\d+\s+words?/i,
    /^\d+\s+bullet/i,
    /under\s+\d+\s+words?/i,
  ];
  
  return !narrationPatterns.some(pattern => pattern.test(line));
}

}
