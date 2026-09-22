# Red Solidaria Villahermosa — API REST

API en Node.js y Express para el registro de donantes, autenticación con JWT y control de acceso por roles (RBAC). Las contraseñas se almacenan con hash bcrypt (`bcryptjs`). Los datos viven en memoria para facilitar pruebas y arranque local; el diseño de repositorio permite sustituir el almacén por una base de datos más adelante.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

```bash
npm install
```

Copia las variables de entorno:

```bash
copy .env.example .env
```

En sistemas Unix:

```bash
cp .env.example .env
```

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm start` | Arranca la API en el puerto configurado (`3000` por defecto) |
| `npm run dev` | Arranque con recarga al guardar (`node --watch`) |
| `npm test` | Jest con cobertura (umbral global > 80%) |
| `npm run audit` | Auditoría de seguridad de dependencias |

## Endpoints

### Público

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/health` | Estado del servicio |
| `POST` | `/api/register` | Registro de donante (u otro rol válido) |
| `POST` | `/api/login` | Inicio de sesión |

Cuerpo de registro:

```json
{
  "nombre": "Ana Pérez",
  "email": "ana@solidaria.mx",
  "password": "secreto123",
  "rol": "donante"
}
```

`rol` es opcional. Si se omite, se asigna `donante`. Valores permitidos: `administrador`, `donante`, `empresa`, `organizacion`.

Cuerpo de login:

```json
{
  "email": "ana@solidaria.mx",
  "password": "secreto123"
}
```

### Protegidos (Bearer JWT)

| Método | Ruta | Roles |
| --- | --- | --- |
| `GET` | `/api/me` | cualquier autenticado |
| `GET` | `/api/donors` | `administrador` |
| `GET` | `/api/donors/:id` | el propio usuario o `administrador` |
| `GET` | `/api/admin/dashboard` | `administrador` |
| `GET` | `/api/empresa/recursos` | `empresa`, `administrador` |
| `GET` | `/api/organizacion/campanas` | `organizacion`, `administrador` |
| `GET` | `/api/donante/historial` | `donante`, `administrador` |

Ejemplo:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/me
```

## Autenticación y RBAC

1. El registro y el login emiten un JWT firmado (`JWT_SECRET`, expiración `JWT_EXPIRES_IN`).
2. El middleware `authenticate` exige `Authorization: Bearer <token>` y resuelve al usuario.
3. El middleware `authorize(...roles)` restringe la ruta a los roles indicados.

## Pruebas

Las pruebas viven en `/tests` y cubren:

- registro exitoso
- datos faltantes
- correos duplicados
- login válido e inválido
- JWT ausente o corrupto
- acceso permitido y denegado por rol

```bash
npm test
```

Jest falla si la cobertura global baja del 80% (líneas, sentencias, funciones y ramas).

## CI/CD

El flujo `.github/workflows/deploy.yml` en cada push o pull request a `main`/`master`:

1. Instala Node.js 20
2. Instala dependencias (`npm ci`)
3. Ejecuta auditoría de seguridad (`npm audit --audit-level=high`)
4. Corre las pruebas unitarias con reporte de cobertura
5. En `main`/`master`, simula el despliegue automático a Staging

## Estructura

```
src/
  app.js                 # aplicación Express (sin listen)
  server.js              # arranque HTTP
  config/                # entorno, roles
  data/store.js          # almacén en memoria
  middleware/            # JWT, errores
  routes/                # auth y RBAC
  services/              # lógica de donantes
  utils/                 # bcrypt, JWT, validación
tests/
.github/workflows/deploy.yml
```

## Licencia

MIT
