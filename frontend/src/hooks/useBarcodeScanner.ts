import { useEffect, useRef } from 'react'

/**
 * Detects barcode scanner input (USB HID / Bluetooth HID / 2.4G).
 *
 * Scanners type characters extremely fast (< 50 ms apart) and finish
 * with an Enter key.  This hook distinguishes scanner input from normal
 * keyboard typing by measuring inter-key timing.
 *
 * Works in two scenarios:
 *   1. No input focused  → chars accumulate in the hook buffer, Enter fires onScan.
 *   2. Text input focused → chars go into the input via normal browser events AND
 *      are also buffered here; on Enter the hook fires onScan so the caller can
 *      do an exact-match lookup and auto-add to cart.
 */

const SCAN_SPEED_MS  = 50   // max ms between chars for scanner detection
const MIN_CODE_LEN   = 3    // ignore codes shorter than this

interface Options {
  onScan:   (code: string) => void
  enabled?: boolean
}

export function useBarcodeScanner({ onScan, enabled = true }: Options): void {
  const bufferRef  = useRef<string>('')
  const lastKeyRef = useRef<number>(0)
  const firstKeyRef= useRef<number>(0)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keep a stable ref so the effect doesn't re-run when onScan identity changes
  const onScanRef  = useRef(onScan)
  useEffect(() => { onScanRef.current = onScan }, [onScan])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const now   = Date.now()
      const delta = now - lastKeyRef.current
      lastKeyRef.current = now

      // Long gap between keys → reset buffer (user was typing, not scanning)
      if (delta > 300 && bufferRef.current.length > 0) {
        bufferRef.current = ''
        firstKeyRef.current = 0
      }

      if (e.key === 'Enter') {
        const code    = bufferRef.current.trim()
        const elapsed = now - firstKeyRef.current
        // Valid scan: enough chars AND whole sequence arrived fast (< 300ms)
        const valid   = code.length >= MIN_CODE_LEN && elapsed < 300 && elapsed >= 0
        bufferRef.current   = ''
        firstKeyRef.current = 0
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }

        if (valid) {
          e.preventDefault()
          e.stopPropagation()
          onScanRef.current(code)
        }
        return
      }

      // Accumulate printable chars — let them go to any focused input naturally
      if (e.key.length === 1) {
        if (delta < SCAN_SPEED_MS) {
          bufferRef.current += e.key
        } else {
          // Slow key → fresh buffer
          bufferRef.current   = e.key
          firstKeyRef.current = now
        }
      }

      // Safety: clear buffer if Enter never arrives within 500 ms
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        bufferRef.current   = ''
        firstKeyRef.current = 0
        timerRef.current    = null
      }, 500)
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enabled])
}
