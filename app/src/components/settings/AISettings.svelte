<script lang="ts">
  /**
   * AISettings.svelte - AI Configuration UI Component
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
   * AI 설정 컴포넌트 for 배움의 달인
   *
   * BYOK (Bring Your Own Key) 설정:
   * - API 제공자 선택 (Google Gemini 우선)
   * - API 키 입력 및 검증
   * - AI 모델 선택
   * - 고급 설정 (Temperature, Max Tokens)
   */

  import { onMount } from 'svelte'
  import { t } from '../../i18n'
  import {
    type AIProvider,
    type AIProviderConfig,
    aiConfigStore,
    AI_PROVIDER_INFO,
    getModelsForProvider,
    getModelInfo,
    DEFAULT_AI_CONFIG
  } from '../../lib/ai-config'

  // 현재 AI 설정
  let config: AIProviderConfig = { ...DEFAULT_AI_CONFIG }

  // UI 상태
  let apiKeyVisible = false
  let validatingKey = false
  let keyValidationResult: { valid: boolean; message: string } | null = null
  let showAdvancedSettings = false

  // 선택된 Provider의 모델 목록
  $: availableModels = getModelsForProvider(config.provider)
  $: selectedModelInfo = getModelInfo(config.provider, config.model)

  onMount(() => {
    // 저장된 설정 불러오기
    config = aiConfigStore.load()
  })

  /**
   * AI Provider 변경 핸들러
   */
  function handleProviderChange(newProvider: AIProvider) {
    config.provider = newProvider
    const models = getModelsForProvider(newProvider)

    // 첫 번째 모델로 자동 선택
    if (models.length > 0) {
      config.model = models[0].id
    }

    // Gemini의 경우 기본 엔드포인트 설정
    if (newProvider === 'gemini') {
      config.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta'
    }

    keyValidationResult = null
  }

  /**
   * API 키 검증
   */
  async function validateApiKey() {
    validatingKey = true
    keyValidationResult = null

    try {
      // 1. 형식 검증
      const isValidFormat = aiConfigStore.validateApiKey(config.provider, config.apiKey)
      if (!isValidFormat) {
        keyValidationResult = {
          valid: false,
          message: $t('settings.apiKey.invalid')
        }
        validatingKey = false
        return
      }

      // 2. 실제 API 호출 테스트 (간단한 요청)
      const testResult = await testApiConnection()

      if (testResult.success) {
        keyValidationResult = {
          valid: true,
          message: $t('settings.apiKey.valid')
        }

        // 설정 저장
        aiConfigStore.save(config)
      } else {
        keyValidationResult = {
          valid: false,
          message: testResult.error || $t('settings.apiKey.invalid')
        }
      }
    } catch (error) {
      keyValidationResult = {
        valid: false,
        message: error instanceof Error ? error.message : $t('settings.apiKey.invalid')
      }
    } finally {
      validatingKey = false
    }
  }

  /**
   * API 연결 테스트
   */
  async function testApiConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (config.provider === 'gemini') {
        // Google Gemini API 테스트
        const response = await fetch(
          `${config.apiEndpoint}/models?key=${config.apiKey}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        if (response.ok) {
          return { success: true }
        } else {
          const error = await response.json()
          return {
            success: false,
            error: error.error?.message || '유효하지 않은 API 키입니다'
          }
        }
      } else if (config.provider === 'openai') {
        // OpenAI API 테스트
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${config.apiKey}`
          }
        })

        return { success: response.ok }
      } else if (config.provider === 'anthropic') {
        // Anthropic API 테스트
        const response = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01'
          }
        })

        return { success: response.ok }
      }

      return { success: false, error: '지원하지 않는 Provider입니다' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '연결 테스트 실패'
      }
    }
  }

  /**
   * 설정 저장
   */
  function saveSettings() {
    try {
      aiConfigStore.save(config)
      alert($t('settings.dataPath.changeSuccess'))
    } catch (error) {
      alert($t('settings.dataPath.changeFailed'))
    }
  }

  /**
   * 설정 초기화
   */
  function resetSettings() {
    if (confirm('AI 설정을 초기화하시겠습니까?')) {
      aiConfigStore.reset()
      config = { ...DEFAULT_AI_CONFIG }
      keyValidationResult = null
    }
  }
</script>

