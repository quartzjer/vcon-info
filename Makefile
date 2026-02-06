.PHONY: help install serve test test-unit test-integration test-watch sync sync-drafts sync-examples spec clean

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies (requires bun)
	@command -v bun >/dev/null 2>&1 || { echo "Error: bun is required. Install from https://bun.sh"; exit 1; }
	bun install

node_modules: install

serve: ## Start development server on http://localhost:8080
	bun run serve

test: node_modules ## Run all tests
	bun test

test-unit: node_modules ## Run unit tests only
	bun test --testNamePattern='Unit'

test-integration: node_modules ## Run integration tests only
	bun test --testNamePattern='Integration'

test-watch: node_modules ## Run tests in watch mode
	bun test --watch

sync: sync-drafts sync-examples ## Sync all external resources

sync-drafts: ## Fetch latest IETF draft revisions
	cd drafts && python3 sync.py

sync-examples: ## Sync vCon examples from IETF WG repo
	cd docs/examples && python3 sync.py

spec: ## Render vconz spec via IETF Author Tools API (requires .env)
	@test -f .env || { echo "Error: .env file with IETF_API_KEY required. See README."; exit 1; }
	python3 at.py vconz.md

clean: ## Remove generated files and dependencies
	rm -rf node_modules coverage vconz tests/snapshot.png
