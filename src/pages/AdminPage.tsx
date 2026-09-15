import { useEffect, useRef, useState } from "react"
import { LIME, INK, IVORY } from "../theme"
import { CATEGORIES, CATEGORY_COLORS, type CategoryId } from "../categories"

// F-공22 관리자 대시보드. 로그인 화면 없이 세션도 안 쓰는 이 앱의 유일한
// 예외 — /api/admin/* 를 HTTP Basic Auth로 보호하고(api/_lib/adminAuth.ts),
// 여기서는 로그인 폼에서 받은 자격증명을 Authorization 헤더로 실어 보낸다.
// P-공25(운영자는 전부 동일 권한)라 사용자 구분 없이 계정 하나만 있으면 된다.

// 색약 사용자도 인접한 막대를 색만으로 구분하지 않도록(dataviz 스킬
// validate_palette.js 기준 통과) 정한 카테고리 순서 — api/admin/stats.ts의
// CATEGORY_ORDER와 동일하게 유지해야 한다.
const CATEGORY_ORDER: CategoryId[] = ["medical", "photo", "counseling", "writing", "travel"]

// 상태(양/음) 색상 — dataviz 스킬의 고정 status palette(good/critical),
// 브랜드색과 별개로 항상 이 값을 쓴다.
const GOOD = "#0ca30c"
const CRITICAL = "#d03b3b"
const SEQUENTIAL = "#2a78d6" // 단일 계열 크기 비교(설문 사유 순위)용

const SESSION_KEY = "aljaltak_admin_auth"

interface CategoryStat {
  category: CategoryId
  total: number
  up: number
  down: number
}
interface ReasonStat {
  reason: string
  count: number
}
interface FeedbackRow {
  id: number
  category: CategoryId
  axisValues: Record<string, string>
  rating: "up" | "down"
  rawText: string | null
  createdAt: string
}
interface Stats {
  summary: { totalFeedback: number; up: number; down: number; surveyResponses: number }
  byCategory: CategoryStat[]
  topReasons: ReasonStat[]
  recentFeedback: FeedbackRow[]
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

function categoryName(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id
}
function categoryIcon(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.icon ?? "❓"
}

export function AdminPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  // 최신 성공 인증 헤더 — state가 아니라 ref로 들고 있어서 "새로고침" 버튼이
  // 리렌더 사이클을 거치지 않고 바로 최신 값을 읽는다(가시적 화면 전환은
  // 오직 stats 유무로만 결정 — 아래 fetchStats/handleLogin 참고).
  const authHeaderRef = useRef<string | null>(null)

