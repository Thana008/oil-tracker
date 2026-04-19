from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import numpy as np

app = FastAPI(title="Oil Tracker AI Service")

class HistoryItem(BaseModel):
    date: str
    prices: Dict[str, Any]
    brent: Any

class PredictRequest(BaseModel):
    history: List[HistoryItem]
    fuelType: str
    horizonDays: Optional[int] = 7

# --- Helper functions migrated from predict_price.py ---
def _to_float(x):
    try:
        if x is None: return None
        return float(x)
    except Exception:
        return None

def _parse_date(s):
    try:
        return datetime.fromisoformat(s[:10])
    except Exception:
        return None

def _build_features(y, brent, dates, lag=7):
    rows = []
    targets = []
    for i in range(lag, len(y)):
        if y[i] is None: continue
        if any(y[i - j] is None for j in range(1, lag + 1)): continue

        w7 = [v for v in y[max(0, i - 7):i] if v is not None]
        w30 = [v for v in y[max(0, i - 30):i] if v is not None]
        sma7 = float(np.mean(w7)) if len(w7) >= 3 else None
        sma30 = float(np.mean(w30)) if len(w30) >= 10 else None

        b = brent[i] if i < len(brent) else None
        b_prev = brent[i - 1] if (i - 1) < len(brent) else None
        b_chg1 = (b - b_prev) if (b is not None and b_prev is not None) else 0.0
        b_prev7 = brent[i - 7] if (i - 7) >= 0 and (i - 7) < len(brent) else None
        b_chg7 = (b - b_prev7) if (b is not None and b_prev7 is not None) else 0.0

        bw7 = [v for v in brent[max(0, i - 7):i] if v is not None]
        b_sma7 = float(np.mean(bw7)) if len(bw7) >= 3 else (float(b) if b is not None else 0.0)

        dow = dates[i].weekday() if dates[i] else 0
        sin_dow = float(np.sin(2 * np.pi * dow / 7))
        cos_dow = float(np.cos(2 * np.pi * dow / 7))

        feats = []
        feats.extend([float(y[i - j]) for j in range(1, lag + 1)])
        feats.append(float(sma7) if sma7 is not None else float(y[i - 1]))
        feats.append(float(sma30) if sma30 is not None else float(y[i - 1]))
        feats.append(float(b) if b is not None else 0.0)
        feats.append(float(b_sma7))
        feats.append(float(b_chg1))
        feats.append(float(b_chg7))
        feats.append(sin_dow)
        feats.append(cos_dow)

        rows.append(feats)
        targets.append(float(y[i]))

    if not rows: return None, None
    return np.asarray(rows, dtype=np.float64), np.asarray(targets, dtype=np.float64)

def _ridge_fit(X, y, alpha=1.0):
    n = X.shape[0]
    Xb = np.concatenate([np.ones((n, 1), dtype=np.float64), X], axis=1)
    k = Xb.shape[1]
    I = np.eye(k, dtype=np.float64)
    I[0, 0] = 0.0
    A = Xb.T @ Xb + alpha * I
    b = Xb.T @ y
    w = np.linalg.solve(A, b)
    return w

def _ridge_predict(w, X):
    n = X.shape[0]
    Xb = np.concatenate([np.ones((n, 1), dtype=np.float64), X], axis=1)
    return Xb @ w

def _standardize_fit(X):
    mean = X.mean(axis=0)
    std = X.std(axis=0)
    std = np.where(std < 1e-8, 1.0, std)
    return (X - mean) / std, mean, std

def _standardize_apply(X, mean, std):
    return (X - mean) / std

def _typical_change(series, window=30):
    if len(series) < 3: return 0.5
    diffs = []
    start = max(1, len(series) - window)
    for i in range(start, len(series)):
        diffs.append(abs(series[i] - series[i - 1]))
    diffs = [d for d in diffs if d > 0]
    if not diffs: return 0.5
    return float(np.median(np.asarray(diffs, dtype=np.float64)))

