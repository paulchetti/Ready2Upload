# Standalone AI Content Production Platform — Architecture Specification

## 1. System Overview & Product Boundary

The **Standalone AI Content Production Platform** is an autonomous, multi-agent virtual studio designed to transform high-level creative prompts into studio-quality, downloadable content packages (YouTube long-form, Shorts, Instagram Reels, X videos, educational explainers).

### Strict Boundary Definition
* **Autonomous Creation:** From prompt to research, scripting, storyboarding, media generation, voice synthesis, video assembly, subtitles, thumbnails, and QA.
* **Controlled Output:** The platform **strictly terminates at the Download Center**. It produces final rendered `.mp4`, `.png`, `.srt`, `.vtt`, `.json`, `.md`, and bundled `.zip` content packages.
* **Zero Direct Publishing:** The system **never** connects to social media OAuth, does not store platform credentials, and never publishes to YouTube, Instagram, X, TikTok, or any third party. The user maintains 100% human-in-the-loop publishing sovereignty.

```
+----------------------------------------------------------------------------------------------------+
|                                    PLATFORM BOUNDARY                                               |
|                                                                                                    |
|  [ User Prompt ]                                                                                   |
|        │                                                                                           |
|        ▼                                                                                           |
|  [ Orchestrator ] ──► [ Research ] ──► [ Creative ] ──► [ Storyboard ]                            |
|                                                                │                                   |
|  [ Download Center ] ◄── [ QA Agent ] ◄── [ Media Engine ] ◄──┘                                    |
|   (MP4, ZIP, SRT)                                                                                  |
+----------------------------------------------------------------------------------------------------+
                                         │  (Human Transfer Only)
                                         ▼
                     [ Manual Creator Upload to Social Platforms ]
```

---

## 2. Multi-Agent System Architecture

Rather than a monolithic prompt loop, the platform uses an **Orchestrator-Worker Multi-Agent Topology** with discrete, deterministic agent states, resumable workflows, and strict output schemas.

```
                           ┌───────────────────────────┐
                           │    ORCHESTRATOR AGENT     │
                           │   (Finite State Machine)  │
                           └─────────────┬─────────────┘
                                         │
     ┌───────────────────┬───────────────┼───────────────┬───────────────────┐
     │                   │               │               │                   │
     ▼                   ▼               ▼               ▼                   ▼
┌───────────┐     ┌───────────┐   ┌─────────────┐  ┌───────────┐     ┌───────────┐
│ RESEARCH  │     │ CREATIVE  │   │ STORYBOARD  │  │   MEDIA   │     │    QA     │
│   AGENT   │────►│   AGENT   │──►│    AGENT    │─►│PRODUCTION │────►│   AGENT   │
│           │     │           │   │             │  │   AGENT   │     │           │
└───────────┘     └───────────┘   └─────────────┘  └─────┬─────┘     └─────┬─────┘
                                                         │                 │
                                                         ▼                 ▼
                                                   ┌───────────┐     ┌───────────┐
                                                   │ RENDERING │     │  EXPORT   │
                                                   │  ENGINE   │────►│   AGENT   │
                                                   │  (FFmpeg) │     │   (ZIP)   │
                                                   └───────────┘     └───────────┘
```

### 2.1 Agent Responsibilities & Data Contracts

| Agent | Input Contract | Primary Duties | Output Deliverables |
| :--- | :--- | :--- | :--- |
| **Orchestrator** | User Project Request | Manages DAG pipeline, tracks state, handles retries, enforces budgets, handles pause/resume. | Project FSM state, event stream, task lifecycle records. |
| **Research Agent** | Topic, Category, Depth | Topic breakdown, web search/knowledge extraction, claim verification, fact vs. opinion separation. | `research_notes.md`, `research_sources.json` |
| **Creative Agent** | Research outputs, Audience, Tone | Defines content angle, creates hook, develops narrative arc, writes spoken script, platform adaptation. | `ContentBlueprint` (Script, Tone, Timing) |
| **Storyboard Agent** | ContentBlueprint, Target Duration | Scene-by-scene temporal breakdown, visual prompts, transition cues, overlay specs. | `storyboard.json` (Array of Scene objects) |
| **Image Agent** | Scene visual requirements | Prompt optimization, style consistency, multi-provider image generation, variant caching. | High-res PNG/JPEG assets with scene metadata |
| **Video Agent** | Dynamic scene flags | Short AI B-roll clip generation, motion interpolation, aspect-ratio conformity. | MP4 clip assets linked to scene IDs |
| **Voice Agent** | Script segments, Voice profile | Text-to-speech synthesis, speech rate control, segment timing extraction, LUFS normalization. | Normalized WAV/MP3 narration stems + timing maps |
| **Subtitle Agent** | Voice timing maps, Script | Sentence/word-level timestamp synchronization, subtitle styling, line-wrap formatting. | `subtitles.srt`, `subtitles.vtt`, ASS styled subtitles |
| **Thumbnail Agent** | Title, Core premise, Visual style | High-impact concept generation, visual prompt execution, text typography composition. | `thumbnail.png` (16:9, 1280x720 / 1920x1080) |
| **Video Editing Agent** | Storyboard, Assets, Audio, Subtitles | Deterministic FFmpeg filtergraph construction, Ken Burns pan/zoom, audio ducking, final MP4 render. | `final_video.mp4`, low-res preview MP4 |
| **QA Agent** | Complete project package | 15-point automated verification: audio sync, missing media, resolution, duration, clipping, sources. | `QualityReport` (PASS / WARN / FAIL) |
| **Export Agent** | Verified project assets | Directory organization, checksum calculation, packaging, ZIP generation, README drafting. | Deliverable Bundle & `project_package.zip` |

