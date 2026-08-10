import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import Subscription, { SUBSCRIPTION_STATUS, PLAN_NAME } from "../src/models/Subscription.js";

describe("Subscription Model", () => {
  it("should use basic as the default plan", () => {
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

  it("should detect an expired subscription", () => {
    const subscription = new Subscription({
      societyId: new mongoose.Types.ObjectId(),
      purchasedBy: new mongoose.Types.ObjectId(),
      amountPaise: 59900,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      startsAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    });

    assert.ok(subscription.expiresAt < new Date());
  });

  it("should find an active subscription with a future end date", () => {
    const query = Subscription.findActive();
    const filter = query.getFilter();

    assert.equal(filter.status, SUBSCRIPTION_STATUS.ACTIVE);
    assert.ok(filter.expiresAt.$gt instanceof Date);
    assert.ok(filter.expiresAt.$gt <= new Date());
  });
});
