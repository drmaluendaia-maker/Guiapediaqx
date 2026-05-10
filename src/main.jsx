import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const fmt = (n, digits = 1) => {
  if (Number.isNaN(n) || !Number.isFinite(n)) return '—'
  return n.toLocaleString('es-AR', {
    maximumFractionDigits: digits,
    minimumFractionDigits: n % 1 === 0 ? 0 : digits
  })
}

const parseNumber = (value) => Number(String(value ?? '').replace(',', '.'))

const AGE_OPTIONS = Array.from({ length: 16 }, (_, i) => ({
  value: String(i),
  label: i === 1 ? '1 año' : `${i} años`
}))

const patientEquals = (a, b) => JSON.stringify(a) === JSON.stringify(b)

const DOSE_DB = {
  lidocaina: {
    title: 'Lidocaína sin adrenalina',
    note: 'Default conservador institucional: 3 mg/kg. Cambiar sólo si el protocolo local lo autoriza.',
    doseMgKg: 3,
    maxMg: 200,
    brands: ['Lidocaína genérica hospitalaria', 'Xylocaína / equivalentes según stock'],
    concentrations: [
      { id: '2', label: '2% — 20 mg/ml', mgMl: 20, preferred: true },
      { id: '1', label: '1% — 10 mg/ml', mgMl: 10 }
    ]
  },
  amoxClav: {
    title: 'Amoxicilina/clavulánico',
    doseMgKgDay: 50,
    intervalHours: 12,
    note: 'Calcular por componente amoxicilina. No indicar de rutina en herida limpia.',
    concentrations: [
      {
        id: '400',
        label: 'Suspensión 400/57 mg cada 5 ml',
        mgMl: 80,
        maxMgDay: 2000,
        default: true,
        brands: ['Amoxidal Dúo', 'Optamox Dúo', 'Amoclav Dúo', 'Amoxi Plus Mar']
      },
      {
        id: '600',
        label: 'Suspensión 600/42,9 mg cada 5 ml — 14:1',
        mgMl: 120,
        maxMgDay: 3600,
        brands: ['Optamox Dúo 14:1']
      },
      {
        id: '875',
        label: 'Comprimido 875/125 mg',
        tabletMg: 875,
        maxMgDay: 1750,
        brands: ['Optamox Dúo 1 g', 'Amoxidal Dúo 875', 'Amoclav Dúo', 'Amoxi Plus Mar']
      }
    ]
  },
  analgesia: {
    paracetamol: {
      label: 'Paracetamol',
      doseMgKg: 15,
      interval: 'cada 6 h',
      maxMgDayKg: 60,
      maxMgDay: 4000,
      concentrations: [
        { id: 'gotas', label: 'Gotas 100 mg/ml', mgMl: 100, brands: ['Tafirolito gotas', 'Tafirol gotas / equivalentes'] },
        { id: 'jarabe', label: 'Jarabe 120 mg/5 ml', mgMl: 24, brands: ['Tafirol Pediátrico', 'Tafirolito jarabe / equivalentes'] }
      ]
    },
    ibuprofeno2: {
      label: 'Ibuprofeno 2%',
      doseMgKg: 10,
      interval: 'cada 6–8 h',
      maxMgDayKg: 40,
      concentrations: [{ id: '2', label: '2% — 100 mg/5 ml', mgMl: 20, brands: ['Ibupirac 2%', 'Ibuprofeno pediátrico equivalente'] }]
    },
    ibuprofeno4: {
      label: 'Ibuprofeno 4%',
      doseMgKg: 10,
      interval: 'cada 6–8 h',
      maxMgDayKg: 40,
      concentrations: [{ id: '4', label: '4% — 200 mg/5 ml', mgMl: 40, brands: ['Ibupirac 4%', 'Actron Pediátrico / equivalentes'] }]
    },
    dipirona: {
      label: 'Dipirona / metamizol gotas',
      doseMgKg: 12.5,
      interval: 'cada 6 h',
      concentration: '500 mg/ml; 20 gotas/ml; 25 mg/gota',
      brands: ['Novalgina gotas', 'Dipirona gotas equivalente']
    }
  }
}

