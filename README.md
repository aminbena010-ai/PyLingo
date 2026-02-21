# PyLingo

Plataforma de aprendizaje de Python con teoria guiada, retos practicos y progreso persistente.

## Version

`v0.1.2`

## Stack

- React 19
- TypeScript
- Vite
- CSS propio del proyecto

## Funcionalidades

- Ruta de aprendizaje por lecciones.
- Teoria antes de cada reto.
- Retos tipo codigo, opcion multiple, ordenar y debug.
- Simulador de ejecucion estilo Python.
- Persistencia de XP, racha, vidas y progreso en `localStorage`.
- Paneles de ruta, estadisticas, misiones, sesion y perfil.
- Interfaz responsive para desktop y movil.
- Respaldo de datos: exportar/importar JSON desde perfil.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## Estructura principal

- `src/App.tsx`: flujo principal de la aplicacion.
- `src/data/levels.ts`: contenido de lecciones y retos.
- `src/components/`: componentes UI.
- `src/hooks/`: estado del juego y progreso.
- `src/utils/pythonSimulator.ts`: simulador de codigo Python.
- `src/styles/index.css`: estilos globales.

## Estado de release

`v0.1.2` corrige textos corruptos (simbolos raros), pule la interfaz y mantiene estable la base funcional de `v0.1.x`.
