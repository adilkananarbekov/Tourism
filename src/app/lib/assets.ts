const assetBaseUrl = (import.meta.env.VITE_ASSET_BASE_URL as string | undefined)?.replace(/\/$/, '') || '';

export const withBasePath = (path: string) => {
  if (!path) {
    return path;
  }

  if (/^(https?:|data:|blob:|mailto:|tel:)/i.test(path)) {
    return path;
  }

  const normalized = path.startsWith('/') ? path.slice(1) : path;

  if (assetBaseUrl && /^(images|videos)\//.test(normalized)) {
    return `${assetBaseUrl}/${normalized}`;
  }

  const base = import.meta.env.BASE_URL || '/';
  return `${base}${normalized}`;
};
