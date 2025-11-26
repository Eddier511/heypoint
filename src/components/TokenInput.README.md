# TokenInput Component

Sistema de ingreso de códigos alfanuméricos de 6 caracteres para HeyPoint!

## Características

- ✅ **Códigos alfanuméricos**: Soporta A-Z y 0-9
- ✅ **6 caracteres fijos**: Longitud configurable
- ✅ **Auto-mayúsculas**: Convierte automáticamente a mayúsculas
- ✅ **Estados visuales**: default, focus, filled, error, disabled
- ✅ **Animaciones suaves**: Bounce al ingresar dígitos
- ✅ **Paste support**: Maneja pegado de códigos completos
- ✅ **Navegación por teclado**: Flechas y Backspace
- ✅ **Responsive**: Funciona en desktop, tablet y móvil
- ✅ **Contador de expiración opcional**: Badge con tiempo restante
- ✅ **Dos variantes**: Input (entrada) y Display (visualización)

## Uso

### Variante Input (para ingresar códigos)

```tsx
import { TokenInput } from "../components/TokenInput";

function KioskLoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const handleTokenComplete = (value: string) => {
    // Se ejecuta cuando se completan los 6 caracteres
    verifyToken(value);
  };

  return (
    <TokenInput
      value={token}
      onChange={setToken}
      onComplete={handleTokenComplete}
      error={error}
      autoFocus={true}
      length={6}
      showExpiration={true}
      expirationTime={120} // 2 minutos en segundos
    />
  );
}
```

### Variante Display (para mostrar códigos)

```tsx
import { TokenInput } from "../components/TokenInput";

function SuccessPage({ pickupCode }: { pickupCode: string }) {
  return (
    <div className="bg-gradient-to-r from-[#FF6B00] to-[#e56000] p-8">
      <h2 className="text-white mb-6">Tu Código de Retiro</h2>
      <TokenInput 
        value={pickupCode}
        variant="display"
        length={6}
        disabled
      />
    </div>
  );
}
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `length` | `number` | `6` | Cantidad de caracteres del código |
| `value` | `string` | `""` | Valor actual del token |
| `onChange` | `(value: string) => void` | - | Callback cuando cambia el valor |
| `onComplete` | `(value: string) => void` | - | Callback cuando se completan todos los caracteres |
| `error` | `string` | - | Mensaje de error a mostrar |
| `disabled` | `boolean` | `false` | Deshabilita el input |
| `autoFocus` | `boolean` | `true` | Auto-focus en el primer input |
| `className` | `string` | `""` | Clases CSS adicionales |
| `variant` | `"default" \| "display"` | `"default"` | Variante del componente |
| `showExpiration` | `boolean` | `false` | Mostrar contador de expiración |
| `expirationTime` | `number` | `120` | Tiempo de expiración en segundos |

## Estados Visuales

### Default
- Borde: gris suave (#D1D5DB)
- Fondo: blanco
- Texto: #1C2335

### Focus
- Borde: naranja HeyPoint (#FF6B00)
- Fondo: blanco
- Animación: scale bounce

### Filled
- Borde: naranja HeyPoint (#FF6B00)
- Fondo: crema suave (#FFF4E6)
- Texto: #1C2335

### Error
- Borde: rojo (#EF4444)
- Fondo: rojo claro (#FEF2F2)
- Mensaje de error debajo

### Disabled
- Opacidad: 50%
- Cursor: not-allowed

## Mensajes de Error Predefinidos

```tsx
// Código inválido
<TokenInput error="Código inválido" />

// Formato incorrecto
<TokenInput error="Formato incorrecto" />

// Longitud incorrecta
<TokenInput error="El código debe tener 6 caracteres" />

// Solo alfanumérico
<TokenInput error="Ingresá solo letras y números" />
```

## Integración con API

```tsx
const verifyToken = async (token: string) => {
  setIsLoading(true);
  setError("");

  try {
    const response = await fetch("/api/verify-token", {
      method: "POST",
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      // Token válido - abrir locker
      unlockLocker();
    } else {
      setError("Código inválido. Por favor, verificá tu código.");
      setTokenValue(""); // Limpiar input
    }
  } catch (err) {
    setError("Error de conexión. Intentá nuevamente.");
  } finally {
    setIsLoading(false);
  }
};
```

## Responsive

El componente se adapta automáticamente a diferentes tamaños de pantalla:

- **Desktop (1280px+)**: Celdas 64x72px, texto 2rem
- **Tablet (768px-1279px)**: Celdas 56x64px, texto 1.75rem
- **Mobile (320px-767px)**: Celdas 48x56px, texto 1.5rem

## Accesibilidad

- ✅ Área táctil mínima 44px (mobile)
- ✅ Contraste AA mínimo (WCAG 2.1)
- ✅ Labels ARIA para cada celda
- ✅ Navegación por teclado completa
- ✅ Soporte para screen readers

## Ejemplos de Uso

### Kiosko - Pantalla de Ingreso
Ver: `/pages/TokenEntryPage.tsx`

### Web - Confirmación de Compra
Ver: `/pages/PurchaseSuccessPage.tsx`

### Email - Template de Confirmación
```html
<div style="text-align: center; padding: 40px; background: linear-gradient(135deg, #FF6B00, #e56000);">
  <h2 style="color: white; margin-bottom: 20px;">Tu Código de Retiro</h2>
  <div style="font-size: 48px; font-weight: 700; color: white; letter-spacing: 0.5em;">
    A3X9K2
  </div>
  <p style="color: rgba(255,255,255,0.9); margin-top: 20px;">
    Usá este código para retirar tu pedido en el locker HeyPoint!
  </p>
</div>
```

## Colores HeyPoint

```css
/* Naranja principal */
--heypoint-orange: #FF6B00;
--heypoint-orange-hover: #e56000;

/* Crema suave */
--heypoint-cream: #FFF4E6;

/* Texto */
--text-primary: #1C2335;
--text-secondary: #2E2E2E;

/* Estados */
--error-red: #EF4444;
--error-bg: #FEF2F2;
--success-green: #B6E322;
```

## Formato de Código

Los códigos generados deben seguir este formato:
- **Longitud**: 6 caracteres
- **Caracteres permitidos**: A-Z, 0-9
- **Evitar caracteres ambiguos**: 0/O, 1/I/l
- **Ejemplo válido**: `A3X9K2`, `B7H4M1`, `C9P2W8`
- **Ejemplo inválido**: `ABC12` (muy corto), `123456O` (tiene O)

## Generación de Códigos (Backend)

```typescript
// Ejemplo de generación segura de códigos
function generatePickupCode(): string {
  // Evitar caracteres ambiguos: 0, O, 1, I, l
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}

// Ejemplo: "B7H4M3", "A8K9P2", "C3X5W7"
```
