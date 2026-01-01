# TaskNest

A full-stack MERN SaaS application for task management.

## Project Structure

```
TaskNest/
├── server/          # Backend (Node.js, Express, TypeScript, Mongoose)
└── client/          # Frontend (React, TypeScript, TailwindCSS)
```

## Setup

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `server` directory:
   - Copy the `env.example` file to `.env`: `copy env.example .env` (Windows) or `cp env.example .env` (Mac/Linux)
   - Or create a new `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_atlas_connection_string_here
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```
   - Replace `your_mongodb_atlas_connection_string_here` with your actual MongoDB Atlas connection string
   - Replace `your_jwt_secret_key_here` with a secure random string for JWT signing

4. Run the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

## Available Scripts

### Backend (server/)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run type-check` - Type check without emitting files

### Frontend (client/)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Tech Stack

### Backend
- Node.js
- Express
- TypeScript
- Mongoose
- JWT Authentication
- MongoDB Atlas

### Frontend
- React
- TypeScript
- TailwindCSS
- React Router
- Vite

