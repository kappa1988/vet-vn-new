import {onUserCreated} from "firebase-functions/v2/auth";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();

export const onusercreate = onUserCreated(
  {region: "asia-northeast1"},
  async (event) => {
    const user = event.data;
    const {uid, email} = user;

    logger.info(`New user created: ${uid} (${email})`);

    const newUser = {
      uid: uid,
      email: email,
      createdAt: new Date().toISOString(),
      role: "free_user",
    };

    try {
      await getFirestore().collection("users").doc(uid).set(newUser);
      logger.info(`User ${uid} successfully saved to Firestore.`);
    } catch (error) {
      logger.error(`Error saving user ${uid} to Firestore:`, error);
    }
  },
);
