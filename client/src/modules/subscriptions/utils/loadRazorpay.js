const RAZORPAY_SCRIPT_ID = "razorpay-checkout-script";
const RAZORPAY_CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export const loadRazorpayCheckout = () => {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  const existingScript = document.getElementById(RAZORPAY_SCRIPT_ID);

  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener("load", () => resolve(Boolean(window.Razorpay)), {
        once: true
      });
      existingScript.addEventListener("error", () => resolve(false), {
        once: true
      });
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");

    script.id = RAZORPAY_SCRIPT_ID;
    script.src = RAZORPAY_CHECKOUT_URL;
    script.async = true;

    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};
