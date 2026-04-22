import { supabaseProjectUrl } from './supabase';

const supabaseAssetBucket = import.meta.env.VITE_SUPABASE_ASSET_BUCKET as string | undefined;

export const withBasePath = (path: string) => {
  if (!path) {
    return path;
  }

  if (/^(https?:|data:|blob:|mailto:|tel:)/i.test(path)) {
    return path;
  }

  const normalized = path.startsWith('/') ? path.slice(1) : path;

  if (
    supabaseProjectUrl &&
    supabaseAssetBucket &&
    /^(images|videos)\//.test(normalized)
  ) {
    return `${supabaseProjectUrl.replace(/\/$/, '')}/storage/v1/object/public/${supabaseAssetBucket}/${normalized}`;
  }

  const base = import.meta.env.BASE_URL || '/';
  return `${base}${normalized}`;
};
