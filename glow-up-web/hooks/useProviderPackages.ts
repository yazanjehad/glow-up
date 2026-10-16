import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProviderPackagesService } from "@/integration/services/provider-packages/provider-packages.service";
import type { CreateProviderPackageDto } from "@/integration/services/provider-packages/provider-packages.types";


export const useProviderPackages = (
  providerId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["provider-packages", providerId],
    queryFn: () => ProviderPackagesService.getByProviderId(providerId),
    enabled: !!providerId && enabled,
    staleTime: 5 * 60 * 1000, 
  });
};

export const useProviderPackagesUi = (
  providerId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["provider-packages-ui", providerId],
    queryFn: () => ProviderPackagesService.getByProviderIdAsUi(providerId),
    enabled: !!providerId && enabled,
    staleTime: 5 * 60 * 1000, 
  });
};


export const useAddProviderPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      token,
      providerId,
      newPackage,
    }: {
      token: string;
      providerId: string;
      newPackage: CreateProviderPackageDto;
    }) => ProviderPackagesService.addPackage(token, providerId, newPackage),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["provider-packages", variables.providerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["provider-packages-ui", variables.providerId],
      });
    },
  });
};


export const useUpdateProviderPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      token,
      providerId,
      packageId,
      updatedPackage,
    }: {
      token: string;
      providerId: string;
      packageId: string;
      updatedPackage: CreateProviderPackageDto;
    }) =>
      ProviderPackagesService.updatePackage(
        token,
        providerId,
        packageId,
        updatedPackage
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["provider-packages", variables.providerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["provider-packages-ui", variables.providerId],
      });
    },
  });
};


export const useDeleteProviderPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      token,
      providerId,
      packageId,
    }: {
      token: string;
      providerId: string;
      packageId: string;
    }) => ProviderPackagesService.deletePackage(token, providerId, packageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["provider-packages", variables.providerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["provider-packages-ui", variables.providerId],
      });
    },
  });
};
