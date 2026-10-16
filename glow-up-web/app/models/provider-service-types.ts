export type ProviderService = {
  id: string;

  categoryId: string;
  categoryLabel?: string;

  typeId: string;
  typeLabel?: string;

  name: string;
  durationMinutes: number;
  price: number;

  isActive: boolean;
};
export type ProviderServiceMode = "create" | "edit";
