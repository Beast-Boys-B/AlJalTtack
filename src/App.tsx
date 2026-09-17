import { useState } from "react"
import { CATEGORIES, type CategoryId } from "./categories"
import { ArcadeHeaderBar } from "./components/ArcadeHeaderBar"
import { useIsMobile } from "./lib/useIsMobile"
import { LandingPage } from "./pages/LandingPage"
import { StartPage } from "./pages/StartPage"
import { ComparePage } from "./pages/ComparePage"
import { LibraryPage } from "./pages/LibraryPage"
import { MobileStartPage } from "./pages/MobileStartPage"
import { MobileComparePage } from "./pages/MobileComparePage"
import { MobileLibraryPage } from "./pages/MobileLibraryPage"

type Page = 0 | 1 | 2 | 3

export default function App() {
  // 모바일 기기에는 랜딩 페이지가 없다(기획 확정) — 첫 페이지를 바로 입력 화면(1)으로
  // 연다. isMobile은 User-Agent 기반(창 너비 아님 — 데스크톱 창을 좁혀도 모바일로
  // 안 바뀌어야 한다는 요구사항)이라 마운트 시점에 동기적으로 값을 알 수 있어
  // 랜딩 화면이 잠깐 보였다 사라지는 깜빡임이 없다.
  const isMobile = useIsMobile()
  const [page, setPage] = useState<Page>(() => (isMobile ? 1 : 0))
  const [previousPage, setPreviousPage] = useState<Page>(0)
  const [inputText, setInputText] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(
    null,
  )
  const [destination, setDestination] = useState("")

  const [soundEnabled] = useState(true)
  const [crtEnabled, setCrtEnabled] = useState(false)
  const [credits, setCredits] = useState(99)
  const [score, setScore] = useState(1250)

  const cat = CATEGORIES.find((c) => c.id === selectedCategory)
  const addScore = (pts: number) => setScore((prev) => prev + pts)

  const goToStart = () => {
    setPage(1)
    setCredits((prev) => Math.max(1, prev - 1))
  }
  const goToCompare = () => {
    if (inputText.trim() && selectedCategory) setPage(2)
  }
  const goToLibrary = () => {
    if (page === 3) {
      setPage(previousPage)
    } else {
      setPreviousPage(page)
      setPage(3)
    }
  }
  const goBackFromLibrary = () => setPage(previousPage)
  const goToLanding = () => setPage(0)
  const goBack = () => setPage(1)
  // 메인 화면(랜딩)으로 — 헤더 "← 메인 화면"/홈 버튼 전용.
  // 모바일은 랜딩 페이지가 없으므로 "메인"은 입력 화면(1)을 뜻한다.
  const goHome = () => {
    setInputText("")
    setSelectedCategory(null)
    setDestination("")
    setPage(isMobile ? 1 : 0)
  }
  // F-공18(팀 확정): 페이지2 "🔄 처음으로 돌아가기"는 랜딩이 아니라
  // 페이지1(입력화면)로 이동하며 완전 리셋한다 — goHome과는 목적지가 다르다.
  const goReset = () => {
    setInputText("")
    setSelectedCategory(null)
    setDestination("")
    setPage(1)
  }
  const handleStartWithExample = (categoryId: CategoryId, example: string) => {
    setSelectedCategory(categoryId)
    setInputText(example)
    setDestination("")
    setPage(2)
  }

  const headerBar = (
    <ArcadeHeaderBar
      crtEnabled={crtEnabled}
      setCrtEnabled={setCrtEnabled}
      credits={credits}
      score={score}
      onHome={goHome}
      onLibrary={goToLibrary}
      libraryActive={page === 3}
      isMobile={isMobile}
    />
  )
  // 모바일 페이지2(비교 화면)만 예외: 검정 상단바를 스크롤 영역 "안"에 넣어 함께
  // 스크롤되게 하고, 대신 MobileComparePage 자체 서브헤더(뒤로/카테고리/처음으로)가
  // 그 스크롤 컨테이너 안에서 sticky로 화면 위에 고정된다 — 검정바는 스크롤에 밀려
  // 사라지고 흰 서브헤더만 고정되길 원한다는 요청(다른 페이지/데스크톱은 기존 그대로
  // 검정바가 스크롤 영역 바깥에서 항상 고정).
  const headerScrollsWithContent = isMobile && page === 2

  return (
    <div
      className={crtEnabled ? "crt-overlay" : ""}
      style={{
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!headerScrollsWithContent && headerBar}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {page === 0 && (
          <LandingPage
            key="landing"
            onStart={goToStart}
            soundEnabled={soundEnabled}
          />
        )}
        {page === 1 && (
          <div
            key="start"
            className="animate-fade-up"
            style={{ height: "100%", overflowY: "auto" }}
          >
            {isMobile ? (
              <MobileStartPage
                inputText={inputText}
                setInputText={setInputText}
                selectedCategory={selectedCategory}
                setSelectedCategory={(v) => {
                  setSelectedCategory(v)
                  if (v !== "travel") setDestination("")
                }}
                destination={destination}
                setDestination={setDestination}
                onNext={goToCompare}
                onLibrary={goToLibrary}
                soundEnabled={soundEnabled}
              />
            ) : (
              <StartPage
                inputText={inputText}
                setInputText={setInputText}
                selectedCategory={selectedCategory}
                setSelectedCategory={(v) => {
                  setSelectedCategory(v)
                  if (v !== "travel") setDestination("")
                }}
                destination={destination}
                setDestination={setDestination}
                onNext={goToCompare}
                onBack={goToLanding}
                soundEnabled={soundEnabled}
              />
            )}
          </div>
        )}
        {page === 2 && cat && (
          <div
            key="compare"
            style={{ height: "100%", overflowY: "auto" }}
          >
            {isMobile ? (
              <>
                {/* headerBar sits outside the fade wrapper below — it must
                    stay put (no dissolve-in) when returning from the library,
                    even though it scrolls away with the content on this page. */}
                {headerBar}
                <div className="animate-fade-up">
                  <MobileComparePage
                    inputText={inputText}
                    category={cat}
                    destination={destination}
                    onBack={goBack}
                    onReset={goReset}
                    soundEnabled={soundEnabled}
                    addScore={addScore}
                  />
                </div>
              </>
            ) : (
              <div className="animate-fade-up">
                <ComparePage
                  inputText={inputText}
                  category={cat}
                  destination={destination}
                  onBack={goBack}
                  onReset={goReset}
                  soundEnabled={soundEnabled}
                  addScore={addScore}
                />
              </div>
            )}
          </div>
        )}
        {page === 3 && isMobile && (
          <div
            key="library"
            className="animate-fade-up"
            style={{ height: "100%", overflowY: "auto" }}
          >
            <MobileLibraryPage
              onHome={goBackFromLibrary}
              onStartWithExample={handleStartWithExample}
              soundEnabled={soundEnabled}
            />
          </div>
        )}
        {page === 3 && !isMobile && (
          <div
            key="library"
            className="animate-fade-up"
            style={{ height: "100%", overflowY: "auto" }}
          >
            <LibraryPage
              onBack={goBackFromLibrary}
              onStartWithExample={handleStartWithExample}
              soundEnabled={soundEnabled}
            />
          </div>
        )}
      </div>
    </div>
  )
}
