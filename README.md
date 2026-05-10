# Guía Quirúrgica Pediátrica Notti — WebApp

Prototipo inicial en React + Vite, pensado como WebApp móvil para residentes.

## 1. Archivos importantes

```txt
notti-guia-quirurgica-webapp/
├─ index.html
├─ package.json
├─ vite.config.js
├─ public/
│  ├─ README-LOGO.txt
│  └─ logo.png              ← agregar manualmente aquí
└─ src/
   ├─ main.jsx              ← lógica clínica, pantallas y calculadoras
   └─ styles.css            ← diseño visual/mobile-first
```

## 2. Logo

Colocá el logo del Hospital Notti con este nombre exacto:

```txt
public/logo.png
```

Si no lo colocás, la app muestra un encabezado textual alternativo “NOTTI”.

## 3. Ejecutar localmente

Necesitás instalar Node.js.

En la carpeta del proyecto:

```bash
npm install
npm run dev
```

Abrí la URL que aparece en la terminal, normalmente:

```txt
http://localhost:5173
```

## 4. Compilar para producción

```bash
npm run build
```

Esto genera la carpeta:

```txt
dist/
```

## 5. Desplegar gratis en Render como Static Site

1. Subí esta carpeta a un repositorio de GitHub.
2. Entrá a Render.
3. New → Static Site.
4. Conectá tu repo.
5. Configuración:

```txt
Build Command: npm install && npm run build
Publish Directory: dist
```

6. Deploy.

## 6. Módulos incluidos en esta versión

- Heridas cortantes
- Lidocaína sin adrenalina 1% / 2%
- Mordeduras
- Suturas por zona
- Dolor abdominal + Pediatric Appendicitis Score
- Analgesia: paracetamol, ibuprofeno 2%, ibuprofeno 4%, dipirona gotas
- Indicaciones al alta copiables

## 7. Datos clínicos implementados

### Lidocaína sin adrenalina

Default conservador:

```txt
3 mg/kg
Lidocaína 2% = 20 mg/ml
Lidocaína 1% = 10 mg/ml
Tope absoluto configurado: 200 mg
```

### Amoxicilina/clavulánico

```txt
50 mg/kg/día por componente amoxicilina
Cada 12 h
Presentaciones:
- 400/57 mg cada 5 ml = 80 mg/ml de amoxicilina
- 600/42,9 mg cada 5 ml = 120 mg/ml de amoxicilina
- Comprimido 875/125 mg
```

### Analgesia

```txt
Paracetamol: 15 mg/kg/dosis
Ibuprofeno: 10 mg/kg/dosis
Dipirona: 12,5 mg/kg/dosis ≈ 0,5 gotas/kg si 25 mg/gota
```

## 8. Advertencia de uso

Esta versión es un prototipo. Antes de uso clínico real, revisar y aprobar las dosis, topes, indicaciones y alternativas con protocolo institucional local, cirugía pediátrica, infectología y farmacia hospitalaria.
