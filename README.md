# Guía Quirúrgica Pediátrica Notti — WebApp

Prototipo en React + Vite, pensado como WebApp móvil para residentes de pediatría/cirugía.

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

## 3. Novedades de la versión 0.2

- Edad como lista desplegable desde 0 hasta 15 años.
- Botón **Calcular indicaciones** debajo de los datos del paciente.
- La app ya no recalcula automáticamente al escribir: conserva los últimos datos calculados hasta presionar **Calcular**.
- Aviso visual si hay cambios pendientes sin calcular.
- En antibióticos se agregó campo editable **mg/kg/día**.
- Botón **Recalcular medicamento** para modificar sólo ese medicamento sin cambiar todo el caso.
- En analgesia se agregó campo editable **mg/kg/dosis**.
- Se agregaron ejemplos de marcas comerciales habituales de Argentina en los medicamentos incluidos.
- Se agregó explicación desplegable del cálculo antibiótico.

## 4. Ejecutar localmente

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

## 5. Compilar para producción

```bash
npm run build
```

Esto genera la carpeta:

```txt
dist/
```

## 6. Desplegar gratis en Render como Static Site

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

## 7. Módulos incluidos

- Heridas cortantes
- Lidocaína sin adrenalina 1% / 2%
- Mordeduras
- Suturas por zona
- Dolor abdominal + Pediatric Appendicitis Score
- Analgesia: paracetamol, ibuprofeno 2%, ibuprofeno 4%, dipirona gotas
- Indicaciones al alta copiables

## 8. Datos clínicos implementados

### Lidocaína sin adrenalina

```txt
3 mg/kg
Lidocaína 2% = 20 mg/ml
Lidocaína 1% = 10 mg/ml
Tope absoluto configurado: 200 mg
```

### Amoxicilina/clavulánico

```txt
Dosis editable por el usuario en mg/kg/día, calculada por componente amoxicilina.
Default: 50 mg/kg/día.
Frecuencia: cada 12 h.
Presentaciones:
- 400/57 mg cada 5 ml = 80 mg/ml de amoxicilina
- 600/42,9 mg cada 5 ml = 120 mg/ml de amoxicilina
- Comprimido 875/125 mg
```

### Analgesia

```txt
Paracetamol: default 15 mg/kg/dosis
Ibuprofeno: default 10 mg/kg/dosis
Dipirona: default 12,5 mg/kg/dosis ≈ 0,5 gotas/kg si 25 mg/gota
```

## 9. Marcas comerciales

Las marcas comerciales están cargadas como ejemplos para orientar al residente y deben revisarse contra el stock real del hospital/farmacia y el vademécum actualizado.

## 10. Advertencia de uso

Esta versión es un prototipo. Antes de uso clínico real, revisar y aprobar dosis, topes, indicaciones, marcas comerciales, alternativas y duraciones con protocolo institucional local, cirugía pediátrica, infectología y farmacia hospitalaria.


## Cambios v0.3

- Agrega alternativa para mordeduras en alergia a betalactámicos: TMS-SMZ + clindamicina.
- Incluye esquema adulto de referencia: TMS-SMZ 160/800 mg cada 12 h + clindamicina 500 mg cada 6-8 h.
- Incluye equivalentes pediátricos en suspensión: Dosulfín 200/40 mg cada 5 ml y Resbiotic Pediátrico 75 mg cada 5 ml.
- Agrega recomendaciones de manejo inicial de mordeduras según SAP: lavado con agua y jabón, irrigación, no cepillado, cierre según riesgo, tétanos/rabia y contacto con zoonosis cuando corresponda.

## Cambios v0.4

- Reconstruye el módulo **Suturas** como apartado completo y autónomo.
- Agrega selector de zona anatómica con recomendaciones de:
  - material de sutura,
  - técnica básica,
  - tiempo de retiro,
  - necesidad de interconsulta,
  - antibiótico al alta,
  - curaciones y control.
- Incluye cálculo de **lidocaína sin adrenalina** dentro del módulo Suturas.
- Agrega checklist de evaluación previa a la sutura para operadores con experiencia limitada.
- Agrega criterios de **derivar / avisar cirugía**.
- Agrega selección rápida del tipo de cierre: punto simple, tiras adhesivas, adhesivo tisular, grapas, plano profundo o cierre diferido.
- Agrega indicaciones de curación domiciliaria, en centro de salud o guardia/cirugía.
- Agrega pautas de alarma y texto copiable de alta.
- Agrega recordatorio de profilaxis antitetánica.
- Agrega enlaces externos a recursos visuales de sutura básica: MSD Manual, NEJM, Geeky Medics y CHOP.

