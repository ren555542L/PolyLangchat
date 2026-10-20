import { test } from "node:test";
import assert from "node:assert/strict";
import User from "./User.js";

test("User model has the expected fields", () => {
  const fields = Object.keys(User.schema.paths);

  assert.ok(fields.includes("username"));
  assert.ok(fields.includes("email"));
  assert.ok(fields.includes("passwordHash"));
  assert.ok(fields.includes("preferredLanguage"));
  assert.ok(fields.includes("createdAt"));
  assert.ok(fields.includes("updatedAt"));
});

test("passwordHash is excluded from ordinary queries", () => {
  assert.equal(User.schema.path("passwordHash").options.select, false);
});

test("preferred language defaults to English", () => {
  const user = new User({
    username: "tester",
    email: "tester@example.com",
    passwordHash: "test-hash",
  });

  assert.equal(user.preferredLanguage, "en");
});