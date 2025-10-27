from fastapi import FastAPI, HTTPException, Depends, status,Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import json
import os
from pathlib import Path
import pandas as pd
import io

# Import the stock predictor
from stock_predictor import run_prediction

app = FastAPI(title="Stock Prediction API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data files
USERS_FILE = 'data/users.json'
STOCKS_FILE = 'data/stocks.json'
PREDICTIONS_FILE = 'data/predictions.json'
MODELS_DIR = 'models/'

# Create directories
Path('data').mkdir(exist_ok=True)
Path('models').mkdir(exist_ok=True)
Path('static').mkdir(exist_ok=True)

# Initialize data files
def init_data_files():
    if not os.path.exists(USERS_FILE):
        users = {
            'admin': {
                'password': 'admin123',
                'email': 'admin@gmail.com',
                'is_admin': True,
                'date_joined': str(datetime.now())
            },
            'john12': {
                'password': 'pass123',
                'email': 'john12@gmail.com',
                'is_admin': False,
                'date_joined': str(datetime.now())
            },
        }
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f)
    
    if not os.path.exists(STOCKS_FILE):
        stocks = {
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc. (Google)',
            'MSFT': 'Microsoft Corporation',
            'AMZN': 'Amazon.com, Inc.',
            'TSLA': 'Tesla, Inc.',
            'NVDA': 'NVIDIA Corporation',
            'ACN': 'Accenture Plc',
            'TCS': 'Tata Consultancy Services'
        }
        with open(STOCKS_FILE, 'w') as f:
            json.dump(stocks, f)
    
    if not os.path.exists(PREDICTIONS_FILE):
        with open(PREDICTIONS_FILE, 'w') as f:
            json.dump([], f)

init_data_files()


# Pydantic models
class UserLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class PasswordChange(BaseModel):
    username: str
    new_password: str

class StockAdd(BaseModel):
    ticker: str
    name: str

class PredictionRequest(BaseModel):
    ticker: str
    period: str = "5y"
    days_ahead: int = 7

class PredictionResponse(BaseModel):
    id: int
    user: str
    stock: str
    predicted_price: float
    predicted_date: str
    created_at: str

# Helper functions
def load_users():
    with open(USERS_FILE, 'r') as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def load_stocks():
    with open(STOCKS_FILE, 'r') as f:
        return json.load(f)

def save_stocks(stocks):
    with open(STOCKS_FILE, 'w') as f:
        json.dump(stocks, f, indent=2)

def load_predictions():
    with open(PREDICTIONS_FILE, 'r') as f:
        return json.load(f)

def save_predictions(predictions):
    with open(PREDICTIONS_FILE, 'w') as f:
        json.dump(predictions, f, indent=2)

# Authentication dependency
def verify_user(username: str, password: str):
    users = load_users()
    if username in users and users[username]['password'] == password:
        return users[username]
    return None

def verify_admin(username: str, password: str):
    user = verify_user(username, password)
    if user and user.get('is_admin', False):
        return user
    return None

# Routes
@app.get("/")
async def root():
    return FileResponse('static/index.html')

@app.post("/api/auth/login")
async def login(user: UserLogin):
    users = load_users()
    if user.username in users and users[user.username]['password'] == user.password:
        return {
            "success": True,
            "username": user.username,
            "email": users[user.username]['email'],
            "is_admin": users[user.username].get('is_admin', False),
            "date_joined": users[user.username]['date_joined']
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/auth/register")
async def register(user: UserRegister):
    users = load_users()
    
    if user.username in users:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    if len(user.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    users[user.username] = {
        'password': user.password,
        'email': user.email,
        'is_admin': False,
        'date_joined': str(datetime.now())
    }
    save_users(users)
    
    return {"success": True, "message": "Registration successful"}

@app.post("/api/user/change-password")
async def change_password(data: PasswordChange):
    users = load_users()
    
    if data.username not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    users[data.username]['password'] = data.new_password
    save_users(users)
    
    return {"success": True, "message": "Password updated successfully"}

@app.get("/api/stocks")
async def get_stocks():
    stocks = load_stocks()
    return {"stocks": stocks}

# --- ADD THIS NEW ENDPOINT ---
@app.get("/api/stocks/search")
async def search_stocks(q: str = Query(..., min_length=1)):
    """
    Searches for stocks by ticker or name.
    Expects a query parameter 'q', e.g., /api/stocks/search?q=APPL
    """
    stocks = load_stocks() # e.g., {"AAPL": "Apple Inc.", "GOOGL": "Alphabet Inc."}
    
    # Convert the stocks dictionary to a list of objects for easier searching
    stock_list = [{"symbol": symbol, "name": name} for symbol, name in stocks.items()]
    
    q_lower = q.lower()
    
    # Filter the list on the server
    results = [
        stock for stock in stock_list 
        if q_lower in stock["symbol"].lower() or q_lower in stock["name"].lower()
    ]
    
    return {"results": results}

@app.post("/api/stocks")
async def add_stock(stock: StockAdd):
    stocks = load_stocks()
    stocks[stock.ticker.upper()] = stock.name
    save_stocks(stocks)
    return {"success": True, "message": f"Stock {stock.ticker} added successfully"}

@app.post("/api/predict")
async def predict_stock(request: PredictionRequest):
    try:
        results = run_prediction(request.ticker, request.period, request.days_ahead)
        
        # Save predictions
        predictions = load_predictions()
        prediction_id = len(predictions) + 1
        
        new_predictions = []
        for i, (date, price) in enumerate(zip(results['future_dates'], results['future_predictions'])):
            pred = {
                'id': prediction_id + i,
                'user': 'api_user',  # You'd get this from auth token in production
                'stock': request.ticker,
                'predicted_price': float(price),
                'predicted_date': date,
                'created_at': str(datetime.now())
            }
            predictions.append(pred)
            new_predictions.append(pred)
        
        save_predictions(predictions)
        
        return {
            "success": True,
            "results": results,
            "predictions": new_predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predictions")
async def get_predictions(username: Optional[str] = None):
    predictions = load_predictions()
    
    if username:
        predictions = [p for p in predictions if p['user'] == username]
    
    return {"predictions": predictions}

@app.get("/api/predictions/export")
async def export_predictions(username: Optional[str] = None):
    predictions = load_predictions()
    
    if username:
        predictions = [p for p in predictions if p['user'] == username]
    
    df = pd.DataFrame(predictions)
    
    # Create CSV in memory
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=predictions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )
    return response

@app.get("/api/admin/stats")
async def get_admin_stats():
    users = load_users()
    stocks = load_stocks()
    predictions = load_predictions()
    
    # Calculate most predicted stocks
    stock_counts = {}
    for pred in predictions:
        stock = pred['stock']
        stock_counts[stock] = stock_counts.get(stock, 0) + 1
    
    sorted_stocks = sorted(stock_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "total_users": len(users),
        "total_stocks": len(stocks),
        "total_predictions": len(predictions),
        "most_predicted": [{"stock": stock, "count": count} for stock, count in sorted_stocks]
    }

@app.get("/api/admin/users")
async def get_all_users():
    users = load_users()
    user_list = []
    for i, (username, data) in enumerate(users.items()):
        user_list.append({
            "id": i + 1,
            "username": username,
            "email": data['email'],
            "date_joined": data['date_joined'][:10],
            "is_admin": data.get('is_admin', False)
        })
    return {"users": user_list}

# Mount static files (for serving the HTML frontend)
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)