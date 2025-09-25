export interface QueryRequest {
  query: string;
  choice: number;
  district: string;
  state: string;
  current_crop?: string;
}

export interface QueryResponse {
  answer: string;
  retrieved_chunks: Array<{
    id: string;
    text: string;
    score: number;
  }>;
  context: string;
}
