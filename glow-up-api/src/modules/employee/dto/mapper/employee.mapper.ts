export function mapEmployeeToResponse(employee: any) {
   return {
    id: employee._id.toString(),
    name: employee.name,

    position: mapLookup(employee.position),

    // permissions: employee.permissions,
    workingHours: employee.workingHours,
    services: employee.services || [],
  };
}

export function mapLookup(lookup: any) {
  if (!lookup || !lookup._id) return null;

  return {
    id: lookup._id.toString(),
    code: lookup.code,
    name: lookup.name,
  };
}

