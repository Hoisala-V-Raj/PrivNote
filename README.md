# PrivNote - Private Note Sharing with AI Summarization

A secure, self-destructing note-sharing application with AI-powered summarization capabilities. Create private notes that can be accessed with a password and automatically summarized using advanced AI models.

## Features

- **Secure Note Sharing**: Create encrypted notes with unique passwords
- **AI-Powered Summarization**: Automatic summarization using Llama 3 or mock summarizer
- **Self-Destructing Access**: Notes are accessible only with correct password
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Docker Support**: Full containerization for easy deployment
- **RESTful API**: Well-documented backend API with TypeScript
- **Database Persistence**: PostgreSQL database for note storage
- **HTTPS Support**: Self-signed certificates for secure transmission

## Tech Stack & Frameworks

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **TypeORM** - Object-relational mapping
- **PostgreSQL** - Database
- **bcryptjs** - Password hashing
- **Axios** - HTTP client for AI API calls
- **Ollama/Llama 3** - AI summarization (optional)

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

### DevOps & Deployment
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy and static file serving
- **GitHub Actions** - CI/CD (if configured)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** & **Docker Compose** (Recommended)
- **Node.js** (v18 or higher) - For local development
- **PostgreSQL** (v16 or higher) - If not using Docker
- **Git** - For version control

## Quick Start (Docker - Recommended)

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd PrivNote
```

### 2. Environment Configuration
Copy the environment files and configure as needed:

```bash
# For development
cp .env.example .env

# For production
cp .env.prod.example .env.prod
```

### 3. Start the Application
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Nginx (Production)**: http://localhost:80

### Live Deployment

A live production instance is deployed and accessible at:
- **Production URL**: https://34.226.209.126

Note: This deployment uses self-signed SSL certificates, so your browser will show a security warning. Click "Advanced" and proceed to access the application.

## Local Development Setup

### 1. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 2. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL container
docker run --name privnote-postgres \
  -e POSTGRES_DB=privnote_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16-alpine
```

#### Option B: Local PostgreSQL
```bash
# Create database
createdb privnote_db

# Or use psql
psql -U postgres -c "CREATE DATABASE privnote_db;"
```

### 3. Environment Variables

Create `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=privnote_db

# Backend Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# AI Summarization (Optional)
USE_MOCK_SUMMARIZER=true
OLLAMA_URL=http://localhost:11434

# Frontend Configuration
VITE_API_URL=http://localhost:5000/api
```

### 4. Run Database Migrations
```bash
cd backend
npm run migration:run
```

### 5. Start Development Servers

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

#### Terminal 3 - Ollama (Optional - for AI summarization)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama
ollama serve

# Pull Llama 3 model
ollama pull llama3

# Set USE_MOCK_SUMMARIZER=false in .env
```

## Project Structure

```
PrivNote/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── api/            # API routes
│   │   ├── database/       # Database configuration
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── index.ts        # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── main.tsx        # Entry point
│   ├── Dockerfile
│   └── package.json
├── nginx/                   # Nginx configuration
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml       # Development setup
├── docker-compose.prod.yml  # Production setup
└── README.md
```

## API Endpoints

### Notes API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notes` | Create a new note |
| POST | `/api/notes/:id/view` | View a note with password |
| POST | `/api/notes/:id/summarize` | Generate AI summary |

### Request/Response Examples

#### Create Note
```bash
POST /api/notes
Content-Type: application/json

{
  "text": "Your private note content here..."
}
```

**Response:**
```json
{
  "noteId": "uuid-here",
  "password": "GENERATED_PASSWORD",
  "shareUrl": "http://localhost:3000/note/uuid-here"
}
```

#### View Note
```bash
POST /api/notes/:id/view
Content-Type: application/json

{
  "password": "GENERATED_PASSWORD"
}
```

**Response:**
```json
{
  "id": "uuid-here",
  "text": "Your private note content here...",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Summarize Note
```bash
POST /api/notes/:id/summarize
Content-Type: application/json

