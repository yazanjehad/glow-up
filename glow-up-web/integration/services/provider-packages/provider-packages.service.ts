import { get, patch } from "../../http/http.client";
import type {
  ProviderPackageDto,
  ProviderWithPackagesDto,
  CreateProviderPackageDto,
  ProviderPackageUiItem,
  mapProviderPackagesToUi,
} from "./provider-packages.types";

export const ProviderPackagesService = {
 
  async getByProviderId(providerId: string): Promise<ProviderPackageDto[]> {
    const res = await get<ProviderWithPackagesDto>(`/providers/${providerId}`);
    return res.data.packages || [];
  },

  async getByProviderIdAsUi(
    providerId: string
  ): Promise<ProviderPackageUiItem[]> {
    const packages = await this.getByProviderId(providerId);
    const { mapProviderPackagesToUi } = await import(
      "./provider-packages.types"
    );
    return mapProviderPackagesToUi(packages);
  },

  async updatePackages(
    token: string,
    providerId: string,
    packages: CreateProviderPackageDto[]
  ): Promise<ProviderWithPackagesDto> {
    const res = await patch<ProviderWithPackagesDto>(
      `/providers/${providerId}`,
      { packages },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  },


  async addPackage(
    token: string,
    providerId: string,
    newPackage: CreateProviderPackageDto
  ): Promise<ProviderWithPackagesDto> {
    const currentPackages = await this.getByProviderId(providerId);

    const updatedPackages = [
      ...currentPackages.map((pkg) => ({
        name: pkg.name,
        desc: pkg.desc,
        price: pkg.price,
        items: pkg.items.map((item) => ({
          serviceItemId: item.serviceItemId,
          quantity: item.quantity,
        })),
      })),
      newPackage,
    ];

    return this.updatePackages(token, providerId, updatedPackages);
  },

  async updatePackage(
    token: string,
    providerId: string,
    packageId: string,
    updatedPackage: CreateProviderPackageDto
  ): Promise<ProviderWithPackagesDto> {
    const currentPackages = await this.getByProviderId(providerId);

    const updatedPackages = currentPackages.map((pkg) => {
      if (pkg._id === packageId) {
        return {
          name: updatedPackage.name,
          desc: updatedPackage.desc,
          price: updatedPackage.price,
          isActive: pkg.isActive,
          items: updatedPackage.items,
        };
      }
      return {
        name: pkg.name,
        desc: pkg.desc,
        price: pkg.price,
        items: pkg.items.map((item) => ({
          serviceItemId: item.serviceItemId,
          quantity: item.quantity,
        })),
      };
    });

    return this.updatePackages(token, providerId, updatedPackages);
  },

  async deletePackage(
    token: string,
    providerId: string,
    packageId: string
  ): Promise<ProviderWithPackagesDto> {
    const currentPackages = await this.getByProviderId(providerId);

    const updatedPackages = currentPackages
      .filter((pkg) => pkg._id !== packageId)
      .map((pkg) => ({
        name: pkg.name,
        desc: pkg.desc,
        price: pkg.price,
        isActive: pkg.isActive,
        items: pkg.items.map((item) => ({
          serviceItemId: item.serviceItemId,
          quantity: item.quantity,
        })),
      }));

    return this.updatePackages(token, providerId, updatedPackages);
  },
};
