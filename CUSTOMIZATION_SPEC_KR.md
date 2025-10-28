# 🌊 Deta Surf 커스터마이징 및 배포 SPEC 문서

**작성일**: 2025년 10월 28일
**버전**: 1.0
**프로젝트**: Deta Surf 개인화 커스터마이징

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술적 분석](#2-기술적-분석)
3. [커스터마이징 가능성 평가](#3-커스터마이징-가능성-평가)
4. [로컬 저장소 전략](#4-로컬-저장소-전략)
5. [한국어 지원 구현](#5-한국어-지원-구현)
6. [배포 전략](#6-배포-전략)
7. [구현 로드맵](#7-구현-로드맵)
8. [예상 작업량 및 리스크](#8-예상-작업량-및-리스크)

---

## 1. 프로젝트 개요

### 🎯 목표

**Deta Surf를 개인화된 한국어 AI 노트북으로 커스터마이징**

#### 핵심 요구사항
- ✅ **로컬 저장소**: 모든 노트와 데이터를 사용자 로컬에 저장
- ✅ **한국어 UI**: 전체 인터페이스 한국어화
- ✅ **개인 GitHub**: 나만의 저장소에서 관리
- ✅ **웹 배포**: Vercel을 통한 온라인 접근

### ⚠️ 중요한 사실

**Deta Surf는 Electron 기반 데스크톱 애플리케이션입니다!**

#### 현재 아키텍처
```
┌─────────────────────────────────────┐
│     Electron Desktop App            │
│  ┌─────────────────────────────┐   │
│  │   Svelte UI (Renderer)      │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │   Node.js Main Process      │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │   Rust Backend (NEON)       │   │
│  │   - SQLite Database         │   │
│  │   - File System Storage     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
        ↓ 데이터 저장 위치
   사용자 로컬 컴퓨터
   ~/Library/Application Support/Surf/
```

#### 배포 방식에 따른 차이

| 항목 | 현재 (Electron) | Vercel 배포 가능성 |
|------|----------------|-------------------|
| **플랫폼** | 데스크톱 앱 | 웹 애플리케이션 |
| **실행 환경** | OS 네이티브 | 브라우저 |
| **데이터 저장** | 로컬 파일 시스템 | 제한적 (LocalStorage/IndexedDB) |
| **Rust 백엔드** | 직접 실행 | 불가능 (WASM 변환 필요) |
| **파일 시스템 접근** | 완전 제어 | 제한적 (브라우저 샌드박스) |
| **SQLite** | 직접 사용 | WebAssembly 변환 필요 |

---

## 2. 기술적 분석

### 📦 프로젝트 구조

```
surf-main/
├── app/                          # Electron 메인 앱
│   ├── src/
│   │   ├── main/                 # Node.js 메인 프로세스
│   │   │   ├── config.ts         # 🔑 설정 관리 (430줄)
│   │   │   ├── sffs.ts           # 🔑 파일 시스템 추상화
│   │   │   ├── ipcHandlers.ts    # IPC 통신 핸들러
│   │   │   └── viewManager.ts    # 뷰 관리 (41.8 KB)
│   │   ├── renderer/             # Svelte UI
│   │   │   ├── Settings/         # 🔑 설정 UI (한국어화 대상)
│   │   │   └── components/       # 94개 UI 컴포넌트
│   │   └── preload/              # Preload 스크립트
│   └── package.json              # Electron 앱 설정
│
├── packages/
│   ├── backend/                  # 🔑 Rust 백엔드
│   │   ├── src/
│   │   │   ├── store/            # SQLite 데이터베이스 (11 모듈)
│   │   │   └── ai/               # AI 통합
│   │   └── Cargo.toml            # Rust 의존성
│   │
│   ├── types/                    # TypeScript 타입 정의
│   ├── ui/                       # UI 컴포넌트 라이브러리
│   ├── editor/                   # 텍스트 에디터
│   └── utils/                    # 유틸리티
│
└── package.json                  # Monorepo 루트 설정
```

### 🗄️ 데이터 저장 시스템 (SFFS)

#### SQLite 데이터베이스 구조
```sql
-- 리소스 관리 (노트, 파일, 웹페이지)
CREATE TABLE resources (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,           -- note, file, webpage, youtube
    title TEXT,
    content TEXT,                 -- 텍스트 콘텐츠
    url TEXT,                     -- 웹 리소스 URL
    file_path TEXT,               -- 로컬 파일 경로
    created_at INTEGER,
    updated_at INTEGER,
    metadata TEXT                 -- JSON 메타데이터
);

-- 태그 시스템
CREATE TABLE tags (
    resource_id TEXT,
    key TEXT,
    value TEXT,
    PRIMARY KEY (resource_id, key)
);

-- 브라우저 히스토리
CREATE TABLE history (
    id INTEGER PRIMARY KEY,
    url TEXT,
    title TEXT,
    visit_time INTEGER,
    visit_count INTEGER
);

-- AI 임베딩 (검색 최적화)
CREATE TABLE embeddings (
    resource_id TEXT PRIMARY KEY,
    embedding BLOB,               -- 벡터 임베딩
    model TEXT,
    created_at INTEGER
);

-- 노트북 구성
CREATE TABLE notebooks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at INTEGER
);

-- 리소스-노트북 연결
CREATE TABLE notebook_resources (
    notebook_id TEXT,
    resource_id TEXT,
    order_index INTEGER,
    PRIMARY KEY (notebook_id, resource_id)
);
```

#### 파일 시스템 구조
```
~/Library/Application Support/Surf/
├── sffs_backend/
│   ├── surf.db                   # SQLite 메인 데이터베이스
│   ├── surf.db-wal              # Write-Ahead Log
│   ├── surf.db-shm              # Shared Memory
│   │
│   ├── resources/               # 리소스 파일들
│   │   ├── notes/               # 노트 콘텐츠
│   │   ├── files/               # 업로드된 파일
│   │   ├── web_cache/           # 웹페이지 캐시
│   │   └── youtube/             # YouTube 데이터
│   │
│   └── embeddings/              # AI 임베딩 캐시
│
├── user.json                    # 사용자 설정 (JSON)
├── cache/                       # 임시 캐시
└── logs/                        # 로그 파일
```

### 🔧 핵심 기술 스택

#### Frontend
- **UI 프레임워크**: Svelte 5 (최신 Runes API)
- **라우팅**: `@mateothegreat/svelte5-router`
- **스타일링**: TailwindCSS + PostCSS
- **컴포넌트**: `bits-ui` (Headless UI)
- **아이콘**: Iconify
- **PDF 뷰어**: `@pdfslick/core`
- **에디터**: Tiptap (자체 패키지 `@deta/editor`)

#### Backend
- **언어**: Rust + Node.js (Hybrid)
- **데이터베이스**: SQLite (WAL 모드)
- **Node 바인딩**: NEON (Rust ↔ JavaScript)
- **AI 통합**: OpenAI API, 로컬 모델 지원
- **파일 처리**: `sharp` (이미지), PDF 파싱

#### Build & Deploy
- **빌드 도구**: Electron Vite + Turbo
- **패키지 관리**: Yarn Workspaces (Monorepo)
- **타입스크립트**: TypeScript 5.5
- **번들러**: Vite 7.1, Rollup
- **전자 빌더**: electron-builder (멀티 플랫폼)

---

## 3. 커스터마이징 가능성 평가

### ✅ 가능한 것

#### 1. 로컬 저장소 전략 (100% 가능)
- **현재 상태**: 이미 로컬 저장소 사용 중
- **위치**: `~/Library/Application Support/Surf/`
- **커스터마이징**:
  - ✅ 저장 위치 변경 가능
  - ✅ 백업 자동화 설정
  - ✅ 클라우드 동기화 추가 (선택)
  - ✅ 데이터 마이그레이션 스크립트

#### 2. 한국어 지원 (100% 가능)
- **작업량**: 중간 (~40-60시간)
- **방법**: i18n 시스템 구축
- **대상 파일**:
  - Settings UI (25+ 라벨)
  - 메뉴 항목 (10+ 항목)
  - 에러 메시지 (50+ 메시지)
  - 툴팁 및 도움말

#### 3. GitHub 관리 (100% 가능)
- **방법**: Fork + Private Repository
- **유지보수**: Upstream 동기화 가능
- **브랜칭 전략**: `main` (원본) + `korean` (커스텀)

### ⚠️ 제한적인 것

#### 1. Vercel 배포 (가능하지만 제한적)

**시나리오 A: 순수 웹 앱 변환 (대규모 리팩토링)**

```
변경 필요 사항:
┌────────────────────────────────────┐
│ Electron Desktop                   │
└────────────────────────────────────┘
              ↓ 변환
┌────────────────────────────────────┐
│ Next.js / SvelteKit Web App        │
│  ┌──────────────────────────────┐ │
│  │ Frontend (Svelte)            │ │
│  └──────────────────────────────┘ │
│  ┌──────────────────────────────┐ │
│  │ Backend API (Node.js)        │ │
│  │ - Vercel Serverless          │ │
│  └──────────────────────────────┘ │
│  ┌──────────────────────────────┐ │
│  │ Database (Vercel Postgres)   │ │
│  │ - SQLite → PostgreSQL 마이그 │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

**필요한 주요 변경사항**:
1. **Rust 백엔드 제거/변환**
   - ❌ Rust NEON 바인딩 → Node.js/API 경로
   - ❌ SQLite → PostgreSQL/MySQL
   - ❌ 파일 시스템 접근 → 클라우드 스토리지 (S3/Vercel Blob)

2. **Electron API 제거**
   - ❌ IPC 통신 → HTTP/WebSocket
   - ❌ 네이티브 파일 다이얼로그 → 웹 File API
   - ❌ 시스템 트레이 → 없음

3. **데이터 저장소 변경**
   - ❌ 로컬 파일 시스템 → 클라우드 저장소
   - ❌ 사용자별 로컬 DB → 중앙 데이터베이스

**작업량 추정**: 🚨 **300-500시간** (6-10주 풀타임)

---

**시나리오 B: Hybrid 접근 (Electron + 웹 뷰어)**

```
┌─────────────────────────────────────┐
│  GitHub Pages / Vercel (웹 뷰어)    │
│  - 노트 미리보기                     │
│  - 공유 링크                         │
│  - 정적 HTML 생성                    │
└─────────────────────────────────────┘
              ↕ 동기화
┌─────────────────────────────────────┐
│  Electron Desktop (메인 앱)         │
│  - 전체 기능                         │
│  - 로컬 데이터                       │
└─────────────────────────────────────┘
```

**작업량 추정**: ⚡ **80-120시간** (2-3주)

---

### ❌ 불가능한 것

1. **Vercel에서 Rust 백엔드 직접 실행**
   - Vercel은 Node.js/Python/Go만 지원
   - Rust는 WASM 변환 필요 (복잡도 높음)

2. **완전한 로컬 파일 시스템 접근 (웹 앱)**
   - 브라우저 샌드박스 제한
   - File System Access API는 제한적

3. **네이티브 데스크톱 기능 (웹 앱)**
   - 시스템 트레이, 글로벌 단축키 등

---

## 4. 로컬 저장소 전략

### 📁 현재 저장 위치 커스터마이징

#### A. 저장 위치 변경

**파일**: `/app/src/main/config.ts`

```typescript
// 기존 코드 (140-155줄)
export function getUserDataPath(): string {
  const userDataPath = app.getPath('userData');
  return userDataPath;
}

export function getSffsPath(): string {
  return join(getUserDataPath(), 'sffs_backend');
}

// ✅ 커스터마이징: 사용자 정의 경로 지원
export function getUserDataPath(): string {
  // 환경 변수로 커스텀 경로 지정 가능
  const customPath = process.env.SURF_DATA_PATH;

  if (customPath && existsSync(customPath)) {
    return customPath;
  }

  // 기본값
  const userDataPath = app.getPath('userData');
  return userDataPath;
}

// 설정 UI에서 경로 변경 가능
export function setCustomDataPath(newPath: string): boolean {
  try {
    // 경로 검증
    if (!existsSync(newPath)) {
      mkdirSync(newPath, { recursive: true });
    }

    // 환경 변수 업데이트
    process.env.SURF_DATA_PATH = newPath;

    // user.json에 저장
    const config = getConfig();
    config.customDataPath = newPath;
    saveConfig(config);

    return true;
  } catch (error) {
    console.error('Failed to set custom data path:', error);
    return false;
  }
}
```

#### B. 자동 백업 시스템

**새 파일**: `/app/src/main/backup.ts`

```typescript
import { join } from 'path';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { getSffsPath } from './config';

interface BackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'manual';
  location: string;
  keepCount: number; // 보관할 백업 개수
}

export class BackupManager {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupName = `surf-backup-${timestamp}`;
    const backupPath = join(this.config.location, backupName);

    // 백업 디렉토리 생성
    mkdirSync(backupPath, { recursive: true });

    // SQLite 데이터베이스 복사
    const sffsPath = getSffsPath();
    const dbFiles = ['surf.db', 'surf.db-wal', 'surf.db-shm'];

    for (const file of dbFiles) {
      const srcPath = join(sffsPath, file);
      if (existsSync(srcPath)) {
        copyFileSync(srcPath, join(backupPath, file));
      }
    }

    // 리소스 디렉토리 복사 (선택적)
    // ... 구현

    // 오래된 백업 정리
    this.cleanupOldBackups();

    return backupPath;
  }

  private cleanupOldBackups(): void {
    const backups = readdirSync(this.config.location)
      .filter(name => name.startsWith('surf-backup-'))
      .sort()
      .reverse();

    // keepCount 이상의 백업 삭제
    for (let i = this.config.keepCount; i < backups.length; i++) {
      // 삭제 로직
    }
  }

  async restoreBackup(backupPath: string): Promise<boolean> {
    // 백업 복원 로직
    return true;
  }
}

// 자동 백업 스케줄러
export function setupAutoBackup(config: BackupConfig): void {
  if (!config.enabled) return;

  const manager = new BackupManager(config);

  // 일일 백업: 매일 새벽 3시
  if (config.frequency === 'daily') {
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 3 && now.getMinutes() === 0) {
        manager.createBackup();
      }
    }, 60000); // 1분마다 체크
  }

  // 주간 백업: 매주 일요일 새벽 3시
  if (config.frequency === 'weekly') {
    setInterval(() => {
      const now = new Date();
      if (now.getDay() === 0 && now.getHours() === 3) {
        manager.createBackup();
      }
    }, 60000);
  }
}
```

#### C. 클라우드 동기화 (선택 기능)

**새 파일**: `/app/src/main/sync.ts`

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSffsPath } from './config';

interface SyncConfig {
  provider: 'google-drive' | 'dropbox' | 's3' | 'none';
  credentials: any;
  autoSync: boolean;
  syncInterval: number; // 분 단위
}

export class CloudSyncManager {
  private config: SyncConfig;
  private s3Client?: S3Client;

  constructor(config: SyncConfig) {
    this.config = config;

    if (config.provider === 's3') {
      this.s3Client = new S3Client(config.credentials);
    }
  }

  async syncToCloud(): Promise<boolean> {
    // 로컬 DB를 클라우드에 업로드
    // 충돌 해결 로직 포함
    return true;
  }

  async syncFromCloud(): Promise<boolean> {
    // 클라우드에서 최신 DB 다운로드
    return true;
  }
}
```

### 📦 데이터 내보내기/가져오기

**파일**: `/app/src/main/export.ts`

```typescript
import { join } from 'path';
import { writeFileSync, readFileSync } from 'fs';
import { getSffsPath } from './config';

interface ExportOptions {
  format: 'json' | 'markdown' | 'html';
  includeResources: boolean;
  includeHistory: boolean;
  includeSettings: boolean;
}

export class DataExporter {
  async exportAll(outputPath: string, options: ExportOptions): Promise<void> {
    // SQLite 데이터 읽기
    const db = await this.openDatabase();

    // 모든 리소스 추출
    const resources = await db.all('SELECT * FROM resources');
    const notebooks = await db.all('SELECT * FROM notebooks');
    const tags = await db.all('SELECT * FROM tags');

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      resources,
      notebooks,
      tags,
      settings: options.includeSettings ? this.getSettings() : null
    };

    // JSON 저장
    if (options.format === 'json') {
      writeFileSync(
        join(outputPath, 'surf-export.json'),
        JSON.stringify(exportData, null, 2)
      );
    }

    // Markdown 변환
    if (options.format === 'markdown') {
      this.exportAsMarkdown(exportData, outputPath);
    }

    // HTML 변환
    if (options.format === 'html') {
      this.exportAsHTML(exportData, outputPath);
    }
  }

  private exportAsMarkdown(data: any, outputPath: string): void {
    // 각 노트를 .md 파일로 저장
    for (const resource of data.resources) {
      if (resource.type === 'note') {
        const filename = `${resource.title.replace(/[^a-z0-9]/gi, '-')}.md`;
        const content = `# ${resource.title}\n\n${resource.content}`;
        writeFileSync(join(outputPath, filename), content);
      }
    }
  }

  private exportAsHTML(data: any, outputPath: string): void {
    // HTML로 변환하여 저장
  }
}
```

---

## 5. 한국어 지원 구현

### 🌐 i18n 시스템 구축

#### A. 다국어 지원 아키텍처

**새 디렉토리 구조**:
```
app/src/
├── i18n/
│   ├── index.ts                 # i18n 초기화
│   ├── locales/
│   │   ├── en.json              # 영어 (기본)
│   │   └── ko.json              # 한국어 (신규)
│   └── utils.ts                 # i18n 유틸리티
```

#### B. 언어 파일 구조

**파일**: `/app/src/i18n/locales/ko.json`

```json
{
  "app": {
    "name": "Surf",
    "description": "AI 노트북"
  },
  "menu": {
    "file": "파일",
    "edit": "편집",
    "view": "보기",
    "help": "도움말",
    "quit": "종료",
    "newNote": "새 노트",
    "newNotebook": "새 노트북",
    "openFile": "파일 열기",
    "save": "저장",
    "saveAs": "다른 이름으로 저장"
  },
  "settings": {
    "title": "설정",
    "general": "일반",
    "appearance": "외관",
    "ai": "AI",
    "storage": "저장소",
    "advanced": "고급",

    "darkMode": {
      "label": "다크 모드",
      "description": "어두운 테마를 사용합니다"
    },
    "language": {
      "label": "언어",
      "description": "인터페이스 언어를 선택합니다",
      "options": {
        "en": "English",
        "ko": "한국어"
      }
    },
    "dataPath": {
      "label": "데이터 저장 위치",
      "description": "노트와 파일이 저장되는 폴더를 선택합니다",
      "button": "경로 변경",
      "currentPath": "현재 경로: {path}"
    },
    "autoBackup": {
      "label": "자동 백업",
      "description": "정기적으로 데이터를 백업합니다",
      "frequency": {
        "label": "백업 주기",
        "options": {
          "daily": "매일",
          "weekly": "매주",
          "manual": "수동"
        }
      },
      "location": {
        "label": "백업 위치",
        "button": "폴더 선택"
      }
    },
    "aiModel": {
      "label": "AI 모델",
      "description": "사용할 AI 모델을 선택합니다",
      "options": {
        "gpt4": "GPT-4",
        "gpt35": "GPT-3.5 Turbo",
        "claude": "Claude",
        "local": "로컬 모델"
      }
    },
    "apiKey": {
      "label": "API 키",
      "description": "AI 모델 API 키를 입력합니다",
      "placeholder": "sk-...",
      "validate": "키 검증"
    }
  },
  "notebook": {
    "untitled": "제목 없음",
    "create": "노트북 만들기",
    "rename": "이름 바꾸기",
    "delete": "삭제",
    "confirmDelete": "'{name}' 노트북을 삭제하시겠습니까?",
    "addNote": "노트 추가",
    "addFile": "파일 추가",
    "addLink": "링크 추가"
  },
  "note": {
    "untitled": "제목 없는 노트",
    "lastEdited": "마지막 편집: {time}",
    "wordCount": "{count}자",
    "save": "저장됨",
    "saving": "저장 중...",
    "aiGenerate": "AI로 생성",
    "aiContinue": "AI로 계속 쓰기",
    "aiSummarize": "요약",
    "aiTranslate": "번역"
  },
  "search": {
    "placeholder": "검색...",
    "results": "{count}개 결과",
    "noResults": "결과 없음",
    "searching": "검색 중...",
    "filters": {
      "all": "모두",
      "notes": "노트",
      "files": "파일",
      "web": "웹"
    }
  },
  "errors": {
    "generic": "오류가 발생했습니다",
    "fileNotFound": "파일을 찾을 수 없습니다",
    "saveFailed": "저장에 실패했습니다",
    "loadFailed": "불러오기에 실패했습니다",
    "networkError": "네트워크 오류",
    "apiError": "API 오류: {message}",
    "invalidApiKey": "유효하지 않은 API 키입니다"
  },
  "actions": {
    "ok": "확인",
    "cancel": "취소",
    "save": "저장",
    "delete": "삭제",
    "create": "만들기",
    "edit": "편집",
    "close": "닫기",
    "retry": "다시 시도",
    "back": "뒤로",
    "forward": "앞으로",
    "refresh": "새로고침"
  }
}
```

#### C. i18n 유틸리티

**파일**: `/app/src/i18n/index.ts`

```typescript
import { writable, derived } from 'svelte/store';
import en from './locales/en.json';
import ko from './locales/ko.json';

