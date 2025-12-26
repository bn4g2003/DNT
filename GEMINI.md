# GEMINI.md - Project Analysis: EduManager Pro

## Project Overview

This project is **EduManager Pro**, a comprehensive web application designed to manage the operations of an education center. It is built as a single-page application (SPA) using a modern frontend stack.

-   **Core Technologies:**
    -   **Framework:** React
    -   **Language:** TypeScript
    -   **Build Tool:** Vite
    -   **Routing:** React Router (`react-router-dom`)
    -   **Styling:** The project appears to use a utility-first CSS framework like Tailwind CSS, based on the class names used in the components.
    -   **Data Visualization:** `recharts` is used for creating charts on the dashboard.
    -   **Icons:** `lucide-react` provides the icon set.

-   **Architecture:**
    -   The application is structured with a main layout containing a persistent sidebar for navigation and a header.
    -   Routing is centralized in `App.tsx`, mapping URL paths to specific page components.
    -   Components are organized into `pages` (for top-level feature views like `Dashboard`, `StudentManager`, etc.) and `components` (for reusable elements like `Sidebar`, `Header`).
    -   All core data structures and types are centrally defined in `types.ts`, providing a clear and consistent data model for the application.
    -   The application uses mock data from `mockData.ts` for development, as real backend APIs are not yet integrated.

-   **Key Features (Inferred from routing and components):**
    -   **Dashboard:** An overview of key metrics, schedules, and alerts.
    -   **Training Management:** Handling classes, schedules, attendance, holidays, and tutoring.
    -   **Customer Management:** Managing student and parent information, including different student statuses (active, dropped, trial).
    -   **HR Management:** Staff information, salary configuration, work confirmation, and salary reports.
    -   **Finance & Reports:** Basic financial tracking (invoices) and reporting.
    -   **Settings:** Configuration for core entities like staff, products (course packages), inventory, and rooms.

## Building and Running

### Prerequisites

-   Node.js must be installed.
-   A Gemini API key needs to be set in a `.env.local` file (as per `README.md`).

### Key Commands

-   **Install Dependencies:**
    ```bash
    npm install
    ```

-   **Run in Development Mode:** Starts a local development server with hot-reloading.
    ```bash
    npm run dev
    ```

-   **Build for Production:** Compiles and minifies the application for deployment.
    ```bash
    npm run build
    ```

-   **Preview Production Build:** Serves the production build locally to test it before deployment.
    ```bash
    npm run preview
    ```

## Development Conventions

-   **TypeScript:** The entire codebase is written in TypeScript, ensuring type safety. Core data models are defined in `types.ts`.
-   **Component-Based Architecture:** The UI is built using React components, organized by feature into the `pages` directory and shared components in the `components` directory.
-   **Centralized Routing:** All application routes are defined in `App.tsx` using `react-router-dom`.
-   **Styling:** CSS classes (e.g., `flex`, `p-6`, `text-lg`) strongly suggest the use of Tailwind CSS.
-   **State Management:** For the currently inspected components, state is managed locally with React hooks (`useState`). A more complex global state management solution is not apparent from the initial analysis.
-   **Data:** The application currently relies on mock data defined in `mockData.ts`. There is no evidence of live API integration yet.
