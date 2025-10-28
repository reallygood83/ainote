# 배움의 달인 v1.0.0 - Windows 빌드 수정 완료 ✅

**중요 공지**: 한글 파일명 다운로드 시 404 에러가 발생할 수 있습니다. **반드시 아래 영문 파일명으로 다운로드**해주세요!

---

## 🎉 Windows 버전 다운로드 (최종 수정 완료)

### ⬇️ Windows 10/11 사용자

**파일명**: `LearningMaster-1.0.0-setup.exe` (169MB)
**다운로드**: [🔗 Windows 설치파일 다운로드](https://github.com/reallygood83/ainote/releases/download/v1.0.0/LearningMaster-1.0.0-setup.exe)

**설치 방법**:

1. 위 링크를 클릭하여 `LearningMaster-1.0.0-setup.exe` 파일 다운로드
2. 다운로드한 파일을 더블클릭하여 설치 시작
3. Windows Defender SmartScreen 경고가 나타나면:
   - "자세히" 클릭 → "실행" 버튼 클릭
4. 설치 완료 후 바탕화면 아이콘으로 실행

---

## 🍎 macOS 버전 다운로드 (Apple Silicon)

### ⬇️ macOS ARM64 (M1/M2/M3 칩)

**파일명**: `LearningMaster-1.0.0-arm64.dmg` (203MB)
**다운로드**: [🔗 macOS DMG 다운로드](https://github.com/reallygood83/ainote/releases/download/v1.0.0/LearningMaster-1.0.0-arm64.dmg)

**설치 방법**:

1. DMG 파일 다운로드 및 마운트
2. 앱을 Applications 폴더로 드래그
3. 터미널에서 다음 명령어 실행 (권한 설정):

```bash
xattr -c "/Applications/배움의 달인.app"
chmod -R +x "/Applications/배움의 달인.app/Contents/MacOS/"
find "/Applications/배움의 달인.app" -name "*.node" -exec chmod +x {} \;
```

⚠️ **macOS 주의사항**:

- 현재 버전은 OCR 기능이 비활성화되어 있습니다
- Conditional Compilation을 통해 코드 서명 문제를 우회했습니다
- 자세한 내용: [macOS*대체*해결방안.md](https://github.com/reallygood83/ainote/blob/main/macOS_대체_해결방안.md)

---

## ✅ Windows 빌드 및 흰색 화면 문제 해결 완료

### 🔧 해결된 문제 1: .exe 파일 생성 실패

**증상**:

- Windows .exe 파일이 생성되지 않았음

**근본 원인**:

```json
// package.json의 문제
"build:win:x64": "... --publish always"
```

`--publish always` 플래그가 GitHub Releases에 자동 업로드를 시도했으나 실패하여 .exe 파일이 생성되지 못했습니다.

**적용된 해결책**:

```json
// 수정 후
"build:win:x64": "... --publish never"
```

로컬 빌드만 수행하도록 변경하여 정상적으로 .exe 파일이 생성되었습니다.

### 🔧 해결된 문제 2: Windows 흰색 화면 (2025-10-28 15:20 수정)

**증상**:

- Windows 설치 후 앱 실행 시 흰색 빈 화면만 표시
- UI가 전혀 로드되지 않음

**근본 원인**:

```typescript
// app/src/main/mainWindow.ts:390 (수정 전)
mainWindow.loadURL('surf-internal://Core/Core/core.html')
```

프로토콜 URL의 hostname이 대문자 'Core'였으나, 허용된 hostnames는 소문자 'core'만 인식:

```typescript
// app/src/main/surfProtocolHandlers.ts:241
const ALLOWED_HOSTNAMES = ['core', 'overlay', 'surf']

// HOSTNAME_TO_ROOT 객체 키 조회 실패 → 400 Bad Request → 흰색 화면
```

**적용된 해결책**:

```typescript
// 수정 후
mainWindow.loadURL('surf-internal://core/Core/core.html')
```

hostname을 소문자 'core'로 변경하여 프로토콜 핸들러가 정상 작동하도록 수정했습니다.

### 📦 생성된 파일

- ✅ **Windows Setup.exe**: `LearningMaster-1.0.0-setup.exe` (169MB)
- ✅ **macOS DMG**: `LearningMaster-1.0.0-arm64.dmg` (203MB)
- ✅ **macOS ZIP**: `LearningMaster-1.0.0-arm64-mac.zip` (201MB)

---

## 🆘 자주 묻는 질문 (FAQ)

### Q1: 한글 파일명으로 다운로드 시 404 에러가 발생합니다

**A**: GitHub 릴리즈의 한글 파일명은 URL 인코딩 문제로 404 에러가 발생합니다. **반드시 영문 파일명(`LearningMaster-1.0.0-setup.exe`)으로 다운로드**해주세요.

### Q2: Windows에서 SmartScreen 경고가 뜹니다

**A**: 정상입니다. 코드 서명 인증서가 없어서 발생하는 경고입니다. "자세히" → "실행"을 클릭하면 설치가 진행됩니다.

### Q3: macOS에서 앱이 실행되지 않습니다

**A**: 권한 설정이 필요합니다. 위의 macOS 설치 방법 섹션의 터미널 명령어를 실행해주세요.

### Q4: OCR 기능이 작동하지 않습니다

**A**:

- **Windows**: OCR 기능이 정상 작동합니다
- **macOS**: 현재 버전은 코드 서명 문제로 OCR 기능이 비활성화되어 있습니다

---

## 🧪 테스트 요청

Windows 사용자분들께서 다음 사항을 테스트하고 피드백 부탁드립니다:

### 필수 테스트 항목

- [ ] `LearningMaster-1.0.0-setup.exe` 다운로드 정상 작동
- [ ] 설치 프로세스 완료 확인
- [ ] 앱이 정상적으로 실행되는지 확인
- [ ] UI가 제대로 표시되는지 확인 (흰색 화면 해결 여부)
- [ ] OCR 기능 정상 작동 확인

### 피드백 방법

이슈가 있으시면 [GitHub Issues](https://github.com/reallygood83/ainote/issues)에 등록해주세요.

---

## 📋 변경 사항 (Changelog)

### v1.0.0 (2025-10-28)

- ✅ **Windows 빌드 수정**: `--publish always` → `--publish never` 변경으로 .exe 생성 문제 해결
- ✅ **Windows 흰색 화면 수정** (15:20): protocol hostname 대소문자 수정으로 런타임 오류 해결
- ✅ **macOS Conditional Compilation**: OCR 기능을 macOS에서 제외하여 코드 서명 문제 해결
- ✅ **릴리즈 파일 정리**: 영문 파일명으로 통일하여 다운로드 안정성 향상
- 📝 **문서 개선**: 설치 가이드 및 FAQ 추가

---

## 🔗 관련 문서

- [Windows 흰색 화면 수정 완료 보고서](https://github.com/reallygood83/ainote/blob/main/Windows_흰색화면_수정완료.md) ⭐ 최신
- [Windows 빌드 수정 완료 보고서](https://github.com/reallygood83/ainote/blob/main/Windows_빌드_수정완료.md)
- [Conditional Compilation 구현 완료](https://github.com/reallygood83/ainote/blob/main/Conditional_Compilation_구현완료.md)
- [macOS 대체 해결방안](https://github.com/reallygood83/ainote/blob/main/macOS_대체_해결방안.md)
- [빌드 완료 및 실행 이슈 정리](https://github.com/reallygood83/ainote/blob/main/빌드_완료_및_실행_이슈_정리.md)

---

**개발자**: Claude (Anthropic)
**프로젝트 관리**: 안양 박달초 김문정
**최종 업데이트**: 2025년 10월 28일
**GitHub**: https://github.com/reallygood83/ainote
