
import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "./app.js";

test("GET /health returns HTTP 200", async () => {
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.service, "polyglot-backend");
});
