// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getFunctions, connectFunctionsEmulator } from "firebase/functions"
import { getPerformance } from "firebase/performance";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
}

const app = initializeApp(firebaseConfig)

export const analytics = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID ? getAnalytics(app) : {}

export const functions = getFunctions(app)
if (process.env.REACT_APP_USE_FIREBASE_EMULATORS) {
  connectFunctionsEmulator(functions, "localhost", 5001)
}

export const db = getFirestore(app)
if (process.env.REACT_APP_USE_FIREBASE_EMULATORS) {
  connectFirestoreEmulator(db, 'localhost', 8080)
}
// if (process.env.NODE_ENV === 'production') {
//   // Pass your reCAPTCHA v3 site key (public key) to activate(). Make sure this
//   // key is the counterpart to the secret key you set in the Firebase console.
//   initializeAppCheck(app, {
//     provider: new ReCaptchaV3Provider('6LdMi5ohAAAAAE9mn1-YMjhEIdyBYwi7nmwDRev2'),

//     // Optional argument. If true, the SDK automatically refreshes App Check
//     // tokens as needed.
//     isTokenAutoRefreshEnabled: true
//   })
// }

// Initialize Performance Monitoring and get a reference to the service
export const perf = process.env.NODE_ENV === 'production' ? getPerformance(app) : null