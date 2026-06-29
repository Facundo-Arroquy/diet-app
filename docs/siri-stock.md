# Cargar stock por voz con Siri (iPhone)

Permite decirle a Siri algo como **"Oye Siri, cargar stock"** y dar de alta o
actualizar un insumo de la planilla de stock hablando: nombre del ingrediente,
cantidad actual y mínimo. Si el ingrediente no existe, se crea solo (con los
macros en sus valores por defecto, en cero).

No hace falta una app nativa: se usa la app **Atajos** (Shortcuts) de iOS, que
ya viene en el iPhone.

---

## 1. Configurar el servidor

En las variables de entorno del despliegue (o en tu `.env` local) definí un
token secreto:

```
VOICE_API_TOKEN=una-cadena-larga-y-secreta
```

El endpoint queda en:

```
POST  https://TU-DOMINIO/api/voice/stock
```

Necesita el token en el header `x-voice-token` (o en `?token=...`) y este
cuerpo JSON:

```json
{
  "userId": "TU-USER-ID",
  "ingrediente": "huevos",
  "cantidad": 12,
  "minimo": 6,
  "unidad": "u"
}
```

- `userId` (obligatorio): el ID de tu usuario en la app.
- `ingrediente` (obligatorio): el nombre. Si no existe, se crea.
- `cantidad`, `minimo` (opcionales): por defecto `0`.
- `unidad` (opcional): `u`, `kg`, `g`, `L`, `ml`, `docena` o `paquete`
  (por defecto `u`).

Respuesta:

```json
{
  "item": { "...": "el stock_item resultante" },
  "ingredienteCreado": true,
  "accion": "creado",
  "mensaje": "Agregué huevos al stock: 12 u, mínimo 6 u."
}
```

El campo `mensaje` está pensado para que Siri lo lea en voz alta.

> **¿Cómo obtengo mi `userId`?** Entrá a la web, abrí las herramientas de
> desarrollador → consola y ejecutá
> `JSON.parse(localStorage.getItem('diet_active_user')).id`, o miralo en la
> tabla `users` de Supabase.

---

## 2. Crear el Atajo en el iPhone

Abrí **Atajos → +** y agregá estas acciones en orden:

1. **Preguntar por una entrada** → Pregunta: *"¿Qué ingrediente?"*,
   tipo **Texto**.
2. **Preguntar por una entrada** → Pregunta: *"¿Cuánto stock tenés?"*,
   tipo **Número**.
3. **Preguntar por una entrada** → Pregunta: *"¿Mínimo deseado?"*,
   tipo **Número**.
4. *(Opcional)* **Elegir de un menú** → opciones: `u`, `kg`, `g`, `L`, `ml`,
   `docena`, `paquete`. Si lo omitís, se usa `u`.
5. **Obtener contenido de la URL**:
   - URL: `https://TU-DOMINIO/api/voice/stock`
   - Método: **POST**
   - Encabezados: agregá `x-voice-token` con tu `VOICE_API_TOKEN`.
   - Cuerpo de la solicitud: **JSON**, con estos campos:
     - `userId` → tu user id (texto fijo)
     - `ingrediente` → la variable de la pregunta 1
     - `cantidad` → la variable de la pregunta 2
     - `minimo` → la variable de la pregunta 3
     - `unidad` → la variable del menú (si lo agregaste)
6. **Obtener valor del diccionario** → clave `mensaje` del resultado anterior.
7. **Mostrar notificación** (o **Reproducir texto / Decir**) con ese `mensaje`.

Poné de nombre del atajo algo como **"Cargar stock"**: ese es el nombre que
vas a decir, *"Oye Siri, cargar stock"*.

---

## 3. Usarlo

> **Tú:** "Oye Siri, cargar stock"
> **Siri:** "¿Qué ingrediente?" → *"Huevos"*
> **Siri:** "¿Cuánto stock tenés?" → *"12"*
> **Siri:** "¿Mínimo deseado?" → *"6"*
> **Siri:** "Agregué huevos al stock: 12 u, mínimo 6 u."

Si el ingrediente ya estaba en la planilla, se actualizan su cantidad y su
mínimo en lugar de duplicarlo.

---

## Seguridad

El endpoint solo responde si el token enviado coincide con `VOICE_API_TOKEN`.
Mantené ese valor en secreto (vive únicamente en el header del Atajo y en las
variables de entorno del servidor). Si se filtra, cambialo y actualizá el
Atajo.
