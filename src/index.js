import { useState, useEffect, useMemo } from "react";

const DEFAULT_OPTIONS = {
  getNow: false,
  fallback: null,
  onLoad: () => {},
  timeoutFallbackMs: 5000,
};

const idleish = (fn, { timeoutFallbackMs }) => {
  if ("requestIdleCallback" in window) {
    const handle = requestIdleCallback(fn);
    return () => cancelIdleCallback(handle);
  } else {
    const handle = setTimeout(fn, timeoutFallbackMs);
    return () => clearTimeout(handle);
  }
};

const makeIdleGetter = (workFn, options) => {
  const UNLOADED = {};
  let result = UNLOADED;

  const clear = idleish(() => {
    result = workFn();
  }, options);

  return () => {
    if (result === UNLOADED) {
      result = workFn();
      clear();
    }

    return result;
  };
};

const useIdleUntilUrgent = (func, CUSTOM_OPTIONS = {}) => {
  const options = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...CUSTOM_OPTIONS }),
    [CUSTOM_OPTIONS],
  );

  const { getNow, fallback } = options;

  const [{ idleGetter }, setIdleGetter] = useState({
    idleGetter: () => ({})
  });
  const [result, setResult] = useState();

  const workFn = async () => {
    const result = await func();
    setResult({ payload: result });
  };

  useEffect(() => {
    setIdleGetter({ idleGetter: makeIdleGetter(workFn, options) });
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
