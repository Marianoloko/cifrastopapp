import { createServerFn } from "@tanstack/react-start";

export const adminIsAdmin = createServerFn({ method: "GET" }).handler(async () => true);
export const adminTrafficStats = createServerFn({ method: "GET" }).handler(async () => ({ total: 0 }));
export const adminDeletePlan = createServerFn({ method: "POST" }).handler(async () => ({ success: true }));
export const adminGrantAccess = createServerFn({ method: "POST" }).handler(async () => ({ success: true }));
export const adminListPlans = createServerFn({ method: "GET" }).handler(async () => []);
export const adminSavePlan = createServerFn({ method: "POST" }).handler(async () => ({ success: true }));
export const adminDeleteUser = createServerFn({ method: "POST" }).handler(async () => ({ success: true }));
export const adminForceLogout = createServerFn({ method: "POST" }).handler(async () => ({ success: true }));
export const adminListUserFolders = createServerFn({ method: "GET" }).handler(async () => []);
export const adminSetLifetimeVip = createServerFn({ method: "POST" }).handler(async () => ({ success: true }));
export const adminSetNotes = createServerFn({ method: "POST" }).handler(async () => ({ success: true }));
export const adminListUserSongs = createServerFn({ method: "GET" }).handler(async () => []);
export const adminListUsers = createServerFn({ method: "GET" }).handler(async () => []);
export const adminResetPassword = createServerFn({ method: "POST" }).handler(async () => ({ success: true }));
export const adminSetAccess = createServerFn({ method: "POST" }).handler(async () => ({ success: true }));
export const adminSetBan = createServerFn({ method: "POST" }).handler(async () => ({ success: true }));

// Funções do AdminSystem.tsx que faltavam:
export const adminExpiredRecent = createServerFn({ method: "GET" }).handler(async () => []);
export const adminPurgeTrash = createServerFn({ method: "POST" }).handler(async () => ({ success: true }));
export const adminSearchMisses = createServerFn({ method: "GET" }).handler(async () => []);
export const adminTopSavedSongs = createServerFn({ method: "GET" }).handler(async () => []);
