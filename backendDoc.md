Backend Documentation – Fake News Detection System

🎯 Overview

This backend is built using FastAPI and is responsible for:
	•	Handling API requests from the frontend (Next.js)
	•	Running the Machine Learning model for fake news detection
	•	Fetching real-time news from external APIs
	•	Storing and retrieving data from PostgreSQL (Neon DB)


backend/
│
├── main.py   ✅ (ENTRY POINT)
│
├── app/
│   ├── routes/
│   │   ├── predict.py
│   │   ├── news.py
│   │   └── history.py
│
│   ├── services/
│   │   ├── ml_service.py
│   │   ├── news_service.py
│   │   └── db_service.py
│
│   ├── models/
│   │   └── schema.py
│
│   ├── utils/
│   │   └── preprocessing.py
│
│   └── config/
│       └── database.py
│
├── ml/
│   ├── train_model.py
│   ├── model.pkl
│   └── vectorizer.pkl
│
├── requirements.txt
└── .env


Detailed Explanation

⸻

🔹 1. app/main.py (Entry Point)

Purpose:
	•	Starts the FastAPI server
	•	Registers all API routes

Contains:
	•	FastAPI app instance
	•	Route inclusion

Example Responsibilities:
	•	Initialize app
	•	Connect all modules

⸻

🔹 2. routes/ (API Endpoints)

This folder defines all API endpoints.

📄 predict.py
	•	Endpoint: POST /predict
	•	Takes news text as input
	•	Returns:
	•	Prediction (FAKE / REAL)
	•	Confidence score

📄 news.py
	•	Endpoint: GET /news
	•	Fetches latest news from NewsData API

📄 history.py
	•	Endpoint: GET /history
	•	Returns previously analyzed news from database

⸻

🔹 3. services/ (Business Logic)

This is the core logic layer (very important).

📄 ml_service.py
	•	Loads trained ML model (model.pkl)
	•	Loads TF-IDF vectorizer
	•	Performs:
	•	preprocessing
	•	prediction

📄 news_service.py
	•	Calls NewsData.io API
	•	Handles API requests and responses

📄 db_service.py
	•	Handles all database operations:
	•	Insert records
	•	Fetch history

⸻

🔹 4. models/ (Schemas)

📄 schema.py
Defines:
	•	Request models (input format)
	•	Response models (output format)

Uses Pydantic for validation.

⸻

🔹 5. utils/ (Helper Functions)

📄 preprocessing.py
Handles:
	•	Text cleaning
	•	Lowercasing
	•	Removing punctuation
	•	Stopword removal
	•	Lemmatization

⸻

🔹 6. config/ (Configuration)

📄 database.py
	•	Sets up PostgreSQL connection
	•	Uses SQLAlchemy
	•	Reads DB URL from .env

⸻

🔹 7. ml/ (Machine Learning)

📄 train_model.py
	•	Script to train model using dataset
	•	Performs:
	•	preprocessing
	•	TF-IDF vectorization
	•	model training (Logistic Regression / SVM)
	•	Saves:
	•	model.pkl
	•	vectorizer.pkl
