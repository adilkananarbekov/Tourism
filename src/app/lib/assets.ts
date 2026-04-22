export const withBasePath = (path: string) => {
  if (!path) {
    return path;
  }

  if (/^(https?:|data:|blob:|mailto:|tel:)/i.test(path)) {
    return path;
  }

  const base = import.meta.env.BASE_URL || '/';
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`;
};
