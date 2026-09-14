import { useState } from "react"
import { CATEGORIES, type CategoryId } from "./categories"
import { ArcadeHeaderBar } from "./components/ArcadeHeaderBar"
import { LandingPage } from "./pages/LandingPage"
import { StartPage } from "./pages/StartPage"
import { ComparePage } from "./pages/ComparePage"
import { LibraryPage } from "./pages/LibraryPage"

type Page = 0 | 1 | 2 | 3

export default function App() {
  const [page, setPage] = useState<Page>(0)
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
  const goToLibrary = () => setPage(3)
  const goBack = () => setPage(1)
  const goReset = () => {
    setInputText("")
    setSelectedCategory(null)
    setDestination("")
    setPage(0)
  }
  const handleStartWithExample = (categoryId: CategoryId, example: string) => {
    setSelectedCategory(categoryId)
    setInputText(example)
    setDestination("")
    setPage(2)
  }

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
      <ArcadeHeaderBar
        crtEnabled={crtEnabled}
        setCrtEnabled={setCrtEnabled}
        credits={credits}
        score={score}
        onHome={goReset}
        onLibrary={goToLibrary}
      />
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
              onHome={goReset}
              soundEnabled={soundEnabled}
            />
          </div>
        )}
        {page === 2 && cat && (
          <div
            key="compare"
            className="animate-fade-up"
            style={{ height: "100%", overflowY: "auto" }}
          >
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
        {page === 3 && (
          <div
            key="library"
            className="animate-fade-up"
            style={{ height: "100%", overflowY: "auto" }}
          >
            <LibraryPage
              onHome={goReset}
              onStartWithExample={handleStartWithExample}
              soundEnabled={soundEnabled}
            />
          </div>
        )}
      </div>
    </div>
  )
}
