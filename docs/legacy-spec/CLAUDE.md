# CLAUDE.md – AI Wardrobe / Outfit Planner App

## Project Overview
**Name:** GardıropAI / OutfitFlow  
**Purpose:** Production-ready AI-powered digital wardrobe app focused on **outfit recommendations & combinations**.  
Users never have to think “what goes with what”. The app generates daily outfits, plans weeks, and lets people share combinations socially (Instagram/TikTok/Reddit style).

Core user pain: Decision fatigue – “Neyi neyle giyeyim?”  
Core value: AI suggests complete outfits from the user’s real clothes + weather + occasion + style, with one-tap save/share.

## Tech Stack (Recommended for Production)
- **Mobile:** React Native (Expo) or Flutter
- **Web:** Next.js
- **Backend:** NestJS (TypeScript) or FastAPI
- **Database:** PostgreSQL + Redis (cache + sessions)
- **Storage:** Cloudflare R2 or AWS S3 (images + video)
- **AI:** 
  - Background removal + tagging: vision model (Replicate / custom / OpenAI Vision)
  - Outfit generation: LLM + structured clothing data (Claude / GPT-4o)
  - Optional virtual try-on: specialized model
- **Auth:** JWT + refresh tokens, OAuth (Google, Apple)
- **Infra:** Docker, Kubernetes, CDN, Sentry, rate limiting

## Key Directories (Suggested Structure)
```
/apps
  /mobile
  /web
/backend
  /src
    /modules
      /auth
      /users
      /wardrobe      # items
      /outfits       # combinations + AI generation
      /social        # posts, feed, comments
      /challenges
    /common
/ai-pipeline       # background jobs for cutout + tagging
```

## Development Rules for Claude Code
- Always write TypeScript with strict types.
- Prefer composition over inheritance.
- Every feature must have acceptance criteria and basic tests.
- Image uploads must go through background processing queue.
- Never store raw bank/finance data (this is wardrobe only).
- Privacy first: user wardrobe is private by default; sharing is explicit.
- Use environment variables for all secrets.
- Follow RESTful conventions; return consistent error shapes.

## Core Workflows Claude Should Implement First
1. User uploads clothing photo → AI removes background + auto-tags category/color/season.
2. User requests “Today’s outfit” → AI generates 3 complete looks from their items + weather.
3. User can edit, save, and share an outfit as a post.
4. Social feed of shared outfits + before/after closet posts.

## Verification
After implementing a feature, provide:
- How to test it end-to-end
- Sample request/response
- Any edge cases handled
