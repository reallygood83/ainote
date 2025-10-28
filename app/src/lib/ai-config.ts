/**
 * ai-config.ts - AI Configuration Management System
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
 * AI 설정 관리 시스템 for 배움의 달인
 *
 * BYOK (Bring Your Own Key) 지원:
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic (Claude 3)
 * - Google Gemini (Gemini Pro, Gemini Ultra) - 우선 지원
 * - 기타 호환 가능한 AI 모델
 */

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'custom'

export interface AIModel {
  id: string
  name: string
  description: string
  maxTokens: number
  costPer1kTokens?: number
}

export interface AIProviderConfig {
  provider: AIProvider
  apiKey: string
  model: string
  apiEndpoint?: string
  temperature?: number
  maxTokens?: number
}

// Google Gemini 모델 목록 (우선 지원) - 2025년 최신 모델
export const GEMINI_MODELS: AIModel[] = [
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro ⭐ NEW',
    description: '최강력 모델, 적응형 사고 기능, 1M 토큰 컨텍스트 (곧 2M)',
    maxTokens: 1000000,
    costPer1kTokens: 0.001
  },
  {
    id: 'gemini-2.5-flash-preview-09-2025',
    name: 'Gemini 2.5 Flash ⚡ NEW',
    description: '고속 모델, 50% 토큰 절감, 최신 2025년 9월 버전',
    maxTokens: 1000000,
    costPer1kTokens: 0.0004
  },
  {
    id: 'gemini-2.5-flash-lite-preview-09-2025',
    name: 'Gemini 2.5 Flash-Lite 🚀 NEW',
    description: '초경량 고속 모델, 24% 토큰 절감, 비용 효율 최적화',
    maxTokens: 1000000,
    costPer1kTokens: 0.0002
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash 🔥 NEW',
    description: '실험적 차세대 모델, 멀티모달 강화, 빠른 속도',
    maxTokens: 1048576,
    costPer1kTokens: 0.0003
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: '안정적인 프로덕션 모델, 긴 컨텍스트 지원',
    maxTokens: 1048576,
    costPer1kTokens: 0.0007
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: '빠른 응답 속도, 안정적인 성능',
    maxTokens: 1048576,
    costPer1kTokens: 0.00035
  }
]

// OpenAI 모델 목록 - 2025년 최신 모델
export const OPENAI_MODELS: AIModel[] = [
  {
    id: 'gpt-4.5-turbo',
    name: 'GPT-4.5 Turbo 🔥 NEW',
    description: '최신 최강 모델, 환각 37.1% (GPT-4o 61.8% 대비 개선)',
    maxTokens: 128000,
    costPer1kTokens: 0.075
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o ⚡',
    description: '현세대 주력 모델, 83% 가격 인하, 멀티모달 지원',
    maxTokens: 128000,
    costPer1kTokens: 0.003
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini 💰',
    description: '초저비용 고효율 모델, 가장 경제적인 선택',
    maxTokens: 128000,
    costPer1kTokens: 0.00015
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: '안정적인 프로덕션 모델, 128K 컨텍스트',
    maxTokens: 128000,
    costPer1kTokens: 0.01
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: '레거시 모델, 빠른 응답 속도',
    maxTokens: 16384,
    costPer1kTokens: 0.001
  }
]

// Anthropic Claude 모델 목록 - 2025년 최신 모델
export const ANTHROPIC_MODELS: AIModel[] = [
  {
    id: 'claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5 ⭐ NEW',
    description: '최강력 코딩/에이전트 모델, 1M 토큰 컨텍스트',
    maxTokens: 1000000,
    costPer1kTokens: 0.003
  },
  {
    id: 'claude-opus-4.1',
    name: 'Claude Opus 4.1 🔥 NEW',
    description: '고급 추론 및 에이전트 작업 최적화',
    maxTokens: 200000,
    costPer1kTokens: 0.015
  },
  {
    id: 'claude-haiku-4.5',
    name: 'Claude Haiku 4.5 ⚡ NEW',
    description: '초저지연 모델, 빠른 응답 속도',
    maxTokens: 200000,
    costPer1kTokens: 0.001
  },
  {
    id: 'claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    description: '빠른 응답과 깊은 추론의 균형',
    maxTokens: 200000,
    costPer1kTokens: 0.003
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: '레거시 안정 모델',
    maxTokens: 200000,
    costPer1kTokens: 0.015
  }
]

