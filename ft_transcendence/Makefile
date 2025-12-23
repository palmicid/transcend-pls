# ============================================================================
# ft_transcendence Makefile
# ============================================================================
# Usage:
#   make dev             - Run development environment (with ollama)
#   make dev-no-ollama   - Run development environment without ollama
#   make prod            - Run production environment (with ollama)
#   make prod-no-ollama  - Run production environment without ollama
#   make stop            - Stop all containers
#   make clean           - Remove containers and volumes
#   make logs            - View logs from all services
# ============================================================================

# Colors for terminal output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
RED    := \033[0;31m
RESET  := \033[0m

# Docker Compose files
COMPOSE_BASE    := docker-compose.yml
COMPOSE_DEV     := docker-compose.dev.yml
COMPOSE_PROD    := docker-compose.prod.yml
COMPOSE_OLLAMA  := docker-compose.ollama.yml

# Project name
PROJECT_NAME := ft_transcendence

# ============================================================================
# Default target
# ============================================================================
.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help message
	@echo "$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@echo "$(CYAN)  ft_transcendence - Makefile Commands$(RESET)"
	@echo "$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@echo ""
	@echo "$(YELLOW)Development:$(RESET)"
	@echo "  $(GREEN)make dev$(RESET)              Run dev environment (web + db + ollama)"
	@echo "  $(GREEN)make dev-no-ollama$(RESET)    Run dev environment without Ollama"
	@echo ""
	@echo "$(YELLOW)Production:$(RESET)"
	@echo "  $(GREEN)make prod$(RESET)             Run prod environment (web + db + ollama)"
	@echo "  $(GREEN)make prod-no-ollama$(RESET)   Run prod environment without Ollama"
	@echo ""
	@echo "$(YELLOW)Container Management:$(RESET)"
	@echo "  $(GREEN)make build$(RESET)            Build all Docker images"
	@echo "  $(GREEN)make stop$(RESET)             Stop all running containers"
	@echo "  $(GREEN)make restart$(RESET)          Restart all containers"
	@echo "  $(GREEN)make clean$(RESET)            Remove containers, networks, and volumes"
	@echo "  $(GREEN)make fclean$(RESET)           Full clean (including images)"
	@echo ""
	@echo "$(YELLOW)Logs & Status:$(RESET)"
	@echo "  $(GREEN)make logs$(RESET)             View all container logs"
	@echo "  $(GREEN)make logs-web$(RESET)         View web container logs"
	@echo "  $(GREEN)make logs-db$(RESET)          View database container logs"
	@echo "  $(GREEN)make logs-ollama$(RESET)      View Ollama container logs"
	@echo "  $(GREEN)make status$(RESET)           Show container status"
	@echo ""
	@echo "$(YELLOW)Database:$(RESET)"
	@echo "  $(GREEN)make db-migrate$(RESET)       Run Prisma migrations"
	@echo "  $(GREEN)make db-push$(RESET)          Push Prisma schema to database"
	@echo "  $(GREEN)make db-studio$(RESET)        Open Prisma Studio"
	@echo "  $(GREEN)make db-shell$(RESET)         Open PostgreSQL shell"
	@echo ""
	@echo "$(YELLOW)Development Utilities:$(RESET)"
	@echo "  $(GREEN)make shell$(RESET)            Open shell in web container"
	@echo "  $(GREEN)make test$(RESET)             Run tests"
	@echo "  $(GREEN)make lint$(RESET)             Run linter"
	@echo ""
	@echo "$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"

# ============================================================================
# Development Environment
# ============================================================================
.PHONY: dev
dev: ## Run development environment with Ollama (default)
	@echo "$(GREEN)🚀 Starting development environment with Ollama...$(RESET)"
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) -f $(COMPOSE_OLLAMA) --profile dev --profile ollama up --build

.PHONY: dev-detached
dev-detached: ## Run development environment with Ollama in background
	@echo "$(GREEN)🚀 Starting development environment with Ollama (detached)...$(RESET)"
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) -f $(COMPOSE_OLLAMA) --profile dev --profile ollama up --build -d

.PHONY: dev-no-ollama
dev-no-ollama: ## Run development environment without Ollama
	@echo "$(GREEN)🚀 Starting development environment (without Ollama)...$(RESET)"
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) --profile dev up --build

.PHONY: dev-no-ollama-detached
dev-no-ollama-detached: ## Run development environment without Ollama in background
	@echo "$(GREEN)🚀 Starting development environment without Ollama (detached)...$(RESET)"
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) --profile dev up --build -d

# ============================================================================
# Production Environment
# ============================================================================
.PHONY: prod
prod: ## Run production environment with Ollama (default)
	@echo "$(GREEN)🚀 Starting production environment with Ollama...$(RESET)"
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_PROD) -f $(COMPOSE_OLLAMA) --profile prod --profile ollama up --build -d
	@echo "$(GREEN)✅ Production environment is running$(RESET)"
	@echo "$(CYAN)   Web app: http://localhost:3000$(RESET)"
	@echo "$(CYAN)   Ollama:  http://localhost:11434$(RESET)"

.PHONY: prod-no-ollama
prod-no-ollama: ## Run production environment without Ollama
	@echo "$(GREEN)🚀 Starting production environment (without Ollama)...$(RESET)"
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_PROD) --profile prod up --build -d
	@echo "$(GREEN)✅ Production environment is running$(RESET)"
	@echo "$(CYAN)   Web app: http://localhost:3000$(RESET)"

