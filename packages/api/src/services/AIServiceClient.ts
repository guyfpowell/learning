import CircuitBreaker from 'opossum';
import {
  LessonOutputSchema,
  CoachingOutputSchema,
  type LessonOutput,
  type CoachingOutput,
  type LessonRequest,
  type CoachingRequest,
} from '@learning/shared';

export class AIServiceError extends Error {
  constructor(
    public readonly kind: 'timeout' | 'circuit_open' | 'validation' | 'http_error' | 'network_error',
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'AIServiceError';
    Object.setPrototypeOf(this, AIServiceError.prototype);
  }
}

const RETRY_DELAYS_MS = [150, 300, 600];
const CIRCUIT_OPEN_MESSAGE = 'Breaker is open';

export class AIServiceClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  readonly breaker: CircuitBreaker<[string, unknown], unknown>;

  constructor() {
    this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.apiKey = process.env.AI_SERVICE_API_KEY || '';
    this.timeoutMs = parseInt(process.env.AI_SERVICE_TIMEOUT_MS || '30000', 10);

    this.breaker = new CircuitBreaker(
      (url: string, body: unknown) => this._fetchWithRetry(url, body),
      {
        timeout: false,                // timeout handled by AbortController
        errorThresholdPercentage: 50,
        resetTimeout: 30000,           // half-open after 30s
        volumeThreshold: 5,            // need 5 requests before circuit can open
      }
    );
  }

  private async _fetchWithRetry(url: string, body: unknown): Promise<unknown> {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 0; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-API-Key': this.apiKey,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timer);

        // 4xx: don't retry — the request is malformed or auth failed
        if (response.status >= 400 && response.status < 500) {
          throw new AIServiceError(
            'http_error',
            `AI service returned ${response.status}`,
            response.status
          );
        }

        // 5xx: throw and let retry loop handle it
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        clearTimeout(timer);

        // Don't retry 4xx or already-typed errors
        if (err instanceof AIServiceError) throw err;

        if ((err as Error).name === 'AbortError') {
          lastError = new AIServiceError(
            'timeout',
            `Request timed out after ${this.timeoutMs}ms`
          );
        } else {
          lastError = err as Error;
        }

        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
        }
      }
    }

    throw lastError;
  }

  private async _fire(url: string, body: unknown): Promise<unknown> {
    try {
      return await this.breaker.fire(url, body);
    } catch (err) {
      if (err instanceof AIServiceError) throw err;
      const msg = (err as Error)?.message ?? '';
      if (msg === CIRCUIT_OPEN_MESSAGE) {
        throw new AIServiceError('circuit_open', 'AI service circuit breaker is open');
      }
      throw new AIServiceError('network_error', msg);
    }
  }

  async generateLesson(request: LessonRequest): Promise<LessonOutput> {
    const raw = await this._fire(`${this.baseUrl}/generate/lesson`, request);
    const result = LessonOutputSchema.safeParse(raw);
    if (!result.success) {
      throw new AIServiceError(
        'validation',
        `AI response failed validation: ${result.error.message}`
      );
    }
    return result.data;
  }

  async coachingMessage(request: CoachingRequest): Promise<CoachingOutput> {
    const raw = await this._fire(`${this.baseUrl}/coaching/message`, request);
    const result = CoachingOutputSchema.safeParse(raw);
    if (!result.success) {
      throw new AIServiceError(
        'validation',
        `AI response failed validation: ${result.error.message}`
      );
    }
    return result.data;
  }
}

export const aiServiceClient = new AIServiceClient();
