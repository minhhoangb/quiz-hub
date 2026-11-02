import { useCallback, useRef, useState } from 'react';
import { STORAGE_KEY, readAll, writeAll } from '../lib/storage.js';

export default function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    if (key === STORAGE_KEY) return readAll();
    try { return JSON.parse(window.localStorage.getItem(key)) ?? initialValue; }
    catch { return initialValue; }
  });
  const current = useRef(value);
  const [storageError, setStorageError] = useState(false);
  const update = useCallback(nextValue => {
    const next = typeof nextValue === 'function' ? nextValue(current.current) : nextValue;
    // Lưu đồng bộ trước khi render: đóng tab ngay sau thao tác vẫn giữ tiến độ.
    if (typeof window !== 'undefined') {
      let saved = false;
      if (key === STORAGE_KEY) saved = writeAll(next);
      else { try { window.localStorage.setItem(key, JSON.stringify(next)); saved = true; } catch { /* Báo lỗi qua UI. */ } }
      setStorageError(!saved);
    }
    current.current = next;
    setValue(next);
    return next;
  }, [key]);
  return [value, update, storageError];
}
