// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBZm4CnT-kjtS1q0WsZCRA5hefqlifxiu8",
    authDomain: "treehole-player.firebaseapp.com",
    projectId: "treehole-player",
    storageBucket: "treehole-player.firebasestorage.app",
    messagingSenderId: "486060653255",
    appId: "1:486060653255:web:522565e0ddee0549819ce2",
    measurementId: "G-D1VVRJ5P2F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics, logEvent };