# API.md – AI Wardrobe App

Base URL: `https://api.example.com/v1`

All authenticated endpoints require `Authorization: Bearer <token>`

## Auth
- `POST /auth/register` – { email, password, name }
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`

## Wardrobe Items
- `GET /items` – list (query: category, color, season, limit, offset)
- `POST /items` – multipart form (image file) → returns item with AI tags
- `GET /items/:id`
- `PATCH /items/:id` – update tags, notes, etc.
- `DELETE /items/:id`
- `POST /items/:id/wear` – log as worn today

## Outfits (Combinations)
- `POST /outfits/generate` 
  Body: { occasion?, date?, weather?, itemId? (build around this), count?: 3 }
  Response: array of outfits, each with items + reason
- `GET /outfits` – user’s saved outfits
- `POST /outfits` – save generated or manual outfit
- `GET /outfits/:id`
- `DELETE /outfits/:id`
- `POST /outfits/:id/assign` – { date } assign to calendar

## Social
- `GET /feed` – public outfits + posts
- `POST /posts` – create post from outfit or free photo
- `GET /posts/:id`
- `POST /posts/:id/like`
- `POST /posts/:id/comments`
- `GET /users/:id/outfits` – public outfits of a user

## Other
- `GET /weather/current` – (or use client location)
- `GET /stats` – cost-per-wear, unused items, etc.

## Example Generate Request
```json
{
  "occasion": "casual",
  "date": "2026-10-27",
  "count": 3
}
```

## Example Response Item in Outfit
```json
{
  "id": "outfit_123",
  "items": [
    { "id": "item_1", "name": "White shirt", "category": "top", "imageUrl": "..." },
    { "id": "item_2", "name": "Blue jeans", "category": "bottom", "imageUrl": "..." }
  ],
  "reason": "Cool 18°C day, casual vibe, these pieces match well and jeans haven't been worn in 12 days."
}
```
