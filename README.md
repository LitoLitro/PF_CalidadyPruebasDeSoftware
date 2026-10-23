
# Guía de trabajo colaborativo - MiMundoUPN

## 1. Objetivo

Este documento establece el procedimiento que deben seguir los integrantes del equipo para descargar el proyecto, desarrollar nuevas funcionalidades, corregir errores, subir actualizaciones a GitHub y solicitar su revisión.

El objetivo es mantener un repositorio organizado, evitar conflictos entre los cambios de los integrantes y permitir que el Scrum Master supervise y apruebe las contribuciones antes de incorporarlas a la rama principal.

## 2. Repositorio del proyecto

Repositorio oficial:

https://github.com/LitoLitro/PF_CalidadyPruebasDeSoftware

Cada integrante debe trabajar sobre una copia local del repositorio y utilizar Git para registrar sus modificaciones.

## 3. Documentación e instalación del proyecto

Antes de comenzar a programar, cada integrante debe revisar la documentación técnica del motor de rutas.

Dentro de la carpeta `mimundoupn-motor-rutas/` se encuentra el archivo `README.md`, que contiene la información del proyecto, los programas necesarios, los pasos de instalación, los comandos para instalar las dependencias y las instrucciones para ejecutar la aplicación.

Ruta del archivo:

```text
PF_CalidadyPruebasDeSoftware/
└── mimundoupn-motor-rutas/
    └── README.md
```

Se recomienda leer este documento antes de modificar el código para comprender la estructura del sistema y preparar correctamente el entorno de desarrollo.

## 4. Programas necesarios

Para trabajar con el repositorio se recomienda contar con:

- Git, para gestionar el control de versiones.
- Node.js y npm, para ejecutar el backend e instalar las dependencias.
- Visual Studio Code u otro editor de código.
- Una cuenta de GitHub con acceso al repositorio.

La instalación detallada de los programas y la ejecución del proyecto se explican en `mimundoupn-motor-rutas/README.md`.

## 5. Cómo clonar el repositorio

### Paso 1. Instalar Git

Descarga Git desde:

https://git-scm.com/install/windows

También puedes instalarlo mediante PowerShell:

```powershell
winget install --id Git.Git -e
```

Comprueba que la instalación se realizó correctamente:

```powershell
git --version
```

### Paso 2. Configurar la identidad de Git

Cada integrante debe configurar su nombre y correo electrónico:

```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu-correo@ejemplo.com"
```

Es recomendable utilizar el correo asociado a la cuenta de GitHub.

### Paso 3. Clonar el repositorio

Abre PowerShell o la terminal de Visual Studio Code y accede a la carpeta donde guardarás el proyecto.

Por ejemplo:

```powershell
cd $HOME\Documents
```

Clona el repositorio:

```powershell
git clone https://github.com/LitoLitro/PF_CalidadyPruebasDeSoftware.git
```

Ingresa en la carpeta:

```powershell
cd PF_CalidadyPruebasDeSoftware
```

### Paso 4. Abrir el proyecto

Puedes abrir la carpeta raíz en Visual Studio Code:

```powershell
code .
```

Si el comando `code` no está disponible, abre Visual Studio Code manualmente y selecciona **Archivo > Abrir carpeta**.

Para instalar las dependencias del motor de rutas:

```powershell
cd mimundoupn-motor-rutas
npm install
```

Consulta `mimundoupn-motor-rutas/README.md` para conocer cómo ejecutar la aplicación.

## 6. Flujo de trabajo para los colaboradores

**Regla principal:** los colaboradores no deben subir sus cambios directamente a la rama `main`. Cada actualización debe enviarse mediante una rama de trabajo y un Pull Request para que pueda ser revisada.

### Paso 1. Actualizar la copia local

Antes de comenzar una tarea, vuelve a la carpeta raíz del repositorio y ejecuta:

```powershell
git switch main
git pull origin main
```

Esto permite obtener los últimos cambios aprobados.

### Paso 2. Crear una rama para la tarea

Cada colaborador debe crear una rama específica para la funcionalidad, corrección o mejora que realizará.

Ejemplo:

```powershell
git switch -c feature/busqueda-ambientes
```

Convenciones recomendadas:

- `feature/`: nuevas funcionalidades.
- `fix/`: corrección de errores.
- `test/`: pruebas de software.
- `docs/`: documentación.
- `refactor/`: reorganización del código sin cambiar su comportamiento esperado.

Ejemplos:

```text
feature/calculo-rutas
feature/seleccion-origen
fix/validacion-destino
test/rutas-dijkstra
docs/actualizar-readme
```

Cada colaborador debe utilizar una rama distinta para evitar mezclar tareas diferentes.

### Paso 3. Desarrollar y probar los cambios

El colaborador realiza sus modificaciones en su copia local.

