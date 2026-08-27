import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Keep logs focused on critical errors
setLogLevel('error');

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const bookingsCollection = collection(db, 'bookings');
export const settingsCollection = collection(db, 'settings');

