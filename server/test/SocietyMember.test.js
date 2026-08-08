import mongoose from "mongoose";
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import "dotenv/config";

import SocietyMember from "../src/models/SocietyMember.js";

const testSocietyId = new mongoose.Types.ObjectId();
const secondSocietyId = new mongoose.Types.ObjectId();

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  // Make sure indexes are created before testing duplicate protection
  await SocietyMember.init();
});

after(async () => {
  await SocietyMember.deleteMany({
    societyId: {
      $in: [testSocietyId, secondSocietyId]
    }
  });

  await mongoose.disconnect();
});

test("rejects an invalid society role", async () => {
  const member = new SocietyMember({
    societyId: testSocietyId,
    userId: new mongoose.Types.ObjectId(),
    flatId: new mongoose.Types.ObjectId(),
    role: "ADMIN",
    mobileNumber: "9876543210"
  });

  await assert.rejects(
    () => member.validate(),
    /Role must be SECRETARY or RESIDENT/
  );
});

test("rejects an invalid member type", async () => {
  const member = new SocietyMember({
    societyId: testSocietyId,
    userId: new mongoose.Types.ObjectId(),
    flatId: new mongoose.Types.ObjectId(),
    memberType: "GUEST",
    mobileNumber: "9876543210"
  });

  await assert.rejects(
    () => member.validate(),
    /Member type must be OWNER, TENANT or FAMILY_MEMBER/
  );
});

test("prevents duplicate user-society membership", async () => {
  const userId = new mongoose.Types.ObjectId();
  const societyId = new mongoose.Types.ObjectId();

  await SocietyMember.create({
    societyId,
    userId,
    flatId: new mongoose.Types.ObjectId(),
    mobileNumber: "9876543210"
  });

  await assert.rejects(
    () =>
      SocietyMember.create({
        societyId,
        userId,
        flatId: new mongoose.Types.ObjectId(),
        mobileNumber: "9876543210"
      }),
    (error) => error.code === 11000
  );
});

test("allows one user to belong to multiple societies", async () => {
  const userId = new mongoose.Types.ObjectId();

  const firstMembership = await SocietyMember.create({
    societyId: testSocietyId,
    userId,
    flatId: new mongoose.Types.ObjectId(),
    mobileNumber: "9876543210"
  });

  const secondMembership = await SocietyMember.create({
    societyId: secondSocietyId,
    userId,
    flatId: new mongoose.Types.ObjectId(),
    mobileNumber: "9876543210"
  });

  assert.equal(firstMembership.userId.toString(), userId.toString());
  assert.equal(secondMembership.userId.toString(), userId.toString());
  assert.notEqual(
    firstMembership.societyId.toString(),
    secondMembership.societyId.toString()
  );
});

test("allows multiple members in the same flat", async () => {
  const societyId = new mongoose.Types.ObjectId();
  const flatId = new mongoose.Types.ObjectId();

  const firstMember = await SocietyMember.create({
    societyId,
    userId: new mongoose.Types.ObjectId(),
    flatId,
    mobileNumber: "9876543210"
  });

  const secondMember = await SocietyMember.create({
    societyId,
    userId: new mongoose.Types.ObjectId(),
    flatId,
    mobileNumber: "9876543211"
  });

  assert.equal(firstMember.flatId.toString(), flatId.toString());
  assert.equal(secondMember.flatId.toString(), flatId.toString());
});