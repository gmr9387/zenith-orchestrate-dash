# Zilliance Backend API

A production-ready, enterprise-grade backend API for the Zilliance Business Automation Platform. Built with Node.js, Express, MongoDB, and Redis, featuring comprehensive authentication, storage management, and tutorial management systems.

## 🚀 Features

### Core Functionality
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user lifecycle management with email verification
- **Tutorial System**: Full CRUD operations for tutorials and steps with search and pagination
- **Storage Management**: S3-compatible storage with support for multiple providers
- **File Processing**: Image and video processing capabilities
- **Email Service**: Templated email notifications for various events
- **Rate Limiting**: Per-user and global rate limiting
- **Logging**: Comprehensive logging with Winston
- **Error Handling**: Centralized error handling with custom error classes

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Security**: Bcrypt hashing with configurable rounds
- **Rate Limiting**: Protection against abuse and DDoS
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Helmet Security**: Security headers and protection
- **Input Validation**: Comprehensive request validation
- **Session Management**: Redis-based session storage

### Storage Providers
- **AWS S3**: Full S3 integration
- **DigitalOcean Spaces**: S3-compatible object storage
- **Cloudflare R2**: S3-compatible object storage
- **MinIO**: Self-hosted S3-compatible storage
- **Local Storage**: Development and testing storage

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **Authentication**: JWT with bcrypt
- **Storage**: S3-compatible APIs
- **Email**: Nodemailer with SMTP
- **File Processing**: Sharp (images), FFmpeg (videos)
- **Validation**: Express-validator
- **Logging**: Winston
- **Testing**: Jest
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js 18+ 
- npm 8+
- MongoDB 7.0+
- Redis 7.0+
- Docker & Docker Compose (optional, for development)

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended for Development)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

3. **Install dependencies and start the server**
   ```bash
   npm install
   npm run dev
   ```

4. **Access the services**
   - Backend API: http://localhost:3001
   - MongoDB Express: http://localhost:8081 (admin/zilliance123)
   - MinIO Console: http://localhost:9001 (zilliance/zilliance123)

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB and Redis**
   ```bash
   # Start MongoDB (make sure it's running on port 27017)
   # Start Redis (make sure it's running on port 6379)
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
API_VERSION=v1
CORS_ORIGIN=http://localhost:5173

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/zilliance
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Storage Configuration
STORAGE_PROVIDER=minio
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=zilliance-storage
STORAGE_ACCESS_KEY_ID=zilliance
STORAGE_SECRET_ACCESS_KEY=zilliance123

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Storage Provider Configuration

#### AWS S3
```env
STORAGE_PROVIDER=s3
STORAGE_ENDPOINT=https://s3.amazonaws.com
STORAGE_BUCKET=your-bucket-name
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY_ID=your-access-key
STORAGE_SECRET_ACCESS_KEY=your-secret-key
```

#### DigitalOcean Spaces
```env
STORAGE_PROVIDER=digitalocean
STORAGE_ENDPOINT=https://nyc3.digitaloceanspaces.com
STORAGE_BUCKET=your-space-name
STORAGE_REGION=nyc3
STORAGE_ACCESS_KEY_ID=your-access-key
STORAGE_SECRET_ACCESS_KEY=your-secret-key
```

#### Cloudflare R2
```env
STORAGE_PROVIDER=cloudflare
STORAGE_ENDPOINT=https://pub-1234567890.r2.dev
STORAGE_BUCKET=your-bucket-name
STORAGE_REGION=auto
STORAGE_ACCESS_KEY_ID=your-access-key
STORAGE_SECRET_ACCESS_KEY=your-secret-key
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "your-refresh-token"
}
```

### Tutorial Endpoints

#### Create Tutorial
```http
POST /tutorials
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "title": "Getting Started with Zilliance",
  "description": "Learn the basics of the Zilliance platform",
  "category": "technology",
  "difficulty": "beginner",
  "estimatedDuration": 30,
  "tags": ["tutorial", "beginners", "platform"],
  "isPublic": true
}
```

#### Search Tutorials
```http
GET /tutorials?query=automation&category=technology&difficulty=beginner&page=1&limit=20
```

#### Get Tutorial by ID
```http
GET /tutorials/:id
```

#### Update Tutorial
```http
PUT /tutorials/:id
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "title": "Updated Tutorial Title",
  "description": "Updated description"
}
```

### Storage Endpoints

#### Upload File
```http
POST /storage/upload
Authorization: Bearer <access-token>
Content-Type: multipart/form-data

