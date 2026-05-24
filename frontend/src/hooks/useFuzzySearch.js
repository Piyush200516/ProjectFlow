import { useMemo } from 'react';
import Fuse from 'fuse.js';

export const useFuzzySearch = (items, searchTerm, keys, options = {}) => {
  return useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    const query = (searchTerm || '').trim();
    if (!query) return list;

    const fuse = new Fuse(list, {
      keys,
      threshold: 0.35,
      ignoreLocation: true,
      ...options,
    });

    return fuse.search(query).map((result) => result.item);
  }, [items, searchTerm, keys, options]);
};
