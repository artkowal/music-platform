# 🎵 Music Lesson Management Platform

A web platform for managing individual music lessons between teachers and students.

---

## 🚀 Tech Stack

-   **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui
-   **Backend:** Node.js, Express.js
-   **Database:** MySQL
-   **Environment:** Docker & Docker Compose
-   **Tooling:** PhpMyAdmin, Swagger

---

## 🛠️ Getting Started

This project is fully containerized. A single command will build and run the entire development environment.

### Prerequisites

-   You must have **Docker Desktop** installed and running on your system.

### 1. Run the Environment

1.  Clone this repository to your local machine.
2.  Open a terminal in the project's root directory.
3.  Run the following command:

    ```bash
    docker-compose up --build
    ```

    This will build the `client` and `server` images, pull the `mysql` and `phpmyadmin` images, and start all services. The frontend and backend will auto-reload when you make changes to the code.

### 2. Accessing Services

Once all containers are running, the services will be available at these local addresses:

| Service | Local URL | Notes |
| :--- | :--- | :--- |
| **Frontend** | `http://localhost:5173` | React/Vite App (with HMR) |
| **Backend API** | `http://localhost:5001` | Express.js API |
| **API Docs** | `http://localhost:5001/api-docs` | Swagger UI |
| **PhpMyAdmin** | `http://localhost:8081` | Database Management |
| **Database** | `localhost:3308` | Port for external SQL clients |

---

## 🗃️ Database

The database is **automatically created and initialized** on the first run.

The `docker-compose.yml` file maps the `./database` folder to the MySQL container's initialization directory. Any `.sql` files in that folder (like `init.sql`) are automatically executed when the `db` container starts for the first time.

-   **Host:** `db` (for internal container communication)
-   **User:** `root`
-   **Password:** `admin`
-   **Database Name:** `music-platform-db`

---

## 💡 Common Tasks

### How to Reset the Database

If you make changes to `init.sql` or want to clear all data and start fresh:

1.  Stop the containers and **remove the persistent volume**:
    ```bash
    docker-compose down -v
    ```
2.  Restart the environment. This will force Docker to re-create the database from scratch:
    ```bash
    docker-compose up --build
    ```

### How to Access a Container Shell

If you need to run commands (like `npm install`) inside a running container:

-   **Frontend Container:**
    ```bash
    docker-compose exec frontend sh
    ```
-   **Backend Container:**
    ```bash
    docker-compose exec backend sh
    ```