# Standalone AI Content Production Platform

> **An autonomous, multi-agent AI virtual studio that transforms high-level creative prompts into studio-quality, downloadable content packages.**

---

## 🎯 Product Vision & Core Principle

This platform behaves like a complete virtual content production team for creators. The user inputs a simple creative goal, such as:

> *"Create a 10-minute YouTube video explaining the archaeological and historical evidence for the Tower of Babel."*  
> or  
> *"Create a 60-second high-energy Instagram Reel about supermassive black holes."*

The system independently coordinates research, scriptwriting, scene storyboarding, image/clip generation, voice synthesis, automated video assembly with motion effects, subtitle generation, thumbnail creation, and 15-point quality control.

### 🛡️ Critical Product Boundary: 100% Creator Controlled
* **Autonomous in Creation — Controlled in Publishing:**
* **Zero Automatic Publishing:** The platform **strictly does not publish to YouTube, Instagram, X, TikTok, or Facebook**. It does not request or store social media credentials.
* **Download-First Delivery:** The platform terminates at a comprehensive **Download Center**, providing:
  * Final rendered `.mp4` video (1080p / 4K)
  * High-contrast thumbnail (`.png`)
  * Synced subtitles (`.srt` and `.vtt`)
  * Spoken script (`.md`)
  * Storyboard breakdown (`.json`)
  * Verified research dossier (`research_notes.md` & `research_sources.json`)
  * Complete bundled `.zip` content package

---

## 🏗️ Multi-Agent Architecture

The system avoids monolithic prompt loops by deploying an **Orchestrator Agent** that coordinates specialized agents through a resumable, state-persisted workflow:

```
                            ┌────────────────────────┐
                            │   ORCHESTRATOR AGENT   │
                            └───────────┬────────────┘
                                        │
     ┌──────────────────┬───────────────┼───────────────┬──────────────────┐
     │                  │               │               │                  │
     ▼                  ▼               ▼               ▼                  ▼
┌───────────┐    ┌───────────┐   ┌─────────────┐  ┌───────────┐     ┌───────────┐
│ RESEARCH  │    │ CREATIVE  │   │ STORYBOARD  │  │   MEDIA   │     │    QA     │
│   AGENT   │───►│   AGENT   │──►│    AGENT    │─►│PRODUCTION │────►│   AGENT   │
│           │    │           │   │             │  │   AGENT   │     │           │
└───────────┘    └───────────┘   └─────────────┘  └─────┬─────┘     └─────┬─────┘
                                                        │                 │
                                                        ▼                 ▼
                                                  ┌───────────┐     ┌───────────┐
                                                  │ RENDERING │     │  EXPORT   │
                                                  │  ENGINE   │────►│   AGENT   │
                                                  │  (FFmpeg) │     │   (ZIP)   │
                                                  └───────────┘     └───────────┘
```

---

## ⚡ Key Capabilities

1. **Format & Aspect Ratio Engine:**
   * **16:9 Landscape:** YouTube Long-form, documentaries, explainers.
   * **9:16 Vertical:** YouTube Shorts, Instagram Reels, TikTok.
   * **1:1 Square:** Social feeds & carousels.
2. **Provider-Independent Media Engine:**
   * Works out-of-the-box with a built-in **MockProvider** for zero-cost local testing without requiring paid API keys.
   * Pluggable adapters for **Google Gemini**, **OpenAI**, **ElevenLabs**, **Stability AI**, **Runway**, etc.
3. **Deterministic Video Editing (FFmpeg):**
   * Ken Burns motion effects (pan/zoom) on images.
   * Dynamic video clip splicing.
   * Audio ducking (background music automatically lowers during voice narration).
   * EBU R128 loudness normalization (-14 LUFS standard).
4. **15-Point Automated QA Check:**
   * Automated verification of audio sync, scene coverage, video resolution, duration matching, source attribution, and spelling before export.
5. **Creator Memory & Preferences:**
   * Remembers brand guidelines, preferred tone, voice profiles, default aspect ratios, and visual styles.
6. **Budget & Cost Guardrails:**
   * Per-project and daily spending caps. Automatically pauses generation if limits are exceeded.

---

## 📁 Repository Structure

```
Ready2Upload/
├── backend/                  # Node.js + TypeScript API server & Agent Orchestrator
│   ├── src/
│   │   ├── agents/           # Orchestrator, Research, Creative, Media, QA, Export
│   │   ├── providers/        # LLM, Image, Voice, and Video provider adapters
│   │   ├── pipeline/         # FFmpeg video rendering, audio mixing, subtitles
│   │   ├── queue/            # Background job queue & worker concurrency
│   │   ├── db/               # SQLite database schemas and models
│   │   ├── routes/           # REST API endpoints & SSE real-time stream
│   │   └── storage/          # Media and project storage abstraction
│   └── tests/                # Unit, integration, and media pipeline tests
├── frontend/                 # React 18 + Vite dashboard
│   ├── src/
│   │   ├── components/       # Storyboard cards, Timeline, Audio/Video player, Review
│   │   ├── pages/            # Create, Projects, LiveView, DownloadCenter, Settings
│   │   └── services/         # API & SSE client
├── storage/                  # Generated assets, clips, and download packages
├── ARCHITECTURE.md           # In-depth system architecture & specifications
├── PROJECT_ROADMAP.md        # 20-phase implementation plan
├── .env.example              # Environment variables template
└── README.md                 # Project guide & quickstart
```

---

## 🚀 Quickstart Guide

### Prerequisites
* **Node.js:** v18+ (v24 LTS recommended)
* **npm:** v9+

### Setup
1. Clone or navigate to the repository directory:
   ```bash
   cd Ready2Upload
   ```
2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies and start the local environment:
   ```bash
   npm run setup
   npm run dev
   ```
4. Access the studio dashboard at: `http://localhost:5173`

---

## 📄 License & Independence Notice

This project is completely standalone and operates independently from any other application or external publishing pipeline.
