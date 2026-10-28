# SPEC.md – AI Wardrobe App (Outfit Recommendation Focus)

## Problem
People own many clothes but still stare at the closet every morning thinking “What should I wear with this?”  
They love sharing outfit ideas and closet organization on Instagram, TikTok, and Reddit.

## Solution
An app that:
1. Digitizes the user’s real wardrobe (photos + AI tags).
2. Instantly generates complete outfits (top + bottom + shoes + outer + accessories) based on weather, occasion, mood, and style.
3. Lets users plan days/weeks.
4. Lets users share combinations publicly so others can get inspiration (social layer like Instagram/TikTok).

## Target Users
- Young adults who follow fashion and organization content.
- People who want to wear what they already own (sustainability).
- Users who enjoy “outfit of the day” content.

## Must-Have Features (MVP → Production)

### 1. Digital Wardrobe
- Upload photo of item (camera or gallery)
- AI background removal (clean cutout)
- Auto detection: category, subcategory, dominant colors, season, pattern
- Manual edit tags (brand, size, notes, purchase date/price)
- Search & filter by color, category, season, “not worn in 30 days”

### 2. AI Outfit Generation (Core Differentiator)
- **Daily Outfit**: 3 suggestions every morning based on:
  - Current weather (temp, rain)
  - Calendar events (optional)
  - User style preferences
  - Items not worn recently
- **Occasion-based**: “Work”, “Date night”, “Casual weekend”, “Gym”, “Travel”
- **Item-led**: Select one piece → “Build outfits around this”
- **Week planner**: Generate 7 looks at once
- Each outfit is a complete look (at least top + bottom + shoes)
- User can swap any piece, regenerate, or save

### 3. Planning & Calendar
- Assign outfit to a date
- Packing list for trips (select destination + dates → AI suggests from wardrobe)
- “What I wore” log (mark as worn → updates cost-per-wear)

### 4. Social Layer (Share Combinations)
- Post an outfit (auto-generated collage or photo)
- Caption + hashtags (#kombin, #ootd, #gardırop)
- Feed of public outfits
- Like, comment, save
- Follow users
- Challenge posts (e.g. “30 days of outfits from existing clothes”)

### 5. Analytics
- Cost per wear
- Most / least worn items
- Color palette analysis
- “You haven’t worn these in 60 days”

## Non-Goals (Out of Scope for v1)
- Full virtual try-on on user’s body
- Marketplace selling clothes
- Bank/finance integration

## Success Metrics
- % of users who generate at least 1 outfit per day
- Number of outfits shared
- Retention (day 7 and day 30)

## Acceptance Criteria Examples
- Given a user with 20+ items, when they request “Today’s outfit” with weather 18°C and no rain, the system returns at least 2 complete outfits containing only their items.
- Background removal completes within 10 seconds for a single photo.
- Shared outfit appears in the public feed within 2 seconds.
