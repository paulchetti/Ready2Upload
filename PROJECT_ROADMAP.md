# Project Roadmap & Implementation Plan

This roadmap outlines the 20 phased milestones for building the **Standalone AI Content Production Platform**.

---

## Phased Implementation Breakdown

| Phase | Milestone Name | Key Deliverables | Status | Primary Verification |
| :---: | :--- | :--- | :---: | :--- |
| **Phase 1** | **Project Foundation** | Environment setup, project structure, TypeScript configs, ESLint, base scripts. | ✅ Verified | Project builds, scripts run, lint checks pass. |
| **Phase 2** | **Database & Project Models** | SQLite setup, repositories, project CRUD endpoints, state management. | ✅ Verified | Unit tests for DB schema, migrations, and CRUD operations pass. |
| **Phase 3** | **Agent Orchestration Engine** | FSM workflow runner, task queue, event emitter, pause/resume/retry logic. | ✅ Verified | State machine tests, mock task transitions, error recovery pass. |
| **Phase 4** | **Research Agent** | Topic decomposition, source gathering, claim categorization, notes generator. | ✅ Verified | Automated research generation with source citation validation. |
| **Phase 5** | **Creative Agent** | Narrative structure, hook generation, script writing, ContentBlueprint creation. | ✅ Verified | Script structure parsing tests, duration estimation checks. |
| **Phase 6** | **Storyboard System** | Machine-readable scene breakdown, visual & audio requirement mapping. | ✅ Verified | Storyboard JSON schema validation, scene timing sync tests. |
| **Phase 7** | **Media Provider Abstraction** | Provider interfaces (LLM, Image, Voice, Video), MockProvider suite, Gemini. | ✅ Verified | Interface tests, switching providers dynamically via config. |
| **Phase 8** | **Image Generation Agent** | Scene visual prompt generator, batch generation, asset cataloging. | ✅ Verified | Image generation and file storage verification. |
| **Phase 9** | **Voice & Audio Agent** | Text-to-speech synthesis, scene audio stems, loudness normalization (LUFS). | ✅ Verified | Audio playback verification, LUFS metering, timing extraction. |
| **Phase 10** | **Video Generation Agent** | AI video clip generation for dynamic scenes, aspect ratio conformity. | ✅ Verified | Clip format compliance, duration matching tests. |
| **Phase 11** | **Video Rendering & Editing** | FFmpeg timeline engine, Ken Burns pan/zoom, transitions, audio mixing. | ✅ Verified | End-to-end MP4 rendering test from image/audio/clip inputs. |
| **Phase 12** | **Subtitle System** | SRT/VTT generation, word/sentence timestamp synchronization, styling. | ✅ Verified | Subtitle parsing and video sync validation. |
| **Phase 13** | **Thumbnail Generation** | Concept synthesis, visual prompt execution, text overlay composition. | ✅ Verified | Thumbnail image rendering and resolution verification. |
| **Phase 14** | **Quality Control (QA) Agent** | 15-point verification matrix (audio sync, broken assets, duration, sources). | ✅ Verified | QA test matrix with intentional PASS/WARN/FAIL test cases. |
| **Phase 15** | **Review System** | Interactive preview, scene-level inspection, script editing UI, HTML5 video player. | ✅ Verified | Scene regeneration API tests, review state transitions. |
| **Phase 16** | **Download Center** | Download package builder, ZIP archiver, individual asset downloads. | ✅ Verified | ZIP structure validation, integrity checksum verification. |
| **Phase 17** | **Asset Library & Management** | Cross-project asset catalog, search, preview, reuse, and deletion. | ✅ Verified | Asset tagging and reuse tests. |
| **Phase 18** | **Cost & Budget Management** | Token/compute tracking, spend ledgers, hard limits, budget pause warnings. | ✅ Verified | Budget threshold trigger tests and cost report validation. |
| **Phase 19** | **Background Workers & Queue** | Concurrency limits, job worker pool, crash recovery, SSE live updates. | ✅ Verified | Parallel job execution and resilience under server restart. |
| **Phase 20** | **Production Hardening** | Security review, error boundaries, performance tuning, complete docs. | ✅ Verified | End-to-end autonomous run test, benchmark suite, smoke tests. |

---

## Detailed Phase Execution Criteria

### Phase 1: Project Foundation
* Initialize backend (`express`, `typescript`, `ts-node`, `cors`, `zod`, `dotenv`).
* Initialize frontend (`vite`, `react`, `typescript`, modern dark-mode design system).
* Establish shared types for all project entities, agent states, and provider contracts.
* Provide npm scripts for concurrent dev execution (`npm run dev:all`).

### Phase 2: Database & Project Management
* Configure SQLite database with persistent file location.
* Model `Project`, `Task`, `ContentBlueprint`, `Scene`, `Asset`, `QualityReport`, `CostLedger`.
* Implement REST endpoints:
  * `POST /api/projects` (Create project)
  * `GET /api/projects` (List projects)
  * `GET /api/projects/:id` (Project details & workflow state)
  * `DELETE /api/projects/:id` (Cleanup project & storage)

### Phase 3: Agent Orchestration Engine
* Build the Finite State Machine (FSM):
  `DRAFT -> RESEARCHING -> SCRIPTING -> STORYBOARDING -> GENERATING_MEDIA -> EDITING -> QA_CHECK -> REVIEW -> READY -> COMPLETED`.
* Build step recovery: if any step fails, record error, retain completed assets, and allow single-step retry.
* Implement SSE event channel (`GET /api/projects/:id/stream`) for real-time progress broadcast.

### Phase 4: Research Agent
* Topic analyzer identifies core questions, sub-topics, historical facts, and claims.
* Formats output into structured `research_notes.md` and machine-readable `research_sources.json`.
* Integrates web research tool or fallback LLM factual synthesis with source verification.

