#!/usr/bin/make

include .env

#----------- Make Environment ----------------------
docker_compose_bin = $(shell command -v docker-compose 2> /dev/null || echo "docker compose")
SITE_SERVICE = site
API_SERVICE = api
COMPOSE = --env-file .env -p $(PROJECT_NAME) -f docker/docker-compose.yml

.DEFAULT_GOAL := help

help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / {printf "  \033[92m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

---------------: ## ------[ SETUP ]---------
init: ## Copy the .env files into place and generate JWT secrets
	@cp -n .env.example .env || true
	@cp -n app/backend/.env.example app/backend/.env || true
	@cp -n app/frontend/.env.example app/frontend/.env || true
	@sed -i "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$$(openssl rand -base64 48 | tr -d '\n')|" app/backend/.env
	@sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$$(openssl rand -base64 48 | tr -d '\n')|" app/backend/.env
	@echo "Env files ready. Set NFT_CONTRACT_ADDRESS in app/backend/.env, then run: make up migrate seed"

---------------: ## ------[ ACTIONS ]---------
build-img: ## Build the docker images
	$(docker_compose_bin) $(COMPOSE) build
up: ## Start every service
	$(docker_compose_bin) $(COMPOSE) up -d
down: ## Stop every service
	$(docker_compose_bin) $(COMPOSE) down || true
restart: ## Restart every service
	$(docker_compose_bin) $(COMPOSE) restart
logs: ## Tail the api and site logs
	$(docker_compose_bin) $(COMPOSE) logs -f $(API_SERVICE) $(SITE_SERVICE)
migrate: ## Run the database migrations
	$(docker_compose_bin) $(COMPOSE) run --rm $(API_SERVICE) npm run migrate
down-migrate: ## Roll every migration back
	$(docker_compose_bin) $(COMPOSE) run --rm $(API_SERVICE) npm run down-migrate
seed: ## Seed countries, translations and the demo users
	$(docker_compose_bin) $(COMPOSE) run --rm $(API_SERVICE) npm run seed

---------------: ## ------[ CONTRACTS ]---------
contracts-test: ## Run the Solidity test suite
	(cd app/contracts && npm test)
contracts-preview: ## Render a sheet of generated passes to app/contracts/preview.html
	(cd app/contracts && npm run preview)
deploy-contracts: ## Deploy EthersWeb3Pass + TipJar to Sepolia (needs app/contracts/.env)
	(cd app/contracts && npm run deploy:sepolia)

---------------: ## ------[ QUALITY ]---------
test: ## Run every test suite
	(cd app/backend && npm test) && (cd app/frontend && npm test) && (cd app/contracts && npm test)
lint: ## Lint both packages
	(cd app/backend && npm run lint) && (cd app/frontend && npm run lint)
typecheck: ## Typecheck both packages
	(cd app/backend && npm run typecheck) && (cd app/frontend && npm run typecheck)
check: lint typecheck test ## Everything CI runs, but locally

---------------: ## ------[ SHELL ]---------
sh-api: ## Open a shell in the api container
	$(docker_compose_bin) $(COMPOSE) exec $(API_SERVICE) bash
sh-site: ## Open a shell in the site container
	$(docker_compose_bin) $(COMPOSE) exec $(SITE_SERVICE) bash
