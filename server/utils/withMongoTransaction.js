import mongoose from "mongoose";

const isTransactionUnsupported = (err) => {
  const msg = String(err?.message || err || "");
  return (
    err?.code === 20 ||
    /transaction numbers are only allowed/i.test(msg) ||
    /replica set/i.test(msg) ||
    /Transactions are not supported/i.test(msg)
  );
};

/**
 * Run `work(session)` inside a Mongo multi-doc transaction when available.
 * Falls back to `fallback()` on standalone Mongo (no replica set).
 */
export const withMongoTransaction = async (work, fallback) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    if (typeof fallback === "function" && isTransactionUnsupported(err)) {
      console.warn(
        "[withMongoTransaction] Transactions unavailable; using snapshot fallback.",
        err?.message || err,
      );
      return fallback();
    }
    throw err;
  } finally {
    session.endSession();
  }
};
