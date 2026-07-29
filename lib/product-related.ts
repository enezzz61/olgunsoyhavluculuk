export function isMockProductId(id: string) {
  return id.startsWith("mock-");
}

export function isDatabaseObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

export function shouldQueryProductCatalog(productId: string) {
  return !isMockProductId(productId) && isDatabaseObjectId(productId);
}
