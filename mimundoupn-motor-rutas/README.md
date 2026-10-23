
# PF - Calidad y Pruebas de Software

## Descripción del proyecto

Este repositorio contiene el proyecto académico desarrollado para el curso de **Calidad y Pruebas de Software**. Su objetivo es implementar y documentar una solución de software, considerando su arquitectura, funcionamiento, base de datos y las actividades relacionadas con el aseguramiento de la calidad y las pruebas.

El proyecto incluye **MiMundoUPN**, una aplicación web que permite buscar ambientes del campus y calcular la ruta más corta desde un punto de partida hasta el destino seleccionado. Para calcular las rutas se utiliza el algoritmo de Dijkstra.

Actualmente, el motor de rutas cuenta con una interfaz web interactiva y un backend desarrollado con Node.js y Express. Los datos del mapa y los ambientes utilizados por el motor se encuentran definidos como datos de demostración en el código.

## Objetivos

- Implementar un motor de generación de rutas para ambientes del campus.
- Permitir la selección del punto de partida y del ambiente de destino.
- Calcular la ruta más corta utilizando el algoritmo de Dijkstra.
- Organizar el código mediante el patrón arquitectónico Boundary-Control-Entity.
- Preparar la solución para su evaluación mediante pruebas de software.
- Documentar los recursos y evidencias correspondientes al proyecto.

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| Node.js | Entorno de ejecución de JavaScript en el servidor. |
| npm | Instalación y administración de dependencias. |
| Express.js | Creación del servidor y gestión de las rutas HTTP. |
| JavaScript | Implementación de la lógica del motor de rutas. |
| HTML, CSS y JavaScript | Interfaz web del sistema. |
| SQL Server | Tecnología prevista para la gestión de datos persistentes. |
| SQL Server Management Studio (SSMS) | Administración y ejecución de scripts SQL. |
| Git y GitHub | Control de versiones y alojamiento del código. |
| Jest | Herramienta prevista para las pruebas automatizadas. |

## Estructura del repositorio

```text
PF_CalidadyPruebasDeSoftware/
├── Evidencias/
│   └── Evidencias del proyecto
├── mimundoupn-motor-rutas/
│   ├── boundary/
│   │   └── rutaRoutes.js
│   ├── control/
│   │   ├── RutaService.js
│   │   └── MapaService.js
│   ├── entity/
│   │   ├── Nodo.js
│   │   ├── Arista.js
│   │   └── Aula.js
│   ├── persistence/
│   │   └── GrafoRepository.js
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── server.js
├── BDPFcalidadPS.sql
├── .gitignore
└── README.md
```

**Nota:** La estructura anterior resume los directorios y archivos principales del proyecto. La carpeta `Evidencias/` puede contener archivos adicionales.

## Requisitos previos

Para ejecutar el motor de rutas se necesita:

- Windows 10 o Windows 11.
- Git para clonar el repositorio.
- Node.js en una versión LTS compatible.
- npm, incluido con la instalación de Node.js.
- Un navegador web actualizado.

Para trabajar con el script de base de datos también se recomienda instalar:

- Microsoft SQL Server, si se necesita disponer de una instancia de base de datos.
- SQL Server Management Studio (SSMS), para conectarse al servidor y ejecutar el script SQL.

Visual Studio Code es un editor recomendado, pero no es obligatorio para ejecutar la aplicación.

## Instalación de los programas

### 1. Instalar Git

Git permite descargar el repositorio y gestionar las versiones del proyecto.

**Instalación mediante PowerShell o Windows Terminal:**

```powershell
winget install --id Git.Git -e
```

También se puede descargar desde:

https://git-scm.com/install/windows

Después de instalarlo, cierra y vuelve a abrir la terminal. Comprueba la instalación:

```powershell
git --version
```

### 2. Instalar Node.js y npm

Node.js permite ejecutar el servidor y npm instalar las dependencias necesarias.

**Instalación mediante PowerShell o Windows Terminal:**

