from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

import models
from database import get_db
from auth import get_current_user
from services.stock_service import get_stock_info

router = APIRouter(prefix="/user/watchlist", tags=["watchlist"])

class WatchlistAdd(BaseModel):
    symbol: str

@router.get("/")
def get_watchlist(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    items = db.query(models.WatchlistItem).filter(models.WatchlistItem.user_id == current_user.id).all()
    symbols = [item.symbol for item in items]
    
    # Optionally fetch live data for all symbols here or just return symbols
    return {"symbols": symbols}

@router.post("/")
def add_to_watchlist(item: WatchlistAdd, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if already exists
    existing = db.query(models.WatchlistItem).filter(
        models.WatchlistItem.user_id == current_user.id,
        models.WatchlistItem.symbol == item.symbol
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Stock already in watchlist")
        
    new_item = models.WatchlistItem(symbol=item.symbol, user_id=current_user.id)
    db.add(new_item)
    db.commit()
    return {"message": "Added to watchlist", "symbol": item.symbol}

@router.delete("/{symbol}")
def remove_from_watchlist(symbol: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    item = db.query(models.WatchlistItem).filter(
        models.WatchlistItem.user_id == current_user.id,
        models.WatchlistItem.symbol == symbol
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Stock not found in watchlist")
        
    db.delete(item)
    db.commit()
    return {"message": "Removed from watchlist"}
