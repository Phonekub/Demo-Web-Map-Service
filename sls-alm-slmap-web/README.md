# AllMap Frontend

Modern React + TypeScript + Vite

### Tech Stack (macOS & Windows)

- **[React 19](https://react.dev/)** with **[Vite](https://vitejs.dev/)** for fast development
- **[TypeScript](https://www.typescriptlang.org/)** strict configuration
- **[Tailwind CSS](https://tailwindcss.com/)** + **[DaisyUI](https://daisyui.com/)** for UI styling
- **[React Router v6](https://reactrouter.com/)** for routing
- **[Zustand](https://zustand-demo.pmnd.rs/)** for state management (with persistent user state)
- **[TanStack Query](https://tanstack.com/query/latest)** for server state management and data fetching
- **[OpenLayers](https://openlayers.org/)** for interactive maps
- **[ESLint](https://eslint.org/)** & **[Prettier](https://prettier.io/)** for code quality
- **[PNPM](https://pnpm.io/)** for package management

### Install pnpm (macOS & Windows)

**macOS:**

```sh
brew install pnpm
# or using npm
npm install -g pnpm
```

**Windows:**

```powershell
# Using npm (recommended)
npm install -g pnpm
# Or use scoop
scoop install pnpm
# Or use chocolatey
choco install pnpm
```

## 📁 Project Structure

```
src/
  components/      # Reusable UI components (Header, BaseMap, etc.)
  pages/           # Application pages (Home, Dashboard, Maps, Analytics)
  stores/          # Zustand state stores (userStore)
  types/           # TypeScript type definitions
  utils/           # Utility functions
  assets/          # Static assets
public/            # Static files
```

## 🚀 Getting Started

1. **Install dependencies**
   ```sh
   pnpm fetch && pnpm install --offline
   ```
   or
   ```sh
   make run
   ```
2. **Run development server**
   ```sh
   pnpm dev
   ```
3. **Build for production**
   ```sh
   pnpm build
   ```

## 🛠️ Tooling

- **ESLint**: `pnpm lint` / `pnpm lint:fix`
- **Prettier**: `pnpm format` / `pnpm format:check`
- **Tailwind CSS**: Utility-first styling, [`DaisyUI`](https://daisyui.com/) for components

## 🗺️ Map Integration

- Uses **[OpenLayers](https://openlayers.org/)** for map rendering

## 4. File Naming Conventions

### Component Files

- Use **PascalCase** for React component file names.

**Example:**

- `Header.tsx`
- `BaseMap.tsx`
