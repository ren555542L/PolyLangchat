
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import bcrypt from "bcrypt";
import authRoutes from "./auth.js";
import User from "../models/User.js";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  return app;
}

test("registration rejects invalid email", async () => {
  const app = createTestApp();

  const response = await request(app)
    .post("/api/auth/register")
    .send({
      username: "tester",
      email: "not-an-email",
      password: "ExamplePass123!",
    });

  assert.equal(response.status, 400);
});

test("registration rejects short passwords", async () => {
  const app = createTestApp();

  const response = await request(app)
    .post("/api/auth/register")
    .send({
      username: "tester",
      email: "tester@example.com",
      password: "short",
    });

  assert.equal(response.status, 400);
});

test("registration rejects unsupported languages", async () => {
  const app = createTestApp();

  const response = await request(app)
    .post("/api/auth/register")
    .send({
      username: "tester",
      email: "tester@example.com",
      password: "ExamplePass123!",
      preferredLanguage: "xx",
    });

  assert.equal(response.status, 400);
});

test("registration returns a safe response on success", async (t) => {
  const app = createTestApp();

  const findOneMock = mock.method(User, "findOne", async () => null);
  const createMock = mock.method(User, "create", async (data) => ({
    _id: "test-user-id",
    username: data.username,
    email: data.email,
    preferredLanguage: data.preferredLanguage,
  }));

  t.after(() => {
    findOneMock.mock.restore();
    createMock.mock.restore();
  });

  const response = await request(app)
    .post("/api/auth/register")
    .send({
      username: "tester",
      email: "tester@example.com",
      password: "ExamplePass123!",
      preferredLanguage: "hi",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.user.email, "tester@example.com");
  assert.equal(response.body.user.preferredLanguage, "hi");
  assert.equal("password" in response.body.user, false);
  assert.equal("passwordHash" in response.body.user, false);

  const savedData = createMock.mock.calls[0].arguments[0];
  assert.notEqual(savedData.passwordHash, "ExamplePass123!");
  assert.equal(
    await bcrypt.compare("ExamplePass123!", savedData.passwordHash),
    true
  );
});