Antes de subir los cambios, debe comprobar el estado del repositorio:

```powershell
git status
```

Revisa qué archivos fueron modificados:

```powershell
git diff
```

Ejecuta las pruebas disponibles y verifica que la funcionalidad desarrollada opere correctamente.

Si se han modificado archivos del backend, también se recomienda comprobar que el servidor pueda iniciarse sin errores.

### Paso 4. Registrar los cambios

Agrega los archivos que deseas incluir en el commit:

```powershell
git add .
```

Registra los cambios con un mensaje claro:

```powershell
git commit -m "Implementar búsqueda de ambientes"
```

Los mensajes deben describir brevemente lo realizado.

Ejemplos:

```text
feat: implementar selección de destino
fix: corregir validación de ambientes
test: agregar pruebas para el cálculo de rutas
docs: actualizar instrucciones de instalación
```

Es preferible realizar commits pequeños y relacionados con una sola tarea.

### Paso 5. Subir la rama a GitHub

La primera vez que subas una rama, ejecuta:

```powershell
git push -u origin feature/busqueda-ambientes
```

Reemplaza `feature/busqueda-ambientes` por el nombre real de tu rama.

En las siguientes actualizaciones de esa misma rama, puedes utilizar:

```powershell
git add .
git commit -m "Ajustar búsqueda de ambientes"
git push
```

**Importante:** `git push` sube la rama a GitHub, pero no incorpora automáticamente los cambios a `main`.

### Paso 6. Crear un Pull Request

Después de subir la rama:

1. Ingresa al repositorio en GitHub.
2. Abre la sección **Pull requests**.
3. Selecciona **New pull request**.
4. En la rama base, selecciona `main`.
5. En la rama de comparación, selecciona la rama que acabas de subir.
6. Pulsa **Create pull request**.

El Pull Request debe incluir:

- Título descriptivo.
- Descripción de los cambios realizados.
- Historia de usuario o tarea relacionada.
- Pruebas realizadas y sus resultados.
- Capturas de pantalla cuando los cambios afecten la interfaz.
- Posibles problemas conocidos o aspectos pendientes.

Ejemplo de descripción:

```text
## Objetivo
Implementar la búsqueda de ambientes del campus.

## Cambios realizados
- Se agregó la búsqueda por código de ambiente.
- Se actualizaron las validaciones del formulario.
- Se ajustó la respuesta mostrada al usuario.

## Pruebas realizadas
- Búsqueda de un ambiente existente.
- Búsqueda de un ambiente inexistente.
- Verificación de la respuesta del servidor.

## Evidencias
Se adjuntan capturas de la funcionalidad implementada.
```

Una vez creado el Pull Request, el colaborador debe esperar la revisión antes de considerar su trabajo incorporado a la versión principal.

## 7. Funciones del Scrum Master

El Scrum Master supervisa el proceso de trabajo del equipo, facilita la colaboración y ayuda a mantener el flujo de revisión organizado.

En este repositorio, el procedimiento de revisión será el siguiente.

### 7.1. Revisar las contribuciones en GitHub

El Scrum Master puede consultar las actualizaciones de los colaboradores desde:

- **Pull requests:** muestra las solicitudes pendientes de revisión.
- **Commits:** permite consultar los cambios registrados.
- **Branches:** muestra las ramas disponibles.
- **Files changed:** permite examinar las líneas agregadas, modificadas o eliminadas.
- **Checks:** permite consultar las verificaciones automatizadas, si están configuradas.

Para revisar una contribución, debe abrir el Pull Request y examinar el código en la pestaña **Files changed**.

También puede revisar los comentarios, las evidencias y los resultados de las pruebas.

### 7.2. Ver quién realizó cada cambio

Dentro de un Pull Request se pueden consultar los commits asociados y sus autores.

Para cada actualización se debe verificar:

- Qué integrante realizó los cambios.
- Qué archivos fueron modificados.
- Qué problema o tarea se está resolviendo.
- Si los cambios corresponden al objetivo declarado.
- Si existen errores o modificaciones innecesarias.

Los commits permiten rastrear las contribuciones registradas en Git. La información de autoría depende de la configuración de Git de cada integrante.

### 7.3. Revisar la calidad del código

Antes de aprobar una contribución, el Scrum Master o el revisor designado debe comprobar:

1. Que los cambios correspondan a la tarea asignada.
2. Que no se hayan incluido archivos temporales, dependencias descargadas o datos sensibles.
3. Que no se hayan introducido errores evidentes.
4. Que las pruebas disponibles se hayan ejecutado.
5. Que las evidencias solicitadas estén incluidas.
6. Que los cambios no afecten negativamente a otras funcionalidades.
7. Que la rama pueda integrarse con `main` sin conflictos pendientes.

