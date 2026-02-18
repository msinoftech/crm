import { describe, it, expect } from "vitest";
import {
  canAccessApp,
  SUPERADMIN_APP_ROLES,
  WORKSPACE_APP_ROLES,
  getAllowedRolesForApp,
} from "./access";
import type { AppRole } from "./types";

const ROLES: AppRole[] = ["superadmin", "workspace_admin", "customer"];

describe("Final access validation (Module 10)", () => {
  describe("canAccessApp(role, app)", () => {
    it("superadmin can access superadmin app only", () => {
      expect(canAccessApp("superadmin", "superadmin")).toBe(true);
      expect(canAccessApp("superadmin", "workspace")).toBe(false);
    });

    it("workspace_admin cannot access superadmin app; can access workspace app", () => {
      expect(canAccessApp("workspace_admin", "superadmin")).toBe(false);
      expect(canAccessApp("workspace_admin", "workspace")).toBe(true);
    });

    it("customer can access workspace app only", () => {
      expect(canAccessApp("customer", "superadmin")).toBe(false);
      expect(canAccessApp("customer", "workspace")).toBe(true);
    });

    it("all role × app combinations match expected matrix", () => {
      const matrix: Record<AppRole, { superadmin: boolean; workspace: boolean }> = {
        superadmin: { superadmin: true, workspace: false },
        workspace_admin: { superadmin: false, workspace: true },
        customer: { superadmin: false, workspace: true },
      };
      for (const role of ROLES) {
        expect(canAccessApp(role, "superadmin")).toBe(matrix[role].superadmin);
        expect(canAccessApp(role, "workspace")).toBe(matrix[role].workspace);
      }
    });
  });

  describe("allowed roles per app", () => {
    it("superadmin app allows only superadmin", () => {
      expect(SUPERADMIN_APP_ROLES).toEqual(["superadmin"]);
      expect(getAllowedRolesForApp("superadmin")).toEqual(["superadmin"]);
    });

    it("workspace app allows workspace_admin and customer", () => {
      expect(WORKSPACE_APP_ROLES).toEqual(["workspace_admin", "customer"]);
      expect(getAllowedRolesForApp("workspace")).toEqual(["workspace_admin", "customer"]);
    });
  });

  describe("invalid users redirected to login (validation behavior)", () => {
    it("wrong-role user fails canAccessApp for that app", () => {
      expect(canAccessApp("superadmin", "workspace")).toBe(false);
      expect(canAccessApp("workspace_admin", "superadmin")).toBe(false);
      expect(canAccessApp("customer", "superadmin")).toBe(false);
    });

    it("correct-role user passes canAccessApp", () => {
      expect(canAccessApp("superadmin", "superadmin")).toBe(true);
      expect(canAccessApp("workspace_admin", "workspace")).toBe(true);
      expect(canAccessApp("customer", "workspace")).toBe(true);
    });
  });
});
