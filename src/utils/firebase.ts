/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

// Graceful, lazy, non-crashing initialization
const isFirebaseConfigured = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);

let app: any = null;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    // As per skill guidelines: MUST include firebaseConfig.firestoreDatabaseId inside getFirestore
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { app as firebaseApp, db, auth, isFirebaseConfigured };

/**
 * Robust error handling in compliance with the Firebase integration guidelines
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUserId = auth?.currentUser?.uid || null;
  const currentUserEmail = auth?.currentUser?.email || null;
  const currentUserEmailVerified = auth?.currentUser?.emailVerified || null;
  const currentUserIsAnonymous = auth?.currentUser?.isAnonymous || null;

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUserId,
      email: currentUserEmail,
      emailVerified: currentUserEmailVerified,
      isAnonymous: currentUserIsAnonymous,
    },
    operationType,
    path
  };

  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