Cuando sea necesario, puede solicitar la revisión de otro integrante con conocimientos técnicos específicos.

### 7.4. Aprobar o solicitar cambios

En el Pull Request, el revisor puede utilizar la opción **Review changes**.

Las alternativas principales son:

- **Approve:** indica que la contribución fue revisada y se considera aceptable.
- **Request changes:** solicita modificaciones antes de integrar los cambios.
- **Comment:** deja observaciones sin emitir una aprobación formal.

Si se solicitan cambios, el colaborador debe corregirlos en la misma rama, registrar los nuevos commits y ejecutar `git push`.

Los cambios aparecerán en el Pull Request existente. No es necesario crear uno nuevo para cada corrección.

El Scrum Master vuelve a revisar la actualización y determina si cumple con los criterios acordados.

## 8. Integración de los cambios a la rama principal

Una vez revisado y aprobado el Pull Request, se puede incorporar a `main`.

El procedimiento recomendado es:

1. Confirmar que la revisión se haya completado.
2. Comprobar que las pruebas requeridas hayan pasado.
3. Verificar que no existan conflictos pendientes.
4. Aprobar el Pull Request conforme a las reglas del repositorio.
5. Utilizar **Merge pull request** para integrar los cambios.
6. Confirmar que el Pull Request se haya cerrado correctamente.

Si el equipo configura protecciones de rama, GitHub puede exigir aprobaciones y verificaciones antes de permitir la integración.

**Importante:** una aprobación del Pull Request y la integración efectiva a `main` son acciones diferentes. La aprobación no incorpora por sí sola los cambios, salvo que se configure un mecanismo adicional de integración automática.

## 9. ¿Cómo actualizar el proyecto después de una integración?

Después de que el Pull Request haya sido integrado a `main`, los colaboradores deben actualizar su copia local antes de comenzar otra tarea.

Ejecuta:

```powershell
git switch main
git pull origin main
```

Después crea una nueva rama para la siguiente tarea:

```powershell
git switch -c feature/nueva-funcionalidad
```

De esta forma, el trabajo nuevo parte de la última versión aprobada.

## 10. Resolución de conflictos

Si GitHub indica que existen conflictos, la integración debe esperar hasta que sean resueltos.

El colaborador puede actualizar su rama con los últimos cambios de `main`:

```powershell
git switch feature/busqueda-ambientes
git fetch origin
git merge origin/main
```

Si Git identifica conflictos, deben abrirse los archivos afectados y resolverse manualmente, conservando los cambios correctos.

Después de resolverlos:

```powershell
git add .
git commit -m "Resolver conflictos con main"
git push
```

El Pull Request se actualizará y podrá revisarse nuevamente.

Si no se tiene experiencia resolviendo conflictos, es recomendable solicitar apoyo antes de aceptar o eliminar cambios de otro integrante.

## 11. Buenas prácticas

- No trabajar directamente sobre `main`.
- No subir archivos generados que puedan reconstruirse mediante la instalación de dependencias.
- No incluir contraseñas, tokens, claves privadas ni credenciales en el repositorio.
- No subir la carpeta `node_modules/`.
- Actualizar `main` antes de comenzar una tarea nueva.
- Utilizar nombres de ramas descriptivos.
- Crear commits pequeños y con mensajes claros.
- Probar las modificaciones antes de solicitar una revisión.
- Mantener actualizada la descripción de cada Pull Request.
- Resolver las observaciones antes de solicitar la aprobación final.
- No cerrar un Pull Request con cambios pendientes sin informar al equipo.
- No eliminar ramas compartidas sin comprobar que ya no sean necesarias.

## 12. Resumen del flujo de trabajo

```text
1. Clonar el repositorio
          |
          v
2. Actualizar main
          |
          v
3. Crear una rama de trabajo
          |
          v
4. Desarrollar y probar
          |
          v
5. Crear commits
          |
          v
6. Subir la rama a GitHub
          |
          v
7. Crear un Pull Request
          |
          v
8. Revisión del Scrum Master
          |
          v
   ¿Necesita cambios?
       /        \
     Sí          No
     |            |
     v            v
 Corregir      Aprobar
 y volver         |
 a subir          v
              Integrar a main
                   |
                   v
              Actualizar copias
```

## 13. Consideraciones finales

Este procedimiento busca que las contribuciones sean trazables, revisables y consistentes con los objetivos del proyecto.

El repositorio central debe conservar una versión estable del sistema, mientras que las ramas de trabajo permiten desarrollar funcionalidades de forma independiente.

La documentación técnica, los programas necesarios para ejecutar el proyecto y las instrucciones de instalación se encuentran en:

`mimundoupn-motor-rutas/README.md`

Todos los integrantes deben consultar ese archivo antes de configurar su entorno o realizar modificaciones al motor de rutas.
