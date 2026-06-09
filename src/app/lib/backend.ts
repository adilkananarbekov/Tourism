import { apiEnabled } from './api';

export const guestSubmissionBackendEnabled = true;
export const guestSubmissionBackendName = apiEnabled
  ? 'API'
  : 'local';
