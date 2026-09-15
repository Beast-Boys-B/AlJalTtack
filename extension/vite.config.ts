import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { crx } from "@crxjs/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import manifest from "./manifest.config"

// 메인 웹앱(vite.config.ts)과는 별도 빌드다 — 매니페스트, 출력 구조,
// 콘텐츠 스크립트/백그라운드 서비스워커 번들링 방식이 완전히 달라서
// 하나의 설정으로 같이 쓰기 어렵다. src/categories 등 카테고리 로직은
// ../src 상대경로로 그대로 재사용한다(복붙/중복 없음).
export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss(), crx({ manifest })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
})
