import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import AppShell from "../../../components/common/AppShell.jsx";
import { getApiErrorCode, getApiErrorMessage } from "../../../lib/apiError.js";
import { useAuth } from "../../auth/hooks/useAuth.js";
import {
  createSubscriptionOrder,
  getMySubscription,
  verifySubscriptionPayment
} from "../api/subscription.api.js";
import { loadRazorpayCheckout } from "../utils/loadRazorpay.js";

const formatRupees = (amountPaise) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format((amountPaise ?? 0) / 100);
};

function SubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const refreshStatus = async () => {
    const nextStatus = await getMySubscription();
    setStatus(nextStatus);
    return nextStatus;
  };

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      try {
        const nextStatus = await getMySubscription();

        if (!cancelled) {
          setStatus(nextStatus);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load subscription status."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const startPayment = async () => {
    setProcessing(true);
    setErrorMessage("");

    try {
      const checkoutLoaded = await loadRazorpayCheckout();

      if (!checkoutLoaded) {
        throw new Error("Razorpay Checkout could not be loaded. Check your internet connection.");
      }

      let orderData;

      try {
        orderData = await createSubscriptionOrder();
      } catch (error) {
        if (getApiErrorCode(error) === "ACTIVE_CREATION_SUBSCRIPTION_EXISTS") {
          const nextStatus = await refreshStatus();

          if (nextStatus.canCreateSociety) {
            navigate("/societies/create");
            return;
          }
        }

        throw error;
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "MySociety",
        description: "Society creator access for 30 days",
        order_id: orderData.order.id,
        prefill: {
          name: user?.name ?? "",
          email: user?.email ?? "",
          contact: user?.mobileNumber ?? ""
        },
        handler: async (paymentResponse) => {
          try {
            await verifySubscriptionPayment(paymentResponse);
            await refreshStatus();
            navigate("/societies/create", {
              replace: true
            });
          } catch (error) {
            setErrorMessage(
              getApiErrorMessage(
                error,
                "Payment completed, but subscription verification failed. Do not pay again until you check the status."
              )
            );
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      });

      razorpay.on("payment.failed", (response) => {
        const description = response?.error?.description;
        setErrorMessage(description || "Payment failed. You can try again.");
        setProcessing(false);
      });

      razorpay.open();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, error.message || "Unable to start payment."));
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Creator subscription" backTo="/societies">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading subscription...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Creator subscription"
      description="This project uses one simple Razorpay test payment. Successful payment activates creator access for 30 days."
      backTo="/societies"
    >
      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Society creator
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {formatRupees(status?.plan?.amountPaise)}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{status?.plan?.durationDays ?? 30} days</p>
          </div>

          <span
            className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${
              status?.canCreateSociety
                ? "bg-green-100 text-green-800"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {status?.canCreateSociety ? "Ready to create" : "Payment required"}
          </span>
        </div>

        <div className="mt-6 space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-600">
          <p>One verified payment activates creator access for 30 days.</p>
          <p>
            While the subscription is active, you can create societies during the 30-day access
            period.
          </p>
          <p>There is no automatic recurring billing in this college-project implementation.</p>
        </div>

        {status?.subscription && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              Latest status:{" "}
              <span className="font-semibold text-slate-900">{status.subscription.status}</span>
            </p>
            {status.subscription.expiresAt && (
              <p className="mt-1">
                Ends: {new Date(status.subscription.expiresAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <div className="mt-8">
          {status?.canCreateSociety ? (
            <Link
              to="/societies/create"
              className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Continue to create society
            </Link>
          ) : (
            <button
              type="button"
              onClick={startPayment}
              disabled={processing}
              className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing
                ? "Opening Razorpay..."
                : `Pay ${formatRupees(status?.plan?.amountPaise)}`}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default SubscriptionPage;