def _forecast_iterative(y, brent_series, last_date, w, mean, std, lag=7, horizon=7):
    series = [float(v) for v in y]
    preds = []
    curr_date = last_date
    brent_last = next((b for b in reversed(brent_series) if b is not None), None)
    b_last7 = [float(b) for b in brent_series[-7:] if b is not None]
    b_sma7 = float(np.mean(b_last7)) if len(b_last7) >= 3 else (float(brent_last) if brent_last is not None else 0.0)
    typ = _typical_change(series, window=30)
    cap = max(0.8, typ * 6.0)

    for _ in range(horizon):
        curr_date = curr_date + np.timedelta64(1, "D")
        dow = int((datetime.fromisoformat(str(curr_date)).weekday()) if curr_date is not None else 0)
        sin_dow = float(np.sin(2 * np.pi * dow / 7))
        cos_dow = float(np.cos(2 * np.pi * dow / 7))

        lags = series[-lag:][::-1]
        w7 = series[-7:]
        w30 = series[-30:]
        sma7 = float(np.mean(w7)) if len(w7) >= 3 else series[-1]
        sma30 = float(np.mean(w30)) if len(w30) >= 10 else series[-1]

        b_chg1 = 0.0
        b_chg7 = 0.0

        X = np.asarray([[
            *lags, sma7, sma30, float(brent_last) if brent_last is not None else 0.0,
            float(b_sma7), float(b_chg1), float(b_chg7), sin_dow, cos_dow
        ]], dtype=np.float64)
        Xs = _standardize_apply(X, mean, std)
        raw = float(_ridge_predict(w, Xs)[0])
        last = float(series[-1])
        delta = raw - last
        if delta > cap: raw = last + cap
        elif delta < -cap: raw = last - cap
        pred = round(float(raw), 2)
        preds.append(pred)
        series.append(pred)

    return preds

@app.post("/predict")
async def predict_price(req: PredictRequest):
    try:
        horizon = max(1, min(30, req.horizonDays))
        points = []
        for h in req.history:
            date = _parse_date(h.date)
            price = _to_float(h.prices.get(req.fuelType))
            brent = _to_float(h.brent)
            if date is None or price is None:
                continue
            points.append((date, price, brent))

        points.sort(key=lambda x: x[0])
        if len(points) < 20:
            last_price = points[-1][1] if points else None
            return {
                "success": True,
                "model": "ridge-lags-brent",
                "predictedPrice": float(last_price) if last_price is not None else None,
                "forecast": [float(last_price)] * horizon if last_price is not None else [],
                "meta": {"note": "not_enough_data", "n_points": len(points)},
            }

        dates = [p[0] for p in points]
        y = [p[1] for p in points]
        brent = [p[2] if p[2] is not None else None for p in points]

        best_pack = None
        best_rmse = None

        for lag in (3, 5, 7, 10, 14):
            X, target = _build_features(y, brent, dates, lag=lag)
            if X is None or target is None or X.shape[0] < 12:
                continue

            if X.shape[0] > 21:
                X_train, y_train = X[:-14], target[:-14]
                X_val, y_val = X[-14:], target[-14:]
            else:
                X_train, y_train = X, target
                X_val, y_val = None, None

            Xs_train, mean, std = _standardize_fit(X_train)
            alphas = [0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0]

            best_alpha = 1.0
            best_w = None
            lag_rmse = None

            if X_val is not None:
                Xs_val = _standardize_apply(X_val, mean, std)
                for a in alphas:
                    w_try = _ridge_fit(Xs_train, y_train, alpha=a)
                    pred_val = _ridge_predict(w_try, Xs_val)
                    rmse_try = float(np.sqrt(np.mean((pred_val - y_val) ** 2)))
                    if lag_rmse is None or rmse_try < lag_rmse:
                        lag_rmse = rmse_try
                        best_alpha = float(a)
                        best_w = w_try
            if best_w is None:
                best_w = _ridge_fit(Xs_train, y_train, alpha=best_alpha)

            if lag_rmse is None:
                lag_rmse = float(np.sqrt(np.mean((_ridge_predict(best_w, Xs_train) - y_train) ** 2)))

            if best_rmse is None or lag_rmse < best_rmse:
                best_rmse = lag_rmse
                best_pack = {
                    "lag": int(lag),
                    "alpha": float(best_alpha),
                    "w": best_w.tolist(), # Convert numpy array to list for JSON
                    "mean": mean.tolist(),
                    "std": std.tolist(),
                    "n_train": int(X_train.shape[0]),
                }

        if best_pack is None:
            last_price = y[-1]
            return {
                "success": True,
                "model": "ridge-lags-brent",
                "predictedPrice": float(last_price),
                "forecast": [float(last_price)] * horizon,
                "meta": {"note": "not_enough_features"},
            }

        rmse = float(best_rmse) if best_rmse is not None else None
        last_date = np.datetime64(dates[-1].date().isoformat())
        forecast = _forecast_iterative(
            y,
            brent,
            last_date,
            np.array(best_pack["w"]),
            np.array(best_pack["mean"]),
            np.array(best_pack["std"]),
            lag=best_pack["lag"],
            horizon=horizon,
        )

        return {
            "success": True,
            "model": "ridge-lags-brent",
            "predictedPrice": float(forecast[-1]) if forecast else float(y[-1]),
            "forecast": forecast,
            "meta": {
                "n_points": len(points),
                "n_train": best_pack["n_train"],
                "rmse": rmse,
                "alpha": best_pack["alpha"],
                "lag": best_pack["lag"],
            },
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
