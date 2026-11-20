# Clarity Health

A React and FastAPI symptom checker using the supplied scikit-learn model. Supabase Auth provides email/password registration, sign-in, password reset, session persistence, and protected app pages. Prediction history stays in local storage for the signed-in account on this browser; it is not synced to a database.

## Model files

Keep these files in `backend/models/`:

- `disease_model.pkl`
- `label_encoder.pkl`
- `symptom_columns.pkl`

The API loads the existing model once at startup. It does not train or replace the model. The model files were saved using joblib and are loaded with `joblib.load`.

## Run locally

Backend, using Python 3.10 or newer:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend, using Node 20 or newer:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `frontend/.env`. Use the exact **Project URL** and **publishable key** from the Supabase project's Connect dialog. The publishable key is intended for browser use; do not put a Supabase secret key in this file.

In Supabase Dashboard → Authentication → URL Configuration, set the local Site URL and allow redirects to `http://localhost:5173/**` and `http://127.0.0.1:5173/**`. Email/password auth must be enabled in the project. If email confirmations are on, users must confirm their email before they can sign in.

Open the Vite URL, normally `http://localhost:5173`. Set `VITE_API_URL` in `frontend/.env` if the API uses another URL.

The API provides `GET /health`, `GET /symptoms`, and `POST /predict`. Prediction input is validated against the 132 features in `symptom_columns.pkl` and built in the exact stored order. The API does not store predictions; browser history is scoped by the Supabase user ID in local storage.

## Privacy and medical notice

Prediction history is stored in browser local storage on this device and is not uploaded to Supabase. Clearing browser storage removes it. Predictions are educational suggestions, not confirmed diagnoses. Model confidence is not the probability a person has a disease. The app does not prescribe medicines or guarantee treatment outcomes. Consult a qualified medical professional.
