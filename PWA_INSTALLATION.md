# Progressive Web App (PWA) Installation Guide

## What is a PWA?

A Progressive Web App (PWA) is a web application that can be installed on mobile devices and desktops like a native app. It provides:

- **App-like experience**: Runs in its own window without browser UI
- **Offline functionality**: Works even without internet connection
- **Push notifications**: Can send notifications to users
- **Home screen icon**: Appears on device home screen
- **Fast loading**: Cached resources for quick access

## How to Install

### On Mobile Devices (Android/iOS):

1. **Open the website** in your mobile browser
2. **Look for install prompt** - You'll see an "Install App" button
3. **Tap "Install"** when prompted
4. **Confirm installation** in the popup dialog
5. **App icon appears** on your home screen

### On Desktop (Chrome/Edge):

1. **Open the website** in Chrome or Edge browser
2. **Look for install icon** in the address bar (usually a "+" or download icon)
3. **Click the install icon** or use the install button
4. **Confirm installation** in the popup dialog
5. **App opens** in its own window

### Manual Installation:

If you don't see the install prompt:

1. **Chrome/Edge**: Go to Menu (⋮) → "Install [App Name]"
2. **Safari**: Go to Share button → "Add to Home Screen"
3. **Firefox**: Go to Menu (⋮) → "Install"

## Features

### Offline Support
- App works without internet connection
- Cached data for viewing attendance records
- Offline form submissions sync when back online

### Push Notifications
- Receive notifications for important updates
- Attendance reminders and alerts
- System announcements

### App Shortcuts
- Quick access to attendance view
- Direct login shortcut
- Fast navigation to common features

## Troubleshooting

### Install Button Not Appearing
- Make sure you're using a supported browser (Chrome, Edge, Safari, Firefox)
- Check if the site is served over HTTPS
- Try refreshing the page

### App Not Working Offline
- Clear browser cache and reinstall
- Check if service worker is registered (F12 → Application → Service Workers)

### Notifications Not Working
- Check browser notification permissions
- Ensure notifications are enabled in browser settings

## Technical Details

- **Manifest**: Defines app metadata and icons
- **Service Worker**: Handles offline functionality and caching
- **Icons**: Multiple sizes for different devices and contexts
- **HTTPS Required**: PWA features require secure connection

## Browser Support

- ✅ Chrome (Android/Desktop)
- ✅ Edge (Windows/Android)
- ✅ Safari (iOS/macOS)
- ✅ Firefox (Android/Desktop)
- ✅ Samsung Internet
- ✅ Opera

## Need Help?

If you encounter any issues with PWA installation or functionality, please contact your system administrator.
