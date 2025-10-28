# macOS 앱 크래시 - 대체 해결 방안 (코드 서명 없이)

**현재 문제**: Rust 네이티브 모듈 (`rust_png`)이 서명되지 않아 macOS에서 크래시

---

## 🎯 방안 1: Rust 네이티브 모듈 제거 (권장 ⭐⭐⭐⭐⭐)

### 개념
`rust_png` 모듈을 JavaScript 기반 PNG 라이브러리로 교체

### 장점
- ✅ **코드 서명 불필요** - 순수 JavaScript는 서명 없이 실행 가능
- ✅ **즉시 적용 가능** - 24시간 내 해결
- ✅ **비용 $0** - Apple Developer 계정 불필요
- ✅ **크로스 플랫폼** - 모든 OS에서 동일하게 작동

### 단점
- ⚠️ 성능 약간 저하 (Rust 대비 10-20% 느림)
- ⚠️ 코드 수정 필요

### 구현 방법

#### 1단계: 현재 `rust_png` 사용처 찾기
```bash
cd /Users/moon/Desktop/surf-main
grep -r "rust_png" --include="*.ts" --include="*.js"
grep -r "\.node" --include="*.ts" --include="*.js"
```

#### 2단계: JavaScript PNG 라이브러리 설치
```bash
cd app
npm install pngjs --save
# 또는
npm install sharp --save  # 더 빠르지만 네이티브 의존성 있음
```

#### 3단계: 코드 교체
**Before (Rust)**:
```typescript
import { rustPng } from 'rust_png';

const result = rustPng.encode(imageData);
```

**After (JavaScript - pngjs)**:
```typescript
import { PNG } from 'pngjs';

const png = new PNG({ width: 100, height: 100 });
// ... 이미지 데이터 처리
const buffer = PNG.sync.write(png);
```

#### 4단계: package.json에서 rust_png 제거
```json
{
  "dependencies": {
    // "rust_png": "^1.0.0",  // 제거
    "pngjs": "^7.0.0"  // 추가
  }
}
```

#### 5단계: 재빌드 및 테스트
```bash
cd app
npm run build:mac:arm
```

---

## 🎯 방안 2: Electron Fuses로 보안 완화 (임시 ⭐⭐⭐)

### 개념
Electron의 보안 설정을 완화하여 서명되지 않은 모듈 허용

### 장점
- ✅ 코드 수정 최소화
- ✅ 빠른 적용 (1-2시간)
- ✅ 비용 $0

### 단점
- ⚠️ 보안 위험 증가
- ⚠️ macOS Gatekeeper 경고 계속 발생
- ⚠️ 근본적 해결 아님

### 구현 방법

#### electron-builder 설정 업데이트
```javascript
// app/build/electron-builder-config.js
mac: {
  identity: null,  // 서명 비활성화
  type: 'development',  // 개발 타입으로 설정
  hardenedRuntime: false,  // Hardened Runtime 비활성화
  gatekeeperAssess: false,
  extendInfo: {
    NSAppTransportSecurity: {
      NSAllowsArbitraryLoads: true
    }
  }
}
```

#### Entitlements 파일 추가
```xml
<!-- build/entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
</dict>
</plist>
```

---

## 🎯 방안 3: WebAssembly (WASM)로 마이그레이션 (중장기 ⭐⭐⭐⭐)

### 개념
Rust 코드를 WebAssembly로 컴파일하여 브라우저 내에서 실행

### 장점
- ✅ 네이티브 모듈 불필요
- ✅ 코드 서명 문제 완전 해결
- ✅ Rust 성능 유지 (거의 네이티브 수준)
- ✅ 크로스 플랫폼 보장

### 단점
- ⚠️ 개발 시간 필요 (1-2주)
- ⚠️ Rust 코드 리팩토링 필요

### 구현 방법

#### 1단계: wasm-pack 설치
```bash
cargo install wasm-pack
```

#### 2단계: Rust 프로젝트를 WASM으로 변환
```toml
# Cargo.toml
[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
```

```rust
// lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn encode_png(data: &[u8], width: u32, height: u32) -> Vec<u8> {
    // PNG 인코딩 로직
}
```

