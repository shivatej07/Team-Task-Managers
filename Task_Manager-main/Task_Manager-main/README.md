# 🚀 Team Task Manager (Full-Stack)

A modern, high-performance web application for project management and task tracking with Role-Based Access Control (RBAC). Built with a premium dark-mode aesthetic and a robust MERN-style stack.

---

## ✨ Key Features

### 🔐 Authentication & Security
- **Signup/Login**: Secure user registration and authentication using JWT (JSON Web Tokens).
- **Password Hashing**: Industry-standard encryption using `bcryptjs`.
- **Protected Routes**: Frontend and backend routes are guarded based on authentication status.

### 👥 Project & Team Management
- **Role-Based Access (RBAC)**:
  - **Admin**: Create projects, manage team members, and oversee all tasks.
  - **Member**: View projects they are part of and manage their assigned tasks.
- **Member Management**: Admins can add or remove team members from specific projects.

### 📝 Task Tracking
- **Task Lifecycle**: Create, update, and track tasks (Todo → In Progress → Done).
- **Priority Levels**: Categorize tasks as Low, Medium, or High priority.
- **Deadlines**: Set due dates and track overdue tasks with visual indicators.
- **Filtering**: Filter tasks by project, priority, or status.

### 📊 Interactive Dashboard
- **Real-time Stats**: Instant overview of total tasks, completed items, and overdue work.
- **Recent Activity**: Quick view of the latest tasks added across projects.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Axios, React Router.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (via Mongoose).
- **Styling**: Vanilla CSS (Custom Design System with Glassmorphism).

---

## 📂 Project Structure

```text
├── backend/
│   ├── middleware/    # Auth & Role-check logic
│   ├── models/        # Mongoose schemas (User, Project, Task)
│   ├── routes/        # REST API endpoints
│   └── server.js      # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # Auth state management
│   │   ├── pages/      # Application views
│   │   └── utils/      # API configurations
│   └── index.css      # Global design system
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB account (Atlas or local)

### 1. Clone the repository
```bash
git clone https://github.com/Dhruva1129/Task_Manager.git
cd Task_Manager
```

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your credentials:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🎨 Design Philosophy
The app features a **Premium Dark Mode** design, focusing on:
- **Glassmorphism**: Translucent cards with backdrop filters.
- **Vibrant Gradients**: Indigo to Purple accents for primary actions.
- **Responsive Layout**: Seamless experience across mobile and desktop.
- **Micro-interactions**: Subtle hover effects and smooth transitions.

---

## 📜 License
This project is for educational purposes as part of a technical assignment.
