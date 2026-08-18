const parsePositiveInteger = (value, fallback) => {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const SOCIETY_CREATOR_PRICE_PAISE = parsePositiveInteger(
  process.env.SOCIETY_CREATOR_PRICE_PAISE,
  59900
);

export const SOCIETY_CREATOR_DURATION_DAYS = parsePositiveInteger(
  process.env.SOCIETY_SUBSCRIPTION_DAYS,
  30
);

export const SUBSCRIPTION_CURRENCY = "INR";