file: <file>
folder: "tutorials"
publicRead: false
processImage: true
```

#### Generate Presigned URL
```http
POST /storage/presigned-url
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "key": "tutorials/image.jpg",
  "operation": "putObject",
  "expiresIn": 3600
}
```

#### List Files
```http
GET /storage/files?prefix=tutorials&maxKeys=100
Authorization: Bearer <access-token>
```

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "user",
  "permissions": ["read:tutorials", "write:tutorials"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Permission System
- **read:tutorials**: View tutorials
- **write:tutorials**: Create and edit tutorials
- **delete:tutorials**: Delete tutorials
- **read:users**: View user information
- **write:users**: Modify user information
- **read:analytics**: Access analytics data
- **admin:system**: Administrative access

### Role-Based Access Control
- **user**: Basic access with limited permissions
- **admin**: Full access to all features
- **enterprise**: Advanced features and analytics

## 🗄️ Database Schema

### User Model
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String (required),
  lastName: String (required),
  role: String (enum: user, admin, enterprise),
  permissions: [String],
  isEmailVerified: Boolean,
  isActive: Boolean,
  profile: {
    avatar: String,
    bio: String,
    company: String,
    position: String
  },
  subscription: {
    plan: String,
    status: String,
    stripeCustomerId: String
  },
  usage: {
    tutorialsCreated: Number,
    storageUsed: Number,
    apiCalls: Number
  }
}
```

### Tutorial Model
```javascript
{
  title: String (required),
  description: String (required),
  slug: String (unique, auto-generated),
  category: String (enum),
  difficulty: String (enum),
  estimatedDuration: Number,
  steps: [TutorialStep],
  authorId: ObjectId (ref: User),
  isPublished: Boolean,
  isPublic: Boolean,
  viewCount: Number,
  rating: {
    average: Number,
    count: Number,
    total: Number
  },
  reviews: [Review],
  completionStats: {
    totalAttempts: Number,
    successfulCompletions: Number,
    completionRate: Number
  }
}
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data and fixtures
```

## 📊 Monitoring & Logging

### Log Levels
- **error**: Error conditions
- **warn**: Warning conditions
- **info**: General information
- **http**: HTTP requests
- **debug**: Debug information

### Log Files
- `logs/app.log`: All application logs
- `logs/error.log`: Error logs only

### Health Check Endpoint
```http
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "development",
  "version": "1.0.0"
}
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zilliance
REDIS_URL=redis://your-redis-host:6379
JWT_SECRET=your-production-jwt-secret
STORAGE_PROVIDER=s3
STORAGE_ENDPOINT=https://s3.amazonaws.com
STORAGE_BUCKET=your-production-bucket
```

### Docker Production Build
```bash
docker build -t zilliance-backend .
docker run -p 3001:3001 --env-file .env.production zilliance-backend
```

## 🔧 Development

### Code Style
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (if configured)
- **TypeScript**: Type checking (if configured)

### Git Hooks
```bash
# Pre-commit hooks (if configured)
npm run lint
npm test
```

### Database Migrations
```bash
# Run migrations
npm run migrate

# Seed database
npm run seed
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── models/          # Database models
│   ├── routes/          # API route handlers
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   ├── database/        # Database connection and utilities
│   └── server.js        # Main application file
├── tests/               # Test files
├── docker/              # Docker configuration
├── logs/                # Log files
├── uploads/             # Local file uploads
├── .env.example         # Environment variables template
├── docker-compose.yml   # Development environment
├── Dockerfile           # Production Docker image
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is proprietary software owned by Zilliance. All rights reserved.

## 🆘 Support

### Getting Help
- **Documentation**: Check this README and API documentation
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Email**: support@zilliance.com

### Common Issues

#### MongoDB Connection Issues
- Ensure MongoDB is running on the correct port
- Check connection string format
- Verify authentication credentials

#### Redis Connection Issues
- Ensure Redis is running on the correct port
- Check Redis configuration
- Verify network connectivity

#### Storage Issues
- Verify storage provider configuration
- Check access keys and permissions
- Ensure bucket exists and is accessible

#### Email Issues
- Verify SMTP configuration
- Check email credentials
- Ensure network allows SMTP connections

## 🔮 Roadmap

### Upcoming Features
- **Real-time Notifications**: WebSocket support for live updates
- **Advanced Analytics**: Enhanced reporting and insights
- **API Rate Limiting**: Per-endpoint rate limiting
- **Webhook Support**: External system integrations
- **Multi-tenancy**: Support for multiple organizations
- **Advanced Search**: Elasticsearch integration
- **Caching**: Redis-based response caching
- **Background Jobs**: Queue-based task processing

### Performance Improvements
- **Database Optimization**: Query optimization and indexing
- **Connection Pooling**: Improved database connection management
- **Response Caching**: Intelligent caching strategies
- **Load Balancing**: Horizontal scaling support

---

**Built with ❤️ by the Zilliance Team**