#  FamilIAgenda: Smart Family Calendar - Project Overview

## 1. Introduction

FamilIAgenda is a modern, intelligent family calendar application designed to streamline family organization and communication. It provides a centralized platform for managing events, tasks, and communication, with a focus on ease of use and intelligent features. The application leverages a powerful combination of a FastAPI backend, a React frontend, and a Supabase database to deliver a seamless and responsive user experience.

## 2. Core Features

*   **Shared Family Calendar:** A centralized calendar for managing family events, appointments, and schedules.
*   **AI-Powered Event Creation:** Utilizes Google Gemini to enable users to create events using natural language.
*   **Task Management:** A comprehensive task management system for assigning and tracking family chores and responsibilities.
*   **Real-Time Family Chat:** A built-in chat feature for instant communication and coordination among family members.
*   **Intelligent Notifications:** Customizable reminders and alerts to keep everyone informed about upcoming events and tasks.
*   **Secure Authentication:** A robust authentication system using JWT and bcrypt to ensure data privacy and security.
*   **Responsive Design:** A mobile-first design that works seamlessly across all devices.

## 3. Technology Stack

### Backend

*   **Framework:** FastAPI
*   **Database:** PostgreSQL (Supabase)
*   **ORM:** SQLModel
*   **Authentication:** JWT (JSON Web Tokens)
*   **AI:** Google Gemini
*   **Real-Time Communication:** WebSockets

### Frontend

*   **Framework:** React 18
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Styling:** TailwindCSS
*   **Routing:** React Router

## 4. Architecture

### Client-Server Model

The application follows a traditional client-server architecture, with a React single-page application (SPA) communicating with a FastAPI backend via a RESTful API. The backend handles all business logic, data persistence, and communication with external services.

### Database Schema

The database schema is designed to be user-centric, with each user having their own account and the ability to belong to multiple families. The core tables include `users`, `families`, `events`, `tasks`, and `messages`. The full schema is detailed in the `DATABASE_DOCUMENTATION.md` file.

### API Design

The API is designed to be RESTful and follows best practices for API design. The endpoints are organized by resource and are documented in the `README.md` file.

## 5. Getting Started

To get started with the project, please refer to the `README.md` file for detailed instructions on how to set up and run the project locally.

## 6. Deployment

The application is designed to be deployed on Render (backend) and Vercel (frontend). The `DEPLOYMENT.md` file provides a comprehensive guide to deploying the application to a production environment.

## 7. Project Structure

```
FamilIAgenda/
├── app/                    # Backend (FastAPI)
│   ├── routers/           # API endpoints
│   ├── models.py          # Database models
│   ├── schemas.py         # Pydantic schemas
│   ├── database.py        # DB configuration
│   ├── security.py        # JWT authentication
│   └── main.py            # Entry point
├── pages/                 # Frontend pages (React)
├── components/            # Reusable components
├── context/               # React contexts
├── services/              # API services
├── .env.example           # Environment variables template
├── DEPLOYMENT.md          # Deployment guide
└── requirements.txt       # Python dependencies
```
