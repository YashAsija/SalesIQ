# SalesIQ Hindsight Portal

**SalesIQ Hindsight Portal** is an advanced B2B Enterprise Sales Intelligence Engine designed to act as a dynamic, interactive memory bank and strategic assistant for sales representatives. It tracks high-stake account data, logs negotiations, and uses AI-powered hindsight models to build "Deal Readiness" metrics.

🌟 **Live Demo:** [https://salesiq-5tgz.onrender.com/](https://salesiq-5tgz.onrender.com/)

## 🚀 Key Features

*   **Dynamic Account Focus:** Manage multiple high-stake buyers. Switching "Focus Rooms" instantly adapts the dashboard and memory ledgers to the targeted client.
*   **Memory Inspector & Ledger:**
    *   **World Facts:** Hard parameters, legal constraints, and deal rules.
    *   **Experiences:** Logged interactions, milestones, and meeting summaries.
    *   **Mental Models:** AI-synthesized heuristics and strategic buyer beliefs.
    *   **Safety Deletion:** Secure confirmation prompts before dropping memory assertions.
    *   **AI Tag Suggestions:** Automatically generate categorical tags for your negotiation logs using intelligent Gemini analysis.
*   **Persistent AI Chat Assistant:** A highly visible, highly interactive floating AI assistant tailored precisely to the active Account Focus context.
*   **Authentication Hub:** Built-in Firebase authentication supporting standard Email/Password and Google OAuth sign-in with full fallback support for offline or mock demo scenarios.
*   **Responsive Fluid Interface:** Designed with a meticulously crafted dark/light mode UI that effortlessly scales from mobile phones to high-resolution desktop environments without breaking aspect ratios or text alignment.

## 🛠️ Technology Stack

*   **Frontend:** React (TypeScript), Vite, TailwindCSS, Motion (Framer Motion)
*   **Icons & Assets:** Lucide React
*   **Backend & Data:** Node.js API layer with simulated database integration, Firebase Authentication & Firestore (optional config)
*   **AI Integration:** Gemini API for intelligent text summarization and categorization

## ⚙️ Getting Started

### Prerequisites
*   Node.js installed (v18+ recommended)
*   A valid Gemini API Key

### Installation

1.  **Clone the repository** (or download the source code).
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add your API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```
4.  **Run the local development server:**
    ```bash
    npm run dev
    ```
5.  Access the app at `http://localhost:3000`.

## 🎨 Architecture & UI Design
The interface relies heavily on modern glassmorphism, responsive grid layouts, and context-aware styling. Components such as the `MemoryInspector` and `AuthScreen` use carefully managed React Contexts to synchronize the view states across the application without jarring page reloads.
