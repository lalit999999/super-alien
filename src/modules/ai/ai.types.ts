export type ClassifyEmailInput = {
  subject: string;
  sender: string;
  snippet?: string | null;
  body?: string | null;
};

export type GenerateDraftInput = {
  prompt: string;
  context?: string;
};
