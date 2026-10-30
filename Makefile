# ====================================================
# Clinicify - Developer Makefile
# ====================================================

.PHONY: help install dev dev-backend dev-frontend build test docker-up docker-down clean

help:
	@echo "Available commands:"
	@echo "  make dev          - Start both Backend and Frontend locally"
	@echo "  make dev-backend  - Start Spring Boot backend (port 8080)"
	@echo "  make dev-frontend - Start React Vite frontend (port 5173)"
	@echo "  make install      - Install frontend dependencies"
	@echo "  make build        - Build both backend JAR and frontend bundle"
	@echo "  make test         - Run backend unit tests and test suites"
	@echo "  make docker-up    - Build and launch all services via Docker Compose"
	@echo "  make docker-down  - Stop all Docker Compose services"
	@echo "  make clean        - Clean backend build artifacts and frontend dist"

install:
	cd frontend && npm install

dev-backend:
	cd backend && ./mvnw spring-boot:run

dev-frontend:
	cd frontend && npm run dev

build:
	cd backend && ./mvnw clean package -DskipTests
	cd frontend && npm run build

test:
	cd backend && ./mvnw test

docker-up:
	docker-compose up --build -d

docker-down:
	docker-compose down

clean:
	cd backend && ./mvnw clean
	rm -rf frontend/dist
