// ─── Sound Effects Synthesizer (Web Audio API) ────────────────────────────────

export function playArcadeSound(
  type: "coin" | "select" | "start" | "powerup" | "copy",
) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    if (type === "coin") {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "square"
      osc.frequency.setValueAtTime(987.77, ctx.currentTime)
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } else if (type === "select") {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.1)
    } else if (type === "start") {
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06)
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.06)
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          ctx.currentTime + idx * 0.06 + 0.15,
        )
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + idx * 0.06)
        osc.stop(ctx.currentTime + idx * 0.06 + 0.15)
      })
    } else if (type === "copy") {
      const notes = [523.25, 783.99, 1046.5, 1318.51]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "square"
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05)
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.05)
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          ctx.currentTime + idx * 0.05 + 0.2,
        )
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + idx * 0.05)
        osc.stop(ctx.currentTime + idx * 0.05 + 0.2)
      })
    }
  } catch (e) {
    // Ignore audio autoplay policies gracefully
  }
}