```powershell
winget install --id OpenJS.NodeJS.LTS -e
```

También se puede descargar desde:

https://nodejs.org/

Una vez instalado, abre una terminal nueva y comprueba las versiones:

```powershell
node --version
npm --version
```

Ambos comandos deben mostrar un número de versión.

### 3. Instalar Visual Studio Code (opcional)

Visual Studio Code permite abrir la carpeta del proyecto, editar archivos y utilizar una terminal integrada.

**Instalación mediante PowerShell o Windows Terminal:**

```powershell
winget install --id Microsoft.VisualStudioCode -e
```

Página oficial:

https://code.visualstudio.com/

### 4. Instalar SQL Server y SSMS (opcional para ejecutar el motor de rutas actual)

El repositorio incluye el archivo `BDPFcalidadPS.sql`, que contiene el script de base de datos del proyecto.

Para trabajar con este archivo:

1. Descarga e instala una edición compatible de Microsoft SQL Server.
2. Durante la instalación, configura una instancia del motor de base de datos.
3. Descarga e instala SQL Server Management Studio (SSMS).
4. Abre SSMS y conéctate a la instancia de SQL Server.
5. Abre el archivo `BDPFcalidadPS.sql`.
6. Revisa el contenido del script y ejecútalo sobre la instancia adecuada.

Descargas oficiales:

- SQL Server: https://www.microsoft.com/sql-server/sql-server-downloads
- SQL Server Management Studio: https://learn.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms

**Importante:** La ejecución del motor de rutas de demostración no requiere configurar SQL Server, porque actualmente los datos del grafo se encuentran en memoria. La integración con SQL Server está contemplada como un siguiente paso.

## Clonar el repositorio

Abre PowerShell, Windows Terminal o la terminal de Visual Studio Code.

Dirígete a la carpeta donde quieras guardar el proyecto. Por ejemplo:

```powershell
cd $HOME\Documents
```

Clona el repositorio:

```powershell
git clone https://github.com/LitoLitro/PF_CalidadyPruebasDeSoftware.git
```

Entra en la carpeta descargada:

```powershell
cd PF_CalidadyPruebasDeSoftware
```

Para comprobar que se descargaron los archivos:

```powershell
dir
```

## Instalación de las dependencias

El backend se encuentra dentro de la carpeta `mimundoupn-motor-rutas`.

Accede a ella:

```powershell
cd mimundoupn-motor-rutas
```

Instala las dependencias declaradas en `package.json`:

```powershell
npm install
```

Este comando instala los paquetes necesarios para ejecutar el servidor, incluyendo Express, CORS y el controlador de SQL Server.

No es necesario instalar estos paquetes globalmente.

## Ejecutar el proyecto

Una vez instaladas las dependencias, inicia el servidor:

```powershell
npm start
```

Si el servidor se inicia correctamente, la terminal mostrará un mensaje indicando que MiMundoUPN está disponible en el puerto 3000.

Abre el siguiente enlace en tu navegador:

http://localhost:3000

La interfaz web se sirve desde la carpeta `public/`, por lo que no es necesario abrir el archivo HTML directamente.

Para detener el servidor, regresa a la terminal y presiona:

```text
Ctrl + C
```

## Funcionalidades disponibles

### Búsqueda de ambientes

El usuario puede seleccionar un ambiente de la lista, elegirlo directamente en el mapa o introducir su código.

### Selección del punto de partida

Se puede modificar el punto inicial mediante la lista de selección o interactuando con el mapa.

### Cálculo de la ruta más corta

El motor utiliza el algoritmo de Dijkstra para encontrar la ruta de menor distancia entre el origen y el destino disponibles en el grafo.

### Validaciones de demostración

La aplicación contempla escenarios como:

- Búsqueda de un ambiente inexistente.
- Selección de un punto fuera del área delimitada del campus.
- Selección de distintos puntos de partida y destinos.

### Ambientes de demostración

El sistema incluye ambientes de ejemplo como laboratorios, aulas, biblioteca, cafetería y auditorio.

