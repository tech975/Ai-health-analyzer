#!/bin/bash

# AI Health Analyzer Deployment Script
# This script handles the deployment process for both development and production environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
SKIP_TESTS=${2:-false}

echo -e "${BLUE}🚀 AI Health Analyzer Deployment Script${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Skip Tests: ${SKIP_TESTS}${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if [ "$ENVIRONMENT" = "production" ]; then
        if ! command_exists docker; then
            print_error "Docker is not installed (required for production deployment)"
            exit 1
        fi
        
        if ! command_exists docker-compose; then
            print_error "Docker Compose is not installed (required for production deployment)"
            exit 1
        fi
    fi
    
    print_status "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    # Install server dependencies
    print_info "Installing server dependencies..."
    cd server
    npm ci
    cd ..
    
    # Install client dependencies
    print_info "Installing client dependencies..."
    cd client
    npm ci
    cd ..
    
    # Install root dependencies (for integration tests)
    if [ -f "package.json" ]; then
        print_info "Installing root dependencies..."
        npm ci
    fi
    
    print_status "Dependencies installed successfully"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        print_warning "Skipping tests as requested"
        return
    fi
    
    print_info "Running tests..."
    
    # Run server tests
    print_info "Running server tests..."
    cd server
    npm test
    cd ..
    
    # Run client tests
    print_info "Running client tests..."
    cd client
    npm test
    cd ..
    
    print_status "All tests passed"
}

# Build applications
build_applications() {
    print_info "Building applications..."
    
    # Build server
    print_info "Building server..."
    cd server
    npm run build
    cd ..
    
    # Build client
    print_info "Building client..."
    cd client
    npm run build
    cd ..
    
    print_status "Applications built successfully"
}

# Development deployment
deploy_development() {
    print_info "Starting development deployment..."
    
    # Check if .env files exist
    if [ ! -f "server/.env" ]; then
        print_warning "Server .env file not found, copying from example..."
        cp server/.env.example server/.env
    fi
    
    if [ ! -f "client/.env" ]; then
        print_warning "Client .env file not found, copying from example..."
        cp client/.env.example client/.env
    fi
    
    # Start development servers
    print_info "Starting development servers..."
    
    # Start server in background
    cd server
    npm run dev &
    SERVER_PID=$!
    cd ..
    
    # Wait a moment for server to start
    sleep 5
    
    # Start client in background
    cd client
    npm run dev &
    CLIENT_PID=$!
    cd ..
    
    print_status "Development servers started"
    print_info "Server PID: $SERVER_PID"
    print_info "Client PID: $CLIENT_PID"
    print_info "Server running at: http://localhost:5000"
    print_info "Client running at: http://localhost:3000"
    
    # Save PIDs for later cleanup
    echo $SERVER_PID > .server.pid
    echo $CLIENT_PID > .client.pid
    
    print_warning "Press Ctrl+C to stop the servers"
    
    # Wait for user interrupt
    trap 'kill $SERVER_PID $CLIENT_PID; rm -f .server.pid .client.pid; exit' INT
    wait
}

# Production deployment
deploy_production() {
    print_info "Starting production deployment..."
    
    # Check if production environment files exist
    if [ ! -f "server/.env.production" ]; then
        print_error "Production environment file server/.env.production not found"
        print_info "Please create the production environment file with proper values"
        exit 1
    fi
    
    if [ ! -f "client/.env.production" ]; then
        print_error "Production environment file client/.env.production not found"
        print_info "Please create the production environment file with proper values"
        exit 1
    fi
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found"
        exit 1
    fi
    
    # Load environment variables
    if [ -f ".env" ]; then
        export $(cat .env | xargs)
    fi
    
    # Build and start containers
    print_info "Building Docker containers..."
    docker-compose build
    
    print_info "Starting production containers..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 30
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_status "Production deployment successful"
        print_info "Application is running at: http://localhost"
        print_info "API is running at: http://localhost/api"
    else
        print_error "Some services failed to start"
        docker-compose logs
        exit 1
    fi
}

# Run integration tests
run_integration_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        print_warning "Skipping integration tests as requested"
        return
    fi
    
    print_info "Running integration tests..."
    
    # Wait for services to be fully ready
    sleep 10
    
    # Run integration tests
    if [ -f "integration-tests.js" ]; then
        node integration-tests.js
        print_status "Integration tests passed"
    else
        print_warning "Integration tests file not found, skipping..."
    fi
}

# Cleanup function
cleanup() {
    print_info "Cleaning up..."
    
    if [ -f ".server.pid" ]; then
        SERVER_PID=$(cat .server.pid)
        kill $SERVER_PID 2>/dev/null || true
        rm -f .server.pid
    fi
    
    if [ -f ".client.pid" ]; then
        CLIENT_PID=$(cat .client.pid)
        kill $CLIENT_PID 2>/dev/null || true
        rm -f .client.pid
    fi
}

# Main deployment flow
main() {
    print_info "Starting deployment process..."
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Run deployment steps
    check_prerequisites
    install_dependencies
    run_tests
    build_applications
    
    if [ "$ENVIRONMENT" = "production" ]; then
        deploy_production
        run_integration_tests
    else
        deploy_development
    fi
}

# Show usage if no arguments provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 [environment] [skip_tests]"
    echo ""
    echo "Arguments:"
    echo "  environment    development|production (default: development)"
    echo "  skip_tests     true|false (default: false)"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 production"
    echo "  $0 development true"
    echo "  $0 production false"
    exit 1
fi

# Validate environment argument
if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "production" ]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_info "Valid environments: development, production"
    exit 1
fi

# Run main deployment
main