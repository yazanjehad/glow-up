import { useEffect, useState } from "react";
import { LookupsService } from '@/integration/services/provider/lookupsService';
import type { LookupItemDto } from '@/integration/services/provider/lookups.types';

export function useLookups() {
  const [categories, setCategories] = useState<LookupItemDto[]>([]);
  const [services, setServices] = useState<LookupItemDto[]>([]);
  const [providerTypes, setProviderTypes] = useState<LookupItemDto[]>([]);
  useEffect(() => {
    async function fetchLookups() {
      const cats = await LookupsService.getByKey("SERVICE_CATEGORY");
      const servs = await LookupsService.getByKey("SERVICE_TYPE");
      const providers = await LookupsService.getByKey("PROVIDER_TYPE");
      setCategories(cats);
      setServices(servs);
      setProviderTypes(providers);
    }
    fetchLookups();
  }, []);
  return { categories, services, providerTypes };
}