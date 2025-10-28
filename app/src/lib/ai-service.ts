/**
 * ai-service.ts - AI Service Integration Layer
 *
 * NEW FILE - Created for 배움의 달인 (Learning Master)
 * This is an original work added to the derivative project.
 *
 * Copyright 2025 김문정
 *
 * This file is part of a derivative work based on Deta Surf.
 * The derivative work is licensed under Apache License 2.0.
 * See LICENSE and NOTICE files for details.
 *
 * ---
 *
 * AI 서비스 for 배움의 달인
 *
 * BYOK (Bring Your Own Key) 기반 AI 통합:
 * - Google Gemini (우선 지원)
 * - OpenAI GPT
 * - Anthropic Claude
 * - 커스텀 API
 */

import {
  type AIProvider,
  type AIProviderConfig,
  aiConfigStore,
  getApiEndpoint
} from './ai-config'

export interface AIRequest {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}

export interface AIResponse {
  text: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly provider: AIProvider,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'AIServiceError'
  }
}

/**
 * AI 서비스 클래스
 * 다양한 AI Provider를 통합하여 일관된 인터페이스 제공
 */
export class AIService {
  private config: AIProviderConfig

  constructor() {
    this.config = aiConfigStore.load()
  }

  /**
   * 설정 새로고침
   */
  refreshConfig(): void {
    this.config = aiConfigStore.load()
  }

