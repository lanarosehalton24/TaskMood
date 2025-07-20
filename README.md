# TaskMood - AI-Powered Task Management

An intelligent task management application that combines mood-based productivity insights with real-time collaboration features.

## Features

- **AI-Powered Mood Analysis**: Uses OpenAI GPT-4o to analyze user mood and provide personalized task recommendations
- **Smart Task Management**: Priority-based task organization with mood-driven suggestions
- **Real-time Team Chat**: WebSocket-powered live communication
- **Role-based Access**: Support for students, staff, and employees
- **Voice Input**: Speech-to-text capabilities for hands-free task creation
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Node.js + Express, TypeScript, WebSocket
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **AI**: OpenAI GPT-4o integration

## Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd taskmood
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   REPL_ID=your_replit_app_id
   REPLIT_DOMAINS=your_app_domain
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5000`

## Deployment

This app is designed to be deployed on Replit, but can also be deployed on other platforms:

### Replit Deployment
1. Click the "Deploy" button in your Replit workspace
2. Your app will be available at `https://your-app-name.replit.app`

### Other Platforms
- Ensure PostgreSQL database is configured
- Set all required environment variables
- Build the frontend: `npm run build`
- Start the server: `npm start`

## Usage

1. **Authentication**: Sign in using Replit Auth
2. **Mood Check-in**: Share your current mood to get AI-powered task suggestions
3. **Task Management**: Create, organize, and track tasks with priority levels
4. **Team Chat**: Collaborate with team members in real-time
5. **Analytics**: View productivity insights and mood correlations

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

MIT License - see LICENSE file for details