type Locale = 'en' | 'ko';
type Translations = typeof en;

const translations: Record<Locale, Translations> = {
  en,
  ko
};

// 현재 언어 스토어
export const locale = writable<Locale>('ko'); // 기본값: 한국어

// 번역 텍스트 스토어
export const t = derived(locale, ($locale) => {
  return (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = translations[$locale];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // 키를 찾지 못하면 키 자체 반환
      }
    }

    // 파라미터 치환
    if (params && typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (_, key) => params[key] || '');
    }

    return value || key;
  };
});

// 언어 변경 함수
export function setLocale(newLocale: Locale): void {
  locale.set(newLocale);

  // 설정 저장
  if (typeof window !== 'undefined' && window.api) {
    window.api.setConfig({ language: newLocale });
  }
}

// 시스템 언어 감지
export function detectSystemLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';

  const lang = navigator.language.split('-')[0];
  return lang === 'ko' ? 'ko' : 'en';
}

// 초기화
export function initI18n(): void {
  // 저장된 언어 설정 불러오기
  if (typeof window !== 'undefined' && window.api) {
    window.api.getConfig().then((config: any) => {
      const savedLocale = config.language || detectSystemLocale();
      setLocale(savedLocale);
    });
  }
}
```

#### D. Svelte 컴포넌트에서 사용

**예시**: `/app/src/renderer/Settings/Settings.svelte`

```svelte
<script lang="ts">
  import { t } from '../../i18n';
  import { setLocale } from '../../i18n';

  let currentLocale = 'ko';

  function handleLocaleChange(newLocale: 'en' | 'ko') {
    currentLocale = newLocale;
    setLocale(newLocale);
  }