const modules = [
  { id: 'heridas', label: 'Heridas', icon: '🩹' },
  { id: 'mordeduras', label: 'Mordeduras', icon: '🐕' },
  { id: 'suturas', label: 'Suturas', icon: '🪡' },
  { id: 'abdomen', label: 'Abdomen', icon: '🩺' },
  { id: 'analgesia', label: 'Analgesia', icon: '💊' },
]

function Header() {
  const [logoError, setLogoError] = useState(false)
  return (
    <header className="appHeader">
      <div className="brand">
        {!logoError ? <img src="/logo.png" alt="Hospital Pediátrico Notti" onError={() => setLogoError(true)} /> : <div className="fallbackLogo">NOTTI</div>}
        <div>
          <h1>Guía Quirúrgica Pediátrica</h1>
          <p>Dosis y tratamiento · Uso profesional</p>
        </div>
      </div>
      <button className="helpBtn" title="Ayuda">?</button>
    </header>
  )
}

function Home({ active, setActive }) {
  return (
    <section className="screen">
      <div className="heroCard">
        <p className="eyebrow">Modo guardia</p>
        <h2>¿Qué estás atendiendo?</h2>
        <p>Elegí el motivo de consulta. Cargá el peso una vez y presioná Calcular para actualizar todos los módulos.</p>
      </div>
      <div className="moduleGrid">
        {modules.map(m => (
          <button key={m.id} className={`moduleTile ${active === m.id ? 'active' : ''}`} onClick={() => setActive(m.id)}>
            <span>{m.icon}</span>
            <b>{m.label}</b>
          </button>
        ))}
      </div>
    </section>
  )
}

