'use client'

import { useEffect, useRef } from 'react'

/**
 * CustomCursor, evolved.
 *
 * - Dot + lagging ring, coloured from the active theme (var(--accent)).
 * - Click ripples: a ring bursts outward wherever you press.
 * - Motion trail: tiny fading sparks while the mouse moves (throttled,
 *   capped, and pooled through direct DOM writes so React never re-renders).
 * - Context shapes: the ring grows over clickables, stretches into a
 *   caret bar over text fields, and the dot shrinks while pressing.
 * - Desktop only: on coarse pointers the CSS hides every layer and the
 *   effect never starts.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: -100, y: -100 })
  const ringPos = useRef({ x: -100, y: -100 })
  const raf = useRef<number>(0)
  const lastTrail = useRef(0)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const dot = dotRef.current
    const ring = ringRef.current
    const layer = layerRef.current
    if (!dot || !ring || !layer) return

    const spawnTrail = (x: number, y: number) => {
      const now = performance.now()
      if (now - lastTrail.current < 42) return
      lastTrail.current = now
      if (layer.childElementCount > 28) layer.firstElementChild?.remove()
      const s = document.createElement('span')
      s.className = 'cursor-trail'
      const size = 4 + Math.random() * 5
      s.style.width = size + 'px'
      s.style.height = size + 'px'
      s.style.left = x + 'px'
      s.style.top = y + 'px'
      s.style.setProperty('--tx', (Math.random() * 36 - 18).toFixed(0) + 'px')
      s.style.setProperty('--ty', (Math.random() * 30 - 34).toFixed(0) + 'px')
      layer.appendChild(s)
      setTimeout(() => s.remove(), 650)
    }

    const spawnRipple = (x: number, y: number) => {
      const r = document.createElement('span')
      r.className = 'cursor-ripple'
      r.style.left = x + 'px'
      r.style.top = y + 'px'
      layer.appendChild(r)
      setTimeout(() => r.remove(), 500)
    }

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      dot.style.opacity = '1'
      ring.style.opacity = '1'
      spawnTrail(e.clientX, e.clientY)
    }

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isText =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      const isClickable =
        !isText &&
        (target.tagName === 'A' ||
          target.tagName === 'BUTTON' ||
          !!target.closest('a') ||
          !!target.closest('button') ||
          target.classList.contains('magnetic-btn') ||
          !!target.closest('[data-cursor="hover"]'))
      ring.classList.toggle('hovering', isClickable)
      ring.classList.toggle('typing', isText)
    }

    const onDown = (e: MouseEvent) => {
      dot.classList.add('pressed')
      ring.classList.add('pressed')
      spawnRipple(e.clientX, e.clientY)
    }
    const onUp = () => {
      dot.classList.remove('pressed')
      ring.classList.remove('pressed')
    }
    const onLeave = () => {
      dot.style.opacity = '0'
      ring.style.opacity = '0'
    }

    const animate = () => {
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.14
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.14
      dot.style.left = pos.current.x + 'px'
      dot.style.top = pos.current.y + 'px'
      ring.style.left = ringPos.current.x + 'px'
      ring.style.top = ringPos.current.y + 'px'
      raf.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.documentElement.addEventListener('mouseleave', onLeave)
    raf.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <>
      <div ref={layerRef} className="cursor-layer" aria-hidden />
      <div ref={dotRef} className="cursor-dot" aria-hidden />
      <div ref={ringRef} className="cursor-ring" aria-hidden />
    </>
  )
}
