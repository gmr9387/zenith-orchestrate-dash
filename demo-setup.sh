#!/bin/bash

# Zilliance Enterprise Platform - Demo Setup Script
echo "🚀 Setting up Zilliance Demo Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

print_status "Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "npm version: $(npm --version)"

# Install dependencies
print_status "Installing frontend dependencies..."
cd /workspace
npm install

print_status "Installing backend dependencies..."
cd /workspace/backend
npm install

# Create demo environment file
print_status "Creating demo environment configuration..."
cd /workspace/backend
if [ ! -f .env ]; then
    cp .env.example .env
    print_success "Created .env file from template"
else
    print_warning ".env file already exists"
fi

# Start Redis (if available)
print_status "Checking Redis availability..."
if command -v redis-server &> /dev/null; then
    print_status "Starting Redis server..."
    redis-server --daemonize yes
    print_success "Redis server started"
else
    print_warning "Redis not found. Using in-memory storage for demo."
fi

# Start backend server
print_status "Starting backend server..."
cd /workspace/backend
npm run dev &
BACKEND_PID=$!
print_success "Backend server started (PID: $BACKEND_PID)"

# Wait for backend to start
print_status "Waiting for backend to initialize..."
sleep 5

# Start frontend server
print_status "Starting frontend server..."
cd /workspace
npm run dev &
FRONTEND_PID=$!
print_success "Frontend server started (PID: $FRONTEND_PID)"

# Wait for frontend to start
print_status "Waiting for frontend to initialize..."
sleep 5

# Check if services are running
print_status "Checking service status..."

# Check backend
if curl -s http://localhost:3001/health > /dev/null; then
    print_success "Backend API is running on http://localhost:3001"
else
    print_error "Backend API is not responding"
fi

# Check frontend
if curl -s http://localhost:8080 > /dev/null; then
    print_success "Frontend is running on http://localhost:8080"
else
    print_error "Frontend is not responding"
fi

# Display demo information
echo ""
echo "🎉 ZILLIANCE DEMO ENVIRONMENT READY!"
echo "======================================"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:8080"
echo "   Backend API: http://localhost:3001"
echo "   Health Check: http://localhost:3001/health"
echo ""
echo "🔑 Demo Credentials:"
echo "   Admin: admin@zilliance.com / Admin123!"
echo "   User: demo@zilliance.com / Demo123!"
echo ""
echo "📋 Demo Features Available:"
echo "   ✅ Workflow Engine (Zapier competitor)"
echo "   ✅ Video Platform (Vimeo competitor)"
echo "   ✅ API Gateway (Postman competitor)"
echo "   ✅ Tutorial Management (Kajabi competitor)"
echo "   ✅ SMS Integration (Twilio-powered)"
echo "   ✅ Enterprise Security & Compliance"
echo ""
echo "📊 Demo Data:"
echo "   • 47 Active Workflows"
echo "   • 156 Video Content"
echo "   • 23 API Collections"
echo "   • 89 Published Tutorials"
echo "   • 1,247 Active Users"
echo "   • $2.3M ARR (demo data)"
echo ""
echo "🎬 Demo Script:"
echo "   See DEMO_SCRIPT.md for detailed demo flow"
echo ""
echo "📹 Video Script:"
echo "   See DEMO_VIDEO_SCRIPT.md for video production"
echo ""
echo "💰 Valuation:"
echo "   See PRE_REVENUE_VALUATION.md for financial analysis"
echo ""
echo "🛑 To stop the demo:"
echo "   Press Ctrl+C or run: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "🚀 Happy Demo-ing!"
echo ""

# Keep script running
wait