</script>

<div class="settings">
  <h1>{$t('settings.title')}</h1>

  <!-- 언어 설정 -->
  <div class="setting-item">
    <label>{$t('settings.language.label')}</label>
    <p class="description">{$t('settings.language.description')}</p>
    <select bind:value={currentLocale} on:change={() => handleLocaleChange(currentLocale)}>
      <option value="en">{$t('settings.language.options.en')}</option>
      <option value="ko">{$t('settings.language.options.ko')}</option>
    </select>
  </div>

  <!-- 다크 모드 -->
  <div class="setting-item">
    <label>{$t('settings.darkMode.label')}</label>
    <p class="description">{$t('settings.darkMode.description')}</p>
    <input type="checkbox" />
  </div>

  <!-- 데이터 경로 -->
  <div class="setting-item">
    <label>{$t('settings.dataPath.label')}</label>
    <p class="description">{$t('settings.dataPath.description')}</p>
    <button>{$t('settings.dataPath.button')}</button>
  </div>
</div>
```

### 📝 번역 작업 우선순위

#### Phase 1: 핵심 UI (20시간)
- [x] 메뉴 바 (10개 항목)
- [x] 설정 화면 (25개 라벨)
- [x] 노트북 관리 (8개 액션)
- [x] 기본 액션 (10개 버튼)

#### Phase 2: 노트 에디터 (15시간)
- [ ] 에디터 툴바 (15개 버튼)
- [ ] AI 기능 (8개 명령)
- [ ] 포맷팅 옵션 (12개 항목)

#### Phase 3: 고급 기능 (15시간)
- [ ] 검색 인터페이스
- [ ] 파일 관리
- [ ] 동기화 설정
- [ ] 에러 메시지 (50개)

#### Phase 4: 도움말 및 문서 (10시간)
- [ ] 온보딩 튜토리얼
- [ ] 툴팁 (30개)
- [ ] 도움말 페이지

**총 예상 작업 시간**: 60시간

---

## 6. 배포 전략

### 🚀 전략 비교

| 전략 | 장점 | 단점 | 작업량 | 추천도 |
|------|------|------|--------|--------|
| **A. Electron 데스크톱 (현재)** | ✅ 완전한 로컬 저장<br>✅ 모든 기능 사용<br>✅ 빠른 성능 | ❌ 웹 접근 불가<br>❌ 설치 필요 | 낮음 (40h) | ⭐⭐⭐⭐⭐ |
| **B. Hybrid (데스크톱 + 웹뷰어)** | ✅ 로컬 저장<br>✅ 웹 공유 가능<br>✅ 점진적 구현 | ⚠️ 제한된 웹 기능 | 중간 (100h) | ⭐⭐⭐⭐ |
| **C. 완전 웹 앱 변환** | ✅ 어디서나 접근<br>✅ 설치 불필요 | ❌ 로컬 저장 제한<br>❌ 대규모 리팩토링 | 높음 (400h) | ⭐⭐ |

### 🎯 권장 전략: **B. Hybrid 접근**

#### 아키텍처 설계

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  main 브랜치          │  │  web-viewer 브랜치        │    │
│  │  (Electron Desktop)  │  │  (Static Site)           │    │
│  └──────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
              ↓                              ↓
    ┌─────────────────┐          ┌──────────────────────┐
    │  로컬 실행       │          │  Vercel 배포          │
    │  (전체 기능)    │          │  (읽기 전용 뷰어)     │
    └─────────────────┘          └──────────────────────┘
              ↓                              ↑
    ┌─────────────────┐                     │
    │  로컬 데이터     │     선택적 동기화   │
    │  ~/Surf/        │ ─────────────────────┘
    └─────────────────┘
```

