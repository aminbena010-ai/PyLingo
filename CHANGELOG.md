# Changelog

## v0.1.2 - 2026-02-21

- Corregidos simbolos raros (mojibake) en textos de interfaz de `src/App.tsx`.
- Normalizadas cadenas visibles en paneles de mapa, estadisticas, misiones, sesion, perfil y reto.
- Ajustada redaccion en ASCII para evitar nuevas corrupciones de codificacion en despliegues.
- Versionado actualizado a `v0.1.2` en metadatos del proyecto.

## v0.1.1 - 2026-02-21

- Corregido estado muerto de boost de adrenalina en flujo de XP.
- Ajustada tarjeta de estadistica de adrenalina para reflejar comportamiento real.
- Mejorada resiliencia de datos con claves centralizadas de almacenamiento.
- Agregado respaldo de usuario en perfil: exportar/importar JSON y borrar datos locales con confirmacion.
- Integrado `ErrorBoundary` global para evitar pantalla en blanco por errores runtime.
- Solucionado fallo de build en entorno Windows (`spawn EPERM`) usando `vite --configLoader native`.
- Actualizada metadata y versionado de la app a `v0.1.1`.
- Documentacion actualizada para release estable.

## v0.1.0 - 2026-02-21

- Base funcional de plataforma de aprendizaje con React + TypeScript.
- Sistema de lecciones con teoria guiada y retos practicos.
- Evaluacion de respuestas con simulador Python basico.
- Persistencia de progreso, XP, racha y vidas.
- Paneles de ruta, estadisticas, misiones y perfil.
- Optimizacion visual del panel de retos y barra de accion fija.
- Mejora de experiencia de codigo con ejemplo coloreado.