{
  "password": "GENERATED_PASSWORD"
}
```

**Response:**
```json
{
  "noteId": "uuid-here",
  "summary": "• Key point 1\n• Key point 2\n• Key point 3",
  "cached": false
}
```

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Test Coverage
- Unit tests for API endpoints
- Component tests for React components
- Integration tests for complete workflows

## Security Features

- **Password Protection**: Each note has a unique, auto-generated password
- **Hashed Passwords**: Passwords are hashed using bcrypt
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse
- **CORS Protection**: Proper CORS configuration
- **Environment Variables**: Sensitive data stored in environment variables

## AI Summarization

### Mock Summarizer (Default)
- Extracts key sentences from the note
- Formats as bullet points
- No external dependencies

### Llama 3 Integration (Optional)
1. Install Ollama locally
2. Pull the llama3 model: `ollama pull llama3`
3. Set `USE_MOCK_SUMMARIZER=false` in environment
4. Configure `OLLAMA_URL` (default: http://localhost:11434)

### Summary Features
- **Character Limiting**: Summaries limited to 200 characters (excluding bullets/spaces)
- **Length Validation**: Ensures summary is shorter than original content
- **Keyword Extraction**: Focuses on key concepts rather than full sentences
- **Fallback Mechanism**: Uses basic extraction if AI fails

## Deployment

### Production Deployment with Docker

1. **Configure Production Environment**
```bash
cp .env.prod.example .env.prod
# Edit .env.prod with your production values
```

2. **Build and Deploy**
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

3. **SSL Configuration** (Optional)
- Place SSL certificates in `./ssl/` directory
- Update `nginx/nginx.conf` for SSL configuration

### Manual Deployment

1. **Build Backend**
```bash
cd backend
npm run build
npm start
```

2. **Build Frontend**
```bash
cd frontend
npm run build
# Serve dist/ folder with nginx or your preferred web server
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check PostgreSQL status
docker ps | grep postgres

# Check database logs
docker logs privnote-db
```

#### 2. Frontend Not Loading
```bash
# Check Vite dev server
cd frontend
npm run dev

# Verify API URL in .env
VITE_API_URL=http://localhost:5000/api
```

#### 3. AI Summarization Not Working
```bash
# Check Ollama status
ollama list

# Restart Ollama
ollama serve

# Test Llama 3
ollama run llama3
```

#### 4. Docker Issues
```bash
# Rebuild containers
docker compose down
docker compose up -d --build

# Check logs
docker compose logs -f [service-name]
```

### Port Conflicts
Default ports used:
- Frontend: 3000
- Backend: 5000
- Database: 5432
- Nginx: 80, 443

Change ports in `docker-compose.yml` if conflicts occur.

## Development Guidelines

### Code Style
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Conventional commits for git messages

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review existing GitHub issues
3. Create a new issue with detailed information

---

## Future Improvements

This project has several planned features and improvements in the development roadmap:

### Enhanced Authentication & Sharing
- **Single Sign Code (SSC)**: Implement a centralized authentication system where users can authenticate with a code that grants temporary access to multiple notes without requiring individual passwords for each note.
- **User Accounts**: Add optional user registration and login to create persistent note collections and sharing preferences.
- **Share Expiration**: Set automatic expiration dates for shared notes, after which they become inaccessible.
- **Access Logs**: Track and display who accessed a note and when, providing visibility into note security.

### Advanced AI Capabilities
- **AI Plugin System**: Build a modular plugin architecture to support multiple AI models and services (GPT, Claude, etc.) beyond Llama 3.
- **Customizable Summarization**: Allow users to choose summarization style (bullet points, paragraph, key quotes) and detail level.
- **Multi-language Support**: Enable summarization and note support in multiple languages with automatic translation.
- **Sentiment Analysis**: Analyze and display the emotional tone of notes.
- **Keyword Extraction**: Automatically identify and highlight important keywords in notes and summaries.

### Security & Privacy
- **End-to-End Encryption**: Implement client-side encryption where notes are encrypted before reaching the server, ensuring complete privacy even from administrators.
- **Zero-Knowledge Architecture**: Build a system where the server cannot access note content in plaintext.
- **Hardware Security Key Support**: Add support for FIDO2 hardware keys as an additional authentication factor.
- **Automatic Purging**: Implement configurable automatic deletion of notes after viewing or after a set time period.

### Customization & User Experience
- **Theme Customization**: Allow users to customize the application theme (dark mode, light mode, custom color schemes).
- **Custom Branding**: Support white-label deployment with custom logos, colors, and domain configuration.
- **Export Options**: Export notes in multiple formats (PDF, Markdown, Plain Text, Rich Text).
- **Batch Operations**: Create and share multiple notes simultaneously with template support.
- **Note Analytics**: Display statistics about frequently accessed notes and summarization usage.

### Infrastructure & Scalability
- **Load Balancing**: Implement horizontal scaling with load balancing across multiple backend instances.
- **Caching Layer**: Add Redis caching for frequently accessed notes and summarization results.
- **CDN Integration**: Support CDN integration for faster frontend delivery globally.
- **Database Optimization**: Implement query optimization and database sharding for large-scale deployments.
- **Monitoring & Alerting**: Add comprehensive monitoring, metrics collection, and alerting capabilities.

### Mobile & Cross-Platform
- **Mobile Application**: Develop native iOS and Android applications for mobile note creation and sharing.
- **Progressive Web App (PWA)**: Convert the web application to a PWA for offline access and installability.
- **Browser Extensions**: Create browser extensions for easy note creation and sharing from any webpage.

---

Happy Note Sharing!