### 📦 구현 단계

#### Phase 1: 한국어화 + 로컬 개선 (40시간)

**작업 내용**:
1. i18n 시스템 구축 (10시간)
2. 전체 UI 한국어 번역 (20시간)
3. 로컬 저장소 커스터마이징 (5시간)
4. 자동 백업 시스템 (5시간)

**결과물**: 한국어 Electron 앱

#### Phase 2: 웹 뷰어 개발 (60시간)

**새 프로젝트**: `/web-viewer/`

```
web-viewer/
├── package.json              # SvelteKit 프로젝트
├── svelte.config.js
├── vite.config.js
├── src/
│   ├── routes/
│   │   ├── +page.svelte      # 홈페이지
│   │   └── notes/
│   │       └── [id]/
│   │           └── +page.svelte  # 노트 뷰어
│   ├── lib/
│   │   ├── components/       # 공유 컴포넌트
│   │   └── stores/           # 상태 관리
│   └── app.html
├── static/                   # 정적 파일
└── build/                    # 빌드 결과물
```

**기능**:
- ✅ 노트 읽기 전용 뷰어
- ✅ 검색 기능
- ✅ 노트북 브라우징
- ✅ 공유 링크 생성
- ❌ 노트 편집 (데스크톱 앱 전용)

**데이터 동기화**:
```typescript
// web-viewer/src/lib/sync.ts

interface ExportedNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

interface ExportedData {
  version: string;
  exportDate: string;
  notes: ExportedNote[];
  notebooks: any[];
}

// Electron 앱에서 내보낸 JSON 파일 로드
export async function loadExportedData(): Promise<ExportedData> {
  const response = await fetch('/data/export.json');
  return response.json();
}

// 정적 사이트 빌드 시 데이터 포함
export async function generateStaticSite(exportData: ExportedData): Promise<void> {
  // 각 노트를 정적 HTML로 변환
  for (const note of exportData.notes) {
    const html = await renderNoteToHTML(note);
    // /notes/[id].html 생성
  }
}
```

