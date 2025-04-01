# Bapti - Hungarian Baptist Church Website

A website for Bapti Hungarian Baptist Church built with Angular and Firebase.

## Features

- Responsive design for all devices
- Home page with church information
- About page for church history and mission
- Services page with worship times and information
- Events calendar for upcoming church events
- Sermon archives
- Contact form integrated with Firebase

## Technologies Used

- Angular 17
- Firebase (Authentication, Firestore, Hosting)
- SCSS for styling
- Responsive design
- Font Awesome icons

## Setup Instructions

### Prerequisites

- Node.js and npm installed
- Angular CLI installed globally
- Firebase account

### Installation

1. Clone the repository
```
git clone <repository-url>
cd bapti
```

2. Install dependencies
```
npm install
```

3. Configure Firebase
   - Create a new Firebase project at [firebase.google.com](https://firebase.google.com)
   - Replace the Firebase configuration in `src/app/app.config.ts` with your own
   - Enable Firestore and Authentication in your Firebase console

4. Run the development server
```
ng serve
```

5. Build for production
```
ng build
```

6. Deploy to Firebase Hosting
```
firebase login
firebase init
firebase deploy
```

## Project Structure

- `src/app/components` - Angular components
  - `home` - Home page component
  - `about` - About page component
  - `services` - Services page component
  - `events` - Events page component
  - `sermons` - Sermons page component
  - `contact` - Contact page component
  - `shared` - Shared components (header, footer)
- `src/app/services` - Angular services
  - `firebase.service.ts` - Firebase service for authentication and Firestore
- `src/assets` - Static assets including images

## Domain Information

- Domain Name: bapti.hu
- Deployed on Firebase Hosting

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or support, please contact info@bapti.hu.
