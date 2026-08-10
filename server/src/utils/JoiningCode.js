import Society from "../models/Society.js";

const CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_ATTEMPTS = 10;

class JoiningCodeGenerationError extends Error {
  constructor() {
    super("Failed to generate a unique joining Code");
    this.name = "JoiningCodeGenerationError";
  }
}

function generateRandomCode() {
  let code = "";

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    code += CHARACTERS[randomIndex];
  }
  return code;
}

async function isCodeUnique(code) {
  const existingSociety = await Society.exists({
    joiningCode: code
  });

  return !existingSociety;
}

async function generateJoiningCode() {
  for (let attemps = 0; attemps < MAX_ATTEMPTS; attemps++) {
    const code = generateRandomCode();
    const unique = await isCodeUnique(code);

    if (unique) {
      return code;
    }
  }

  throw new JoiningCodeGenerationError();
}

export default generateJoiningCode;