### Phase 5: Creative Agent
* Produces `ContentBlueprint`: Title, hook (first 5 seconds), narrative body, call-to-action.
* Computes spoken word counts and projected duration based on target platform pace.
* Supports platform-specific tone adaptations (e.g., fast-paced YouTube Shorts vs. authoritative long-form).

### Phase 6: Storyboard System
* Breaks script into discrete scenes (typically 5 to 15 seconds each).
* Categorizes each scene's media requirement: `IMAGE_ONLY`, `VIDEO_CLIP`, `TEXT_CARD`.
* Produces `storyboard.json` with visual prompts, narration sentences, and transition types.

### Phase 7: Media Provider Abstraction
* Standardize `ILLMProvider`, `IImageProvider`, `IVoiceProvider`, `IVideoProvider`.
* Implement `MockProvider` delivering synthetic images, procedural audio tones, and dummy clips for immediate zero-cost testing.
* Wire real provider adapters (Gemini, OpenAI, ElevenLabs, etc.) through configuration flags.

### Phase 8: Image Generation
* Translates storyboard visual prompts into provider-optimized image generation calls.
* Enforces aspect ratios (16:9 for landscape, 9:16 for portrait, 1:1 for square).
* Persists images into `storage/projects/:id/assets/images/` with metadata records.

### Phase 9: Voice & Audio Generation
* Generates TTS audio files for each scene's narration text.
* Extracts exact speech durations and word timestamps.
* Normalizes audio volume to -14 LUFS standard using audio processing filters.

### Phase 10: Video Generation
* Generates short AI clips for scenes flagged for dynamic video.
* Applies fallback to Ken Burns image animations if video generation is disabled or unconfigured.

### Phase 11: Video Rendering & Editing Engine
* Packages scenes into an automated FFmpeg filtergraph:
  * Static images: pan/zoom effect.
  * Clips: scaled and padded to target resolution.
  * Transitions: cross-fade between scenes.
  * Audio: seamless narration concatenation + ducked background music track.
* Outputs `preview.mp4` and production-grade `final_video.mp4`.

### Phase 12: Subtitle Engine
* Generates `.srt` and `.vtt` files synchronized to voice timestamps.
* Optionally generates burned-in styled subtitles for short-form social videos.

### Phase 13: Thumbnail Generation
* Synthesizes 3 thumbnail concepts based on the video hook.
* Generates the visual backdrop and lays out high-contrast, readable headline typography.
* Saves `thumbnail.png` in standard 1280x720 or 1920x1080 resolution.

### Phase 14: Quality Control (QA) Agent
* Audits all 15 automated validation checks.
* Produces a structured `QualityReport` with `PASS`, `WARN`, or `FAIL` flags.

### Phase 15: Review Stage
* UI dashboard displaying video preview player, scene storyboard cards, script viewer, and QA report.
* Supports one-click scene regeneration (re-generate image, re-synthesize voice, or edit script).

### Phase 16: Download Center & Package Bundler
* Generates standard project deliverables:
  * `final_video.mp4`
  * `thumbnail.png`
  * `subtitles.srt` & `subtitles.vtt`
  * `script.md`
  * `research_notes.md` & `research_sources.json`
  * `metadata.json`
  * `README.md`
* Creates a single-click downloadable `.zip` package.

### Phase 17: Asset Library
* Global media asset viewer indexing all generated images, voice recordings, and video clips across projects.
* Facilitates asset tagging, reuse in subsequent projects, and storage cleanup.

### Phase 18: Cost & Budget Guardrails
* Calculates token usage and estimated API cost per project.
* Enforces hard limits: if project cost reaches `MAX_PROJECT_BUDGET_USD`, pauses execution and prompts user.

### Phase 19: Background Task Runner
* Concurrency control to prevent CPU exhaustion during video rendering.
* Handles job recovery and restart resilience.

### Phase 20: Production Hardening
* Complete test suite (unit, integration, media pipeline).
* Documentation, deployment instructions, and user manual.

---

## 🎬 Add-On Module: Full-Length AI Video Production Engine

### Phase 21: Full-Length Video Production Architecture
* **Visual Director Agent**: Converts scripts into cinematic scene directives, specifying scene purpose, camera perspectives, environment, lighting, mood, color style, transitions, and audio cues.
* **Scene Continuity System**: Maintains visual fidelity across long-form productions with persistent `CharacterProfile`, `LocationProfile`, `ObjectProfile`, and `StyleProfile` manifests.
* **Media Decision Engine**: Intelligently assigns scene media types (`AI_VIDEO`, `AI_IMAGE`, `MAP`, `TEXT_GRAPHIC`, `DIAGRAM`) based on narrative weight, motion requirements, and cost efficiency.
* **Dedicated Prompt Generators**: Automatically crafts multi-part structured prompts (Subject, Environment, Time Period, Action, Composition, Camera, Lighting, Mood, Style, Continuity) for photorealistic images and temporal video clips.
* **Audio Design & Music Director**: Automatically scores video with multi-section themes (Intro, Exploration/Tension, Outro/Resolution) and applies dynamic volume ducking (-14dB) under voice narration, with SFX cues placed at exact timestamps.
* **Master Multi-Track Timeline**: Generates machine-readable `timeline.json` synchronizing visual clips, voice stems, music scoring, SFX cues, and subtitle intervals.
* **Programmatic Graphics Engine**: Generates vector SVG maps, trade routes, statistics callout cards, and architectural diagrams without relying on hallucinated AI text.
* **Production Timeline Workspace & Prompt Inspector**: Interactive React timeline with per-scene inspection, in-place prompt editing, and single-scene asset regeneration.

