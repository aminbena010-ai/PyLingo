import { useEffect, useState } from 'react';

export const useIsMobile = (breakpoint = 900) => {
  const getMatches = () =>
    typeof window !== 'undefined' && window.matchMedia(`(max-width: ${breakpoint}px)`).matches;

  const [isMobile, setIsMobile] = useState(getMatches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = () => setIsMobile(mediaQuery.matches);
    handler();
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
};