---

## 3. Technology Stack & Decision Rationale

### 3.1 Core Architecture
* **Backend Runtime:** **Node.js (v24 LTS)** with **TypeScript**.
  * *Rationale:* As verified during environment inspection, Node v24.19.0 and npm 11.17.0 are natively installed. Modern Node provides native fetch, high-performance async I/O, robust worker threads, and rich media packaging capabilities.
* **Backend Framework:** **Express 5 / Fastify** with typed routing and Server-Sent Events (SSE).
  * *Rationale:* Express provides a battle-tested, lightweight API surface with seamless streaming for live agent progress and SSE updates to the dashboard.
* **Frontend:** **React 18 + Vite + TypeScript**.
  * *Rationale:* Blazing-fast development and build times, modular component hierarchy, high responsiveness for live timeline visualization, and rich media players.
* **Styling & UI:** **Modern Vanilla CSS Design System with Dark Mode Tokens** (Inter/Outfit typography, glassmorphic panels, responsive CSS grid, micro-animations).
  * *Rationale:* Full aesthetic control without brittle external CSS framework version mismatches, conforming to high-end virtual studio design guidelines.
* **Database & Persistence:** **SQLite with Prisma ORM** (or Better-SQLite3).
  * *Rationale:* Zero external dependencies, self-contained single-file storage (`production.db`), ACID compliance, and instant local setup. Can easily migrate to PostgreSQL via Prisma schema if multi-user cloud scaling is desired.
* **Media Processing Engine:** **FFmpeg** orchestrated via `fluent-ffmpeg`, bundled with `ffmpeg-static` and `ffprobe-static`.
  * *Rationale:* Guarantees the application runs completely standalone on any machine (Windows, macOS, Linux) without requiring manual system-level PATH configuration.
* **Task Queue & Async Execution:** **SQLite-backed Persistent Task Queue with In-Memory Worker Concurrency**.
  * *Rationale:* Long-running media generations and FFmpeg renders execute without blocking HTTP requests. Projects can be paused, resumed, or recovered after app restarts without losing completed assets.

---

## 4. Provider-Independent Abstraction Layer

The platform enforces clean adapter interfaces so that any AI model or cloud service can be swapped or customized via `.env` configuration.

```
                      ┌────────────────────────────┐
                      │    Media Provider Hub      │
                      └──────────────┬─────────────┘
                                     │
         ┌───────────────────┬───────┴───────────┬───────────────────┐
         ▼                   ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   ILLMProvider  │ │ IImageProvider  │ │  IVoiceProvider │ │ IVideoProvider  │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │                   │
   ┌─────┴─────┐       ┌─────┴─────┐       ┌─────┴─────┐       ┌─────┴─────┐
   │ • Gemini  │       │ • Imagen  │       │ • Eleven  │       │ • Runway  │
   │ • OpenAI  │       │ • DALL-E3 │       │ • OpenAI  │       │ • Luma    │
   │ • Claude  │       │ • SDXL    │       │ • EdgeTTS │       │ • Kling   │
   │ • Mock    │       │ • Mock    │       │ • Mock    │       │ • Mock    │
   └───────────┘       └───────────┘       └───────────┘       └───────────┘
```