Estos datos son demostrativos y deben actualizarse para representar fielmente la distribución real del campus.

## Arquitectura del sistema

El código del motor de rutas está organizado mediante el patrón Boundary-Control-Entity.

- **Boundary:** gestiona la comunicación HTTP y la interfaz de usuario.
- **Control:** contiene la lógica de negocio, el cálculo de rutas y los servicios relacionados con el mapa.
- **Entity:** representa los objetos principales del dominio, como nodos, aristas y aulas.
- **Persistence:** administra los datos del grafo y los ambientes. Actualmente utiliza datos en memoria.

El backend expone los siguientes endpoints:

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/aulas` | Obtiene los ambientes disponibles. |
| GET | `/api/mapa` | Obtiene la información del mapa. |
| POST | `/api/rutas` | Solicita el cálculo de una ruta. |

Estos endpoints se pueden consultar utilizando herramientas como Postman o mediante las solicitudes realizadas desde la interfaz web.

## Pruebas de software

El proyecto contempla la preparación y ejecución de pruebas para verificar el comportamiento del motor de rutas.

Entre los escenarios recomendados se encuentran:

- Verificar el cálculo correcto de la ruta más corta.
- Comprobar el comportamiento cuando el origen y el destino coinciden.
- Verificar la respuesta ante códigos de ambientes inexistentes.
- Validar el comportamiento ante puntos fuera del área permitida.
- Comprobar las respuestas de los endpoints HTTP.
- Verificar que las modificaciones del grafo no produzcan rutas incorrectas.

### Ejecutar las pruebas automatizadas

El proyecto declara el comando `npm test`, asociado a Jest.

Para ejecutar las pruebas:

```powershell
npm test
```

Si aparece un error indicando que Jest no está instalado, puedes instalarlo como dependencia de desarrollo:

```powershell
npm install --save-dev jest
```

Después, vuelve a ejecutar:

```powershell
npm test
```

**Nota:** La instalación de Jest no crea automáticamente los casos de prueba. Es necesario que existan pruebas implementadas y que estén configuradas correctamente para poder ejecutarlas.

## Solución de problemas frecuentes

### El comando `node` o `npm` no se reconoce

Comprueba que Node.js esté instalado y que su directorio se encuentre en la variable de entorno `PATH`.

Cierra y vuelve a abrir la terminal después de instalarlo.

### El comando `git` no se reconoce

Instala Git para Windows y abre una nueva terminal.

### El puerto 3000 está ocupado

El servidor no podrá iniciarse si otro proceso está utilizando el mismo puerto. Cierra la aplicación que lo esté utilizando o revisa la configuración del servidor antes de cambiar el puerto.

### No se puede acceder a la aplicación

Comprueba que `npm start` siga ejecutándose y que no aparezcan errores en la terminal. Después, vuelve a abrir:

http://localhost:3000

### La aplicación no utiliza los datos de SQL Server

El motor de rutas utiliza actualmente datos en memoria. Disponer de SQL Server instalado no conecta automáticamente la aplicación con la base de datos. Para ello es necesario implementar y configurar la integración correspondiente.

## Control de versiones

Para consultar el estado del repositorio local:

```powershell
git status
```

Para registrar los cambios realizados:

```powershell
git add .
git commit -m "Documentar el proyecto"
```

Para enviar los cambios al repositorio remoto:

```powershell
git push
```

Estos comandos deben ejecutarse desde la carpeta local del repositorio. Para realizar `git push`, es necesario contar con permisos y tener configurada la autenticación con GitHub.

## Autores

Proyecto académico correspondiente al curso de Calidad y Pruebas de Software.

Repositorio:

https://github.com/LitoLitro/PF_CalidadyPruebasDeSoftware

## Estado del proyecto

Proyecto académico en desarrollo. La implementación actual incluye el motor de rutas de demostración y su interfaz web. La conexión con SQL Server y la ampliación de las pruebas automatizadas forman parte de las actividades que pueden completarse posteriormente.
