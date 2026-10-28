# DATA_MODELS.md

## User
- id, email, name, avatarUrl, stylePreferences (json), createdAt

## Item (Clothing Piece)
- id, userId
- imageUrl (original), cutoutUrl (AI cleaned)
- category (top, bottom, outer, shoes, accessory, dress, ...)
- subcategory
- colors (array)
- season (spring, summer, fall, winter, all)
- brand, size, notes
- purchasePrice, purchaseDate
- lastWornAt, wearCount
- isPublic (default false)

## Outfit
- id, userId
- name (optional)
- items (array of itemIds or embedded snapshot)
- occasion, weatherSnapshot
- generatedByAI (bool)
- assignedDate (optional)
- createdAt

## Post
- id, userId, outfitId (optional)
- caption, mediaUrls
- likeCount, commentCount
- createdAt

## WearLog
- id, itemId, date, notes

## Relationships
- User 1—N Items
- User 1—N Outfits
- Outfit N—N Items
- Post belongs to User, optionally to Outfit