<div class="ai-settings">
  <h2>{$t('settings.ai')}</h2>

  <!-- AI Provider 선택 -->
  <div class="setting-group">
    <h3>{$t('settings.aiModel.label')}</h3>
    <p class="description">{$t('settings.aiModel.description')}</p>

    <div class="provider-grid">
      {#each Object.entries(AI_PROVIDER_INFO) as [providerId, providerInfo]}
        <button
          class="provider-card"
          class:selected={config.provider === providerId}
          on:click={() => handleProviderChange(providerId as AIProvider)}
        >
          <div class="provider-icon">
            {#if providerId === 'gemini'}
              ✨
            {:else if providerId === 'openai'}
              🤖
            {:else if providerId === 'anthropic'}
              🧠
            {:else}
              ⚙️
            {/if}
          </div>
          <h4>{providerInfo.name}</h4>
          <p>{providerInfo.description}</p>
          {#if providerId === 'gemini'}
            <span class="recommended-badge">추천</span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- API 키 입력 -->
  <div class="setting-group">
    <h3>{$t('settings.apiKey.label')}</h3>
    <p class="description">{$t('settings.apiKey.description')}</p>

    <div class="api-key-input-group">
      <div class="input-wrapper">
        <input
          type={apiKeyVisible ? 'text' : 'password'}
          placeholder={$t('settings.apiKey.placeholder')}
          bind:value={config.apiKey}
          class="api-key-input"
        />
        <button
          class="visibility-toggle"
          on:click={() => (apiKeyVisible = !apiKeyVisible)}
          title={apiKeyVisible ? '숨기기' : '보이기'}
        >
          {apiKeyVisible ? '👁️' : '🔒'}
        </button>
      </div>

      <button
        class="validate-button"
        on:click={validateApiKey}
        disabled={validatingKey || !config.apiKey}
      >
        {#if validatingKey}
          {$t('settings.apiKey.validating')}
        {:else}
          {$t('settings.apiKey.validate')}
        {/if}
      </button>
    </div>

    {#if keyValidationResult}
      <div class="validation-result" class:valid={keyValidationResult.valid} class:invalid={!keyValidationResult.valid}>
        <span class="icon">{keyValidationResult.valid ? '✅' : '❌'}</span>
        <span>{keyValidationResult.message}</span>
      </div>
    {/if}

    <!-- API 키 획득 안내 -->
    {#if config.provider !== 'custom'}
      <div class="api-key-guide">
        <p>
          📝 <strong>API 키 발급 방법:</strong>
          <a href={AI_PROVIDER_INFO[config.provider].website} target="_blank" rel="noopener noreferrer">
            {AI_PROVIDER_INFO[config.provider].name} 웹사이트
          </a>에서 무료로 발급받을 수 있습니다.
        </p>
      </div>
    {/if}
  </div>

  <!-- 모델 선택 -->
  {#if availableModels.length > 0}
    <div class="setting-group">
      <h3>AI 모델 선택</h3>
      <p class="description">작업에 적합한 AI 모델을 선택하세요</p>

      <div class="model-grid">
        {#each availableModels as model}
          <button
            class="model-card"
            class:selected={config.model === model.id}
            on:click={() => (config.model = model.id)}
          >
            <h4>{model.name}</h4>
            <p>{model.description}</p>
            <div class="model-specs">
              <span class="spec">📊 {model.maxTokens.toLocaleString()} 토큰</span>
              {#if model.costPer1kTokens}
                <span class="spec">💰 ${model.costPer1kTokens}/1K</span>
              {/if}
            </div>
          </button>
        {/each}
      </div>

      {#if selectedModelInfo}
        <div class="selected-model-info">
          <h4>선택된 모델: {selectedModelInfo.name}</h4>
          <p>{selectedModelInfo.description}</p>
          <p class="spec-detail">
            최대 컨텍스트: <strong>{selectedModelInfo.maxTokens.toLocaleString()}</strong> 토큰
            {#if selectedModelInfo.costPer1kTokens}
              | 비용: <strong>${selectedModelInfo.costPer1kTokens}</strong> per 1K tokens
            {/if}
          </p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- 고급 설정 -->
  <div class="setting-group">
    <button class="accordion-toggle" on:click={() => (showAdvancedSettings = !showAdvancedSettings)}>
      <span>고급 설정</span>
      <span class="chevron" class:open={showAdvancedSettings}>▼</span>
    </button>

    {#if showAdvancedSettings}
      <div class="advanced-settings">
        <!-- Temperature 설정 -->
        <div class="setting-item">
          <label for="temperature">
            Temperature (창의성)
            <span class="value-display">{config.temperature?.toFixed(2) || '0.70'}</span>
          </label>
          <input
            id="temperature"
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={config.temperature}
          />
          <p class="hint">낮을수록 일관적, 높을수록 창의적</p>
        </div>

        <!-- Max Tokens 설정 -->
        <div class="setting-item">
          <label for="maxTokens">
            최대 응답 길이
            <span class="value-display">{config.maxTokens || 2048} 토큰</span>
          </label>
          <input
            id="maxTokens"
            type="range"
            min="256"
            max="8192"
            step="256"
            bind:value={config.maxTokens}
          />
          <p class="hint">응답의 최대 길이를 제한합니다</p>
        </div>

        <!-- Custom Endpoint (커스텀만) -->
        {#if config.provider === 'custom'}
          <div class="setting-item">
            <label for="apiEndpoint">API Endpoint</label>
            <input
              id="apiEndpoint"
              type="url"
              placeholder="https://api.example.com/v1"
              bind:value={config.apiEndpoint}
            />
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- 액션 버튼 -->
  <div class="action-buttons">
    <button class="save-button" on:click={saveSettings}>{$t('actions.save')}</button>
    <button class="reset-button" on:click={resetSettings}>설정 초기화</button>
  </div>
</div>

<style>
  .ai-settings {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
  }

  h2 {
    font-size: 2rem;
    margin-bottom: 2rem;
    color: #1a202c;
  }

  .setting-group {
    margin-bottom: 3rem;
    padding: 1.5rem;
    background: #f7fafc;
    border-radius: 12px;
  }

  h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: #2d3748;
  }

  .description {
    color: #718096;
    margin-bottom: 1.5rem;
  }

  /* Provider 선택 그리드 */
  .provider-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .provider-card {
    position: relative;
    padding: 1.5rem;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }

  .provider-card:hover {
    border-color: #4299e1;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .provider-card.selected {
    border-color: #3182ce;
    background: #ebf8ff;
  }

  .provider-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  .provider-card h4 {
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
    color: #2d3748;
  }

  .provider-card p {
    font-size: 0.875rem;
    color: #718096;
  }

  .recommended-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #48bb78;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: bold;
  }

  /* API 키 입력 */
  .api-key-input-group {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .input-wrapper {
    position: relative;
    flex: 1;
  }

  .api-key-input {
    width: 100%;
    padding: 0.75rem 3rem 0.75rem 1rem;
    font-size: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
  }

  .visibility-toggle {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.25rem;
    padding: 0.5rem;
  }

  .validate-button {
    padding: 0.75rem 1.5rem;
    background: #3182ce;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    white-space: nowrap;
  }

  .validate-button:hover:not(:disabled) {
    background: #2c5aa0;
  }

  .validate-button:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
  }

  .validation-result {
    padding: 1rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .validation-result.valid {
    background: #c6f6d5;
    color: #22543d;
  }

  .validation-result.invalid {
    background: #fed7d7;
    color: #742a2a;
  }

  .api-key-guide {
    padding: 1rem;
    background: #fff5e6;
    border-left: 4px solid #ed8936;
    border-radius: 6px;
  }

  /* 모델 선택 그리드 */
  .model-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .model-card {
    padding: 1.5rem;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .model-card:hover {
    border-color: #4299e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .model-card.selected {
    border-color: #3182ce;
    background: #ebf8ff;
  }

  .model-card h4 {
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
    color: #2d3748;
  }

  .model-card p {
    font-size: 0.875rem;
    color: #718096;
    margin-bottom: 0.75rem;
  }

  .model-specs {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: #4a5568;
  }

  .selected-model-info {
    padding: 1.5rem;
    background: #edf2f7;
    border-left: 4px solid #3182ce;
    border-radius: 8px;
  }

  .spec-detail {
    margin-top: 0.5rem;
    color: #4a5568;
  }

  /* 고급 설정 */
  .accordion-toggle {
    width: 100%;
    padding: 1rem;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    color: #2d3748;
  }

  .chevron {
    transition: transform 0.2s;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .advanced-settings {
    margin-top: 1rem;
    padding: 1.5rem;
    background: white;
    border-radius: 8px;
  }

  .setting-item {
    margin-bottom: 1.5rem;
  }

  .setting-item label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #2d3748;
  }

  .value-display {
    font-weight: normal;
    color: #4a5568;
    background: #edf2f7;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
  }

  input[type='range'] {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: #e2e8f0;
    outline: none;
  }

  input[type='url'] {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
  }

  .hint {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #718096;
  }

  /* 액션 버튼 */
  .action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  .save-button,
  .reset-button {
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-button {
    background: #48bb78;
    color: white;
  }

  .save-button:hover {
    background: #38a169;
  }

  .reset-button {
    background: #e53e3e;
    color: white;
  }

  .reset-button:hover {
    background: #c53030;
  }
</style>
