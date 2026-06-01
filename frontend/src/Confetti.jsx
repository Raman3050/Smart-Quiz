import { useEffect, useState, useCallback } from 'react'
import './Confetti.css'

const COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']
const SHAPES = ['circle', 'square', 'triangle']

function randomBetween(a, b) {
  return Math.random() * (b - a) + a
}

function createParticle(id, originX, originY) {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
  const angle = randomBetween(0, 360)
  const velocity = randomBetween(300, 700)
  const size = randomBetween(6, 12)
  const drift = randomBetween(-100, 100)
  const duration = randomBetween(1.5, 3.5)
  const delay = randomBetween(0, 0.3)
  const spin = randomBetween(-720, 720)

  return { id, color, shape, angle, velocity, size, drift, duration, delay, spin, originX, originY }
}

export default function Confetti({ trigger, type = 'burst' }) {
  const [particles, setParticles] = useState([])

  const launchConfetti = useCallback(() => {
    const count = type === 'celebration' ? 120 : 40
    const centerX = window.innerWidth / 2
    const centerY = type === 'celebration' ? window.innerHeight * 0.3 : window.innerHeight * 0.4

    const newParticles = Array.from({ length: count }, (_, i) =>
      createParticle(Date.now() + i, centerX, centerY)
    )
    setParticles(newParticles)

    setTimeout(() => setParticles([]), 4000)
  }, [type])

  useEffect(() => {
    if (trigger > 0) launchConfetti()
  }, [trigger, launchConfetti])

  if (particles.length === 0) return null

  return (
    <div className="confetti-container" aria-hidden="true">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180
        const tx = Math.cos(rad) * p.velocity * 0.4 + p.drift
        const ty = Math.sin(rad) * p.velocity * 0.3 - p.velocity * 0.6

        return (
          <div
            key={p.id}
            className={`confetti-particle confetti-${p.shape}`}
            style={{
              left: p.originX,
              top: p.originY,
              width: p.size,
              height: p.size,
              backgroundColor: p.shape !== 'triangle' ? p.color : 'transparent',
              borderBottomColor: p.shape === 'triangle' ? p.color : undefined,
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
              '--spin': `${p.spin}deg`,
              '--duration': `${p.duration}s`,
              '--delay': `${p.delay}s`,
            }}
          />
        )
      })}
    </div>
  )
}

/* Mini confetti burst for correct answers */
export function CorrectBurst({ show }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (!show) return
    const count = 24
    const newParticles = Array.from({ length: count }, (_, i) =>
      createParticle(Date.now() + i, window.innerWidth / 2, window.innerHeight * 0.45)
    )
    setParticles(newParticles)
    const t = setTimeout(() => setParticles([]), 2000)
    return () => clearTimeout(t)
  }, [show])

  if (particles.length === 0) return null

  return (
    <div className="confetti-container mini" aria-hidden="true">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180
        const tx = Math.cos(rad) * p.velocity * 0.25 + p.drift * 0.5
        const ty = Math.sin(rad) * p.velocity * 0.2 - p.velocity * 0.35

        return (
          <div
            key={p.id}
            className={`confetti-particle confetti-${p.shape}`}
            style={{
              left: p.originX,
              top: p.originY,
              width: p.size * 0.7,
              height: p.size * 0.7,
              backgroundColor: p.shape !== 'triangle' ? p.color : 'transparent',
              borderBottomColor: p.shape === 'triangle' ? p.color : undefined,
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
              '--spin': `${p.spin}deg`,
              '--duration': `${p.duration * 0.7}s`,
              '--delay': `${p.delay * 0.5}s`,
            }}
          />
        )
      })}
    </div>
  )
}