#### Phase 3: Vercel 배포 설정 (10시간)

**파일**: `/web-viewer/vercel.json`

```json
{
  "framework": "sveltekit",
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["icn1"],
  "env": {
    "PUBLIC_APP_NAME": "Surf - AI 노트북",
    "PUBLIC_APP_URL": "https://your-surf.vercel.app"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

**GitHub Actions**: `.github/workflows/deploy.yml`

```yaml
name: Deploy Web Viewer to Vercel

on:
  push:
    branches:
      - web-viewer
    paths:
      - 'web-viewer/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd web-viewer
          npm install

      - name: Build
        run: |
          cd web-viewer
          npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./web-viewer
```

#### Phase 4: 통합 및 테스트 (20시간)

**Electron 앱에서 웹 내보내기 기능 추가**:

```typescript
// app/src/main/webExport.ts

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export async function exportForWeb(): Promise<string> {
  // 1. 모든 노트 데이터 추출
  const exporter = new DataExporter();
  const data = await exporter.exportAll({ format: 'json' });

  // 2. 웹 뷰어 데이터 디렉토리 생성
  const webDataPath = join(app.getPath('userData'), 'web-export');
  mkdirSync(webDataPath, { recursive: true });

  // 3. JSON 파일 저장
  writeFileSync(
    join(webDataPath, 'export.json'),
    JSON.stringify(data, null, 2)
  );

  // 4. 정적 HTML 생성 (선택)
  await generateStaticPages(data, webDataPath);

  return webDataPath;
}