### 4.1 Mock Provider for Zero-Cost Local Testing
Every provider includes a robust `MockProvider` implementation. This allows:
1. Complete end-to-end integration and UI testing without consuming paid API credits.
2. Generating test procedural color card images, synthetic audio waveforms, and simulated video clips.
3. Offline development and verification of all pipeline steps.

---

## 5. Media Assembly & FFmpeg Rendering Pipeline

The editing engine creates a deterministic FFmpeg command tree based on the `storyboard.json` recipe:

1. **Visual Track Processing:**
   * Static images: Applied with Ken Burns pan/zoom via `-filter_complex "zoompan=z='min(zoom+0.0015,1.2)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080"`.
   * Video clips: Normalized with `scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30`.
2. **Audio Track Processing:**
   * Individual scene narration audio clips concatenated seamlessly.
   * EBU R128 loudness normalization applied targeting -14 LUFS (YouTube/streaming standard).
   * Optional background music track mixed with automatic ducking during active speech segments.
3. **Subtitles & Overlays:**
   * Text overlays and subtitle burning via `subtitles=subtitles.srt:force_style='FontSize=22,PrimaryColour=&H00FFFFFF,BorderStyle=3,Outline=2'`.
4. **Export Rendering:**
   * Fast preview render: `libx264 -preset ultrafast -crf 28`.
   * Master final render: `libx264 -preset slow -crf 18 -c:a aac -b:a 320k -pix_fmt yuv420p -movflags +faststart`.

---

## 6. Storage Model & Content Package Structure

Project data is strictly partitioned into **relational metadata** (SQLite) and **binary assets** (local storage directory).

```
storage/projects/{project_id}/
├── assets/
│   ├── images/
│   │   ├── scene_01_v1.png
│   │   └── scene_02_v1.png
│   ├── video_clips/
│   │   └── scene_03_clip.mp4
│   └── audio/
│       ├── narration_01.wav
│       ├── narration_02.wav
│       └── background_music.mp3
├── renders/
│   ├── preview.mp4
│   └── final_video.mp4
├── research/
│   ├── research_notes.md
│   └── research_sources.json
├── content/
│   ├── script.md
│   ├── storyboard.json
│   ├── ContentBlueprint.json
│   ├── thumbnail.png
│   ├── subtitles.srt
│   └── subtitles.vtt
├── metadata.json
├── README.md
└── {project_slug}_package.zip
```

---

## 7. Quality Control & Automated Guardrails

Before a project is marked `READY` for download, the **QA Agent** executes a 15-point verification matrix:

1. **Script Completeness:** Verification that all scenes have matching spoken narration text.
2. **Scene Coverage:** Verification that 100% of scenes possess a rendered image or video clip.
3. **Asset Integrity:** Check that all files exist on disk, have non-zero byte length, and pass format validation.
4. **Audio Normalization:** Verification that final audio adheres to -14 LUFS ± 1.5 LUFS.
5. **Audio-Visual Duration Match:** Verification that audio length matches total video container duration within 0.25s.
6. **Subtitle Sync:** Check that subtitle entry timestamps align with voice segment start and end markers.
7. **Aspect Ratio Enforcement:** Check that final output matches requested format (16:9, 9:16, 1:1).
8. **Resolution & Bitrate Standards:** Validate minimum 1080p output and appropriate video bitrate.
9. **Spelling & Duplicate Detection:** Text inspection for duplicated script lines or parsing hallucinations.
10. **Fact & Source Consistency:** Ensure factual claims have source citations in `research_sources.json`.
11. **Cost & Budget Limits:** Verify project spend did not exceed the user-defined threshold.
12. **Thumbnail Presence:** Confirm high-resolution thumbnail generation.
13. **Package Bundling:** Ensure all download artifacts are ready for single or bulk ZIP extraction.
14. **Container Compliance:** Fast-start MP4 flag validation for immediate streaming compatibility.
15. **Error & Warning Scoring:** Compute overall status (`PASS`, `WARN`, or `FAIL`) with actionable remediation steps.

---

## 8. Security, Isolation & Safety Architecture

* **No Arbitrary Code/Command Execution:** All FFmpeg commands and file operations use sanitized, parameter-bound arguments without raw shell string concatenation.
* **Path Traversal Protection:** All project directories are strictly resolved within the configured `STORAGE_DIR`, rejecting any `..` or illegal path characters.
* **Credential Isolation:** All API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.) are held exclusively in server environment memory and are never sent to the browser.
* **Cost Controls:** Hard limits on maximum tokens per prompt, maximum image generation calls per project, and configurable maximum cost thresholds. Generation automatically pauses if budget limits are hit.
