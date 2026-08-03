export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  message?: string;
}