function PatientPanel({ formPatient, setFormPatient, calculatedPatient, onCalculate }) {
  const set = (key, value) => setFormPatient(prev => ({ ...prev, [key]: value }))
  const pending = !patientEquals(formPatient, calculatedPatient)
  return (
    <section className="card patientCard">
      <div className="sectionTitle"><span>👤</span><h3>Datos del paciente</h3></div>
      <div className="fieldGrid">
        <label className="field"><span>Peso (kg)</span><input inputMode="decimal" value={formPatient.weight} onChange={e => set('weight', e.target.value.replace(',', '.'))} /></label>
        <label className="field"><span>Edad</span><select value={formPatient.age} onChange={e => set('age', e.target.value)}>{AGE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></label>
        <label className="field"><span>Alergias</span><select value={formPatient.allergy} onChange={e => set('allergy', e.target.value)}><option>No conocidas</option><option>Betalactámicos</option><option>Otra alergia relevante</option></select></label>
        <label className="field"><span>No deglute sólidos</span><select value={formPatient.noSolids} onChange={e => set('noSolids', e.target.value)}><option>No</option><option>Sí</option></select></label>
      </div>
      <div className="calculateActions">
        <button className="wideCalcBtn" onClick={onCalculate}>🧮 Calcular indicaciones</button>
        <div className={pending ? 'pendingBar' : 'okBar'}>{pending ? 'Hay cambios sin calcular. Presioná Calcular para actualizar todas las indicaciones.' : `Indicaciones calculadas con ${calculatedPatient.weight || '—'} kg y ${AGE_OPTIONS.find(a => a.value === calculatedPatient.age)?.label || 'edad no cargada'}.`}</div>
      </div>
    </section>
  )
}

function Brands({ brands = [], compact = false }) {
  if (!brands.length) return null
  return (
    <div className={compact ? 'brandBox compact' : 'brandBox'}>
      <b>Marcas habituales / ejemplos AR:</b>
      <span>{brands.join(' · ')}</span>
    </div>
  )
}

function DoseEditor({ label, unit, value, setValue, onApply, dirty }) {
  return (
    <div className="doseEditor">
      <label>
        <span>{label}</span>
        <div>
          <input inputMode="decimal" value={value} onChange={e => setValue(e.target.value.replace(',', '.'))} />
          <small>{unit}</small>
        </div>
      </label>
      <button className={dirty ? 'recalcBtn dirty' : 'recalcBtn'} onClick={onApply}>Recalcular medicamento</button>
    </div>
  )
}

function LidocaineCalc({ weight }) {
  const [conc, setConc] = useState('2')
  const [open, setOpen] = useState(true)
  const selected = DOSE_DB.lidocaina.concentrations.find(c => c.id === conc)
  const maxMgByWeight = weight * DOSE_DB.lidocaina.doseMgKg
  const maxMg = Math.min(maxMgByWeight, DOSE_DB.lidocaina.maxMg)
  const ml = maxMg / selected.mgMl
  return (
    <section className="card resultCard">
      <div className="sectionTitle green"><span>✅</span><h3>Resultado rápido</h3></div>
      <label className="compactSelect">Concentración <select value={conc} onChange={e => setConc(e.target.value)}>{DOSE_DB.lidocaina.concentrations.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
      <div className="bigResult">
        <span>Lidocaína {conc}% sin adrenalina</span>
        <strong>{fmt(ml)} ml máximo</strong>
        <small>{fmt(maxMg)} mg · {DOSE_DB.lidocaina.doseMgKg} mg/kg · {selected.mgMl} mg/ml</small>
      </div>
      <Brands brands={DOSE_DB.lidocaina.brands} compact />
      <button className="accordionHeader" onClick={() => setOpen(!open)}><span>Ver cálculo</span><b>{open ? '⌃' : '⌄'}</b></button>
      {open && <ol className="calcList">
        <li><b>{fmt(weight)}</b> kg × {DOSE_DB.lidocaina.doseMgKg} mg/kg = <b>{fmt(maxMgByWeight)}</b> mg</li>
        <li>Tope absoluto configurado: {DOSE_DB.lidocaina.maxMg} mg</li>
        <li>Lidocaína {conc}% = {selected.mgMl} mg/ml</li>
        <li>{fmt(maxMg)} mg ÷ {selected.mgMl} mg/ml = <b>{fmt(ml)} ml</b></li>
      </ol>}
      <div className="safetyBox">Aspirar antes de infiltrar · infiltrar lento · usar el menor volumen efectivo · recalcular si se suma anestesia tópica.</div>
    </section>
  )
}

function AntibioticBox({ weight, allergy, noSolids, scenario = 'herida' }) {
  const [conc, setConc] = useState('400')
  const ab = DOSE_DB.amoxClav
  const [doseInput, setDoseInput] = useState(String(ab.doseMgKgDay))
  const [activeDose, setActiveDose] = useState(ab.doseMgKgDay)
  const [open, setOpen] = useState(false)
  const selected = ab.concentrations.find(c => c.id === conc)
  const doseDirty = parseNumber(doseInput) !== activeDose
  const maxMgDay = selected.maxMgDay
  const dailyMgRaw = weight * activeDose
  const dailyMg = Math.min(dailyMgRaw, maxMgDay)
  const dosesPerDay = 24 / ab.intervalHours
  const doseMg = dailyMg / dosesPerDay
  const ml = selected.mgMl ? doseMg / selected.mgMl : null
  const indicated = scenario === 'mordedura'
  const applyDose = () => {
    const next = parseNumber(doseInput)
    if (!Number.isFinite(next) || next <= 0) return
    setActiveDose(next)
  }
  return (
    <section className="card medCard">
      <div className="sectionTitle"><span>💊</span><h3>Antibiótico</h3></div>
      {allergy === 'Betalactámicos' ? <div className="alert danger">Alergia a betalactámicos: no sugerir amoxicilina/clavulánico. Usar alternativa según protocolo local/infectología.</div> : (
        <>
          <div className={`alert ${indicated ? 'ok' : 'warn'}`}>{indicated ? 'Indicado/considerar fuerte en mordeduras de alto riesgo.' : 'No rutinario en herida limpia. Considerar sólo si contaminación, mordedura, inmunocompromiso, mano/pie, compromiso profundo o infección.'}</div>
          <label className="compactSelect">Presentación <select value={conc} onChange={e => setConc(e.target.value)}>{ab.concentrations.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
          <DoseEditor label="Dosis diaria deseada" unit="mg/kg/día" value={doseInput} setValue={setDoseInput} dirty={doseDirty} onApply={applyDose} />
          {noSolids === 'Sí' && selected.tabletMg && <div className="alert warn">Paciente marcado como “no deglute sólidos”: preferir suspensión si está disponible.</div>}
          {selected.tabletMg ? (
            <div className="doseLine">
              <b>{fmt(doseMg / selected.tabletMg, 1)} comp. cada 12 h</b>
              <small>Dosis calculada: {fmt(doseMg)} mg por dosis. Sugerencia práctica habitual en peso adulto: 1 comprimido cada 12 h. Validar factibilidad de fraccionamiento.</small>
            </div>
          ) : (
            <div className="doseLine">
              <b>{fmt(ml)} ml VO cada 12 h</b>
              <small>{fmt(doseMg)} mg por dosis · {activeDose} mg/kg/día por componente amoxicilina · duración orientativa 3–5 días profilaxis, 5–7 días si infección.</small>
            </div>
          )}
          <Brands brands={selected.brands} />
          <button className="accordionHeader" onClick={() => setOpen(!open)}><span>Ver cálculo del antibiótico</span><b>{open ? '⌃' : '⌄'}</b></button>
          {open && <ol className="calcList">
            <li>{fmt(weight)} kg × {activeDose} mg/kg/día = <b>{fmt(dailyMgRaw)} mg/día</b></li>
            <li>Tope según presentación seleccionada: {fmt(maxMgDay)} mg/día</li>
            <li>Dosis diaria usada: {fmt(dailyMg)} mg/día ÷ {dosesPerDay} tomas/día = <b>{fmt(doseMg)} mg por toma</b></li>
            {selected.mgMl ? <li>{fmt(doseMg)} mg ÷ {selected.mgMl} mg/ml = <b>{fmt(ml)} ml por toma</b></li> : <li>{fmt(doseMg)} mg ÷ {selected.tabletMg} mg/comprimido = <b>{fmt(doseMg / selected.tabletMg, 1)} comprimidos por toma</b></li>}
          </ol>}
        </>
      )}
    </section>
  )
}

function Heridas({ formPatient, setFormPatient, calculatedPatient, onCalculate }) {
  const weight = parseNumber(calculatedPatient.weight) || 0
  return (
    <section className="screen stack">
      <div className="topBar"><span>🩹</span><div><h2>Heridas cortantes</h2><p>Cierre, lidocaína, suturas e indicación al alta.</p></div></div>
      <PatientPanel formPatient={formPatient} setFormPatient={setFormPatient} calculatedPatient={calculatedPatient} onCalculate={onCalculate} />
      {weight > 0 ? <><LidocaineCalc weight={weight} /><AntibioticBox weight={weight} allergy={calculatedPatient.allergy} noSolids={calculatedPatient.noSolids} /><SutureQuick zone="Cara / frente" /><InitialCare /><DischargeText type="herida" /></> : <EmptyWeight />}
    </section>
  )
}

function Mordeduras({ formPatient, setFormPatient, calculatedPatient, onCalculate }) {
  const weight = parseNumber(calculatedPatient.weight) || 0
  const [animal, setAnimal] = useState('Perro')
  const [location, setLocation] = useState('Extremidad')
  return (
    <section className="screen stack">
      <div className="topBar"><span>🐕</span><div><h2>Mordeduras</h2><p>Perro, gato o humana. Irrigación, riesgo, ATB, tétanos/rabia.</p></div></div>
      <PatientPanel formPatient={formPatient} setFormPatient={setFormPatient} calculatedPatient={calculatedPatient} onCalculate={onCalculate} />
      <section className="card"><div className="sectionTitle"><span>🧭</span><h3>Clasificación rápida</h3></div><div className="fieldGrid"><label className="field"><span>Origen</span><select value={animal} onChange={e => setAnimal(e.target.value)}><option>Perro</option><option>Gato</option><option>Humana</option><option>Otro</option></select></label><label className="field"><span>Localización</span><select value={location} onChange={e => setLocation(e.target.value)}><option>Extremidad</option><option>Mano</option><option>Cara</option><option>Pie</option><option>Genitales</option></select></label></div><div className="alert warn">Alto riesgo si mano/pie, punción profunda, gato, humana, inmunocompromiso, demora, compromiso articular/tendinoso o signos de infección.</div></section>
      {weight > 0 ? <AntibioticBox weight={weight} allergy={calculatedPatient.allergy} noSolids={calculatedPatient.noSolids} scenario="mordedura" /> : <EmptyWeight />}
      <section className="card"><div className="sectionTitle"><span>🧼</span><h3>Manejo inicial</h3></div><ul className="checks"><li>Irrigación abundante con solución fisiológica.</li><li>Explorar profundidad, tendones, articulación, sensibilidad y perfusión.</li><li>Evitar cierre primario si infectada o alto riesgo; cara puede cerrarse tras limpieza adecuada y consulta temprana.</li><li>Verificar tétanos y evaluar profilaxis antirrábica según normativa local.</li></ul></section>
      <DischargeText type="mordedura" />
    </section>
  )
}

function SutureQuick({ zone = 'Seleccionar zona' }) {
  const [z, setZ] = useState(zone)
  const rows = {
    'Cara / frente': ['Nylon 5-0 / 6-0', 'Puntos simples interrumpidos', 'Retiro 5–7 días'],
    'Cuero cabelludo': ['Nylon 4-0 o grapas', 'Puntos simples', 'Retiro 7–10 días'],
    'Extremidad': ['Nylon 4-0', 'Puntos simples', 'Retiro 10–14 días'],
    'Mano / dedos': ['Nylon 5-0', 'Evaluar tendón/nervio/vaso', 'Retiro 10–14 días'],
    'Labio': ['Nylon 6-0 piel / absorbible mucosa', 'Alinear borde bermellón', 'Control estrecho']
  }
  return <section className="card"><div className="sectionTitle"><span>🪡</span><h3>Suturas sugeridas</h3></div><label className="compactSelect">Zona <select value={z} onChange={e => setZ(e.target.value)}>{Object.keys(rows).map(k => <option key={k}>{k}</option>)}</select></label><div className="summaryList">{rows[z].map(x => <span key={x}>{x}</span>)}</div></section>
}

function Suturas() {
  return <section className="screen stack"><div className="topBar"><span>🪡</span><div><h2>Suturas por zona</h2><p>Material, técnica, retiro y alertas de derivación.</p></div></div><SutureQuick /><section className="card"><div className="sectionTitle"><span>🚩</span><h3>Derivar / avisar cirugía</h3></div><ul className="checks"><li>Lesión tendinosa, nerviosa, vascular o articular.</li><li>Pérdida de tejido, mordedura profunda, cuerpo extraño no removible.</li><li>Herida compleja en cara, labio, párpado, oreja, mano o genitales.</li></ul></section></section>
}

function Abdomen({ formPatient, setFormPatient, calculatedPatient, onCalculate }) {
  const [pas, setPas] = useState({ jump: false, anorexia: false, fever: false, vomit: false, rlq: false, wbc: false, neutro: false, migration: false })
  const score = (pas.jump ? 2 : 0) + (pas.anorexia ? 1 : 0) + (pas.fever ? 1 : 0) + (pas.vomit ? 1 : 0) + (pas.rlq ? 2 : 0) + (pas.wbc ? 1 : 0) + (pas.neutro ? 1 : 0) + (pas.migration ? 1 : 0)
  const risk = score <= 3 ? ['Bajo riesgo', 'Reevaluación clínica, alta sólo si buen estado y pautas claras.'] : score <= 6 ? ['Riesgo intermedio', 'Observación seriada, laboratorio, orina y ecografía según disponibilidad.'] : ['Alto riesgo', 'Ayuno, vía EV, analgesia, laboratorio y avisar cirugía.']
  const items = [
    ['jump', 'Dolor FID al saltar/toser/percutir', 2], ['anorexia', 'Anorexia', 1], ['fever', 'Fiebre ≥38 °C', 1], ['vomit', 'Náuseas/vómitos', 1], ['rlq', 'Dolor en fosa ilíaca derecha', 2], ['wbc', 'Leucocitos >10.000', 1], ['neutro', 'Neutrófilos >7.500', 1], ['migration', 'Migración del dolor a FID', 1]
  ]
  return <section className="screen stack"><div className="topBar"><span>🩺</span><div><h2>Dolor abdominal</h2><p>Diferenciales, estudios y PAS para apendicitis.</p></div></div><PatientPanel formPatient={formPatient} setFormPatient={setFormPatient} calculatedPatient={calculatedPatient} onCalculate={onCalculate} /><section className="card"><div className="sectionTitle"><span>📊</span><h3>Pediatric Appendicitis Score</h3></div><div className="scoreGrid">{items.map(([id, label, points]) => <button key={id} className={pas[id] ? 'scoreBtn on' : 'scoreBtn'} onClick={() => setPas(p => ({ ...p, [id]: !p[id] }))}><span>{label}</span><b>+{points}</b></button>)}</div><div className="scoreResult"><strong>PAS {score}/10</strong><span>{risk[0]}</span><p>{risk[1]}</p></div></section><section className="card"><div className="sectionTitle"><span>🧪</span><h3>Analíticas orientativas</h3></div><ul className="checks"><li>Orina completa ± urocultivo.</li><li>Hemograma y PCR si sospecha inflamatoria/infecciosa.</li><li>Ionograma, urea/creatinina si vómitos, deshidratación o probable cirugía.</li><li>β-hCG en adolescente con posibilidad de embarazo.</li><li>Ecografía si sospecha dirigida o riesgo intermedio/alto.</li></ul></section><section className="card"><div className="sectionTitle"><span>🚩</span><h3>Alarmas</h3></div><div className="chips"><span>Peritonismo</span><span>Vómitos biliosos</span><span>Shock</span><span>Dolor testicular</span><span>Embarazo posible</span><span>Dolor desproporcionado</span></div></section></section>
}

function Analgesia({ formPatient, setFormPatient, calculatedPatient, onCalculate }) {
  const weight = parseNumber(calculatedPatient.weight) || 0
  const [drug, setDrug] = useState('paracetamol')
  const data = DOSE_DB.analgesia
  const d = data[drug]
  const defaultDose = d.doseMgKg
  const [doseInput, setDoseInput] = useState(String(defaultDose))
  const [activeDose, setActiveDose] = useState(defaultDose)
  const doseDirty = parseNumber(doseInput) !== activeDose
  const applyDose = () => {
    const next = parseNumber(doseInput)
    if (!Number.isFinite(next) || next <= 0) return
    setActiveDose(next)
  }
  const handleDrugChange = (value) => {
    setDrug(value)
    const next = data[value].doseMgKg
    setDoseInput(String(next))
    setActiveDose(next)
  }
  let output = null
  let brands = []
  if (weight > 0) {
    if (drug === 'dipirona') {
      const mg = weight * activeDose
      const drops = mg / 25
      output = { main: `${fmt(drops, 0)} gotas por dosis`, sub: `${fmt(mg)} mg · ${d.interval} · ${d.concentration}` }
      brands = d.brands
    } else {
      const conc = d.concentrations[0]
      const mg = weight * activeDose
      const ml = mg / conc.mgMl
      output = { main: `${fmt(ml)} ml por dosis`, sub: `${fmt(mg)} mg · ${d.interval} · ${conc.label}` }
      brands = conc.brands
    }
  }
  return <section className="screen stack"><div className="topBar"><span>💊</span><div><h2>Analgesia pediátrica</h2><p>Cálculo por peso y presentación.</p></div></div><PatientPanel formPatient={formPatient} setFormPatient={setFormPatient} calculatedPatient={calculatedPatient} onCalculate={onCalculate} />{weight > 0 ? <section className="card resultCard medCard"><div className="sectionTitle green"><span>✅</span><h3>Resultado rápido</h3></div><label className="compactSelect">Fármaco <select value={drug} onChange={e => handleDrugChange(e.target.value)}><option value="paracetamol">Paracetamol gotas 100 mg/ml</option><option value="ibuprofeno2">Ibuprofeno 2%</option><option value="ibuprofeno4">Ibuprofeno 4%</option><option value="dipirona">Dipirona gotas</option></select></label><DoseEditor label="Dosis por toma deseada" unit="mg/kg/dosis" value={doseInput} setValue={setDoseInput} dirty={doseDirty} onApply={applyDose} /><div className="bigResult"><span>{d.label}</span><strong>{output.main}</strong><small>{output.sub}</small></div><Brands brands={brands} /><div className="safetyBox">Verificar contraindicaciones: AINEs en deshidratación/insuficiencia renal/sangrado; dipirona según criterio local.</div></section> : <EmptyWeight />}</section>
}

function InitialCare() { return <section className="card"><div className="sectionTitle"><span>📋</span><h3>Manejo inicial</h3></div><ul className="checks"><li>Limpieza e irrigación.</li><li>Explorar cuerpos extraños.</li><li>Cierre primario si herida limpia y bordes aproximables.</li><li>Control en 24–48 h si riesgo o duda.</li></ul></section> }
function EmptyWeight() { return <div className="emptyState">Cargá el peso y presioná Calcular para calcular dosis y volúmenes.</div> }

function DischargeText({ type }) {
  const text = type === 'mordedura' ? 'Control en 24–48 h. Consultar antes si fiebre, aumento de dolor, edema, eritema progresivo, secreción purulenta, limitación funcional o líneas rojas. Completar esquema antibiótico indicado. Reevaluar tétanos y rabia según normativa local.' : 'Mantener herida limpia y seca 24–48 h. Luego lavado suave con agua y jabón. No sumergir. Consultar si dolor progresivo, enrojecimiento, secreción, fiebre, mal olor, apertura de la herida o sangrado. Retiro de puntos según zona.'
  const copy = async () => { try { await navigator.clipboard.writeText(text) } catch {} }
  return <section className="card"><div className="sectionTitle"><span>📄</span><h3>Indicación al alta</h3></div><p className="copyText">{text}</p><button className="primary ghost" onClick={copy}>Copiar indicación</button></section>
}

function BottomNav({ active, setActive }) { return <nav className="bottomNav">{modules.map(m => <button key={m.id} className={active === m.id ? 'active' : ''} onClick={() => setActive(m.id)}><span>{m.icon}</span><small>{m.label}</small></button>)}</nav> }

function App() {
  const [active, setActive] = useState('heridas')
  const [formPatient, setFormPatient] = useState({ weight: '18', age: '5', allergy: 'No conocidas', noSolids: 'No' })
  const [calculatedPatient, setCalculatedPatient] = useState({ weight: '18', age: '5', allergy: 'No conocidas', noSolids: 'No' })
  const onCalculate = () => setCalculatedPatient({ ...formPatient })
  const sharedProps = useMemo(() => ({ formPatient, setFormPatient, calculatedPatient, onCalculate }), [formPatient, calculatedPatient])
  const screen = active === 'heridas' ? <Heridas {...sharedProps} /> : active === 'mordeduras' ? <Mordeduras {...sharedProps} /> : active === 'suturas' ? <Suturas /> : active === 'abdomen' ? <Abdomen {...sharedProps} /> : <Analgesia {...sharedProps} />
  return <div className="phoneShell"><div className="app"><Header /><Home active={active} setActive={setActive} />{screen}<div className="legal">Herramienta de apoyo para profesionales. Verificar guías locales. Versión 0.2.</div><BottomNav active={active} setActive={setActive} /></div></div>
}

createRoot(document.getElementById('root')).render(<App />)
