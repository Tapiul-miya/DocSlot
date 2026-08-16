import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Using experimentalForceLongPolling eliminates streaming probe errors in iframe & proxy environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const bookingsCollection = collection(db, 'bookings');
export const settingsCollection = collection(db, 'settings');
