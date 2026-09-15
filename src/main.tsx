import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AdminPage } from './pages/AdminPage'
import './index.css'

// 로그인 없는 이 앱의 유일한 예외(F-공22 관리자 대시보드) — 메인 화면
// 어디에도 링크하지 않고 /admin 경로로만 진입한다. 별도 라우터 없이
// 경로 하나만 보므로 main.tsx에서 분기(App.tsx는 건드리지 않는다).
const Root = window.location.pathname === '/admin' ? AdminPage : App

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
