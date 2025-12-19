/**
 * @file health.test.ts
 * @description Tests for the health API endpoint.
 */

import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("Health API", () => {
  describe("GET /api/health", () => {
    it("should return ok status", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("ok");
    });

    it("should return service name", async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.service).toBe("pong-server");
    });

    it("should return valid timestamp", async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.timestamp).toBeDefined();
      const timestamp = new Date(data.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });
});