// 설정 UI에 "웹으로 내보내기" 버튼 추가
```

---

## 7. 구현 로드맵

### 📅 3개월 개발 계획

#### **Month 1: 기반 작업 (80시간)**

**Week 1-2: 환경 설정 및 분석 (20h)**
- [x] 프로젝트 구조 분석 완료
- [ ] 개발 환경 설정
  - Node.js 22.18.0+ 설치
  - Rust 1.70+ 설치
  - Yarn 1.22.22 설정
- [ ] Fork 및 Private Repository 생성
- [ ] 브랜치 전략 수립
  - `main`: 원본 Upstream 동기화
  - `korean`: 한국어화 작업
  - `web-viewer`: 웹 뷰어 개발

**Week 3-4: 한국어화 Phase 1 (60h)**
- [ ] i18n 시스템 구축 (10h)
  - 다국어 지원 구조 설계
  - 언어 파일 생성 (`ko.json`)
  - i18n 유틸리티 함수 작성
- [ ] 핵심 UI 번역 (30h)
  - 메뉴 바 (10개 항목)
  - 설정 화면 (25개 라벨)
  - 노트북 관리 (8개 액션)
  - 기본 액션 버튼
- [ ] 로컬 저장소 커스터마이징 (15h)
  - 저장 경로 변경 기능
  - 자동 백업 시스템
  - 설정 UI 추가
- [ ] 테스트 및 버그 수정 (5h)

**결과물**: 한국어 Electron 데스크톱 앱 v1.0

---

#### **Month 2: 고급 기능 및 웹 뷰어 (80시간)**

**Week 5-6: 한국어화 Phase 2 (30h)**
- [ ] 노트 에디터 번역 (15h)
  - 에디터 툴바 (15개 버튼)
  - AI 기능 메뉴 (8개 명령)
  - 포맷팅 옵션 (12개)
- [ ] 고급 기능 번역 (15h)
  - 검색 인터페이스
  - 파일 관리 다이얼로그
  - 에러 메시지 (50개)

**Week 7-8: 웹 뷰어 개발 시작 (50h)**
- [ ] SvelteKit 프로젝트 생성 (5h)
  - `/web-viewer/` 디렉토리 구조
  - 기본 라우팅 설정
- [ ] 데이터 내보내기 시스템 (15h)
  - JSON Export 기능
  - 정적 HTML 생성
  - 이미지 및 첨부파일 처리
- [ ] 노트 뷰어 UI 개발 (30h)
  - 노트 목록 컴포넌트
  - 노트 상세 뷰어
  - 검색 기능
  - 반응형 디자인

**결과물**:
- 한국어 Electron 앱 v1.5 (전체 번역 완료)
- 웹 뷰어 프로토타입 v0.1

---

#### **Month 3: 통합 및 배포 (70시간)**

**Week 9-10: 웹 뷰어 완성 (40h)**
- [ ] 노트북 브라우징 (10h)
  - 노트북 목록
  - 태그 필터링
  - 정렬 옵션
- [ ] 공유 기능 (10h)
  - 공유 링크 생성
  - 임베드 코드
  - 소셜 메타 태그
- [ ] 성능 최적화 (10h)
  - 코드 스플리팅
  - 이미지 최적화
  - 캐싱 전략
- [ ] 다국어 지원 (10h)
  - 웹 뷰어 한국어화
  - 언어 전환 기능

**Week 11: Vercel 배포 (15h)**
- [ ] Vercel 프로젝트 설정 (5h)
  - 계정 연동
  - 도메인 설정
  - 환경 변수 설정
- [ ] CI/CD 파이프라인 (5h)
  - GitHub Actions 설정
  - 자동 배포 워크플로우
  - 빌드 최적화
- [ ] 테스트 배포 (5h)
  - 스테이징 환경 테스트
  - 프로덕션 배포
  - 모니터링 설정

**Week 12: 문서화 및 마무리 (15h)**
- [ ] 사용자 문서 작성 (8h)
  - 설치 가이드
  - 사용 매뉴얼 (한국어)
  - FAQ
  - 트러블슈팅
- [ ] 개발자 문서 작성 (5h)
  - 커스터마이징 가이드
  - API 레퍼런스
  - 기여 가이드라인
- [ ] 최종 테스트 및 릴리스 (2h)
  - 통합 테스트
  - 버전 태깅 (v1.0.0)
  - GitHub Release 발행

**결과물**:
- 한국어 Electron 앱 v2.0 (Production Ready)
- 웹 뷰어 v1.0 (Vercel 배포 완료)
- 완전한 문서화

---

### 🎯 마일스톤

| 마일스톤 | 기간 | 주요 산출물 | 상태 |
|---------|------|------------|------|
| **M1: 기반 구축** | Week 1-4 | 한국어 Electron 앱 v1.0 | 🟡 진행 중 |
| **M2: 고급 기능** | Week 5-8 | 전체 번역 + 웹 뷰어 프로토타입 | ⚪ 예정 |
| **M3: 배포 완료** | Week 9-12 | Production Release | ⚪ 예정 |

---

## 8. 예상 작업량 및 리스크

### ⏱️ 작업량 상세 분석

#### 개발 작업 (230시간)

| 작업 영역 | 예상 시간 | 난이도 |
|----------|-----------|--------|
| **i18n 시스템 구축** | 10h | 중간 |
| **UI 텍스트 번역** | 60h | 낮음 |
| **로컬 저장소 커스터마이징** | 15h | 중간 |
| **자동 백업 시스템** | 15h | 중간 |
| **웹 뷰어 개발** | 60h | 높음 |
| **데이터 내보내기 시스템** | 20h | 중간 |
| **Vercel 배포 설정** | 10h | 낮음 |
| **CI/CD 파이프라인** | 10h | 중간 |
| **통합 테스트** | 15h | 중간 |
| **문서화** | 15h | 낮음 |

**총 개발 시간**: **230시간** (약 6주 풀타임)

#### 리소스 요구사항

**개발자 스킬셋**:
- ✅ TypeScript/JavaScript (필수)
- ✅ Svelte 5 (권장)
- ⚠️ Rust (선택 - 백엔드 수정 시)
- ✅ Electron (권장)
- ✅ Git/GitHub (필수)

**시스템 요구사항**:
- macOS / Linux / Windows (개발 환경)
- Node.js 22.18.0+
- Rust 1.70+ (백엔드 수정 시)
- 최소 8GB RAM
- 20GB 디스크 공간

### ⚠️ 주요 리스크

#### 🔴 High Risk

**1. Upstream 변경 충돌**
- **리스크**: Deta Surf 원본 업데이트 시 머지 충돌
- **완화 전략**:
  - 별도 브랜치 관리 (`korean`, `web-viewer`)
  - 월 1회 upstream 동기화
  - 충돌 발생 시 수동 해결

**2. Rust 백엔드 의존성**
- **리스크**: NEON 바인딩 오류, 빌드 실패
- **완화 전략**:
  - Rust 코드 최소 수정
  - 백엔드는 읽기 전용 활용
  - 필요 시 전문가 컨설팅

#### 🟡 Medium Risk

**3. 웹 뷰어 기능 제한**
- **리스크**: 브라우저 제약으로 일부 기능 불가능
- **완화 전략**:
  - 읽기 전용 뷰어로 범위 제한
  - 편집은 데스크톱 앱 전용
  - 명확한 기능 안내

**4. 번역 품질**
- **리스크**: 기술 용어 번역 부적절
- **완화 전략**:
  - 원어 병기 옵션
  - 사용자 피드백 수집
  - 번역 검수 단계 추가

#### 🟢 Low Risk

**5. Vercel 배포 비용**
- **리스크**: 무료 플랜 한도 초과
- **완화 전략**:
  - 정적 사이트로 최적화
  - 이미지 CDN 활용
  - 트래픽 모니터링

### 📊 성공 지표 (KPI)

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| **번역 완성도** | 95%+ | 번역된 문자열 / 전체 문자열 |
| **빌드 성공률** | 100% | CI/CD 파이프라인 |
| **웹 뷰어 성능** | Lighthouse 90+ | Vercel Analytics |
| **로컬 저장소 안정성** | 99.9% | 백업 성공률 |
| **문서 커버리지** | 80%+ | 문서화된 기능 비율 |

---

## 9. 빠른 시작 가이드

### 🚀 Step 1: 프로젝트 Fork

```bash
# 1. GitHub에서 Fork (Web UI)
# https://github.com/deta/surf → Fork 버튼 클릭

