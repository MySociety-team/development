import { test, mock } from "node:test";
import assert from "node:assert/strict";

import SocietyMember from "../models/SocietyMember.js";
import { requireSocietyMember, requireSocietyRole } from "./societyAuthorization.js";

const societyA = "507f1f77bcf86cd799439011";
const societyB = "507f1f77bcf86cd799439012";
const userA = "507f191e810c19729de860ea";

const createRequest = (societyId = societyA, userId = userA) => ({
  params: { societyId },
  user: { id: userId }
});

const createResponse = () => ({});

const createNext = () => mock.fn();

const waitForNextCall = async (next) => {
  for (let i = 0; i < 50; i += 1) {
    if (next.mock.calls.length > 0) {
      return;
    }

    await new Promise((resolve) => setImmediate(resolve));
  }
};

test("allows an active society member", async () => {
  const membership = {
    societyId: societyA,
    userId: userA,
    role: "RESIDENT",
    status: "ACTIVE"
  };

  const findOneMock = mock.method(SocietyMember, "findOne", async () => membership);

  const req = createRequest();
  const res = createResponse();
  const next = createNext();

  await requireSocietyMember(req, res, next);

  assert.equal(next.mock.calls.length, 1);
  assert.equal(req.societyMember, membership);

  findOneMock.mock.restore();
});

test("rejects a non-member", async () => {
  const findOneMock = mock.method(SocietyMember, "findOne", async () => null);

  const req = createRequest();
  const res = createResponse();
  const next = createNext();

  await requireSocietyMember(req, res, next);

  await waitForNextCall(next);

  assert.equal(next.mock.calls.length, 1);

  const error = next.mock.calls[0].arguments[0];

  assert.equal(error.statusCode, 403);
  assert.equal(error.code, "SOCIETY_MEMBERSHIP_REQUIRED");

  findOneMock.mock.restore();
});

test("rejects invalid society ID", async () => {
  const req = createRequest("invalid-society-id");
  const res = createResponse();
  const next = createNext();

  await requireSocietyMember(req, res, next);

  assert.equal(next.mock.calls.length, 1);

  const error = next.mock.calls[0].arguments[0];

  assert.equal(error.statusCode, 400);
  assert.equal(error.code, "SOCIETY_ID_INVALID");
});

test("prevents cross-society access", async () => {
  const findOneMock = mock.method(SocietyMember, "findOne", async () => null);

  const req = createRequest(societyB, userA);
  const res = createResponse();
  const next = createNext();

  await requireSocietyMember(req, res, next);

  await waitForNextCall(next);

  assert.equal(next.mock.calls.length, 1);

  const error = next.mock.calls[0].arguments[0];

  assert.equal(error.statusCode, 403);
  assert.equal(error.code, "SOCIETY_MEMBERSHIP_REQUIRED");

  findOneMock.mock.restore();
});

test("allows a secretary", async () => {
  const req = createRequest();

  req.societyMember = {
    societyId: societyA,
    userId: userA,
    role: "SECRETARY",
    status: "ACTIVE"
  };

  const res = createResponse();
  const next = createNext();

  const middleware = requireSocietyRole("SECRETARY");

  await middleware(req, res, next);

  assert.equal(next.mock.calls.length, 1);
});

test("rejects a resident from secretary route", async () => {
  const req = createRequest();

  req.societyMember = {
    societyId: societyA,
    userId: userA,
    role: "RESIDENT",
    status: "ACTIVE"
  };

  const res = createResponse();
  const next = createNext();

  const middleware = requireSocietyRole("SECRETARY");

  await middleware(req, res, next);

  assert.equal(next.mock.calls.length, 1);

  const error = next.mock.calls[0].arguments[0];

  assert.equal(error.statusCode, 403);
  assert.equal(error.code, "SOCIETY_ROLE_FORBIDDEN");
});

test("allows any of multiple permitted roles", async () => {
  const req = createRequest();

  req.societyMember = {
    societyId: societyA,
    userId: userA,
    role: "RESIDENT",
    status: "ACTIVE"
  };

  const res = createResponse();
  const next = createNext();

  const middleware = requireSocietyRole("SECRETARY", "RESIDENT");

  await middleware(req, res, next);

  assert.equal(next.mock.calls.length, 1);
});
