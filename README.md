# Tristan Edgina — Creative Engineering Portfolio

<p align="center">
  <img src="https://github.com/masterdorime/masterdorime/blob/main/ascii-art%20(8).png" alt="Tristan Edgina" width="160" style="border-radius: 50%;" />
</p>

<p align="center">
  <strong>A portfolio built at the intersection of physical engineering, software, and experimental interfaces.</strong>
</p>

<p align="center">
  <a href="https://tristanedgina-portofolio.vercel.app">Live Site</a>
  ·
  <a href="https://github.com/masterdorime/portofolio-websites">Source</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Three.js-WebGL-black?style=flat-square&logo=threedotjs" alt="Three.js" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vitest-Tests-6e9f18?style=flat-square&logo=vitest" alt="Vitest" />
</p>

---

## Overview

This is the personal portfolio of **Tristan Edgina**, a Computer Engineering undergraduate at Telkom University, Bandung.

The site is intentionally not structured like a conventional developer portfolio. Instead, it treats the portfolio itself as an engineering project: physical systems, software, interaction design, 3D graphics, motion, and visual storytelling are presented through one cohesive interface.

The underlying idea is simple:

> **Build things that work, then wrap them in interfaces that make sense.**

The portfolio showcases real hardware-oriented projects alongside the software and frontend systems used to present them.

---

## What Makes It Different

### Physical engineering meets frontend engineering

The portfolio is designed around projects that cross the boundary between software and the physical world:

- AI-assisted embedded systems
- Water filtration and sensing
- Wearable thermal systems
- IoT and sensor-driven prototypes
- Edge inference
- Custom hardware
- Interactive WebGL experiences

The interface reflects that same mindset. It uses motion, 3D rendering, shaders, custom interaction systems, and responsive layouts as functional parts of the experience rather than decoration.

### Experimental visual direction

The visual system combines:

- Industrial neo-minimalism
- Retro-dreamy atmosphere
- Dark interfaces
- Analog-inspired textures
- Technical typography
- Cinematic motion
- Interactive 3D
- Subtle shader effects

The design deliberately avoids generic dashboard layouts, excessive neon cyberpunk styling, and template-driven portfolio patterns.

---

## Features

### Interactive landing experience

- Responsive hero section
- Interactive 3D character experience
- Cursor-reactive elements
- Custom motion primitives
- Smooth scrolling
- Atmospheric visual effects
- Reduced-motion handling

### Project laboratory

Projects are stored as structured data rather than being hardcoded directly into individual UI components.

Each project can contain:

- Cover image
- Gallery
- Category
- Year
- Description
- Problem statement
- Engineering approach
- Technology stack
- Hardware breakdown
- Dedicated case-study route

Current project categories:

| Category | Focus |
| -------- | ----- |
| AI | Embedded AI and edge inference |
| IoT | Connected and sensor-driven systems |
| Hardware | Physical engineering and electronics |

### Skills matrix

The portfolio includes an interactive skill system spanning:

- Frontend
- Backend
- Tools
- Infrastructure
- DevOps
- Observability
- Soft skills

The skill graph is represented as typed data and can calculate relationships between skills and their respective hubs.

### Experience archive

Competition and experience material is organized as reusable slide collections rather than isolated static sections.

Current archives include:

- Generasi Terampil
- JISF
- Samsung Innovation Campus
- SRC 2025
- Additional archive material

### Terminal interface

A state-driven terminal experience provides commands for navigating portfolio information.

Available commands:

`help` · `whoami` · `status` · `contact` · `socials` · `projects` · `clear`

### Internationalization

The site supports English and Indonesian content through a centralized dictionary and language provider.

This keeps:

- UI copy
- Project descriptions
- About content
- Terminal responses
- Navigation
- Form labels

separate from presentation logic.

---

## Featured Projects

### Urocheck

**Portable AI urine analysis device**

A compact screening concept combining optical sensing, embedded systems, and local AI inference.

**Core technologies**

- Embedded C
- AI inference
- Optical sensor arrays
- UART / I2C
- Microcontroller
- Custom sampling hardware

### Puresip

**Ultrafiltration straw with live water-quality sensing**

A portable filtration concept combining hollow-fiber ultrafiltration with live turbidity and TDS monitoring.

**Core technologies**

- Hollow-fiber ultrafiltration
- Turbidity sensing
- TDS sensing
- Low-power MCU
- Embedded electronics

### Techware

**AI-assisted thermal jacket**

A wearable thermal-control concept using distributed sensing and thermal elements to dynamically respond to environmental and body-temperature changes.

**Core technologies**

- Thermal control
- Wearable sensors
- Edge inference
- BLE
- Flexible power systems

### H2orizon

**Smart water bottle with ultrafiltration and micro-pump**

A rugged portable water system combining filtration, active pumping, and real-time water-quality sensing.

**Core technologies**

- Ultrafiltration
- Micro diaphragm pump
- TDS / turbidity sensing
- Low-power MCU
- Rechargeable LiPo system

---

## Technology Stack

### Core

| Technology | Role |
| ---------- | ---- |
| Next.js 16 | Application framework, routing, metadata, rendering |
| React 19 | UI architecture |
| TypeScript 5.9 | Static typing |
| Tailwind CSS 4 | Styling and design tokens |

### 3D and Graphics

| Technology | Role |
| ---------- | ---- |
| Three.js | WebGL / 3D rendering |
| React Three Fiber | React-based Three.js architecture |
| @react-three/drei | Three.js utilities and helpers |
| @react-three/rapier | Physics |
| GLSL | Custom shader effects |
| OGL | Lightweight graphics primitives |
| Meshopt | 3D asset optimization |

### Motion and Interaction

| Technology | Role |
| ---------- | ---- |
| Framer Motion | UI animation and spring physics |
| GSAP | Timeline and advanced motion |
| Lenis | Smooth scrolling |
| @use-gesture/react | Gesture interaction |
| Ponytail | Interactive visual effects |

### Tooling

| Technology | Role |
| ---------- | ---- |
| Vitest | Automated tests |
| Sharp | Image processing |
| glTF Transform | 3D asset optimization |
| Puppeteer Core | Browser automation / visual tooling |
| PostCSS | CSS processing |

---

## Architecture

The application follows a feature-oriented structure inside the Next.js App Router.

```text
.
├── public/
│   ├── images/
│   └── models/
│
├── src/
│   ├── app/
│   │   ├── projects/
│   │   ├── support/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── sitemap.ts
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── about/
│   │   ├── atmosphere/
│   │   ├── contact/
│   │   ├── cursor/
│   │   ├── landing/
│   │   ├── motion/
│   │   ├── nav/
│   │   ├── projects/
│   │   ├── terminal/
│   │   ├── three/
│   │   ├── theme/
│   │   └── ui/
│   │
│   ├── data/
│   │   ├── experience.ts
│   │   ├── projects.ts
│   │   ├── site.ts
│   │   └── skills.ts
│   │
│   ├── i18n/
│   │   ├── dict.ts
│   │   └── LanguageProvider.tsx
│   │
│   └── lib/
│
├── docs/
├── scripts/
├── next.config.ts
├── opencode.json
├── package.json
├── tsconfig.json
└── vitest.config.ts
