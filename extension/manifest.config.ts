import { defineManifest } from "@crxjs/vite-plugin"
import pkg from "../package.json"

// 크롬 확장 — 클로드·챗GPT에 이어 제미니까지 지원(그록만 남음, 하나씩
// 검증하며 추가 중). 사이드패널을 쓰는 이유: 브라우저 액션 팝업은
// 포커스를 잃으면(=대상 탭을 클릭하는 순간) 바로 닫혀버려서, "편집하면서
// 대상 탭도 같이 보는" 이 기능의 사용 흐름과 맞지 않는다. 사이드패널은
// 탭 전환에도 계속 떠있다.
export default defineManifest({
  manifest_version: 3,
  name: "알잘딱 - AI 프롬프트 도우미",
  description: "자연어를 카테고리별 규칙으로 정제해 Claude/ChatGPT/Gemini에 바로 보내는 프롬프트 도우미",
  version: pkg.version,
  icons: {
    16: "icons/icon16.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png",
  },
  action: {
    default_icon: {
      16: "icons/icon16.png",
      48: "icons/icon48.png",
      128: "icons/icon128.png",
    },
  },
  side_panel: {
    default_path: "src/sidepanel/index.html",
  },
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["https://claude.ai/*"],
      js: ["src/content/claude.ts"],
    },
    {
      matches: ["https://chatgpt.com/*", "https://chat.openai.com/*"],
      js: ["src/content/chatgpt.ts"],
    },
    {
      matches: ["https://gemini.google.com/*"],
      js: ["src/content/gemini.ts"],
    },
  ],
  permissions: ["sidePanel", "activeTab", "scripting", "tabs"],
  host_permissions: [
    "https://claude.ai/*",
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://gemini.google.com/*",
  ],
})
