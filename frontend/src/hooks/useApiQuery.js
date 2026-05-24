import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export const useApiQuery = (queryKey, url, options = {}) => {
  const { params, select, enabled = true, refetchInterval, staleTime } = options;

  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get(url, { params });
      return data;
    },
    select,
    enabled,
    refetchInterval,
    staleTime,
  });
};
