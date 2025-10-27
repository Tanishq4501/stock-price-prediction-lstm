Stock Prediction Web Application
A full-stack web application built with a FastAPI backend and a React frontend that allows users to predict future stock prices using a machine learning model. The application features a clean, professional user interface for selecting stocks, visualizing historical data, and viewing detailed forecasts on an interactive chart and table.

Key Features
Dynamic Ticker Search: A responsive search bar to find stock symbols in real-time by name or ticker.

Configurable Prediction Parameters: Users can set the historical data period (e.g., 5 years) and the number of days to forecast into the future.

Interactive Chart Visualization: After a prediction is run, results are displayed on a Plotly.js chart showing:

Actual historical prices.

The model's historical predictions (to gauge model fit).

The future price forecast.

Forecast Data Table: A clear table below the chart lists the specific dates and corresponding predicted prices for the forecast period.

User Authentication: The backend includes endpoints for user registration and login, with a distinction between regular users and administrators.

Admin Dashboard Features: Protected endpoints are available to provide statistics like total users, total predictions, and most-predicted stocks.

Data Export: Functionality to export prediction data to a CSV file.

Professional UI/UX: A modern, responsive, and professional black and white theme built with Tailwind CSS.

Technology Stack
Backend
Framework: FastAPI

Language: Python

Data Handling: Pandas

ML Model: TensorFlow (as indicated by server logs)

Server: Uvicorn

Frontend
Framework: React

Styling: Tailwind CSS

Charting: Plotly.js (react-plotly.js)

API Communication: Native Fetch API

Getting Started
Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

Prerequisites
Python 3.8+ and pip

Node.js and npm (or yarn)

Git

Backend Setup
Clone the repository:

Bash

git clone <your-repository-url>
cd <your-repository-name>
Navigate to the backend directory (assuming it's named FastAPI as in your file paths):

Bash

cd FastAPI
Create and activate a Python virtual environment:

Bash

# For Windows
python -m venv venv
.\venv\Scripts\activate

# For macOS/Linux
python3 -m venv venv
source venv/bin/activate
Install the required Python packages:
Create a requirements.txt file in your FastAPI directory with the following content:

Plaintext

fastapi
uvicorn[standard]
pandas
tensorflow
pydantic[email]
Then, run the installation command:

Bash

pip install -r requirements.txt
Run the FastAPI server:

Bash

uvicorn main:app --reload
The backend will now be running on http://localhost:8000.

Frontend Setup
Navigate to the frontend directory from the project root (assuming it's a standard React app structure):

Bash

# From the project root
cd <your-frontend-folder-name> 
Install the required npm packages:

Bash

npm install
Start the React development server:

Bash

npm run dev
The frontend will now be running on http://localhost:5173 (or another port like 3000). You can now open this URL in your browser to use the application.

Project Structure
.
├── FastAPI/
│   ├── data/
│   │   ├── users.json
│   │   ├── stocks.json
│   │   └── predictions.json
│   ├── models/
│   ├── main.py             # FastAPI application logic and routes
│   ├── stock_predictor.py  # Core ML prediction logic
│   └── requirements.txt    # Python dependencies
│
└── frontend/ (Your React App)
    ├── src/
    │   ├── components/
    │   │   ├── PredictionChart.jsx
    │   │   ├── TickerSearch.jsx
    │   │   ├── ForecastTable.jsx
    │   │   └── ...
    │   ├── lib/
    │   │   ├── api.js              # API client for fetching data
    │   │   └── useDebounce.js
    │   ├── pages/
    │   │   └── Home.jsx            # Main application page
    │   └── ...
    ├── package.json
    └── ...






