# 🤖 AI vs Human Text Detection System

A complete end-to-end machine learning system that detects AI-generated text versus human-written text. This project combines a Python FastAPI backend with a Next.js frontend, PostgreSQL database, and a trained scikit-learn model using advanced stylistic feature extraction.

## 🎯 Features

- **Stylistic Analysis**: Advanced ML model using 28 domain-independent stylistic features (word patterns, punctuation, vocabulary diversity, sentence structure, formality markers)
- **Accurate Detection**: 90% test accuracy with 7/8 out-of-domain text generalization
- **Demo Samples**: AI and human-written text samples to test the system
- **Prediction History**: Store and retrieve past predictions from PostgreSQL
- **Modern UI**: Beautiful Next.js frontend with Tailwind CSS
- **RESTful API**: FastAPI with Swagger documentation
- **Environment Configuration**: Secure `.env` file support for credentials
- **Production Ready**: Clean architecture with proper error handling

## 📊 Tech Stack

### Backend
- **Python 3.14**
- **FastAPI** - Web framework
- **Scikit-learn** - Machine learning (TF-IDF + Logistic Regression)
- **Pandas** - Data processing
- **PostgreSQL** - Database (optional, with JSON fallback)
- **Uvicorn** - ASGI server

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hooks** - State management

### ML Model
- **Training Data**: 487K AI vs Human text samples (305K human-written, 181K AI-generated)
- **Algorithm**: SGDClassifier with modified Huber loss
- **Features**: 28 stylistic features (no n-grams) - word length variance, formal words, contractions, first-person pronouns, hedging patterns, etc.
- **Accuracy**: 90.11% test accuracy

## 📁 Project Structure

```
minor/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── predict.py       # POST /predict, GET /history
│   │   │   └── news.py          # GET /news (demo samples)
│   │   ├── services/
│   │   │   ├── model_service.py # Stylistic feature extraction & inference
│   │   │   ├── news_service.py  # Demo text loader
│   │   │   └── db_service.py    # PostgreSQL operations
│   │   └── schemas/
│   │       └── predict_schema.py
│   ├── model/
│   │   ├── train.py             # Training script (stylistic features)
│   │   ├── model.pkl            # Trained SGDClassifier
│   │   ├── scaler.pkl           # StandardScaler for features
│   │   └── config.pkl           # Model configuration
│   ├── data/
│   │   └── demo.json            # Sample AI & human texts
│   ├── database/
│   │   └── schema.sql           # PostgreSQL schema + seed data
│   ├── venv/                    # Python virtual environment
│   ├── .env                     # Environment variables (not in git)
│   ├── .env.example             # Template for .env
│   ├── .gitignore              # Git ignore rules
│   ├── main.py                  # FastAPI app entry point
│   └── requirements.txt         # Python dependencies
│
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Main page
│   │   │   ├── layout.tsx       # Root layout
│   │   │   └── globals.css      # Global styles
│   │   ├── components/
│   │   │   ├── Navbar.tsx       # Navigation
│   │   │   ├── PredictForm.tsx  # Input form
│   │   │   ├── NewsCard.tsx     # Text sample display
│   │   │   ├── HistoryPanel.tsx # Prediction history
│   │   │   ├── AnalysisView.tsx # Main analysis UI
│   │   │   ├── HomeView.tsx     # Home view
│   │   │   └── Sidebar.tsx      # Navigation sidebar
│   │   └── types/
│   │       └── index.ts         # TypeScript types
│   └── package.json
│
├── README.md                    # This file
└── AI_Human.csv                 # AI vs Human text dataset (487K samples)
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL 12+ (optional)
- npm or yarn

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials (optional):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_text_detection
```

**Note**: The API works without PostgreSQL using JSON fallback for history.

### 3. Database Setup (Optional)

```bash
# Create database
createdb ai_text_detection

# Run schema
psql -d ai_text_detection -f database/schema.sql
```

### 4. Start Backend

```bash
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload --port 8000
```

Backend will be available at: **http://localhost:8000**

### 5. Start Frontend

```bash
cd frontend
npm install  # Only needed first time
npm run dev
```

Frontend will be available at: **http://localhost:3000**

## 🔌 API Endpoints

### Root
- **GET** `/` - Health check

### Predictions
- **POST** `/predict` - Classify text as AI-generated, human-written, or uncertain
  ```json
  Request:
  {
    "text": "Your text passage here..."
  }
  
  Response:
  {
    "label": "human-written",
    "confidence": 0.8532
  }
  ```
  
  **Label values**: `"ai-generated"`, `"human-written"`, or `"uncertain"` (if confidence < 0.6)

- **GET** `/history` - Get past predictions (requires PostgreSQL)
  ```json
  Response:
  [
    {
      "id": 1,
      "input_text": "Text sample...",
      "label": "ai-generated",
      "confidence": 0.95,
      "created_at": "2026-03-27T10:30:00"
    }
  ]
  ```

### News
- **GET** `/news` - Get demo text samples (10 AI, 10 human)
  ```json
  Response:
  [
    {
      "id": 1,
      "content": "Sample text..."
    }
  ]
  ```

## 🧠 How It Works

