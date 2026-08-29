import { createServerFn } from "@tanstack/react-start";

export const adminIsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  return true;
});

export const adminTrafficStats = createServerFn({ method: "GET" }).handler(async () => {
  return { total: 0 };
});

export const adminDeletePlan = createServerFn({ method: "POST" }).handler(async () => {
  return { success: true };
});

export const adminGrantAccess = createServerFn({ method: "POST" }).handler(async () => {
  return { success: true };
});

export const adminListPlans = createServerFn({ method: "GET" }).handler(async () => {
  return [];
});

export const adminSavePlan = createServerFn({ method: "POST" }).handler(async () => {
  return { success: true };
});
