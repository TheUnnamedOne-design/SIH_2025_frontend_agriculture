import type { QueryRequest, QueryResponse } from './types';

const API_BASE_URL = 'http://127.0.0.1:5000';

export const apiService = {
  async processQuery(data: QueryRequest): Promise<QueryResponse> {
    const response = await fetch(`${API_BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process query');
    }

    return response.json();
  }
};
