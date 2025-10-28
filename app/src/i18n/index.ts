/**
 * i18n (Internationalization) System for 배움의 달인
 *
 * 다국어 지원을 위한 번역 시스템
 * - 현재 지원 언어: ko (한국어), en (영어)
 * - 기본 언어: ko (한국어)
 */

import { writable, derived } from 'svelte/store'
import type { Writable, Readable } from 'svelte/store'

// 지원 언어 타입
export type Locale = 'ko' | 'en'

// 번역 객체 타입
export type TranslationKeys = Record<string, any>

// 언어별 번역 데이터
const translations: Record<Locale, TranslationKeys> = {
  ko: {} as TranslationKeys,
  en: {} as TranslationKeys
}

// 현재 언어 상태 (기본값: 한국어)
export const locale: Writable<Locale> = writable('ko')

// 번역 데이터 저장소
export const translationStore: Writable<TranslationKeys> = writable({})

/**
 * 언어 파일 로드
 * @param lang 로드할 언어 코드
 */
export async function loadTranslations(lang: Locale): Promise<void> {
  try {
    // 동적 import로 언어 파일 로드
    const module = await import(`./locales/${lang}.json`)
    translations[lang] = module.default || module

    // 현재 언어 설정 및 번역 데이터 업데이트
    locale.set(lang)
    translationStore.set(translations[lang])

    // 로컬 스토리지에 언어 설정 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', lang)
    }

    console.log(`[i18n] Loaded translations for: ${lang}`)
  } catch (error) {
    console.error(`[i18n] Failed to load translations for ${lang}:`, error)

    // 폴백: 기본 언어(한국어)로 시도
    if (lang !== 'ko') {
      console.log('[i18n] Falling back to Korean (ko)')
      await loadTranslations('ko')
    }
  }
}

/**
 * 중첩된 객체에서 키 경로로 값 가져오기
 * @param obj 대상 객체
 * @param path 점(.)으로 구분된 키 경로 (예: "menu.file")
 * @returns 찾은 값 또는 undefined
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * 번역 함수 (Derived Store)
 *
 * 사용 예시:
 * - $t('app.name') => "배움의 달인"
 * - $t('menu.file') => "파일"
 * - $t('errors.generic', { fallback: '오류 발생' }) => "오류가 발생했습니다" 또는 폴백
 */
export const t: Readable<(key: string, options?: { fallback?: string }) => string> = derived(
  translationStore,
  ($translations) => {
    return (key: string, options?: { fallback?: string }): string => {
      const value = getNestedValue($translations, key)

      if (value !== undefined && value !== null) {
        return String(value)
      }

      // 키를 찾지 못한 경우
      if (options?.fallback) {
        return options.fallback
      }

      console.warn(`[i18n] Missing translation key: ${key}`)
      return key // 키 자체를 반환 (개발 시 누락된 번역 확인 용이)
    }
  }
)

/**
 * 번역 함수 (함수형 - Svelte 컴포넌트 외부에서 사용)
 *
 * 사용 예시:
 * - translate('app.name') => "배움의 달인"
 */
export function translate(key: string, options?: { fallback?: string }): string {
  let currentTranslations: TranslationKeys = {}

  translationStore.subscribe((value) => {
    currentTranslations = value
  })()

  const value = getNestedValue(currentTranslations, key)

  if (value !== undefined && value !== null) {
    return String(value)
  }

  if (options?.fallback) {
    return options.fallback
  }

  console.warn(`[i18n] Missing translation key: ${key}`)
  return key
}

/**
 * 현재 언어 가져오기
 */
export function getLocale(): Locale {
  let currentLocale: Locale = 'ko'
  locale.subscribe((value) => {
    currentLocale = value
  })()
  return currentLocale
}

/**
 * 언어 변경
 * @param lang 변경할 언어 코드
 */
export async function setLocale(lang: Locale): Promise<void> {
  await loadTranslations(lang)
}

/**
 * 저장된 언어 설정 불러오기 또는 시스템 언어 감지
 */
export function getInitialLocale(): Locale {
  // 1. 로컬 스토리지에서 저장된 언어 확인
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved && (saved === 'ko' || saved === 'en')) {
      return saved
    }
  }

  // 2. 시스템 언어 감지
  if (typeof navigator !== 'undefined') {
    const systemLang = navigator.language.toLowerCase()
    if (systemLang.startsWith('ko')) {
      return 'ko'
    }
  }

  // 3. 기본값: 한국어
  return 'ko'
}

/**
 * i18n 시스템 초기화
 * 앱 시작 시 호출
 */
export async function initI18n(): Promise<void> {
  const initialLocale = getInitialLocale()
  await loadTranslations(initialLocale)
  console.log(`[i18n] Initialized with locale: ${initialLocale}`)
}

// 자동 초기화 (브라우저 환경)
if (typeof window !== 'undefined') {
  initI18n().catch((error) => {
    console.error('[i18n] Auto-initialization failed:', error)
  })
}