  /**
   * AI 요청 보내기
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    // 설정 검증
    if (!this.config.apiKey) {
      throw new AIServiceError(
        'API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.',
        this.config.provider
      )
    }

    // Provider별 처리
    switch (this.config.provider) {
      case 'gemini':
        return await this.generateWithGemini(request)
      case 'openai':
        return await this.generateWithOpenAI(request)
      case 'anthropic':
        return await this.generateWithAnthropic(request)
      case 'custom':
        return await this.generateWithCustomAPI(request)
      default:
        throw new AIServiceError(
          `지원하지 않는 AI Provider: ${this.config.provider}`,
          this.config.provider
        )
    }
  }

  /**
   * Google Gemini API 호출
   */
  private async generateWithGemini(request: AIRequest): Promise<AIResponse> {
    const endpoint = getApiEndpoint('gemini', this.config.apiEndpoint)
    const url = `${endpoint}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: request.systemPrompt
                    ? `${request.systemPrompt}\n\n${request.prompt}`
                    : request.prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: request.temperature ?? this.config.temperature ?? 0.7,
            maxOutputTokens: request.maxTokens ?? this.config.maxTokens ?? 2048,
            topP: 0.95,
            topK: 40
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new AIServiceError(
          error.error?.message || 'Gemini API 호출 실패',
          'gemini',
          response.status
        )
      }

      const data = await response.json()

      // 응답 파싱
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const usage = data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount || 0,
            completionTokens: data.usageMetadata.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata.totalTokenCount || 0
          }
        : undefined

      return {
        text,
        model: this.config.model,
        usage
      }
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error
      }
      throw new AIServiceError(
        error instanceof Error ? error.message : 'Gemini API 호출 중 오류 발생',
        'gemini'
      )
    }
  }

  /**
   * OpenAI API 호출
   */
  private async generateWithOpenAI(request: AIRequest): Promise<AIResponse> {
    const endpoint = getApiEndpoint('openai', this.config.apiEndpoint)
    const url = `${endpoint}/chat/completions`

    try {
      const messages: Array<{ role: string; content: string }> = []

      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt })
      }
      messages.push({ role: 'user', content: request.prompt })

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: request.temperature ?? this.config.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? this.config.maxTokens ?? 2048
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new AIServiceError(
          error.error?.message || 'OpenAI API 호출 실패',
          'openai',
          response.status
        )
      }

      const data = await response.json()

      return {
        text: data.choices[0].message.content,
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        }
      }
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error
      }
      throw new AIServiceError(
        error instanceof Error ? error.message : 'OpenAI API 호출 중 오류 발생',
        'openai'
      )
    }
  }

  /**
   * Anthropic Claude API 호출
   */
  private async generateWithAnthropic(request: AIRequest): Promise<AIResponse> {
    const endpoint = getApiEndpoint('anthropic', this.config.apiEndpoint)
    const url = `${endpoint}/messages`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: request.maxTokens ?? this.config.maxTokens ?? 2048,
          temperature: request.temperature ?? this.config.temperature ?? 0.7,
          system: request.systemPrompt,
          messages: [
            {
              role: 'user',
              content: request.prompt
            }
          ]
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new AIServiceError(
          error.error?.message || 'Anthropic API 호출 실패',
          'anthropic',
          response.status
        )
      }

      const data = await response.json()

      return {
        text: data.content[0].text,
        model: data.model,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        }
      }
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error
      }
      throw new AIServiceError(
        error instanceof Error ? error.message : 'Anthropic API 호출 중 오류 발생',
        'anthropic'
      )
    }
  }

  /**
   * 커스텀 API 호출
   */
  private async generateWithCustomAPI(request: AIRequest): Promise<AIResponse> {
    if (!this.config.apiEndpoint) {
      throw new AIServiceError(
        '커스텀 API 엔드포인트가 설정되지 않았습니다',
        'custom'
      )
    }

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          prompt: request.prompt,
          system: request.systemPrompt,
          temperature: request.temperature ?? this.config.temperature,
          max_tokens: request.maxTokens ?? this.config.maxTokens
        })
      })

      if (!response.ok) {
        throw new AIServiceError(
          '커스텀 API 호출 실패',
          'custom',
          response.status
        )
      }

      const data = await response.json()

      return {
        text: data.text || data.response || data.output || '',
        model: this.config.model
      }
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error
      }
      throw new AIServiceError(
        error instanceof Error ? error.message : '커스텀 API 호출 중 오류 발생',
        'custom'
      )
    }
  }

  /**
   * 스트리밍 응답 (향후 구현)
   */
  async generateStream(
    request: AIRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    throw new Error('스트리밍 응답은 아직 구현되지 않았습니다')
  }
}

// 싱글톤 인스턴스 export
export const aiService = new AIService()

/**
 * AI 기능별 헬퍼 함수들
 */

/**
 * 텍스트 요약
 */
export async function summarizeText(text: string, maxLength?: number): Promise<string> {
  const response = await aiService.generate({
    systemPrompt: '당신은 전문 요약 작성자입니다. 주어진 텍스트의 핵심 내용을 간결하고 명확하게 요약해주세요.',
    prompt: `다음 텍스트를 요약해주세요${maxLength ? ` (${maxLength}자 이내)` : ''}:\n\n${text}`,
    maxTokens: maxLength ? Math.ceil(maxLength * 1.5) : 500
  })
  return response.text
}

/**
 * 텍스트 번역
 */
export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  const response = await aiService.generate({
    systemPrompt: `당신은 전문 번역가입니다. 원문의 의미와 뉘앙스를 정확하게 ${targetLanguage}로 번역해주세요.`,
    prompt: `다음 텍스트를 ${targetLanguage}로 번역해주세요:\n\n${text}`
  })
  return response.text
}

/**
 * 글쓰기 개선
 */
export async function improveWriting(text: string): Promise<string> {
  const response = await aiService.generate({
    systemPrompt: '당신은 전문 작문 컨설턴트입니다. 문법, 표현, 구조를 개선하여 더 나은 글을 만들어주세요.',
    prompt: `다음 글을 개선해주세요:\n\n${text}`
  })
  return response.text
}

/**
 * 질문 답변
 */
export async function answerQuestion(question: string, context?: string): Promise<string> {
  const response = await aiService.generate({
    systemPrompt: '당신은 친절하고 정확한 AI 어시스턴트입니다. 질문에 명확하고 상세하게 답변해주세요.',
    prompt: context
      ? `다음 컨텍스트를 참고하여 질문에 답변해주세요:\n\n컨텍스트:\n${context}\n\n질문: ${question}`
      : question
  })
  return response.text
}
