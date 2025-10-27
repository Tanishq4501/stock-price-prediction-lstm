import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense, Dropout, LSTM
from tensorflow.keras.callbacks import EarlyStopping
import yfinance as yf
from datetime import datetime, timedelta
import os

class StockPredictor:
    def __init__(self, ticker, period='5y', lookback=30):
        self.ticker = ticker
        self.period = period
        self.lookback = lookback
        self.model = None
        self.scaler_features = MinMaxScaler(feature_range=(0, 1))
        self.scaler_target = MinMaxScaler(feature_range=(0, 1))
        self.data = None
        self.df_features = None
        
    def fetch_data(self):
        """Fetch stock data from Yahoo Finance"""
        print(f"Fetching data for {self.ticker}...")
        stock = yf.Ticker(self.ticker)
        self.data = stock.history(period=self.period)
        if self.data.empty:
            raise ValueError(f"No data fetched for ticker {self.ticker}")
        print(f"Data fetched: {len(self.data)} records")
        return self.data
    
    def create_features(self):
        """Create technical indicators as features"""
        df = self.data.copy()
        
        # Moving averages
        df['MA_20'] = df['Close'].rolling(window=20).mean()
        df['MA_50'] = df['Close'].rolling(window=50).mean()
        
        # RSI
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # MACD
        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
        
        # Bollinger Bands
        df['BB_Middle'] = df['Close'].rolling(window=20).mean()
        df['BB_Std'] = df['Close'].rolling(window=20).std()
        df['BB_Upper'] = df['BB_Middle'] + (df['BB_Std'] * 2)
        df['BB_Lower'] = df['BB_Middle'] - (df['BB_Std'] * 2)
        
        # Target: percentage change
        df['Target'] = df['Close'].pct_change().shift(-1)
        
        df.dropna(inplace=True)
        self.df_features = df
        
    def prepare_data(self, test_size=0.2):
        """Prepare sequential data for LSTM"""
        self.create_features()
        
        feature_cols = ['Close', 'Volume', 'MA_20', 'MA_50', 'RSI', 'MACD', 'MACD_Signal', 'BB_Upper', 'BB_Lower']
        target_col = 'Target'
        
        # Scale features
        self.df_features[feature_cols] = self.scaler_features.fit_transform(self.df_features[feature_cols])
        self.df_features[target_col] = self.scaler_target.fit_transform(self.df_features[[target_col]])
        
        # Split chronologically
        split_idx = int(len(self.df_features) * (1 - test_size))
        train_df = self.df_features[:split_idx]
        test_df = self.df_features[split_idx:]
        
        # Create sequences
        def create_sequences(data, lookback, feature_cols, target_col):
            X, y = [], []
            for i in range(lookback, len(data)):
                X.append(data[feature_cols].iloc[i-lookback:i].values)
                y.append(data[target_col].iloc[i])
            return np.array(X), np.array(y)
        
        X_train, y_train = create_sequences(train_df, self.lookback, feature_cols, target_col)
        X_test, y_test = create_sequences(test_df, self.lookback, feature_cols, target_col)

         # Store the dates corresponding to the y_test for later plotting
        self.y_test_dates = test_df.index[self.lookback:]
        
        return X_train, X_test, y_train, y_test
    
    def build_lstm_model(self, input_shape):
        """Build LSTM model"""
        model = Sequential([
            LSTM(units=50, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(units=50, return_sequences=False),
            Dropout(0.2),
            Dense(25, activation='relu'),
            Dense(1)
        ])
        model.compile(optimizer='adam', loss='mean_squared_error', metrics=['mae'])
        return model
    
    def train(self, epochs=50, batch_size=32):
        """Train the model"""
        X_train, X_test, y_train, y_test = self.prepare_data()
        
        # Check if model exists
        model_path = f'models/{self.ticker}_{self.period}.h5'
        
        if os.path.exists(model_path):
            print(f"Loading existing model for {self.ticker}...")
            try:
                # Try loading with compile=False to avoid metric issues
                self.model = load_model(model_path, compile=False)
                # Recompile with correct configuration
                self.model.compile(optimizer='adam', loss='mean_squared_error', metrics=['mae'])
            except Exception as e:
                print(f"Error loading model: {e}")
                print("Training new model instead...")
                os.remove(model_path)  # Remove corrupted model
                self.model = None
        
        if self.model is None:
            print(f"Training new model for {self.ticker}...")
            input_shape = (X_train.shape[1], X_train.shape[2])
            self.model = self.build_lstm_model(input_shape)
            
            early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
            
            self.model.fit(
                X_train, y_train,
                epochs=epochs,
                batch_size=batch_size,
                validation_split=0.2,
                callbacks=[early_stop],
                verbose=0
            )
            
            # Save model
            self.model.save(model_path)
            print(f"Model saved to {model_path}")
        
        # Evaluate
        predictions_scaled = self.model.predict(X_test, verbose=0)
        predictions_pct = self.scaler_target.inverse_transform(predictions_scaled)
        y_test_pct = self.scaler_target.inverse_transform(y_test.reshape(-1, 1))
        
        # Calculate historical predicted prices
        test_actual_prices = self.data['Close'][self.y_test_dates.min():].iloc[:-1]
        historical_predictions = test_actual_prices * (1 + predictions_pct.flatten())

        mae = mean_absolute_error(y_test_pct, predictions_pct)
        rmse = np.sqrt(mean_squared_error(y_test_pct, predictions_pct))
        
        # Return all necessary data for plotting
        return {
            'mae': mae,
            'rmse': rmse,
            'historical_actual_prices': self.data['Close'][self.y_test_dates],
            'historical_predicted_prices': pd.Series(historical_predictions, index=self.y_test_dates),
        }
    
    def predict_future(self, days_ahead=7):
        """Predict future prices"""
        # Get last sequence
        feature_cols = ['Close', 'Volume', 'MA_20', 'MA_50', 'RSI', 'MACD', 'MACD_Signal', 'BB_Upper', 'BB_Lower']
        last_sequence = self.df_features[feature_cols].iloc[-self.lookback:].values
        last_sequence = last_sequence.reshape(1, self.lookback, len(feature_cols))
        
        predictions = []
        current_sequence = last_sequence.copy()
        last_price = self.data['Close'].iloc[-1]
        
        for _ in range(days_ahead):
            # Predict next day's percentage change
            pred_pct_scaled = self.model.predict(current_sequence, verbose=0)
            pred_pct = self.scaler_target.inverse_transform(pred_pct_scaled)[0][0]
            
            # Calculate next price
            next_price = last_price * (1 + pred_pct)
            predictions.append(next_price)
            last_price = next_price
            
            # Update sequence (simplified - using last known values)
            # In production, you'd want to update all features properly
            new_row = current_sequence[0, -1, :].copy()
            new_row[0] = (next_price - self.data['Close'].min()) / (self.data['Close'].max() - self.data['Close'].min())
            
            current_sequence = np.append(current_sequence[:, 1:, :], [[new_row]], axis=1)
        
        return predictions

def run_prediction(ticker, period, days_ahead):
    """Main function to run prediction and return results"""
    predictor = StockPredictor(ticker, period, lookback=30)
    
    # Fetch and prepare data
    predictor.fetch_data()
    
    # Train model
    train_results = predictor.train(epochs=50)
    
    # Generate future predictions
    future_predictions = predictor.predict_future(days_ahead)
    
    last_date = predictor.data.index[-1]
    future_dates = [str((last_date + timedelta(days=i+1)).date()) for i in range(days_ahead)]
    
    # Get slightly more historical data for a better-looking plot context
    historical_plot_data = predictor.data['Close'].iloc[-90:] 
    
    # Now, build the final dictionary to return to the frontend
    return {
        'mae': train_results['mae'],
        'rmse': train_results['rmse'],
        'future_predictions': future_predictions,
        'future_dates': future_dates,
        'historical_dates': [str(d.date()) for d in historical_plot_data.index],
        'historical_prices': historical_plot_data.values.tolist(),
        'hist_pred_dates': [str(d.date()) for d in train_results['historical_predicted_prices'].index],
        'hist_pred_prices': train_results['historical_predicted_prices'].values.tolist()
    }