// 모든 AI 모델 목록
export const AI_MODELS: Record<AIProvider, AIModel[]> = {
  gemini: GEMINI_MODELS,
  openai: OPENAI_MODELS,
  anthropic: ANTHROPIC_MODELS,
  custom: []
}

// AI Provider 메타데이터
export const AI_PROVIDER_INFO: Record<AIProvider, { name: string; description: string; website: string }> = {
  gemini: {
    name: 'Google Gemini',
    description: 'Google의 최신 멀티모달 AI 모델',
    website: 'https://ai.google.dev/'
  },
  openai: {
    name: 'OpenAI',
    description: 'ChatGPT와 GPT-4를 제공하는 AI 연구소',
    website: 'https://platform.openai.com/'
  },
  anthropic: {
    name: 'Anthropic Claude',
    description: '안전하고 신뢰할 수 있는 AI 어시스턴트',
    website: 'https://www.anthropic.com/'
  },
  custom: {
    name: '사용자 정의 API',
    description: '커스텀 AI API 엔드포인트',
    website: ''
  }
}

// 기본 AI 설정 - 최신 모델로 업데이트
export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-2.5-pro', // 2025년 최신 최강 모델
  temperature: 0.7,
  maxTokens: 4096
}

/**
 * AI 설정 저장소 (로컬 스토리지 기반)
 */
class AIConfigStore {
  private readonly STORAGE_KEY = 'ai_config'

  /**
   * AI 설정 불러오기
   */
  load(): AIProviderConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const config = JSON.parse(stored) as AIProviderConfig
        return { ...DEFAULT_AI_CONFIG, ...config }
      }
    } catch (error) {
      console.error('[AI Config] Failed to load config:', error)
    }
    return { ...DEFAULT_AI_CONFIG }
  }

  /**
   * AI 설정 저장하기
   */
  save(config: AIProviderConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config))
      console.log('[AI Config] Saved configuration:', config.provider, config.model)
    } catch (error) {
      console.error('[AI Config] Failed to save config:', error)
      throw new Error('AI 설정 저장에 실패했습니다')
    }
  }

  /**
   * API 키 검증 (간단한 형식 체크)
   */
  validateApiKey(provider: AIProvider, apiKey: string): boolean {
    if (!apiKey || apiKey.trim().length === 0) {
      return false
    }

    switch (provider) {
      case 'gemini':
        // Gemini API 키 형식: AIza...
        return apiKey.startsWith('AIza') && apiKey.length > 30
      case 'openai':
        // OpenAI API 키 형식: sk-...
        return apiKey.startsWith('sk-') && apiKey.length > 40
      case 'anthropic':
        // Anthropic API 키 형식: sk-ant-...
        return apiKey.startsWith('sk-ant-') && apiKey.length > 40
      case 'custom':
        // 커스텀 API는 기본 검증만
        return apiKey.length > 10
      default:
        return false
    }
  }

  /**
   * 설정 초기화
   */
  reset(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    console.log('[AI Config] Configuration reset to defaults')
  }
}

// 싱글톤 인스턴스 export
export const aiConfigStore = new AIConfigStore()

/**
 * 선택된 AI Provider의 모델 목록 가져오기
 */
export function getModelsForProvider(provider: AIProvider): AIModel[] {
  return AI_MODELS[provider] || []
}

/**
 * 특정 모델의 상세 정보 가져오기
 */
export function getModelInfo(provider: AIProvider, modelId: string): AIModel | undefined {
  const models = getModelsForProvider(provider)
  return models.find((m) => m.id === modelId)
}

/**
 * API 엔드포인트 URL 생성
 */
export function getApiEndpoint(provider: AIProvider, customEndpoint?: string): string {
  if (customEndpoint) {
    return customEndpoint
  }

  switch (provider) {
    case 'gemini':
      return 'https://generativelanguage.googleapis.com/v1beta'
    case 'openai':
      return 'https://api.openai.com/v1'
    case 'anthropic':
      return 'https://api.anthropic.com/v1'
    default:
      return ''
  }
}
