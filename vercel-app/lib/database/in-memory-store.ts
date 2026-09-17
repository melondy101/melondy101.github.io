export type MockUser = {
  id: string;
  email: string;
  emailLower: string;
  name: string;
  passwordHash: string;
};

export type MockProfile = {
  authUserId: string;
  lastName: string;
  nickname: string;
  handle: string;
  handleUpdatedAt?: Date;
};

export type MockVerification = {
  id: string;
  emailLower: string;
  purpose: string;
  code: string;
  attempts: number;
  expiresAt: number;
};

export const memoryStore = {
  users: new Map<string, MockUser>(),
  usersByEmail: new Map<string, string>(),
  profiles: new Map<string, MockProfile>(),
  favorites: new Map<string, Set<string>>(),
  verifications: new Map<string, MockVerification>(),
  attempts: [] as Array<{ ip: string; emailLower?: string; kind: string; at: number }>,
};
