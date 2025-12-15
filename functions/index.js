// FILE: functions/index.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

exports.lookupPackage = onCall(
  { region: "europe-west1", cors: true },
  async (request) => {
    try {
      const barcode = String(request?.data?.barcode || "").trim();

      if (!barcode) {
        throw new HttpsError("invalid-argument", "Barcode is verplicht.");
      }
      if (barcode.length > 80) {
        throw new HttpsError("invalid-argument", "Barcode is te lang.");
      }

      const ref = admin.firestore().collection("packages").doc(barcode);
      const snap = await ref.get();

      if (!snap.exists) {
        return { found: false };
      }

      const data = snap.data() || {};

      return {
        found: true,
        package: {
          barcode: data.barcode || barcode,
          customerName: data.customerName || "",
          status: data.status || "stored",
          rackCode: data.rackCode || ""
        }
      };
    } catch (err) {
      logger.error("lookupPackage failed", err);

      if (err instanceof HttpsError) throw err;
      throw new HttpsError("internal", "Onbekende fout in lookupPackage.");
    }
  }
);