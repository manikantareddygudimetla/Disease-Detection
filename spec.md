# Project Specification: AI-Based Disease Prediction System

## 1. Project Overview

Build a modern, responsive AI-based Disease Prediction website that predicts possible diseases based on symptoms selected by users.

The system will use an already-trained Machine Learning model to analyze symptoms and display the predicted disease, prediction confidence (if supported), and relevant health information.

Use the provided reference images for design inspiration, but create an original design rather than copying them.

## 2. Existing ML Files

The following files are already available:

1. `disease_model.pkl` – Trained multi-class disease classification model.
2. `label_encoder.pkl` – LabelEncoder for converting numerical predictions into disease names.
3. `symptom_columns.pkl` – List of 132 binary symptom feature names.

**Important:** Use these existing trained files. Do not train a new model or replace the existing model.

## 3. Technology Stack

- Frontend: React.js
- Styling: CSS / Tailwind CSS
- Backend: Python FastAPI
- Machine Learning: Scikit-learn
- Model Storage: Pickle files
- Authentication: Firebase Authentication
- Database: Firebase Firestore
- Frontend Firebase Integration: Firebase Web SDK
- Backend Firebase Integration: Firebase Admin SDK

## 4. Authentication – Firebase

Use Firebase Authentication for the complete authentication system.

Features:

- User registration using email and password.
- User login using email and password.
- Logout functionality.
- Forgot password / password reset.
- Maintain authenticated sessions.
- Protect private dashboard pages.
- Redirect unauthenticated users to the login page.
- Redirect authenticated users away from login and registration pages.
- Display user information in the dashboard.

### Firebase Authentication Integration

- Use Firebase Web SDK in React.
- Use Firebase Authentication to create and authenticate accounts.
- Use Firebase ID tokens for secure communication with FastAPI.
- Use Firebase Admin SDK in FastAPI to verify ID tokens.
- Never store user passwords manually.
- Never expose Firebase Admin credentials in the frontend.

### Firebase Firestore

Use Firestore to store:

**Users Collection**
- Firebase UID
- Name
- Email
- Account creation date

**Prediction History Collection**
- Prediction ID
- User UID
- Predicted disease
- Selected symptoms
- Prediction confidence (if available)
- Prediction date and time

Each user must only be able to access their own prediction history.

Configure appropriate Firestore Security Rules.

## 5. User Dashboard

Create a modern healthcare dashboard containing:

- Welcome section with user's name.
- Total number of predictions.
- Recent predictions.
- Quick access to the symptom checker.
- Prediction history.
- User profile.
- Logout option.

Use a clean sidebar navigation layout.

## 6. Symptom Checker

Create an interactive symptom selection page.

Features:

- Display all 132 symptoms from `symptom_columns.pkl`.
- Organize symptoms into suitable categories.
- Search symptoms by name.
- Allow users to select multiple symptoms.
- Display the total number of selected symptoms.
- Provide an optional additional notes field.
- Include a Clear All button.
- Include an Analyze Symptoms button.
- Show a loading indicator during prediction.

The symptom list must be dynamically generated from the existing feature list rather than manually creating a different set of symptoms.

## 7. Disease Prediction

When the user submits symptoms:

1. Collect the selected symptoms.
2. Convert them into 132 binary input features.
3. Maintain the exact feature order from `symptom_columns.pkl`.
4. Set selected symptoms to 1.
5. Set unselected symptoms to 0.
6. Pass the input to `disease_model.pkl`.
7. Get the predicted class.
8. Decode the predicted class using `label_encoder.pkl`.
9. Return the prediction to the React frontend.
10. Save the prediction in Firebase Firestore for the authenticated user.

## 8. Prediction Results Page

Display results using attractive cards and visualizations.

Include:

- Predicted disease name.
- Prediction confidence percentage, if supported by the model.
- Selected symptoms.
- Brief disease information.
- General health precautions.
- Recommendation to consult a qualified medical professional.
- Option to perform another prediction.
- Option to view prediction history.

Do not display unsupported medical risk scores or generate medicine prescriptions.

Do not treat model confidence as the probability that a patient actually has a disease.

## 9. Prediction History

- Save predictions in Firebase Firestore.
- Display previous predictions for the logged-in user.
- Show predicted disease name.
- Show selected symptoms.
- Display prediction date and time.
- Allow users to view individual prediction details.
- Allow users to clear their own prediction history.
- Prevent users from viewing or modifying other users' records.

## 10. Main Pages

1. Login Page
2. Registration Page
3. User Dashboard
4. Symptom Checker
5. Prediction Results
6. Prediction History
7. User Profile

## 11. UI/UX Design Requirements

Use the provided reference images as visual inspiration.

### Overall Design
- Modern healthcare dashboard.
- Clean and professional interface.
- White/light background.
- Blue and purple accent colors.
- Green accents for positive visual indicators.
- Rounded cards and subtle shadows.
- Consistent spacing and typography.
- Responsive design for desktop, tablet and mobile.

### Reference-Based Design

**Symptom Checker**
- Card-based symptom selection.
- Search functionality.
- Symptom categories.
- Selected symptom count.

**Prediction Results**
- Clear disease prediction card.
- Confidence visualization when supported.
- Additional disease information.
- Clean result layout.

**Dashboard**
- Sidebar navigation.
- Overview cards.
- Recent predictions.
- Prediction history.

Create an original interface. Do not copy the reference images exactly.

## 12. Backend API Requirements

Create the following FastAPI endpoints:

- `GET /symptoms` – Return all 132 available symptoms.
- `POST /predict` – Predict disease from selected symptoms.
- `GET /history` – Retrieve the authenticated user's prediction history.
- `GET /history/{id}` – Retrieve an individual prediction.

All protected endpoints must verify the Firebase ID token.

The backend must identify users using their verified Firebase UID.

## 13. ML Model Requirements

- Load all three pickle files when the FastAPI application starts.
- Do not load the model files for every prediction.
- Use all 132 features in the exact order specified by `symptom_columns.pkl`.
- Validate incoming symptoms.
- Use the existing LabelEncoder to decode predictions.
- Handle invalid inputs and prediction errors.
- Do not modify or retrain the existing model.
- Display prediction confidence only if the model supports probability prediction.
- Do not interpret prediction confidence as medical risk.

## 14. Project Structure

Organize the project into two main folders:

### Frontend
- React components
- Pages
- CSS / styles
- Firebase configuration
- Authentication context
- Protected routes
- API services

### Backend
- FastAPI application
- API routes
- ML model loading
- Prediction logic
- Firebase Admin initialization
- Authentication middleware
- Firestore integration

Keep the three pickle files inside the backend model directory.

Use environment variables for Firebase configuration and sensitive credentials.

## 15. Final Requirements

- Build a fully functional website, not just a UI prototype.
- Connect React frontend with FastAPI backend.
- Integrate the existing ML model correctly.
- Implement Firebase Authentication.
- Use Firebase Firestore for user profiles and prediction history.
- Verify Firebase ID tokens on the backend.
- Protect private routes and user data.
- Make all pages responsive.
- Add proper loading indicators and error messages.
- Keep the code clean, modular and understandable.
- Do not expose sensitive credentials or backend model files to the frontend.
- Include setup instructions in a README file.

## 16. Medical Disclaimer

This application is an educational AI-based disease prediction tool. Predictions are not confirmed medical diagnoses and must not replace consultation with qualified healthcare professionals.

Do not provide medicine prescriptions or treatment guarantees.