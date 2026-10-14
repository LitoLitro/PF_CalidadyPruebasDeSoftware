# MiMundoUPN - Motor de ruta mas corta (HU01)

"Programa principal" del proyecto: busqueda de aula + calculo de la ruta mas
corta con Dijkstra sobre el mapa, siguiendo el patron Boundary-Control-Entity
y el diagrama de paquetes del informe.

## Como correrlo

```bash
npm install
npm start
```

Luego abre **http://localhost:3000** en el navegador (el servidor ya entrega
la interfaz, no hace falta abrir el HTML a mano).

## Que puedes probar

- Elegir un ambiente de la lista, tocarlo en el mapa o escribir su codigo.
- Cambiar el punto de partida con la lista "Sales desde" o tocando el mapa.
- **Aula no encontrada:** escribe un codigo que no exista, por ejemplo `999`.
- **Fuera de rango:** toca el mapa fuera del limite punteado del campus.

## Ambientes registrados (datos de demostracion)

| Codigo | Nombre | Ubicacion |
|---|---|---|
| 301-A | Laboratorio de Redes | Bloque A, piso 3 |
| 302-A | Laboratorio de Software | Bloque A, piso 3 |
| 201-A | Aula 201 | Bloque A, piso 2 |
| 101-B | Aula 101 | Bloque B, piso 1 |
| 102-B | Aula 102 | Bloque B, piso 1 |
| BIB | Biblioteca | Bloque A, piso 1 |
| CAF | Cafeteria | Patio central |
| AUD | Auditorio | Bloque B, piso 1 |

El plano, los ambientes y las distancias estan en
`persistence/GrafoRepository.js`. Son datos de prueba: reemplazalos por los
reales de tu campus. Cada unidad del plano equivale a 2 metros, y las
distancias de los tramos se calculan solas a partir de las coordenadas.

## Estructura (mapea 1 a 1 con el diagrama de paquetes)

- `entity/` -> Nodo, Arista, Aula. Objetos de dominio puros, sin HTTP ni SQL.
- `control/` -> RutaService (Dijkstra, nodo de partida mas cercano y los
  criterios de aceptacion de HU01) y MapaService (datos del plano y de los
  ambientes).
- `persistence/` -> GrafoRepository. Hoy usa datos en memoria; el dia que
  conectes SQL Server solo cambias el interior de esta clase.
- `boundary/` -> rutaRoutes.js. Endpoints HTTP: `GET /api/aulas`,
  `GET /api/mapa` y `POST /api/rutas`.
- `public/` -> index.html. Interfaz con mapa interactivo (tambien es Boundary).

## Siguientes pasos para completar el 50%

1. Reemplazar los datos de prueba de `GrafoRepository` por los nodos, aristas
   y ambientes reales de tu campus (puedes digitalizarlos desde Figma).
2. Conectar `GrafoRepository` a SQL Server con el paquete `mssql`, usando el
   esquema del punto 3 del informe.
3. Escribir las pruebas unitarias de `dijkstra()` y `generarRuta()` (no
   necesitan servidor ni base de datos) para la estrategia del punto 4.
4. Subir el proyecto a GitHub con `git init`.
