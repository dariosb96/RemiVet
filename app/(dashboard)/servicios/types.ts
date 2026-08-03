export interface CreateServiceInput {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  color?: string;
}

export interface UpdateServiceInput extends CreateServiceInput {
  id: string;
}