#!/bin/bash
# 배움의 달인 macOS 실행 수정 스크립트
# Learning Master macOS Execution Fix Script

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 앱 경로 설정
APP_NAME="배움의 달인.app"
APP_PATH=""

echo ""
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}  배움의 달인 macOS 실행 수정 스크립트  ${NC}"
echo "${BLUE}  Learning Master Execution Fix Script  ${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 앱 위치 자동 탐지
echo "${YELLOW}🔍 앱 위치를 찾는 중...${NC}"

if [ -d "/Applications/$APP_NAME" ]; then
    APP_PATH="/Applications/$APP_NAME"
    echo "${GREEN}✅ 발견: /Applications/$APP_NAME${NC}"
elif [ -d "$HOME/Applications/$APP_NAME" ]; then
    APP_PATH="$HOME/Applications/$APP_NAME"
    echo "${GREEN}✅ 발견: $HOME/Applications/$APP_NAME${NC}"
elif [ -d "$HOME/Desktop/$APP_NAME" ]; then
    APP_PATH="$HOME/Desktop/$APP_NAME"
    echo "${GREEN}✅ 발견: $HOME/Desktop/$APP_NAME${NC}"
elif [ -d "$HOME/Downloads/$APP_NAME" ]; then
    APP_PATH="$HOME/Downloads/$APP_NAME"
    echo "${GREEN}✅ 발견: $HOME/Downloads/$APP_NAME${NC}"
else
    echo "${RED}❌ 오류: 앱을 찾을 수 없습니다!${NC}"
    echo ""
    echo "${YELLOW}수동으로 앱 경로를 입력해주세요:${NC}"
    read -p "앱 경로 (드래그 앤 드롭 가능): " user_path
    APP_PATH="${user_path// /\\ }"
    APP_PATH="${APP_PATH//\'/}"
    APP_PATH="${APP_PATH//\"/}"

    if [ ! -d "$APP_PATH" ]; then
        echo "${RED}❌ 유효하지 않은 경로입니다.${NC}"
        exit 1
    fi
fi

echo ""
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}🔧 실행 권한 설정을 시작합니다...${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1단계: 격리 속성 제거
echo "${YELLOW}[1/4] 격리 속성(Quarantine) 제거 중...${NC}"
if xattr -cr "$APP_PATH" 2>/dev/null; then
    echo "${GREEN}  ✅ 완료${NC}"
else
    echo "${YELLOW}  ⚠️  관리자 권한이 필요합니다.${NC}"
    echo "${YELLOW}  비밀번호를 입력해주세요:${NC}"
    sudo xattr -cr "$APP_PATH"
    echo "${GREEN}  ✅ 완료${NC}"
fi

# 2단계: 실행 권한 부여
echo ""
echo "${YELLOW}[2/4] 실행 권한 부여 중...${NC}"
chmod -R +x "$APP_PATH/Contents/MacOS/" 2>/dev/null || \
    sudo chmod -R +x "$APP_PATH/Contents/MacOS/"
echo "${GREEN}  ✅ 완료${NC}"

# 3단계: 네이티브 모듈 권한 수정
echo ""
echo "${YELLOW}[3/4] 네이티브 모듈 권한 수정 중...${NC}"
find "$APP_PATH" -name "*.node" -exec chmod +x {} \; 2>/dev/null || \
    find "$APP_PATH" -name "*.node" -exec sudo chmod +x {} \;
echo "${GREEN}  ✅ 완료${NC}"

# 4단계: 앱 서명 확인
echo ""
echo "${YELLOW}[4/4] 앱 서명 상태 확인 중...${NC}"
SIGNATURE=$(codesign -dv "$APP_PATH" 2>&1 || echo "unsigned")
if echo "$SIGNATURE" | grep -q "adhoc"; then
    echo "${YELLOW}  ⚠️  Ad-hoc 서명 (개발자 미확인)${NC}"
else
    echo "${GREEN}  ✅ 서명 확인 완료${NC}"
fi

# 완료 메시지
echo ""
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GREEN}✅ 모든 설정이 완료되었습니다!${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "${YELLOW}📱 이제 앱을 실행해보세요:${NC}"
echo ""
echo "   1. Launchpad 또는 Applications 폴더에서"
echo "      '배움의 달인' 아이콘을 클릭"
echo ""
echo "   2. 또는 터미널에서 직접 실행:"
echo "      ${BLUE}open \"$APP_PATH\"${NC}"
echo ""
echo "${YELLOW}⚠️  보안 경고가 나타나면:${NC}"
echo "   시스템 환경설정 → 보안 및 개인정보 보호"
echo "   → '확인 없이 열기' 버튼 클릭"
echo ""
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 실행 여부 확인
read -p "지금 바로 앱을 실행하시겠습니까? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "${GREEN}🚀 앱을 실행합니다...${NC}"
    open "$APP_PATH"
    echo ""
    echo "${GREEN}✅ 앱이 실행되었습니다!${NC}"
    echo ""
fi

echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GREEN}감사합니다! 즐거운 학습 되세요! 📚✨${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
