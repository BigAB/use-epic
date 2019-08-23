import React, { useMemo, createContext } from 'react';
const DEFAULT_CONTEXT = {};

export const EpicDepsContext = createContext(DEFAULT_CONTEXT);

export const EpicDepsProvider = ({ children, ...props }) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => props, Object.values(props));
  return React.createElement(EpicDepsContext.Provider, { value }, children);
};
