# React + Vite

## Run the published container

The GitHub workflow builds and pushes this app as:

```sh
DOCKERHUB_USERNAME/mmfront:latest
DOCKERHUB_USERNAME/mmfront:main
DOCKERHUB_USERNAME/mmfront:<git-sha>
```

To pull and run the published image with Docker Compose:

```sh
DOCKER_IMAGE=your-dockerhub-username/mmfront:latest docker compose up -d
```

Then open:

```sh
http://localhost:8080
```

You can change the local port if needed:

```sh
APP_PORT=3000 DOCKER_IMAGE=your-dockerhub-username/mmfront:latest docker compose up -d
```

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