# 2. Clone (Private Repository)
git clone https://github.com/YOUR_USERNAME/surf.git surf-korean
cd surf-korean

# 3. Upstream 추가
git remote add upstream https://github.com/deta/surf.git

# 4. 브랜치 생성
git checkout -b korean
```

### 🔧 Step 2: 개발 환경 설정

```bash
# Node.js 설치 확인
node --version  # v22.18.0 이상

# Rust 설치 (백엔드 수정 시)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 의존성 설치
yarn install

# 개발 서버 실행
yarn dev
```

### 📝 Step 3: i18n 시스템 구축

```bash
# i18n 디렉토리 생성
mkdir -p app/src/i18n/locales

# 언어 파일 생성
touch app/src/i18n/index.ts
touch app/src/i18n/locales/ko.json
touch app/src/i18n/locales/en.json

# 초기 번역 작업
# (위의 ko.json 예시 복사)
```

### 🌐 Step 4: 웹 뷰어 프로젝트 생성

```bash
# SvelteKit 프로젝트 생성
npm create svelte@latest web-viewer
cd web-viewer

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 🚢 Step 5: Vercel 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# Vercel 로그인
vercel login

# 프로젝트 배포
cd web-viewer
vercel
```

---

## 10. 결론 및 권장사항

### ✅ 실현 가능한 목표

**우선순위 1: Electron 데스크톱 앱 한국어화** ⭐⭐⭐⭐⭐
- 작업량: 중간 (60-80시간)
- 효과: 즉시 사용 가능한 완전한 한국어 앱
- 리스크: 낮음
- **추천**: 반드시 구현

**우선순위 2: 로컬 저장소 개선** ⭐⭐⭐⭐⭐
- 작업량: 낮음 (15-20시간)
- 효과: 데이터 관리 편의성 대폭 향상
- 리스크: 낮음
- **추천**: 반드시 구현

**우선순위 3: 웹 뷰어 (Hybrid 방식)** ⭐⭐⭐⭐
- 작업량: 높음 (80-100시간)
- 효과: 웹에서 노트 열람 가능
- 리스크: 중간
- **추천**: 여유가 있다면 구현

### ❌ 비추천

**완전한 웹 앱 변환 (Vercel Only)** ⭐
- 작업량: 매우 높음 (400+시간)
- 효과: 로컬 저장소 포기
- 리스크: 매우 높음
- **추천**: 하지 않음

### 🎯 최종 권장 전략

```
Phase 1 (필수): Electron 앱 한국어화 + 로컬 개선
  ↓ (80시간, 2-3주)

