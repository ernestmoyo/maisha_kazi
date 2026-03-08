import { useQuery } from '@tanstack/react-query';
import type { Client, ClientParams, CSRReport } from '@/api/clients';
import * as clientsApi from '@/api/clients';

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (params?: ClientParams) => [...clientKeys.lists(), params] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
  csrReport: (id: string) => [...clientKeys.all, 'csr-report', id] as const,
};

interface ClientsData {
  clients: Client[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  total: number;
}

export function useClients(params?: ClientParams) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: async (): Promise<ClientsData> => {
      const res = await clientsApi.getClients(params);
      const d = (res.data as unknown as { data: { clients: Client[]; pagination: ClientsData['pagination'] } }).data;
      return { clients: d.clients ?? [], pagination: d.pagination, total: d.pagination?.total ?? 0 };
    },
  });
}

export function useClientById(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: async (): Promise<Client> => {
      const res = await clientsApi.getClientById(id);
      return (res.data as unknown as { data: Client }).data;
    },
    enabled: !!id,
  });
}

export function useCSRReport(clientId: string) {
  return useQuery({
    queryKey: clientKeys.csrReport(clientId),
    queryFn: async (): Promise<CSRReport> => {
      const res = await clientsApi.getCSRReport(clientId);
      return (res.data as unknown as { data: CSRReport }).data;
    },
    enabled: !!clientId,
  });
}
