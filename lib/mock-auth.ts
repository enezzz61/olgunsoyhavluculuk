import type { UserRole } from "@prisma/client";

export type MockAuthUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isAdmin: boolean;
};

export type MockSessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
};

const mockUsers: MockAuthUser[] = [
  {
    id: "mock-user-retail",
    name: "Perakende Demo",
    email: "perakende@olgunsoyhavluculuk.com",
    password: "123456",
    role: "perakende",
    isAdmin: false,
  },
  {
    id: "mock-user-wholesale",
    name: "Toptanci Demo",
    email: "toptanci@olgunsoyhavluculuk.com",
    password: "123456",
    role: "toptanci",
    isAdmin: false,
  },
  {
    id: "mock-user-admin",
    name: "Admin Demo",
    email: "admin@olgunsoyhavluculuk.com",
    password: "123456",
    role: "perakende",
    isAdmin: true,
  },
];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toSessionUser(user: MockAuthUser): MockSessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isAdmin: user.isAdmin,
  };
}

function generateMockId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function findMockUserByCredentials(email: string, password: string) {
  const normalized = normalizeEmail(email);
  return mockUsers.find((user) => user.email === normalized && user.password === password) ?? null;
}

export function findMockUserById(id: string) {
  return mockUsers.find((user) => user.id === id) ?? null;
}

export function findMockUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  return mockUsers.find((user) => user.email === normalized) ?? null;
}

export function createMockUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isAdmin?: boolean;
}) {
  const normalized = normalizeEmail(input.email);
  if (findMockUserByEmail(normalized)) {
    return null;
  }

  const record: MockAuthUser = {
    id: generateMockId("mock-user"),
    name: input.name,
    email: normalized,
    password: input.password,
    role: input.role,
    isAdmin: Boolean(input.isAdmin),
  };

  mockUsers.push(record);
  return record;
}

export function updateMockUser(
  id: string,
  patch: Partial<Pick<MockAuthUser, "name" | "password" | "role" | "isAdmin">>,
) {
  const user = findMockUserById(id);
  if (!user) {
    return null;
  }

  if (typeof patch.name === "string" && patch.name.trim()) {
    user.name = patch.name.trim();
  }

  if (typeof patch.password === "string" && patch.password.length >= 6) {
    user.password = patch.password;
  }

  if (patch.role) {
    user.role = patch.role;
  }

  if (typeof patch.isAdmin === "boolean") {
    user.isAdmin = patch.isAdmin;
  }

  return user;
}

export function listMockUsers() {
  return mockUsers.map(toSessionUser);
}