### Model Training
1. Load AI_Human.csv dataset (487K+ samples)
2. Labels: 0 = Human-written, 1 = AI-generated
3. Extract 28 stylistic features:
   - **Word patterns**: avg word length, word length variance, long/short word ratios
   - **Sentence structure**: avg sentence length, variance, sentence starter diversity
   - **Vocabulary**: diversity (type-token ratio), hapax legomena ratio
   - **Formality markers**: formal words (particularly, furthermore, etc.), contractions, first-person pronouns
   - **Casual markers**: filler words (like, honestly, basically), hedging words, narrative words
   - **Punctuation patterns**: ratio of commas, quotes, dashes, parentheticals
   - **Text properties**: total length, paragraph structure
4. No TF-IDF or n-grams — only domain-independent stylistic features
5. Scale features with StandardScaler
6. Train SGDClassifier (modified Huber loss, balanced classes)
7. Save model.pkl, scaler.pkl, config.pkl

### Prediction Flow
1. User submits text via the frontend
2. Frontend sends POST request to `/predict`
3. Backend preprocesses: URL/email removal, whitespace normalization
4. Extract 28 stylistic features from the text
5. Scale features using saved StandardScaler
6. Model predicts: 0 (human-written) or 1 (ai-generated)
7. Returns label + confidence score
8. (Optional) Saves to PostgreSQL database

### Why Stylistic Features?
Traditional n-gram approaches (TF-IDF) overfit to training topics and fail to generalize. Our model uses domain-independent stylistic markers that capture real AI vs human writing differences:
- **Humans**: More contractions, first-person pronouns, casual language, varied sentence structure
- **AI**: More formal vocabulary, fewer contractions, more consistent sentence patterns, hedging language

## 📱 Frontend Features

- **Detect Tab**: Paste text and get instant AI vs Human classification
- **Demo Samples Tab**: Browse AI-generated and human-written samples, click to analyze
- **History Tab**: View all past predictions (requires PostgreSQL)
- **Real-time Feedback**: Visual indicators (AI/HUMAN/UNCERTAIN) with confidence bars
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern Brand**: AuthentiCheck UI with intuitive navigation

## 🔐 Security & Best Practices

- Environment variables stored in `.env` (git-ignored)
- CORS enabled for development
- Graceful fallback when database is unavailable
- No sensitive data in version control
- Type-safe TypeScript frontend

## 📊 Model Performance

- **Training Data**: 100K samples (50K human-written, 50K AI-generated) — subsampled from 487K total
- **Train/Test Split**: 80/20 (80K train, 20K test)
- **Accuracy**: 90.11% overall
- **Precision** (Human): 0.89
- **Recall** (Human): 0.91
- **Precision** (AI): 0.91
- **Recall** (AI): 0.89
- **Generalization**: 7/8 out-of-domain texts correctly classified
- **Uncertainty Threshold**: 0.60 (predictions below this marked as "uncertain")

## 🎨 Sample Testing

Try these samples in the detector:

**Human-Written Example:**
```
I still remember the day my grandmother handed me her recipe notebook. It was worn, pages yellowed and stained with decades of cooking. Inside were recipes written in her handwriting with little notes in the margins.
```

**AI-Generated Example:**
```
Artificial intelligence represents a transformative force in contemporary society, fundamentally reshaping how organizations approach data analysis and decision-making processes. The integration of machine learning algorithms into business operations has engendered unprecedented efficiencies.
```

**Casual Human Example:**
```
Honestly today was a total disaster. I woke up late, spilled coffee all over my shirt, and then realized I had the wrong meeting time. My boss gave me that look you know the one?
```

## 🛠️ Development

### Backend Development
- Hot reload enabled with `--reload` flag
- Swagger docs available at: http://localhost:8000/docs
- ReDoc available at: http://localhost:8000/redoc

### Frontend Development
- Hot reload enabled with npm run dev
- TypeScript strict mode enabled
- Tailwind CSS with automatic optimization

## 📦 Requirements

See `backend/requirements.txt` for complete Python dependencies:
- fastapi
- uvicorn
- scikit-learn
- pandas
- psycopg2-binary
- python-dotenv

## ❌ Troubleshooting

**Port 8000 already in use:**
```bash
lsof -i :8000
kill -9 <PID>
```

**Database connection failed:**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- The app works without DB (uses JSON fallback)

**Frontend can't reach backend:**
- Ensure backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` env var in frontend
- Clear browser cache

**Model accuracy seems low:**
- Check that model.pkl, scaler.pkl, and config.pkl exist in backend/model/
- Re-run `python model/train.py` to retrain the model
- Note: 90% accuracy is expected for stylistic-only features

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💻 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 💡 Future Enhancements

- [ ] Deep learning model (BERT/GPT-based perplexity detection)
- [ ] Multi-language support (non-English datasets)
- [ ] User authentication and profiles
- [ ] Advanced analytics dashboard with trends
- [ ] Model versioning and A/B testing
- [ ] API rate limiting and authentication
- [ ] Caching layer (Redis)
- [ ] Docker containerization
- [ ] Browser extension for real-time detection
- [ ] Integration with content management systems

---

Built with ❤️ for detecting AI-generated text
