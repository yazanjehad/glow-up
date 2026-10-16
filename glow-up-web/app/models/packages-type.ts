export interface ProviderPackageUiItem {
  id: string;
  name: string;
  description?: string;
  servicesIds: string[];
  price: number;
  categoires: string;
  isActive?: boolean;
}
