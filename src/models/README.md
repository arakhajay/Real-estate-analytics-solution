
# Model Registry

This directory contains the machine learning models and the registry system.

## Structure

- `registry.py`: Contains the `ModelRegistry` class for saving and loading models.
- `registry.db`: SQLite database tracking model versions, paths, and metrics.
- `train_valuation.py`: Training script (uses Scikit-Learn Pipeline).
- `test_model.py`: Test script to verify model loading and prediction on new data.
- `<model_name>/v<version>/`: Directory containing the actual model artifacts (`.pkl`).

## Usage

### Saving a Model

```python
from src.models.registry import ModelRegistry

# Train your model
model = ... 
metrics = {'accuracy': 0.95}
params = {'n_estimators': 100}

# Save
registry = ModelRegistry()
version = registry.save_model(
    model=model,
    name='my_model_name',
    metrics=metrics,
    params=params
)
print(f"Saved version {version}")
```

### Loading a Model

```python
from src.models.registry import ModelRegistry

registry = ModelRegistry()

# Load latest version
model = registry.load_model('my_model_name')

# Load specific version
old_model = registry.load_model('my_model_name', version=1)
```

## Running Tests

To verify the latest model is working correctly:

```bash
python src/models/test_model.py
```
