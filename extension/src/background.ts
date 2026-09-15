// 툴바 아이콘을 누르면 사이드패널이 바로 열리도록 설정.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error("sidePanel.setPanelBehavior failed", err))
