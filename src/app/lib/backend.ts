import { firebaseEnabled } from './firebase';
import { supabaseEnabled } from './supabase';

export const guestSubmissionBackendEnabled = supabaseEnabled || firebaseEnabled;
export const guestSubmissionBackendName = supabaseEnabled
  ? 'Supabase'
  : firebaseEnabled
    ? 'Firebase'
    : 'local';