# ============================================================================
# Build
# ============================================================================
.PHONY: build
build: ## Build all Docker images (including Ollama)
	@echo "$(GREEN)🔨 Building Docker images...$(RESET)"
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_OLLAMA) build

.PHONY: build-no-ollama
build-no-ollama: ## Build Docker images without Ollama
	@echo "$(GREEN)🔨 Building Docker images (without Ollama)...$(RESET)"
	docker compose -f $(COMPOSE_BASE) build

# ============================================================================
# Stop & Clean
# ============================================================================
.PHONY: stop
stop: ## Stop all running containers
	@echo "$(YELLOW)⏹️  Stopping all containers...$(RESET)"
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_OLLAMA) down
	@echo "$(GREEN)✅ All containers stopped$(RESET)"

.PHONY: restart
restart: stop dev ## Restart development environment

.PHONY: clean
clean: ## Remove containers, networks, and volumes
	@echo "$(RED)🧹 Cleaning up containers and volumes...$(RESET)"
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_OLLAMA) down -v
	@echo "$(GREEN)✅ Cleanup complete$(RESET)"

.PHONY: fclean
fclean: ## Full clean (containers, volumes, and images)
	@echo "$(RED)🧹 Full cleanup (containers, volumes, images)...$(RESET)"
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_OLLAMA) down -v --rmi all
	@echo "$(GREEN)✅ Full cleanup complete$(RESET)"

.PHONY: prune
prune: fclean ## Full clean + Docker system prune
	@echo "$(RED)🧹 Running Docker system prune...$(RESET)"
	docker system prune -f
	@echo "$(GREEN)✅ Docker system pruned$(RESET)"

# ============================================================================
# Logs
# ============================================================================
.PHONY: logs
logs: ## View logs from all containers
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_OLLAMA) logs -f

.PHONY: logs-web
logs-web: ## View web container logs
	docker compose -f $(COMPOSE_BASE) logs -f web

.PHONY: logs-db
logs-db: ## View database container logs
	docker compose -f $(COMPOSE_BASE) logs -f db

.PHONY: logs-ollama
logs-ollama: ## View Ollama container logs
	docker compose -f $(COMPOSE_OLLAMA) logs -f ollama

# ============================================================================
# Status
# ============================================================================
.PHONY: status
status: ## Show container status
	@echo "$(CYAN)📊 Container Status:$(RESET)"
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_OLLAMA) ps

# ============================================================================
# Database
# ============================================================================
.PHONY: db-migrate
db-migrate: ## Run Prisma migrations
	@echo "$(GREEN)🔄 Running Prisma migrations...$(RESET)"
	docker compose -f $(COMPOSE_BASE) exec web npx prisma migrate dev

.PHONY: db-push
db-push: ## Push Prisma schema to database
	@echo "$(GREEN)📤 Pushing Prisma schema...$(RESET)"
	docker compose -f $(COMPOSE_BASE) exec web npx prisma db push

.PHONY: db-studio
db-studio: ## Open Prisma Studio
	@echo "$(GREEN)🎨 Opening Prisma Studio...$(RESET)"
	npx prisma studio

.PHONY: db-shell
db-shell: ## Open PostgreSQL shell
	@echo "$(GREEN)🐘 Opening PostgreSQL shell...$(RESET)"
	docker compose -f $(COMPOSE_BASE) exec db psql -U postgres -d transcendence

.PHONY: db-reset
db-reset: ## Reset database (drop and recreate)
	@echo "$(RED)⚠️  Resetting database...$(RESET)"
	docker compose -f $(COMPOSE_BASE) exec web npx prisma migrate reset --force
	@echo "$(GREEN)✅ Database reset complete$(RESET)"

# ============================================================================
# Development Utilities
# ============================================================================
.PHONY: shell
shell: ## Open shell in web container
	@echo "$(GREEN)🐚 Opening shell in web container...$(RESET)"
	docker compose -f $(COMPOSE_BASE) exec web sh

.PHONY: test
test: ## Run tests
	@echo "$(GREEN)🧪 Running tests...$(RESET)"
	npm run test

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	@echo "$(GREEN)🧪 Running tests in watch mode...$(RESET)"
	npm run test:watch

.PHONY: lint
lint: ## Run linter
	@echo "$(GREEN)🔍 Running linter...$(RESET)"
	npm run lint

.PHONY: lint-fix
lint-fix: ## Run linter with auto-fix
	@echo "$(GREEN)🔧 Running linter with auto-fix...$(RESET)"
	npm run lint:fix

.PHONY: typecheck
typecheck: ## Run TypeScript type checking
	@echo "$(GREEN)📝 Running type checker...$(RESET)"
	npm run typecheck

# ============================================================================
# Local Development (without Docker)
# ============================================================================
.PHONY: local-dev
local-dev: ## Run Next.js locally (requires running db container)
	@echo "$(GREEN)🚀 Starting Next.js development server locally...$(RESET)"
	npm run dev

.PHONY: local-build
local-build: ## Build Next.js locally
	@echo "$(GREEN)🔨 Building Next.js locally...$(RESET)"
	npm run build

.PHONY: install
install: ## Install npm dependencies
	@echo "$(GREEN)📦 Installing dependencies...$(RESET)"
	npm install

# ============================================================================
# Combined Commands
# ============================================================================
.PHONY: setup
setup: install ## Initial project setup
	@echo "$(GREEN)🔧 Setting up project...$(RESET)"
	cp -n .env.example .env 2>/dev/null || true
	npx prisma generate
	@echo "$(GREEN)✅ Setup complete! Run 'make dev' to start development.$(RESET)"

.PHONY: all
all: build dev ## Build and run development environment
