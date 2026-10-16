
export type AdminApiDto = {
  _id: string;
  name: string;
  phone: string;
  role: "ADMIN" | "SUPER_ADMIN";
  permissions: string[];
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;  
  updatedAt: string;
  __v: number;
};

export type AdminUi = {
  id: string;
  name: string;
  phone: string;
  role: string;
  permissions: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export const mapApiAdminToUi = (api: AdminApiDto): AdminUi => ({
  id: api._id,
  name: api.name,
  phone: api.phone,
  role: api.role,
  permissions: api.permissions,
  status: api.status,
  createdAt: new Date(api.createdAt),
  updatedAt: new Date(api.updatedAt),
});