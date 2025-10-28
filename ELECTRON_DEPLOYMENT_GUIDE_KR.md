# 🚀 Electron 앱 배포 완벽 가이드

**작성일**: 2025년 10월 28일
**대상**: Deta Surf 한국어 커스터마이징 버전
**플랫폼**: macOS, Windows, Linux

---

## 📋 목차

1. [Electron 배포 개요](#1-electron-배포-개요)
2. [배포 방식 비교](#2-배포-방식-비교)
3. [로컬 빌드 배포](#3-로컬-빌드-배포)
4. [GitHub Releases 자동 배포](#4-github-releases-자동-배포)
5. [자동 업데이트 시스템](#5-자동-업데이트-시스템)
6. [코드 사이닝](#6-코드-사이닝)
7. [배포 체크리스트](#7-배포-체크리스트)

---

## 1. Electron 배포 개요

### 🎯 Electron 배포란?

**Electron 앱은 웹 앱이 아닙니다!**

```
개발 환경 (Node.js + Electron)
         ↓ 빌드 (electron-builder)
설치 파일 생성
  ├── macOS: .dmg, .app
  ├── Windows: .exe (NSIS 설치 파일)
  └── Linux: .AppImage, .deb, .rpm
         ↓ 배포
사용자 컴퓨터에 설치
```

### 📦 Deta Surf의 배포 구조

현재 Deta Surf는 **electron-builder**를 사용하여 3가지 플랫폼 지원:

| 플랫폼 | 빌드 결과물 | 설치 방식 |
|--------|------------|----------|
| **macOS** | `.dmg` 파일 | 드래그 앤 드롭 설치 |
| **Windows** | `.exe` 설치 파일 | NSIS 인스톨러 |
| **Linux** | `.AppImage` | 실행 권한 부여 후 실행 |

### 🔧 빌드 시스템 구조

```
surf-main/
├── app/
│   ├── build/
│   │   ├── electron-builder-config.js  # 🔑 빌드 설정
│   │   ├── afterpack.js                # 빌드 후처리
│   │   ├── installer.nsh               # Windows 인스톨러
│   │   └── resources/                  # 앱 아이콘, 리소스
│   │       ├── prod/
│   │       │   ├── icon.icns          # macOS 아이콘
│   │       │   ├── icon.ico           # Windows 아이콘
│   │       │   └── icon.png           # Linux 아이콘
│   └── package.json                    # 빌드 스크립트
│
└── packages/
    └── backend/                         # Rust 백엔드 (사전 컴파일 필요)
```

---

## 2. 배포 방식 비교

### 방식 A: 로컬 빌드 + 직접 배포 ⭐⭐⭐

**사용 시나리오**: 개인 사용, 소규모 배포

```bash
# 1. 로컬에서 빌드
yarn build:mac        # macOS용
yarn build:win:x64    # Windows용
yarn build:lin:x64    # Linux용

# 2. 생성된 파일을 수동 배포
# - 이메일 첨부
# - Google Drive 공유
# - 개인 웹사이트 업로드
```

**장점**:
- ✅ 간단하고 빠름
- ✅ 추가 설정 불필요
- ✅ 비용 없음

**단점**:
- ❌ 수동 배포 필요
- ❌ 자동 업데이트 불가
- ❌ 버전 관리 어려움

---

### 방식 B: GitHub Releases + GitHub Actions ⭐⭐⭐⭐⭐

**사용 시나리오**: 공개 배포, 자동 업데이트 필요

```
개발자가 Git Tag 생성 (v1.0.0)
         ↓
GitHub Actions 자동 트리거
         ↓
3가지 플랫폼 동시 빌드
  ├── macOS (Intel + Apple Silicon)
  ├── Windows (x64)
  └── Linux (x64 + ARM)
         ↓
GitHub Releases에 자동 업로드
         ↓
사용자가 다운로드 및 설치
         ↓
앱 내 자동 업데이트 알림
```

**장점**:
- ✅ 완전 자동화
- ✅ 자동 업데이트 지원
- ✅ 버전 관리 용이
- ✅ 무료 (GitHub Free)

**단점**:
- ⚠️ 초기 설정 복잡
- ⚠️ CI/CD 이해 필요

**추천**: ⭐⭐⭐⭐⭐ **가장 권장하는 방식**

---

### 방식 C: 전용 서버 호스팅 ⭐⭐⭐

**사용 시나리오**: 기업용, 프리미엄 배포

```
자체 서버 (AWS S3, DigitalOcean 등)
         ↓
업데이트 서버 운영
         ↓
사용자 앱이 자체 서버 확인
```

**장점**:
- ✅ 완전한 제어
- ✅ 커스텀 업데이트 로직
- ✅ 사용자 통계 수집 가능

**단점**:
- ❌ 서버 비용 발생
- ❌ 복잡한 인프라 관리

---

## 3. 로컬 빌드 배포

### 🔧 사전 준비

#### A. 빌드 환경 설정

```bash
# Node.js 22.18.0+ 설치 확인
node --version

# Yarn 설치
npm install -g yarn

# Rust 설치 (백엔드 컴파일용)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Xcode Command Line Tools (macOS만)
xcode-select --install
```

#### B. 프로젝트 클론 및 설정

```bash
# 프로젝트 클론
git clone https://github.com/YOUR_USERNAME/surf-korean.git
cd surf-korean

# 의존성 설치
yarn install

# 백엔드 빌드 (Rust)
cd packages/backend
cargo build --release
cd ../..
```

### 📦 플랫폼별 빌드 명령어

#### macOS 빌드

```bash
# Intel + Apple Silicon 동시 빌드
yarn build:mac

# Intel만 빌드 (x64)
yarn build:mac:x64

# Apple Silicon만 빌드 (ARM64)
yarn build:mac:arm

# 빌드 결과물 위치
# dist/Surf-0.0.1.arm64.dmg
# dist/Surf-0.0.1.x64.dmg
```

**macOS 빌드 시 주의사항**:
- macOS에서만 빌드 가능
- 코드 사이닝 없이 빌드 시 보안 경고 발생
- 사용자: "시스템 환경설정 → 보안 → 확인 없이 열기" 필요

#### Windows 빌드

```bash
# Windows x64 빌드 (크로스 컴파일 가능)
yarn build:win:x64

# 빌드 결과물 위치
# dist/Surf-0.0.1-setup.exe
```

**Windows 빌드 시 주의사항**:
- Linux/macOS에서도 크로스 컴파일 가능 (wine 필요)
- 코드 사이닝 없으면 SmartScreen 경고 발생
- NSIS 인스톨러로 시작 메뉴, 바탕화면 바로가기 자동 생성

#### Linux 빌드

```bash
# Linux x64 빌드
yarn build:lin:x64

# Linux ARM64 빌드
yarn build:lin:arm

# 빌드 결과물 위치
# dist/Surf-0.0.1.x64.AppImage
# dist/Surf-0.0.1.arm64.AppImage
```

**Linux 빌드 시 주의사항**:
- AppImage는 실행 권한 필요: `chmod +x Surf-*.AppImage`
- 추가 포맷 빌드 가능: `.deb`, `.rpm`, `.snap`

### 🚀 빌드 파일 배포 방법

#### 방법 1: Google Drive 공유

```bash
# 1. 빌드 파일 압축
cd dist
zip Surf-v1.0.0-macos.zip *.dmg
zip Surf-v1.0.0-windows.zip *.exe
zip Surf-v1.0.0-linux.zip *.AppImage

# 2. Google Drive에 업로드
# 3. 공유 링크 생성 및 배포
```

#### 방법 2: 개인 웹사이트 호스팅

```bash
# 정적 사이트에 파일 업로드
scp dist/*.dmg user@yourserver.com:/var/www/downloads/
scp dist/*.exe user@yourserver.com:/var/www/downloads/
scp dist/*.AppImage user@yourserver.com:/var/www/downloads/

# 다운로드 페이지 생성
# https://yoursite.com/downloads/
```

#### 방법 3: Dropbox, OneDrive 등

```bash
# 클라우드 스토리지에 업로드 후 공유 링크 생성
```

---

## 4. GitHub Releases 자동 배포 (권장)

### 🎯 전체 워크플로우

```
1. 코드 커밋 및 푸시
         ↓
2. Git Tag 생성 (v1.0.0)
         ↓
3. GitHub Actions 자동 실행
   - macOS Runner: .dmg 빌드
   - Windows Runner: .exe 빌드
   - Linux Runner: .AppImage 빌드
         ↓
4. GitHub Releases 자동 생성
   - Release Notes 첨부
   - 3개 플랫폼 파일 업로드
         ↓
5. 사용자 다운로드
   - https://github.com/USER/REPO/releases
```

### 📝 Step 1: GitHub Actions 워크플로우 생성

**파일 위치**: `.github/workflows/build-release.yml`

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*.*.*'  # v1.0.0, v1.2.3 등의 태그에만 반응

jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install dependencies
        run: yarn install

      - name: Build Rust backend
        run: |
          cd packages/backend
          cargo build --release

      - name: Build Electron app (macOS)
        run: yarn build:mac
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload macOS artifacts
        uses: actions/upload-artifact@v3
        with:
          name: macos-build
          path: app/dist/*.dmg

  build-windows:
    runs-on: windows-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install dependencies
        run: yarn install

      - name: Build Rust backend
        run: |
          cd packages/backend
          cargo build --release

      - name: Build Electron app (Windows)
        run: yarn build:win:x64
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload Windows artifacts
        uses: actions/upload-artifact@v3
        with:
          name: windows-build
          path: app/dist/*.exe

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev webkit2gtk-4.0 libappindicator3-dev librsvg2-dev patchelf
          yarn install

      - name: Build Rust backend
        run: |
          cd packages/backend
          cargo build --release

      - name: Build Electron app (Linux)
        run: yarn build:lin:x64
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload Linux artifacts
        uses: actions/upload-artifact@v3
        with:
          name: linux-build
          path: app/dist/*.AppImage

  create-release:
    needs: [build-macos, build-windows, build-linux]
    runs-on: ubuntu-latest
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v3

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            macos-build/*.dmg
            windows-build/*.exe
            linux-build/*.AppImage
          draft: false
          prerelease: false
          generate_release_notes: true
          body: |
            ## Surf 한국어판 ${{ github.ref_name }}

            ### 🚀 새로운 기능
            - 한국어 인터페이스 지원
            - 로컬 저장소 개선
            - 자동 백업 시스템

            ### 📥 다운로드
            - **macOS**: `.dmg` 파일 다운로드 후 설치
            - **Windows**: `.exe` 파일 실행하여 설치
            - **Linux**: `.AppImage` 파일에 실행 권한 부여 후 실행

            ### 📋 설치 방법
            자세한 설치 가이드는 [여기](https://github.com/${{ github.repository }}/wiki)를 참조하세요.
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 🏷️ Step 2: Git Tag 생성 및 배포

```bash
# 1. 변경사항 커밋
git add .
git commit -m "feat: 한국어 지원 추가 v1.0.0"

# 2. Git Tag 생성
git tag -a v1.0.0 -m "Release v1.0.0 - 한국어 버전"

# 3. Tag 푸시 (GitHub Actions 자동 트리거)
git push origin v1.0.0

# 4. GitHub Actions 진행 확인
# https://github.com/YOUR_USERNAME/surf-korean/actions

# 5. GitHub Releases 페이지 확인
# https://github.com/YOUR_USERNAME/surf-korean/releases
```

### 📦 Step 3: Release Notes 작성 (선택)

GitHub Releases 페이지에서 자동 생성된 Release를 수정:

```markdown
# Surf 한국어판 v1.0.0

## 🎉 주요 변경사항

### ✨ 새로운 기능
- 완전한 한국어 인터페이스 지원
- 사용자 지정 데이터 저장 경로
- 자동 백업 시스템 (일일/주간)
- 클라우드 동기화 (선택)

### 🐛 버그 수정
- 한글 입력 시 깨짐 현상 수정
- 로컬 저장소 경로 문제 해결

### 📦 다운로드

| 플랫폼 | 다운로드 |
|--------|----------|
| macOS (Intel) | [Surf-1.0.0.x64.dmg](링크) |
| macOS (Apple Silicon) | [Surf-1.0.0.arm64.dmg](링크) |
| Windows | [Surf-1.0.0-setup.exe](링크) |
| Linux | [Surf-1.0.0.x64.AppImage](링크) |

## 📋 설치 방법

### macOS
1. `.dmg` 파일 다운로드
2. 파일 열기
3. Surf 아이콘을 Applications 폴더로 드래그

### Windows
1. `.exe` 파일 다운로드
2. 실행하여 설치 진행
3. 바탕화면 바로가기 생성됨

### Linux
1. `.AppImage` 파일 다운로드
2. 실행 권한 부여: `chmod +x Surf-*.AppImage`
3. 더블클릭하여 실행

## 🔧 시스템 요구사항

- **macOS**: 10.13 High Sierra 이상
- **Windows**: Windows 10 이상
- **Linux**: Ubuntu 18.04, Debian 10, Fedora 30 이상
- **메모리**: 최소 4GB RAM
- **디스크**: 500MB 여유 공간

## 📞 문제 해결

문제가 발생하면 [Issues](https://github.com/YOUR_USERNAME/surf-korean/issues)에 보고해주세요.
```

---

## 5. 자동 업데이트 시스템

### 🔄 electron-updater 설정

Deta Surf는 이미 `electron-updater` 패키지를 포함하고 있습니다.

**파일**: `/app/src/main/index.ts` (Main Process)

```typescript
import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow } from 'electron';

// 자동 업데이트 설정
export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  // GitHub Releases를 업데이트 서버로 사용
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'YOUR_USERNAME',
    repo: 'surf-korean',
    private: false
  });

  // 자동 다운로드 활성화
  autoUpdater.autoDownload = true;

  // 업데이트 확인 (앱 시작 시)
  autoUpdater.checkForUpdatesAndNotify();

  // 업데이트 이벤트 리스너
  autoUpdater.on('checking-for-update', () => {
    console.log('업데이트 확인 중...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('업데이트 사용 가능:', info.version);
    // 사용자에게 알림
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', () => {
    console.log('최신 버전입니다.');
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`다운로드 진행: ${Math.round(progress.percent)}%`);
    // 진행률 표시
    mainWindow.webContents.send('download-progress', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('업데이트 다운로드 완료:', info.version);
    // 재시작 확인 다이얼로그
    mainWindow.webContents.send('update-downloaded', info);
  });

  autoUpdater.on('error', (error) => {
    console.error('업데이트 오류:', error);
  });
}

// 앱 시작 시 호출
app.whenReady().then(() => {
  const mainWindow = createWindow();
  setupAutoUpdater(mainWindow);

  // 1시간마다 업데이트 확인
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 3600000);
});
```

### 🎨 업데이트 UI 구현

**파일**: `/app/src/renderer/components/UpdateNotification.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let updateAvailable = false;
  let updateInfo: any = null;
  let downloadProgress = 0;
  let updateDownloaded = false;

  onMount(() => {
    // IPC 리스너 등록
    window.api.on('update-available', (info) => {
      updateAvailable = true;
      updateInfo = info;
    });

    window.api.on('download-progress', (progress) => {
      downloadProgress = Math.round(progress.percent);
    });

    window.api.on('update-downloaded', (info) => {
      updateDownloaded = true;
    });
  });

  function restartApp() {
    window.api.send('restart-app');
  }
</script>

{#if updateAvailable && !updateDownloaded}
  <div class="update-notification">
    <h3>새 버전 사용 가능</h3>
    <p>버전 {updateInfo.version}이(가) 다운로드 중입니다...</p>
    <progress value={downloadProgress} max="100"></progress>
    <span>{downloadProgress}%</span>
  </div>
{/if}

{#if updateDownloaded}
  <div class="update-notification">
    <h3>업데이트 준비 완료</h3>
    <p>재시작하여 새 버전을 적용하시겠습니까?</p>
    <button on:click={restartApp}>지금 재시작</button>
    <button on:click={() => updateDownloaded = false}>나중에</button>
  </div>
{/if}

<style>
  .update-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
  }

  progress {
    width: 100%;
    height: 8px;
  }

  button {
    margin-top: 10px;
    margin-right: 10px;
  }
</style>
```

---

## 6. 코드 사이닝

### 🔐 코드 사이닝이란?

**코드 사이닝**: 앱이 신뢰할 수 있는 개발자가 만들었음을 증명하는 디지털 서명

#### 코드 사이닝 없이 배포 시:

| 플랫폼 | 사용자 경험 |
|--------|------------|
| **macOS** | "신뢰할 수 없는 개발자" 경고 → 우클릭 + "열기" 필요 |
| **Windows** | "Windows Defender SmartScreen" 경고 → "추가 정보" + "실행" |
| **Linux** | 경고 없음 (자유로운 실행) |

### 🍎 macOS 코드 사이닝

#### 필요 사항:
- Apple Developer Program 가입 ($99/년)
- Developer ID Application 인증서

#### 설정 방법:

**1. Apple Developer 계정에서 인증서 다운로드**

**2. electron-builder 설정 수정**

```javascript
// app/build/electron-builder-config.js

mac: {
  identity: "Developer ID Application: Your Name (TEAM_ID)",
  hardenedRuntime: true,
  gatekeeperAssess: false,
  entitlements: "build/entitlements.mac.plist",
  entitlementsInherit: "build/entitlements.mac.plist"
}
```

**3. Notarization 설정 (macOS 10.15+)**

```bash
# .env 파일에 추가
APPLE_ID=your-apple-id@example.com
APPLE_ID_PASSWORD=app-specific-password
APPLE_TEAM_ID=YOUR_TEAM_ID
```

```javascript
// electron-builder-config.js
afterSign: 'build/notarize.js'
```

**4. notarize.js 생성**

```javascript
// build/notarize.js
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'surf.deta',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID
  });
};
```

### 🪟 Windows 코드 사이닝

#### 필요 사항:
- 코드 사이닝 인증서 ($200-400/년)
- Sectigo, DigiCert 등에서 구매

#### 설정 방법:

```javascript
// electron-builder-config.js

win: {
  certificateFile: "path/to/cert.pfx",
  certificatePassword: process.env.CERT_PASSWORD,
  signingHashAlgorithms: ['sha256'],
  target: ['nsis']
}
```

### 💰 비용 절감 방법

**코드 사이닝 없이 배포하기** (개인/소규모 사용)

1. **macOS**: 사용자에게 우클릭 + "열기" 안내
2. **Windows**: "추가 정보" + "실행" 안내
3. **Linux**: 제한 없음

**README에 설치 가이드 추가**:

```markdown
## 설치 시 보안 경고 해결

### macOS
1. `.dmg` 파일을 다운로드합니다
2. "신뢰할 수 없는 개발자" 경고가 나타나면:
   - 파일을 우클릭
   - "열기" 선택
   - "열기" 버튼 클릭

### Windows
1. `.exe` 파일을 다운로드합니다
2. "Windows에서 PC를 보호했습니다" 경고가 나타나면:
   - "추가 정보" 클릭
   - "실행" 버튼 클릭
```

---

## 7. 배포 체크리스트

### ✅ 배포 전 체크리스트

#### 📋 코드 준비
- [ ] 모든 기능 테스트 완료
- [ ] 버그 수정 완료
- [ ] 한국어 번역 100% 완성
- [ ] 버전 번호 업데이트 (`package.json`)
- [ ] CHANGELOG.md 작성

#### 🔧 빌드 설정
- [ ] `electron-builder-config.js` 확인
  - [ ] `appId` 변경 (예: `com.yourname.surf`)
  - [ ] `productName` 한국어 설정
  - [ ] 아이콘 파일 교체
- [ ] 자동 업데이트 URL 설정 (GitHub Releases)
- [ ] 라이선스 정보 확인

#### 🎨 리소스 준비
- [ ] 앱 아이콘 제작
  - [ ] macOS: 1024×1024 PNG → `.icns`
  - [ ] Windows: 256×256 PNG → `.ico`
  - [ ] Linux: 512×512 PNG
- [ ] 스플래시 스크린 (선택)
- [ ] 앱 스크린샷 (GitHub Releases용)

#### 📝 문서화
- [ ] README.md 작성
  - [ ] 설치 방법
  - [ ] 사용 방법
  - [ ] 문제 해결
- [ ] LICENSE 파일 확인
- [ ] 개인정보 처리방침 (선택)

#### 🚀 배포 실행
- [ ] 로컬 빌드 테스트
  - [ ] macOS 테스트
  - [ ] Windows 테스트 (VM)
  - [ ] Linux 테스트 (VM)
- [ ] GitHub Actions 워크플로우 검증
- [ ] Git Tag 생성 및 푸시
- [ ] GitHub Releases 확인
- [ ] 다운로드 링크 테스트

#### 📢 배포 후
- [ ] 사용자 안내 (블로그, SNS)
- [ ] 피드백 수집
- [ ] 버그 리포트 모니터링
- [ ] 자동 업데이트 작동 확인

---

## 8. 배포 시나리오별 가이드

### 시나리오 A: 나 혼자 사용 (가장 간단)

```bash
# 1. 로컬 빌드
yarn build:mac  # 또는 build:win:x64, build:lin:x64

# 2. 생성된 파일 실행
open dist/Surf-0.0.1.dmg

# 3. 필요 시 다른 컴퓨터로 복사
```

**예상 시간**: 10분
**추가 설정**: 없음

---

### 시나리오 B: 친구/동료와 공유 (중간)

```bash
# 1. Google Drive 공유 폴더 생성
# 2. 빌드 후 업로드
yarn build:mac && cp dist/*.dmg ~/Google\ Drive/Surf/
yarn build:win:x64 && cp dist/*.exe ~/Google\ Drive/Surf/
yarn build:lin:x64 && cp dist/*.AppImage ~/Google\ Drive/Surf/

# 3. 공유 링크 생성 및 전달
```

**예상 시간**: 30분
**추가 설정**: 클라우드 스토리지 계정

---

### 시나리오 C: GitHub Releases 공개 배포 (권장)

```bash
# 1. GitHub Actions 워크플로우 설정 (1회만)
# .github/workflows/build-release.yml 생성

# 2. 버전 태그 생성
git tag v1.0.0
git push origin v1.0.0

# 3. GitHub Actions 자동 빌드 (10-15분 소요)
# 4. GitHub Releases 페이지 확인
```

**예상 시간**: 1-2시간 (초기 설정), 이후 5분
**추가 설정**: GitHub Actions 워크플로우

---

## 9. 문제 해결 (Troubleshooting)

### ❌ 빌드 실패 시

#### 문제: "Rust 백엔드 컴파일 실패"

```bash
# 해결: Rust 툴체인 재설치
rustup update stable
rustup default stable

# 백엔드 디렉토리로 이동
cd packages/backend

# 클린 빌드
cargo clean
cargo build --release
```

#### 문제: "electron-builder: command not found"

```bash
# 해결: 의존성 재설치
rm -rf node_modules
yarn install
```

#### 문제: macOS에서 "identity null" 에러

```bash
# 해결: electron-builder-config.js 확인
mac: {
  identity: null,  // 코드 사이닝 스킵
}
```

### ⚠️ 자동 업데이트 작동 안 함

#### 원인 1: GitHub Release가 Draft 상태

```bash
# 해결: GitHub Releases 페이지에서 "Publish release" 클릭
```

#### 원인 2: `latest.yml` 파일 누락

```bash
# 확인: dist/ 디렉토리에 latest-mac.yml 존재 여부
ls -la dist/*.yml

# 재빌드로 해결
yarn build:mac
```

---

## 10. 요약 및 권장사항

### 🎯 초보자 권장 경로

```
Step 1: 로컬 빌드 테스트 (1시간)
  ↓
Step 2: Google Drive 수동 배포 (1시간)
  ↓
Step 3: GitHub Actions 설정 (2-3시간)
  ↓
Step 4: 자동 업데이트 활성화 (1시간)
```

**총 예상 시간**: 5-6시간 (초기 설정)
**이후 배포**: 5분 (Git Tag만 푸시)

### ⭐ 가장 권장하는 방식

**GitHub Releases + GitHub Actions** ✅
- 완전 자동화
- 무료
- 자동 업데이트 지원
- 버전 관리 용이

---

## 부록: 유용한 명령어 모음

```bash
# 개발 모드 실행
yarn dev

# 전체 프로젝트 빌드
yarn build

# 플랫폼별 빌드
yarn build:mac        # macOS (Intel + ARM)
yarn build:mac:x64    # macOS Intel만
yarn build:mac:arm    # macOS Apple Silicon만
yarn build:win:x64    # Windows
yarn build:lin:x64    # Linux x64
yarn build:lin:arm    # Linux ARM

# 모든 플랫폼 동시 빌드 (macOS에서만)
yarn build:mwl        # Mac + Windows + Linux

# 빌드 결과물 확인
ls -lh app/dist/

# 빌드 결과물 삭제
rm -rf app/dist/

# 의존성 재설치
rm -rf node_modules
yarn install

# Rust 백엔드 빌드
cd packages/backend
cargo build --release
cargo test

# 타입 체크
yarn typecheck

# 린트
yarn lint

# 포맷
yarn format
```

---

**문서 작성**: 2025년 10월 28일
**작성자**: Claude (SuperClaude Framework)
**버전**: 1.0
**다음 업데이트**: 사용자 피드백 반영
