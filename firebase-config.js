/**
 * ╔══════════════════════════════════════════════════════╗
 * ║   Narayan e-Gurukul — Firebase Configuration        ║
 * ║   Project ID: project-547160493459                  ║
 * ║                                                      ║
 * ║   HOW TO FILL THIS IN:                              ║
 * ║   1. Open https://console.firebase.google.com       ║
 * ║   2. Select project: project-547160493459           ║
 * ║   3. Click ⚙️ gear → Project settings              ║
 * ║   4. Scroll to "Your apps" → click your web app    ║
 * ║   5. Copy the firebaseConfig values below           ║
 * ╚══════════════════════════════════════════════════════╝
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

export const firebaseConfig = {
    apiKey:            "AIzaSyDFu9opexanRdTiKylnV7Rcfxzihp6PPMs",
    authDomain:        "narayanegurukul-ed065.firebaseapp.com",
    projectId:         "narayanegurukul-ed065",
    storageBucket:     "narayanegurukul-ed065.firebasestorage.app",
    messagingSenderId: "434966774308",
    appId:             "1:434966774308:web:0290c93151336b19cdceb1",
    measurementId:     "G-4Y8TN0X9ZY"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
