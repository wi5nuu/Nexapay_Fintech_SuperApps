import { BaseRepository } from './base.repository';
import type { Result } from '../../../../shared/utils/result';
import apiClient from '../services/api';

export interface LoginResponse {
  user: { id: string; name: string };
  tokens: { accessToken: string };
}

/**
 * Repository for Authentication related data operations
 */
export class AuthRepository extends BaseRepository {
  constructor() {
    super(apiClient);
  }

  async login(credentials: any): Promise<Result<LoginResponse, Error>> {
    return this.handleRequest(this.api.post('/auth/login', credentials));
  }
}

export const authRepository = new AuthRepository();
