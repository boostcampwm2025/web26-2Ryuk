#!/bin/bash
set -e

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] [INFO]${NC} $1"
}
log_error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR]${NC} $1" >&2
}
log_warn() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] [WARN]${NC} $1"
}

# 1. 경로 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT" || exit 1

# 2. env 로드
SAVED_API_PORT="$API_PORT"
SAVED_DOCKER_IMAGE_TAG="$DOCKER_IMAGE_TAG"

ENV_FILE="$SCRIPT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  log ".env 파일 로드 중... ($ENV_FILE)"
  set -a
  source "$ENV_FILE"
  set +a
else
  log_warn ".env 파일 없음, 전달된 환경변수 사용"
fi

DOCKER_IMAGE_TAG=${DOCKER_IMAGE_TAG:-latest}
log "배포 시작 (태그: $DOCKER_IMAGE_TAG)"

# 3. 이전 태그 백업
PREVIOUS_TAG=$(docker compose -f "$SCRIPT_DIR/docker-compose.yml" config 2>/dev/null \
  | grep "image:" | head -1 | awk -F: '{print $NF}' | tr -d ' ' || echo "latest")
log "이전 태그: $PREVIOUS_TAG"

# 4. 사전 검증
log "Docker Compose 검증 중..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" config >/dev/null

log "이미지 존재 여부 확인..."
docker manifest inspect "$DOCKER_USERNAME/$DOCKER_IMAGE_BACKEND:$DOCKER_IMAGE_TAG" >/dev/null
docker manifest inspect "$DOCKER_USERNAME/$DOCKER_IMAGE_FRONTEND:$DOCKER_IMAGE_TAG" >/dev/null

# 5. Docker 로그인
if [ -n "$DOCKER_USERNAME" ] && [ -n "$DOCKER_PASSWORD" ]; then
  log "DockerHub 로그인"
  docker login -u "$DOCKER_USERNAME" -p "$DOCKER_PASSWORD" >/dev/null
fi

# 6. 이미지 Pull (명시적)
log "이미지 Pull"
docker pull "$DOCKER_USERNAME/$DOCKER_IMAGE_BACKEND:$DOCKER_IMAGE_TAG"
docker pull "$DOCKER_USERNAME/$DOCKER_IMAGE_FRONTEND:$DOCKER_IMAGE_TAG"

# 🔥 추가: compose 기준 pull (안전)
docker compose -f "$SCRIPT_DIR/docker-compose.yml" pull

# 7. 서비스 재시작
log "기존 서비스 종료"
docker compose -f "$SCRIPT_DIR/docker-compose.yml" down || true

log "서비스 시작 (강제 재생성)"
docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d --force-recreate

# 8. 헬스체크
health_check() {
  log "헬스체크 수행 중..."
  for i in {1..30}; do
    if docker compose -f "$SCRIPT_DIR/docker-compose.yml" exec -T api \
      wget --quiet --tries=1 --spider "http://localhost:${API_PORT:-4000}/health" >/dev/null; then
      log "✓ 헬스체크 통과"
      return 0
    fi
    sleep 2
  done
  return 1
}

if ! health_check; then
  log_error "헬스체크 실패, 롤백 시도"
  if [ "$PREVIOUS_TAG" != "$DOCKER_IMAGE_TAG" ]; then
    export DOCKER_IMAGE_TAG="$PREVIOUS_TAG"
    docker compose -f "$SCRIPT_DIR/docker-compose.yml" down
    docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d --force-recreate
    health_check || exit 1
  else
    exit 1
  fi
fi

# 9. 완료
log "배포 완료 ✅ (태그: $DOCKER_IMAGE_TAG)"
docker compose -f "$SCRIPT_DIR/docker-compose.yml" ps