import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '../lib/api'

// Runs `fn` (returns a promise) on mount and whenever `deps` change. Ignores out-of-date responses.
export default function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const latest = useRef(0)

  const run = useCallback(() => {
    const id = ++latest.current
    setState((s) => ({ ...s, loading: true, error: '' }))
    return fn()
      .then((data) => id === latest.current && setState({ data, loading: false, error: '' }))
      .catch((err) => id === latest.current && setState({ data: null, loading: false, error: errorMessage(err) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
  }, [run])

  return { ...state, reload: run }
}
