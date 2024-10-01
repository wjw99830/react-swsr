import { createContext } from 'react';
import { SwsrChunks } from './chunks';

export const SwsrContext = createContext<SwsrChunks<object> | null>(null);
