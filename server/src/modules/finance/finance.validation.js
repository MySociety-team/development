const allowedTypes = ["INCOME", "EXPENSE"];

const allowedPaymentMethods = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"];

export const validateFinanceCreate = (data) => {
  const errors = {};

  if (!data.title || !data.title.trim()) {
    errors.title = "Title is required";
  }

  if (data.amount === undefined || data.amount === null || Number(data.amount) <= 0) {
    errors.amount = "Amount must be greater than 0";
  }

  if (!allowedTypes.includes(data.type)) {
    errors.type = "Type must be INCOME or EXPENSE";
  }

  if (!data.category || !data.category.trim()) {
    errors.category = "Category is required";
  }

  if (!data.date || Number.isNaN(new Date(data.date).getTime())) {
    errors.date = "Valid date is required";
  }

  if (!allowedPaymentMethods.includes(data.paymentMethod)) {
    errors.paymentMethod = "Payment Method must be CASH, UPI, BANK_TRANSFER, CARD or OTHER";
  }

  return errors;
};

export const validateFinanceUpdate = (data) => {
  const errors = {};

  if (data.title !== undefined && !data.title.trim()) {
    errors.title = "Title cannot be empty";
  }

  if (data.amount !== undefined && (data.amount === null || Number(data.amount) <= 0)) {
    errors.amount = "Amount must be greater than 0";
  }

  if (data.type !== undefined && !allowedTypes.includes(data.type)) {
    errors.type = "Type must be INCOME or EXPENSE";
  }

  if (data.category !== undefined && !data.category.trim()) {
    errors.category = "Category cannot be empty";
  }

  if (data.date !== undefined && Number.isNaN(new Date(data.date).getTime())) {
    errors.date = "Valid date is required";
  }

  if (data.paymentMethod !== undefined && !allowedPaymentMethods.includes(data.paymentMethod)) {
    errors.paymentMethod = "Payment Method must be CASH, UPI, BANK_TRANSFER, CARD or OTHER";
  }

  return errors;
};