Phase 2 (선택): 웹 뷰어 추가
  ↓ (100시간, 3-4주)

Result: 완전한 로컬 저장소 + 웹 공유 가능
```

### 📞 다음 단계

1. **이 SPEC 문서 검토**: 목표와 일치하는지 확인
2. **개발 환경 설정**: Node.js, Rust, IDE 준비
3. **GitHub Fork**: Private Repository 생성
4. **첫 번째 커밋**: i18n 시스템 구축 시작
5. **주간 리뷰**: 진행 상황 점검 및 조정

---

## 부록

### 📚 참고 문서

프로젝트에 이미 생성된 상세 분석 문서:

1. **ARCHITECTURE_ANALYSIS.md** (616줄)
   - 전체 시스템 아키텍처
   - 데이터베이스 구조
   - 백엔드 통합 상세

2. **KEY_FILES_REFERENCE.md** (306줄)
   - 핵심 파일 위치 빠른 참조
   - 번역 대상 파일 목록
   - 커스터마이징 포인트

3. **SURF_PROJECT_GUIDE.md** (308줄)
   - 5분 빠른 시작 가이드
   - 일반적인 작업 매뉴얼
   - 개발 명령어 모음

### 🔗 유용한 링크

- **Deta Surf 공식 GitHub**: https://github.com/deta/surf
- **Svelte 5 문서**: https://svelte-5-preview.vercel.app/
- **Electron 문서**: https://www.electronjs.org/docs/latest
- **SvelteKit 문서**: https://kit.svelte.dev/
- **Vercel 문서**: https://vercel.com/docs

---

**문서 작성**: 2025년 10월 28일
**작성자**: Claude (SuperClaude Framework)
**버전**: 1.0
**라이선스**: 프로젝트와 동일 (Apache 2.0)
