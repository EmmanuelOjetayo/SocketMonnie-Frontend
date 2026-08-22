// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// 1. Initialize Firebase in the Service Worker
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyANqKW-SJ7dw3ZjWaO_dNsYENix83YNPSc",
  authDomain: "shoporia-8607c.firebaseapp.com",
  projectId: "shoporia-8607c",
  storageBucket: "shoporia-8607c.firebasestorage.app",
  messagingSenderId: "217400099175",
  appId: "1:217400099175:web:6e41e00c4977d150d26fc2",
  measurementId: "G-LBBM8MZMVJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


const messaging = firebase.messaging();

// 2. Handle Background Messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'UBC CAMP ALERT';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png', // Path to your logo in the public folder
    badge: '/logo.png',
    data: {
        url: payload.data?.url || '/' 
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 3. Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});