  // fetchStats 하나가 로그인 제출과 새로고침 둘 다 처리한다: 호출 즉시
  // setLoading(true)로 시작해서, 화면 전환은 오직 "stats가 있냐 없냐"
  // 하나로만 결정한다 — authHeader라는 별도 state를 두고 effect로 연결하면
  // 상태 갱신 사이 프레임에 로그인 화면으로 되돌아가 보이는 경쟁 상태가
  // 생겼었다(제출해도 반응이 없는 것처럼 보이는 원인).
  const fetchStats = async (header: string) => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: header },
      })
      if (res.status === 401) {
        try {
          sessionStorage.removeItem(SESSION_KEY)
        } catch {
          /* ignore */
        }
        setLoginError("아이디 또는 비밀번호가 올바르지 않습니다.")
        return
      }
      if (!res.ok) {
        setLoadError("데이터를 불러오지 못했습니다.")
        return
      }
      const data = (await res.json()) as Stats
      authHeaderRef.current = header
      try {
        sessionStorage.setItem(SESSION_KEY, header)
      } catch {
        /* ignore */
      }
      setStats(data)
    } catch {
      setLoadError("서버에 연결할 수 없습니다.")
    } finally {
      setLoading(false)
    }
  }

  // 마운트 시 한 번만: 이전에 로그인해 세션에 저장해둔 값이 있으면 자동 조회.
  useEffect(() => {
    let saved: string | null = null
    try {
      saved = sessionStorage.getItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    if (saved) fetchStats(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    fetchStats(`Basic ${btoa(`${username}:${password}`)}`)
  }

  const handleRefresh = () => {
    if (authHeaderRef.current) fetchStats(authHeaderRef.current)
  }

  const handleLogout = () => {
    authHeaderRef.current = null
    setStats(null)
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
  }

  if (!stats) {
    return (
      <div
        style={{
          minHeight: "100%",
          background: IVORY,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            background: "#fff",
            border: `2px solid ${INK}`,
            borderRadius: 14,
            padding: "32px 28px",
            width: 320,
            maxWidth: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            boxShadow: "6px 6px 0 rgba(17,17,17,0.12)",
          }}
        >
          <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 20, color: INK }}>
            관리자 대시보드
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: INK }}>
            아이디
            <input
              id="admin-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              style={{
                border: "1.5px solid #ccc",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 14,
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: INK }}>
            비밀번호
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                border: "1.5px solid #ccc",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 14,
              }}
            />
          </label>
          {loginError && <div style={{ color: CRITICAL, fontSize: 12.5 }}>{loginError}</div>}
          {loadError && <div style={{ color: CRITICAL, fontSize: 12.5 }}>{loadError}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: LIME,
              color: INK,
              border: "none",
              borderRadius: 8,
              padding: "10px 0",
              fontWeight: 800,
              fontSize: 14,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "확인 중..." : "로그인"}
          </button>
        </form>
      </div>
    )
  }

  const totalRatings = stats.summary.up + stats.summary.down
  const upRatio = totalRatings > 0 ? Math.round((stats.summary.up / totalRatings) * 100) : null
  const maxCategoryCount = Math.max(1, ...stats.byCategory.map((c) => Math.max(c.up, c.down)))
  const maxReasonCount = Math.max(1, ...stats.topReasons.map((r) => r.count))

  return (
    <div style={{ minHeight: "100%", background: IVORY, padding: "20px 24px 60px", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 24, color: INK }}>
          관리자 대시보드 <span style={{ color: LIME, WebkitTextStroke: `0.5px ${INK}` }}>알잘딱</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={statBtnStyle(false)}
          >
            {loading ? "새로고침 중..." : "🔄 새로고침"}
          </button>
          <button onClick={handleLogout} style={statBtnStyle(true)}>
            로그아웃
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="총 피드백" value={stats.summary.totalFeedback.toLocaleString("ko-KR")} />
        <StatCard
          label="만족도 (👍 비율)"
          value={upRatio === null ? "—" : `${upRatio}%`}
          sub={`👍 ${stats.summary.up} · 👎 ${stats.summary.down}`}
          bar={
            totalRatings > 0 ? (
              <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", width: "100%" }}>
                <div style={{ width: `${(stats.summary.up / totalRatings) * 100}%`, background: GOOD }} title={`👍 ${stats.summary.up}`} />
                <div style={{ width: `${(stats.summary.down / totalRatings) * 100}%`, background: CRITICAL }} title={`👎 ${stats.summary.down}`} />
              </div>
            ) : null
          }
        />
        <StatCard label="설문 응답 수" value={stats.summary.surveyResponses.toLocaleString("ko-KR")} sub="재조정 3회↑ 후 응답" />
      </div>

      {/* 카테고리별 만족도 */}
      <Section title="카테고리별 만족도">
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14, fontSize: 12, color: "#52514e" }}>
          <Legend swatch={GOOD} label="👍 만족" />
          <Legend swatch={CRITICAL} label="👎 아쉬움" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {stats.byCategory
            .slice()
            .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category))
            .map((c) => (
              <div key={c.category} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 110, flexShrink: 0, fontSize: 13, fontWeight: 700, color: INK, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{categoryIcon(c.category)}</span>
                  {categoryName(c.category)}
                </div>
                <MiniBar count={c.up} max={maxCategoryCount} color={GOOD} />
                <MiniBar count={c.down} max={maxCategoryCount} color={CRITICAL} />
                <div style={{ width: 40, textAlign: "right", fontSize: 11.5, color: "#898781", fontVariantNumeric: "tabular-nums" }}>
                  n={c.total}
                </div>
              </div>
            ))}
          {stats.byCategory.every((c) => c.total === 0) && <EmptyNote text="아직 쌓인 피드백이 없습니다." />}
        </div>
      </Section>

      {/* 어려움 사유 Top */}
      <Section title="설문: 어떤 점이 어려웠나요 (Top 사유)">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {stats.topReasons.map((r) => (
            <div key={r.reason} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 170, flexShrink: 0, fontSize: 13, color: INK }}>{r.reason}</div>
              <div style={{ flex: 1, background: "#eee", borderRadius: 4, overflow: "hidden", height: 16 }}>
                <div
                  title={`${r.reason}: ${r.count}건`}
                  style={{
                    width: `${(r.count / maxReasonCount) * 100}%`,
                    background: SEQUENTIAL,
                    height: "100%",
                    borderRadius: 4,
                    minWidth: r.count > 0 ? 4 : 0,
                  }}
                />
              </div>
              <div style={{ width: 30, textAlign: "right", fontSize: 12, color: INK, fontVariantNumeric: "tabular-nums" }}>
                {r.count}
              </div>
            </div>
          ))}
          {stats.topReasons.length === 0 && <EmptyNote text="아직 설문 응답이 없습니다." />}
        </div>
      </Section>

      {/* 최근 피드백 로그 */}
      <Section title="최근 피드백 로그">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#898781", borderBottom: "1px solid #e1e0d9" }}>
                <th style={thStyle}>시간</th>
                <th style={thStyle}>카테고리</th>
                <th style={thStyle}>평가</th>
                <th style={thStyle}>내용</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentFeedback.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f0efec" }}>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", color: "#52514e" }}>
                    {dateFormatter.format(new Date(row.createdAt))}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: `${CATEGORY_COLORS[row.category]}1a`,
                        border: `1px solid ${CATEGORY_COLORS[row.category]}55`,
                        color: INK,
                        borderRadius: 999,
                        padding: "2px 8px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {categoryIcon(row.category)} {categoryName(row.category)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: row.rating === "up" ? GOOD : CRITICAL, fontWeight: 700 }}>
                      {row.rating === "up" ? "👍" : "👎"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: INK, maxWidth: 420 }}>
                    {row.rawText ? (
                      <span>“{row.rawText}”</span>
                    ) : (
                      <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {Object.entries(row.axisValues).map(([axis, value]) => (
                          <span
                            key={axis}
                            style={{
                              background: "#f0efec",
                              borderRadius: 4,
                              padding: "1px 6px",
                              fontSize: 11,
                              color: "#52514e",
                            }}
                          >
                            {value}
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.recentFeedback.length === 0 && <EmptyNote text="아직 쌓인 피드백이 없습니다." />}
        </div>
      </Section>
    </div>
  )
}

function StatCard({ label, value, sub, bar }: { label: string; value: string; sub?: string; bar?: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1.5px solid ${INK}`, borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, color: "#898781", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: INK, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "#52514e" }}>{sub}</div>}
      {bar}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e1e0d9", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: INK, marginBottom: 14, borderLeft: `4px solid ${LIME}`, paddingLeft: 10 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: swatch, display: "inline-block" }} />
      {label}
    </div>
  )
}

function MiniBar({ count, max, color }: { count: number; max: number; color: string }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, background: "#f0efec", borderRadius: 4, height: 12 }}>
        <div
          title={String(count)}
          style={{
            width: count > 0 ? `${Math.max((count / max) * 100, 4)}%` : 0,
            background: color,
            height: "100%",
            borderRadius: 4,
          }}
        />
      </div>
      <div style={{ width: 18, fontSize: 11, color: "#52514e", fontVariantNumeric: "tabular-nums" }}>{count}</div>
    </div>
  )
}

function EmptyNote({ text }: { text: string }) {
  return <div style={{ fontSize: 12.5, color: "#898781", padding: "8px 0" }}>{text}</div>
}

function statBtnStyle(subtle: boolean): React.CSSProperties {
  return {
    background: subtle ? "#fff" : LIME,
    color: INK,
    border: `1.5px solid ${INK}`,
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
  }
}

const thStyle: React.CSSProperties = { padding: "6px 10px", fontWeight: 700, fontSize: 11.5 }
const tdStyle: React.CSSProperties = { padding: "8px 10px", verticalAlign: "top" }