#### 3단계: WASM 빌드
```bash
wasm-pack build --target web
```

#### 4단계: Electron에서 WASM 로드
```typescript
import init, { encode_png } from './pkg/rust_png_wasm.js';

await init();
const result = encode_png(imageData, 100, 100);
```

---

## 🎯 방안 4: 앱 배포 방식 변경 (회피 ⭐⭐)

### 개념
macOS 앱 대신 웹 앱 또는 Electron 대체 프레임워크 사용

### 옵션 A: Tauri (Rust 기반 Electron 대체)
- ✅ 더 작은 번들 크기
- ✅ 더 나은 보안
- ⚠️ 전체 리팩토링 필요

### 옵션 B: Progressive Web App (PWA)
- ✅ 설치 불필요
- ✅ 자동 업데이트
- ⚠️ 일부 네이티브 기능 제한

### 옵션 C: Web-only 배포
- ✅ 코드 서명 문제 완전 회피
- ✅ 모든 플랫폼에서 동일
- ⚠️ 오프라인 사용 제한

---

## 🎯 방안 5: 개발자 모드로 배포 (임시 ⭐)

### 개념
사용자가 직접 "개발자 모드"를 활성화하도록 안내

### 사용자 매뉴얼
```markdown
## macOS 개발자 모드 활성화

1. 시스템 환경설정 → 보안 및 개인정보 보호
2. 터미널에서 실행:
   ```bash
   sudo spctl --master-disable
   ```
3. "확인되지 않은 개발자의 앱 허용" 선택
4. 배움의 달인 실행
5. 사용 후 다시 활성화:
   ```bash
   sudo spctl --master-enable
   ```
```

### 장점
- ✅ 코드 수정 불필요
- ✅ 비용 $0

### 단점
- ❌ 사용자 경험 매우 나쁨
- ❌ 보안 위험 증가
- ❌ 일반 사용자가 따라하기 어려움

---

## 📊 방안 비교표

| 방안 | 구현 시간 | 비용 | 사용자 경험 | 보안 | 권장도 |
|------|----------|------|------------|------|--------|
| **1. Rust 제거 → JS** | 1-2일 | $0 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **2. Electron Fuses** | 2시간 | $0 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **3. WASM 마이그레이션** | 1-2주 | $0 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **4. 배포 방식 변경** | 1-4주 | $0 | 다양 | 다양 | ⭐⭐ |
| **5. 개발자 모드** | 1시간 | $0 | ⭐ | ⭐ | ⭐ |
| Apple Developer 서명 | 2-3일 | $99/년 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🚀 추천 실행 계획

### 즉시 (24시간 내)
1. **방안 1 실행**: `rust_png` 사용처 확인
2. `pngjs` 또는 순수 JS 라이브러리로 교체
3. 재빌드 및 테스트
4. v1.0.1 릴리즈

### 단기 (1주일 내)
- v1.0.1 사용자 피드백 수집
- 성능 측정 및 최적화

### 중기 (1개월 내)
- **방안 3 검토**: WASM 마이그레이션 타당성 조사
- 또는 Apple Developer 계정 취득 결정

### 장기 (3개월 내)
- 앱 아키텍처 전면 검토
- Tauri 또는 다른 프레임워크 고려

---

## 💡 결론

**가장 현실적인 해결책**:
1. ✅ **Rust 네이티브 모듈 제거** (방안 1)
   - 코드 서명 없이 즉시 해결
   - 비용 $0
   - 24시간 내 배포 가능

2. ⏳ **중장기적으로 WASM 고려** (방안 3)
   - Rust 성능 유지
   - 완전한 크로스 플랫폼 해결

**Apple Developer 서명은**:
- 장기적으로 필요할 수 있음
- 하지만 지금 당장은 필수 아님
- 방안 1로 먼저 해결 후 결정 가능

---

## 📝 다음 단계

```bash
# 1. rust_png 사용처 확인
cd /Users/moon/Desktop/surf-main
grep -r "rust_png" --include="*.ts" --include="*.js"

# 2. 발견되면 구체적 코드 확인 후 교체 계획 수립
```

**질문**: rust_png가 어디에 사용되고 있는지 먼저 확인하시겠습니까?
