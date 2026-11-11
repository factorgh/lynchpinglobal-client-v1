// One-off: clients may share the same full name, so the old unique index on displayName must go.
//   node scripts/drop-displayname-unique-index.mjs
import mongoose from "mongoose";

try {
  process.loadEnvFile(".env");
} catch {}

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
const users = mongoose.connection.db.collection("users");
const indexes = await users.indexes();
const target = indexes.find((i) => i.key?.displayName === 1 && i.unique);
if (target) {
  await users.dropIndex(target.name);
  console.log(`Dropped unique index "${target.name}" on users.displayName`);
} else {
  console.log("No unique displayName index found; nothing to do.");
}
await mongoose.disconnect();
