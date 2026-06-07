# Morgendagens Maaltid Frontend

This is the frontend for my Morgendagens Maaltid project. The app is built with React and Vite and includes the home page, catering, cleaning, profile, and admin views.

The frontend talks to the backend for products, login, booking, and admin features.

## Stack

- React
- Vite
- React Router
- ESLint
- Docker

## Local development

I start the project like this:

```sh
npm install
npm run dev
```

Vite runs on `http://localhost:5173` by default.

In development, the app uses `/api` as the base path. If I want to point directly to a backend, I can set `VITE_API_BASE_URL`.

```sh
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

## Scripts

```sh
npm run dev
npm run build
npm run preview
npm run lint
```

- `npm run dev` starts the development server
- `npm run build` creates a production build
- `npm run preview` previews the build locally
- `npm run lint` checks the code with ESLint

## Docker

The project includes a `Dockerfile` and a `docker-compose.yml`, so I can run the frontend in a container.

GitHub Actions builds and pushes the image as:

```sh
DOCKERHUB_USERNAME/mmfront:latest
DOCKERHUB_USERNAME/mmfront:main
DOCKERHUB_USERNAME/mmfront:<git-sha>
```

To start the published container locally, I use:

```sh
DOCKER_IMAGE=your-dockerhub-username/mmfront:latest docker compose up -d
```

Then I can open the app at:

```sh
http://localhost:8080
```

If I want to use a different port:

```sh
APP_PORT=3000 DOCKER_IMAGE=your-dockerhub-username/mmfront:latest docker compose up -d
```

## Project structure

- `src/components` contains the UI components
- `src/api` contains the backend calls
- `src/lib` contains helpers and normalization
- `src/styles` contains styling files

## About the app

In this app I work with routing, auth, API calls, booking flow, and admin features. There is also a focus on SEO, reusable components, and a setup that can be deployed with Docker.
