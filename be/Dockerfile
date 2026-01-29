# 1단계: 빌드 스테이지 (파이썬과 컴파일 도구가 포함된 환경)
FROM node:22-alpine AS builder

# pnpm 설치
RUN npm install -g pnpm@9.12.0

# mediasoup 빌드에 필요한 필수 도구 설치
RUN apk add --no-cache python3 py3-pip make g++ gcc linux-headers

WORKDIR /app

# 설정 파일 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY be/package.json ./be/

# 의존성 설치 (여기서 mediasoup 컴파일이 일어납니다)
RUN pnpm install --frozen-lockfile --filter be...

# ---------------------------------------------------------
# 2단계: 실행 스테이지 (빌드 도구를 제외한 가벼운 환경)
FROM node:22-alpine

RUN npm install -g pnpm@9.12.0

WORKDIR /app

# builder 스테이지에서 설치 완료된 node_modules만 통째로 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/be/node_modules ./be/node_modules

# 나머지 설정 및 소스 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY be ./be

EXPOSE 4000

# 개발 서버 실행
CMD ["pnpm", "--filter", "be", "dev"]