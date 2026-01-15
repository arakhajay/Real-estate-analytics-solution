
import sqlite3
import os
import joblib
import json
from datetime import datetime
import pandas as pd

class ModelRegistry:
    def __init__(self, db_path=None, models_dir=None):
        # Default paths
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        if models_dir is None:
            self.models_dir = base_dir
        else:
            self.models_dir = models_dir
            
        if db_path is None:
            self.db_path = os.path.join(self.models_dir, "registry.db")
        else:
            self.db_path = db_path

        self._init_db()

    def _init_db(self):
        """Initialize the SQLite database for model versioning."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                version INTEGER NOT NULL,
                path TEXT NOT NULL,
                metrics TEXT,  -- JSON string
                params TEXT,   -- JSON string
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()

    def get_latest_version(self, name):
        """Get the latest version number for a given model name."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT MAX(version) FROM models WHERE name = ?', (name,))
        res = c.fetchone()
        conn.close()
        return res[0] if res[0] is not None else 0

    def save_model(self, model, name, metrics=None, params=None):
        """
        Save a model artifact and register it in the database.
        
        Args:
            model: The model object (e.g., sklearn estimator).
            name: Name of the model (e.g., 'rent_valuation').
            metrics: Dict of metrics (e.g., {'rmse': 0.5}).
            params: Dict of parameters (e.g., {'n_estimators': 100}).
        """
        version = self.get_latest_version(name) + 1
        
        # Create version specific directory
        # Structure: models/name/v1/model.pkl
        model_dir = os.path.join(self.models_dir, name, f"v{version}")
        os.makedirs(model_dir, exist_ok=True)
        
        model_path = os.path.join(model_dir, "model.pkl")
        
        # Save artifact using joblib (efficient for numpy/sklearn)
        joblib.dump(model, model_path)
        
        # Save metadata to DB
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            INSERT INTO models (name, version, path, metrics, params)
            VALUES (?, ?, ?, ?, ?)
        ''', (name, version, model_path, json.dumps(metrics), json.dumps(params)))
        conn.commit()
        conn.close()
        
        print(f"✅ Model '{name}' version {version} saved successfully.")
        print(f"   Path: {model_path}")
        return version

    def load_model(self, name, version=None):
        """
        Load a model from the registry.
        
        Args:
            name: Name of the model.
            version: Integer version number. If None, loads latest.
        """
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        if version is None:
            c.execute('SELECT path, version FROM models WHERE name = ? ORDER BY version DESC LIMIT 1', (name,))
        else:
            c.execute('SELECT path, version FROM models WHERE name = ? AND version = ?', (name, version))
            
        res = c.fetchone()
        conn.close()
        
        if res:
            path, loaded_version = res
            if os.path.exists(path):
                print(f"Loading '{name}' version {loaded_version} from {path}")
                return joblib.load(path)
            else:
                raise FileNotFoundError(f"Model file not found at {path}")
        else:
            raise ValueError(f"Model '{name}' (version {version}) not found in registry.")

    def list_models(self):
        """List all registered models."""
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query("SELECT * FROM models ORDER BY name, version DESC", conn)
        conn.close()
        return df
