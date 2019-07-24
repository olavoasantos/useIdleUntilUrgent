import { useState, useEffect, useMemo } from "react";

const DEFAULT_OPTIONS = {
  getNow: false,
  fallback: null,
  onLoad: () => {},
  timeoutFallbackMs: 5000,
};

const idleish = (callback, timeoutFallbackMs) => {
  if ("requestIdleCallback" in window) {
    const handle = requestIdleCallback(callback);
    return () => cancelIdleCallback(handle);
  } else {
    const handle = setTimeout(callback, timeoutFallbackMs);
    return () => clearTimeout(handle);
  }
};

const makeIdleGetter = (workFn, timeoutFallbackMs) => {
  const UNLOADED = {};
  let result = UNLOADED;

  const clear = idleish(() => {
    result = workFn();
  }, timeoutFallbackMs);

  return () => {
    if (result === UNLOADED) {
      result = workFn();
      clear();
    }

    return result;
  };
};

const useIdleUntilUrgent = (loadContent, CUSTOM_OPTIONS = {}) => {
  const { getNow, fallback, timeoutFallbackMs } = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...CUSTOM_OPTIONS }),
    [CUSTOM_OPTIONS],
  );

  const [{ idleGetter }, setIdleGetter] = useState({
    idleGetter: () => ({})
  });
  const [result, setResult] = useState();

  const workFn = async () => {
    const payload = await loadContent();
    setResult({ payload });
  };

  useEffect(() => {
    setIdleGetter({ idleGetter: makeIdleGetter(workFn, timeoutFallbackMs) });
  }, []);

  if (getNow && !result) {
    idleGetter();
  }

  if (!!result) {
    return result.payload;
  } else {
    return fallback;
  }
};

export default useIdleUntilUrgent;
