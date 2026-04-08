# Thai Oil Price AI Tracker ⛽🤖

A full-stack web application designed to track real-time fuel prices in Thailand, analyze trends using AI algorithms, and visualize data through an interactive dashboard. 

The application consists of:
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **AI Core:** Python (Scikit-Learn/Numpy concepts for predictions) 

## Prerequisites
Please make sure you have the following installed on your machine:
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en/)
- [Python](https://www.python.org/downloads/)
- npm / pip 

## Installation Guide

Follow the steps below to clone and run the project locally.

### 1. Clone the repository
Open a terminal and run the following command:

```bash
git clone https://github.com/Thana008/oil-tracker.git
cd oil-tracker
```

### 2. Install Python Dependencies
The AI prediction engine requires `numpy`. Install it via pip:

```bash
pip install numpy
```

### 3. Setup Backend (API Server)
First, you need to go to the `backend` directory, install packages, and set up your environment variables.

```bash
cd backend
npm install
```

**Environment Variables (`.env`)**
Create a new file named `.env` inside the `backend` directory and add the following configuration:

```env
PORT=5001
AI_PROVIDER=groq
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
```
> Note: Replace `YOUR_GROQ_API_KEY_HERE` with your actual GROQ API key.

**Run the backend:**
```bash
npm run seed     # Run this only once to fetch and seed initial data
npm run dev      # Start the backend development server
```
The server should now be running on `http://localhost:5001`.

### 4. Setup Frontend (Dashboard)
Open a **new terminal window** (keep the backend server running) and execute:

```bash
cd frontend
npm install
npm run dev
```

The React development server will start, typically on [http://localhost:5173](http://localhost:5173). Open this link in your browser to view and interact with the application!
