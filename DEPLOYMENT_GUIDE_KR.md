# 배움의 달인 - 배포 가이드

**버전**: 1.0.0
**작성일**: 2025년 1월
**대상**: 개발자 및 배포 관리자

---

## 목차

1. [배포 준비사항](#배포-준비사항)
2. [로컬 빌드](#로컬-빌드)
3. [GitHub Actions 자동 배포](#github-actions-자동-배포)
4. [플랫폼별 배포](#플랫폼별-배포)
5. [자동 업데이트 설정](#자동-업데이트-설정)
6. [문제 해결](#문제-해결)

---

## 배포 준비사항

### 1. 시스템 요구사항

**개발 환경:**
- Node.js >= 22.18.0
- Yarn 1.22.22
- Rust (stable)
- Git

**빌드 환경 (플랫폼별):**
- **macOS**: macOS 13+ (Xcode Command Line Tools)
- **Windows**: Windows 10+ (Visual Studio Build Tools)
- **Linux**: Ubuntu 22.04+ (build-essential, libgtk-3-dev)

### 2. 프로젝트 설정 확인

```bash
# 저장소 클론
git clone https://github.com/reallygood83/surf.git
cd surf

# 의존성 설치
yarn install

# 빌드 테스트
yarn build
```

### 3. 환경 변수 설정

**.env 파일 생성:**

```bash
# 앱 정보
PRODUCT_NAME="배움의 달인"
APP_VERSION="1.0.0"

# 빌드 설정
BUILD_RESOURCES_DIR="build/resources/prod"
NODE_OPTIONS="--max_old_space_size=8192"
HUSKY=0
```

---

## 로컬 빌드

### 모든 플랫폼 빌드 (macOS, Windows, Linux)

```bash
# 멀티 플랫폼 빌드 (현재 OS에서 실행 가능한 것만)
yarn build:desktop:mwl
```

### 플랫폼별 빌드

#### macOS

```bash
# Apple Silicon (M1/M2/M3) 전용
yarn build:desktop:mac:arm

# Intel (x64) 전용
yarn build:desktop:mac:x64

# 두 아키텍처 모두 빌드 (Universal)
yarn build:desktop:mac
```

**빌드 결과:**
- `app/dist/배움의 달인-1.0.0.arm64.dmg` (Apple Silicon)
- `app/dist/배움의 달인-1.0.0.x64.dmg` (Intel)

#### Windows

```bash
# Windows x64
yarn build:desktop:win:x64
```

**빌드 결과:**
- `app/dist/배움의 달인-1.0.0-setup.exe` (설치 파일)
- `app/dist/배움의 달인-1.0.0-win.zip` (포터블 버전)

#### Linux

```bash
# Linux x64
yarn build:desktop:lin:x64

# Linux ARM
yarn build:desktop:lin:arm
```

**빌드 결과:**
- `app/dist/배움의 달인-1.0.0.x64.AppImage`
- `app/dist/배움의 달인-1.0.0.tar.gz`

---

## GitHub Actions 자동 배포

### 1. GitHub 저장소 설정

#### Secrets 설정 (선택사항)

GitHub 저장소 Settings → Secrets → Actions:

```
GITHUB_TOKEN (자동 생성됨 - 추가 작업 불필요)
MAIN_ONBOARDING_VIDEO_URL (선택사항)
```

### 2. 자동 배포 워크플로우 실행

#### 방법 1: GitHub UI에서 수동 실행

1. GitHub 저장소 → **Actions** 탭
2. **Release 배움의 달인** 워크플로우 선택
3. **Run workflow** 버튼 클릭
4. 입력 필드 설정:
   - **App Name**: `배움의 달인` (기본값)
   - **App Version**: `1.0.0`
   - **Mark as pre-release**: 베타 버전이면 체크
   - **빌드 플랫폼**: 원하는 플랫폼 선택
     - macOS ARM (M1/M2/M3) - 추천
     - macOS x64 (Intel)
     - Windows x64
     - Linux x64
     - Linux ARM
5. **Run workflow** 버튼 클릭하여 시작

#### 방법 2: Git Tag로 자동 트리거 (향후 추가 가능)

```bash
# 새 버전 태그 생성
git tag v1.0.0
git push origin v1.0.0

# 자동으로 빌드 및 릴리스 생성
```

### 3. 배포 프로세스 모니터링

1. GitHub Actions 탭에서 실시간 로그 확인
2. 각 플랫폼별 빌드 진행 상황 확인:
   - ✅ **build-macos-arm** (약 15-20분)
   - ✅ **build-windows-x64** (약 20-25분)
   - ✅ **build-linux-x64** (약 15-18분)
3. 모든 빌드 완료 후 **create-release** 실행
4. GitHub Releases 페이지에서 새 릴리스 확인

### 4. 릴리스 확인 및 다운로드

1. GitHub 저장소 → **Releases** 탭
2. 최신 릴리스에서 다운로드 파일 확인:
   - `배움의 달인-1.0.0.arm64.dmg` (macOS Apple Silicon)
   - `배움의 달인-1.0.0.x64.dmg` (macOS Intel)
   - `배움의 달인-1.0.0-setup.exe` (Windows)
   - `배움의 달인-1.0.0.x64.AppImage` (Linux)

---

## 플랫폼별 배포

### macOS 배포

#### 1. 코드 서명 (선택사항 - 프로덕션 필수)

```bash
# Apple Developer ID 인증서 설치 후
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password

# 서명된 빌드 생성
yarn build:desktop:mac
```

#### 2. Notarization (선택사항 - 프로덕션 필수)

```bash
# Xcode 13+ 필요
xcrun notarytool submit app/dist/배움의 달인-1.0.0.dmg \
  --apple-id your@apple.id \
  --team-id TEAMID \
  --password app-specific-password \
  --wait
```

#### 3. 배포

- **GitHub Releases**: 자동 업로드
- **직접 배포**: DMG 파일을 웹사이트에 호스팅
- **Mac App Store**: 별도 프로세스 필요

### Windows 배포

#### 1. 코드 서명 (선택사항 - 프로덕션 권장)

```bash
# Code Signing Certificate 필요
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_password

# 서명된 빌드 생성
yarn build:desktop:win:x64
```

#### 2. 배포

- **GitHub Releases**: 자동 업로드
- **직접 배포**: EXE 파일을 웹사이트에 호스팅
- **Microsoft Store**: 별도 MSIX 패키징 필요

### Linux 배포

#### 1. AppImage 배포

```bash
# 빌드 완료 후 AppImage 파일 확인
ls -lh app/dist/*.AppImage

# 실행 권한 부여 (사용자가 직접)
chmod +x 배움의 달인-1.0.0.x64.AppImage
./배움의 달인-1.0.0.x64.AppImage
```

#### 2. 배포 채널

- **GitHub Releases**: 자동 업로드
- **Snap Store**: 별도 snapcraft.yaml 필요
- **Flathub**: 별도 flatpak manifest 필요
- **AUR (Arch User Repository)**: PKGBUILD 작성 필요

---

## 자동 업데이트 설정

배움의 달인은 `electron-updater`를 사용하여 자동 업데이트를 지원합니다.

### 1. 자동 업데이트 메커니즘

**작동 방식:**
1. 앱 시작 시 GitHub Releases에서 최신 버전 확인
2. 새 버전 발견 시 사용자에게 알림
3. 사용자 승인 후 백그라운드 다운로드
4. 다운로드 완료 후 재시작하여 업데이트 적용

### 2. 업데이트 설정 파일

**`app/src/main/updater.ts` (예시):**

```typescript
import { autoUpdater } from 'electron-updater'
import { app, dialog } from 'electron'

export function initAutoUpdater() {
  // GitHub Releases를 업데이트 소스로 사용
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'reallygood83',
    repo: 'surf'
  })

  // 앱 시작 1시간 후 업데이트 확인
  setTimeout(() => {
    autoUpdater.checkForUpdates()
  }, 60 * 60 * 1000)

  // 새 버전 발견 시
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: '새 버전 사용 가능',
      message: `배움의 달인 ${info.version}이(가) 출시되었습니다. 지금 업데이트하시겠습니까?`,
      buttons: ['나중에', '업데이트']
    }).then((result) => {
      if (result.response === 1) {
        autoUpdater.downloadUpdate()
      }
    })
  })

  // 업데이트 다운로드 완료
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: '업데이트 준비 완료',
      message: '업데이트가 다운로드되었습니다. 지금 재시작하시겠습니까?',
      buttons: ['나중에', '재시작']
    }).then((result) => {
      if (result.response === 1) {
        autoUpdater.quitAndInstall()
      }
    })
  })
}
```

### 3. 업데이트 배포 프로세스

1. **새 버전 빌드 및 릴리스**
   ```bash
   # GitHub Actions로 새 버전 빌드
   # 버전: 1.0.1
   ```

2. **latest.yml 파일 자동 생성**
   - electron-builder가 자동으로 생성
   - GitHub Releases에 자동 업로드
   - 파일: `latest-mac.yml`, `latest-linux.yml`, `latest.yml` (Windows)

3. **사용자 업데이트 프로세스**
   - 사용자가 앱 실행
   - 자동으로 새 버전 확인
   - 업데이트 다운로드 및 설치

---

## 문제 해결

### 빌드 오류

#### 오류 1: "Node version mismatch"

```bash
# Node.js 버전 확인
node --version  # 22.18.0 이상 필요

# nvm 사용 시
nvm install 22.18.0
nvm use 22.18.0
```

#### 오류 2: "Rust not found"

```bash
# Rust 설치
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Rust 버전 확인
rustc --version
```

#### 오류 3: "Cannot find module '@deta/backend'"

```bash
# 의존성 재설치
rm -rf node_modules
yarn install --frozen-lockfile
```

### 플랫폼별 오류

#### macOS: "Code signing required"

```bash
# 개발 빌드는 서명 없이 가능
export CSC_IDENTITY_AUTO_DISCOVERY=false
yarn build:desktop:mac
```

#### Windows: "Visual Studio Build Tools not found"

```powershell
# Visual Studio Build Tools 설치
# https://visualstudio.microsoft.com/downloads/
# "Desktop development with C++" 워크로드 선택
```

#### Linux: "libgtk-3-dev not found"

```bash
# 필요한 라이브러리 설치
sudo apt-get update
sudo apt-get install -y \
  libgtk-3-dev \
  libwebkit2gtk-4.0-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf
```

### GitHub Actions 오류

#### "Workflow permission denied"

1. GitHub 저장소 → **Settings** → **Actions** → **General**
2. **Workflow permissions** 섹션에서:
   - "Read and write permissions" 선택
   - "Allow GitHub Actions to create and approve pull requests" 체크
3. 설정 저장

#### "Artifact upload failed"

```yaml
# .github/workflows/release.yml에서 확인
# actions/upload-artifact@v4 버전 사용 확인
```

---

## 배포 체크리스트

### 릴리스 전 확인사항

- [ ] 모든 기능 테스트 완료
- [ ] CHANGELOG.md 업데이트
- [ ] 버전 번호 업데이트 (package.json)
- [ ] README.ko.md 업데이트
- [ ] 라이선스 파일 확인
- [ ] AI API 키 설정 가이드 작성

### 빌드 확인사항

- [ ] 로컬 빌드 성공 (macOS/Windows/Linux)
- [ ] GitHub Actions 빌드 성공
- [ ] 빌드 파일 크기 확인 (< 500MB)
- [ ] 자동 업데이트 파일 (latest.yml) 생성 확인

### 릴리스 확인사항

- [ ] GitHub Releases에 모든 파일 업로드 완료
- [ ] 릴리스 노트 작성 및 게시
- [ ] 다운로드 링크 테스트
- [ ] 각 플랫폼에서 설치 테스트
- [ ] 자동 업데이트 테스트

### 문서 확인사항

- [ ] README.ko.md 최신화
- [ ] DEPLOYMENT_GUIDE_KR.md 최신화
- [ ] 사용자 가이드 작성
- [ ] API 키 설정 가이드 작성
- [ ] 문제 해결 FAQ 작성

---

## 참고 자료

### 공식 문서
- [Electron Builder](https://www.electron.build/)
- [electron-updater](https://www.electron.build/auto-update)
- [GitHub Actions](https://docs.github.com/en/actions)

### 프로젝트 문서
- [README.ko.md](./README.ko.md) - 한국어 프로젝트 소개
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 기여 가이드
- [CUSTOMIZATION_SPEC_KR.md](./CUSTOMIZATION_SPEC_KR.md) - 커스터마이징 사양

---

## 지원 및 문의

- **GitHub Issues**: 버그 리포트 및 기능 제안
- **GitHub Discussions**: 질문 및 토론
- **이메일**: support@example.com

---

**배움의 달인 팀**
버전: 1.0.0 | 최종 업데이트: 2025년 1월
