# 🎵 Music Lesson Management Platform

A web platform for managing individual music lessons between teachers and students.

---

## 🚀 Tech Stack

-   **Frontend:** React, Vite, TypeScript, Tailwind CSS (pending setup), shadcn/ui (pending setup)
-   **Backend:** Node.js, Express.js
-   **Database:** MySQL
-   **Environment:** Docker & Docker Compose
-   **Tooling:** PhpMyAdmin

---

## 🛠️ Getting Started

This project is fully containerized. A single command will build and run the entire development environment.

### Prerequisites

-   You must have **Docker Desktop** installed and running on your system.

### 1. Run the Environment

1.  Clone this repository to your local machine.
2.  Open a terminal in the project's root directory (`MUSIC-PLATFORM/`).
3.  Run the following command:

    ```bash
    docker-compose up --build
    ```

    This will build the `client` and `server` images, pull the `mysql` and `phpmyadmin` images, and start all services.

### 2. Accessing Services

Once all containers are running, the services will be available at these local addresses:

| Service | Local URL | Notes |
| :--- | :--- | :--- |
| **Frontend** | `http://localhost:5173` | React/Vite App (with HMR) |
| **Backend** | `http://localhost:5001` | Express.js API |
| **PhpMyAdmin** | `http://localhost:8081` | Database Management |
| **Database** | `localhost:3308` | Port for external SQL clients |

---

## ⚙️ Post-Setup: Initializing Tailwind & shadcn/ui

This project is pre-configured for shadcn/ui, but it must be **initialized** inside the running container after the first launch.

1.  Ensure the containers are running (`docker-compose up`).
2.  Open a **second terminal window**.
3.  Execute into the running `frontend` container:

    ```bash
    docker-compose exec frontend sh
    ```

4.  Now, **inside the container's shell**, run the following commands to install Tailwind and initialize shadcn/ui:

    ```sh
    # 1. Install Tailwind CSS
    npm install -D tailwindcss postcss autoprefixer
    npx tailwindcss init -p

    # 2. Initialize shadcn/ui (This will ask interactive questions)
    npx shadcn-ui@latest init
    ```

5.  After the setup is complete, you can `exit` the container shell. The frontend will automatically reload with the new configuration.