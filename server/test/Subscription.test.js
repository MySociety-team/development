import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env")
});
import assert from "node:assert/strict";
import { before, after, beforeEach, describe, it } from "node:test";
import mongoose from "mongoose";
import Subscription, { SUBSCRIPTION_STATUS, PLAN_NAME } from "../src/models/Subscription.js";

describe("Subscription Model", () => {
  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  beforeEach(async () => {
    await Subscription.deleteMany({});
  });

  after(async () => {
    await Subscription.deleteMany({});
    await mongoose.connection.close();
  });

  it("should use basic as the default plan", async () => {
    const subscription = new Subscription({
      societyId: new mongoose.Types.ObjectId(),
      purchasedBy: new mongoose.Types.ObjectId(),
      amountPaise: 59900,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    assert.equal(subscription.plan, PLAN_NAME.BASIC);
  });

  it("should require start and end dates", async () => {
    const subscription = new Subscription({
      societyId: new mongoose.Types.ObjectId(),
      purchasedBy: new mongoose.Types.ObjectId(),
      amountPaise: 59900
    });

    await assert.rejects(subscription.validate());
  });

  it("should reject an end date before the start date", async () => {
    const subscription = new Subscription({
      societyId: new mongoose.Types.ObjectId(),
      purchasedBy: new mongoose.Types.ObjectId(),
      amountPaise: 59900,
      startsAt: new Date("2026-08-10"),
      expiresAt: new Date("2026-08-09")
    });

    await assert.rejects(subscription.validate());
  });

  it("should detect an expired subscription", async () => {
    const subscription = await Subscription.create({
      societyId: new mongoose.Types.ObjectId(),
      purchasedBy: new mongoose.Types.ObjectId(),
      amountPaise: 59900,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      startsAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    });

    const activeSubscriptions = await Subscription.findActive();

    assert.equal(activeSubscriptions.length, 0);
    assert.ok(subscription.expiresAt < new Date());
  });

  it("should find an active subscription with a future end date", async () => {
    await Subscription.create({
      societyId: new mongoose.Types.ObjectId(),
      purchasedBy: new mongoose.Types.ObjectId(),
      amountPaise: 59900,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    const activeSubscriptions = await Subscription.findActive();

    assert.equal(activeSubscriptions.length, 1);
    assert.equal(activeSubscriptions[0].status, SUBSCRIPTION_STATUS.ACTIVE);
  });
});
