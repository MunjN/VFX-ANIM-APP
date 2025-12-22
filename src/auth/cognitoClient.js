// src/auth/cognitoClient.js
// Cognito helper using amazon-cognito-identity-js
// IMPORTANT: Uses sessionStorage so login persists across refresh,
// but is cleared when the tab/window is closed.

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";

function makeSessionStorage() {
  // amazon-cognito-identity-js expects a Storage-like interface.
  // sessionStorage already implements this, but we wrap to be explicit.
  return {
    setItem: (key, value) => window.sessionStorage.setItem(key, value),
    getItem: (key) => window.sessionStorage.getItem(key),
    removeItem: (key) => window.sessionStorage.removeItem(key),
    clear: () => window.sessionStorage.clear(),
  };
}

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  Storage: makeSessionStorage(),
};

if (!poolData.UserPoolId || !poolData.ClientId) {
  console.warn("[Auth] Cognito env vars are missing");
}

export const userPool = new CognitoUserPool(poolData);

function makeUser(username) {
  return new CognitoUser({ Username: username, Pool: userPool, Storage: poolData.Storage });
}

export function signIn(username, password) {
  const user = makeUser(username);
  const authDetails = new AuthenticationDetails({
    Username: username,
    Password: password,
  });

  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve({ user, session }),
      onFailure: (err) => reject(err),
      newPasswordRequired: (data) => resolve({ user, challenge: "NEW_PASSWORD_REQUIRED", data }),
    });
  });
}

export function signUp(username, password, attributes = []) {
  return new Promise((resolve, reject) => {
    userPool.signUp(username, password, attributes, null, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export function confirmSignUp(username, code) {
  const user = makeUser(username);
  return new Promise((resolve, reject) => {
    user.confirmRegistration(code, true, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

export function forgotPassword(username) {
  const user = makeUser(username);
  return new Promise((resolve, reject) => {
    user.forgotPassword({
      onSuccess: (data) => resolve(data),
      onFailure: (err) => reject(err),
      inputVerificationCode: (data) => resolve({ challenge: "INPUT_VERIFICATION_CODE", data }),
    });
  });
}

export function confirmForgotPassword(username, code, newPassword) {
  const user = makeUser(username);
  return new Promise((resolve, reject) => {
    user.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(true),
      onFailure: (err) => reject(err),
    });
  });
}

export function signOut() {
  const user = userPool.getCurrentUser();
  if (user) user.signOut();
}

export function getCurrentSession() {
  const user = userPool.getCurrentUser();
  if (!user) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    user.getSession((err, session) => {
      if (err) reject(err);
      else resolve(session);
    });
  });
}
