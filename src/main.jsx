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
  mordeduraAlergiaBeta: {
    title: 'Alternativa en alergia a betalactámicos',
    note: 'Para mordeduras: cubrir Pasteurella/Capnocytophaga + anaerobios. Evitar cefalosporinas como sustituto simple.',
    adult: 'TMS-SMZ 160/800 mg VO cada 12 h + clindamicina 500 mg VO cada 6–8 h',
    tmpSmx: {
      label: 'Trimetoprima/sulfametoxazol',
      doseTmpMgKgDay: 8,
      doseSmxMgKgDay: 40,
      intervalHours: 12,
      maxTmpMgDay: 320,
      maxSmxMgDay: 1600,
      suspension: { label: 'Suspensión 200/40 mg cada 5 ml', tmpMgMl: 8, smxMgMl: 40 },
      tablet: { label: 'Comprimido DS 160/800 mg', tmpMg: 160, smxMg: 800 },
      brands: ['Dosulfín suspensión / comprimidos', 'TMS-SMZ equivalente']
    },
    clindamycin: {
      label: 'Clindamicina',
      doseMgKgDay: 20,
      intervalHours: 8,
      maxMgDay: 1800,
      suspension: { label: 'Resbiotic Pediátrico 75 mg/5 ml', mgMl: 15 },
      adultTablet: { label: 'Esquema adulto SADI: 500 mg', mg: 500 },
      brands: ['Resbiotic Pediátrico', 'Clindamicina equivalente según stock']
    }
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

function BiteBetaAllergyRegimen({ weight, noSolids }) {
  const db = DOSE_DB.mordeduraAlergiaBeta
  const tmp = db.tmpSmx
  const clinda = db.clindamycin
  const [tmpDoseInput, setTmpDoseInput] = useState(String(tmp.doseTmpMgKgDay))
  const [activeTmpDose, setActiveTmpDose] = useState(tmp.doseTmpMgKgDay)
  const [clindaDoseInput, setClindaDoseInput] = useState(String(clinda.doseMgKgDay))
  const [activeClindaDose, setActiveClindaDose] = useState(clinda.doseMgKgDay)
  const [clindaInterval, setClindaInterval] = useState(String(clinda.intervalHours))
  const [open, setOpen] = useState(true)

  const dosesPerDayTmp = 24 / tmp.intervalHours
  const tmpDailyRaw = weight * activeTmpDose
  const tmpDaily = Math.min(tmpDailyRaw, tmp.maxTmpMgDay)
  const smxDailyRaw = weight * (activeTmpDose * 5)
  const smxDaily = Math.min(smxDailyRaw, tmp.maxSmxMgDay)
  const tmpDoseMg = tmpDaily / dosesPerDayTmp
  const smxDoseMg = smxDaily / dosesPerDayTmp
  const tmpMl = tmpDoseMg / tmp.suspension.tmpMgMl
  const tmpTabs = tmpDoseMg / tmp.tablet.tmpMg

  const clindaIntervalNumber = parseNumber(clindaInterval) || 8
  const dosesPerDayClinda = 24 / clindaIntervalNumber
  const clindaDailyRaw = weight * activeClindaDose
  const clindaDaily = Math.min(clindaDailyRaw, clinda.maxMgDay)
  const clindaDoseMg = clindaDaily / dosesPerDayClinda
  const clindaMl = clindaDoseMg / clinda.suspension.mgMl

  const tmpDirty = parseNumber(tmpDoseInput) !== activeTmpDose
  const clindaDirty = parseNumber(clindaDoseInput) !== activeClindaDose
  const applyTmp = () => {
    const next = parseNumber(tmpDoseInput)
    if (!Number.isFinite(next) || next <= 0) return
    setActiveTmpDose(next)
  }
  const applyClinda = () => {
    const next = parseNumber(clindaDoseInput)
    if (!Number.isFinite(next) || next <= 0) return
    setActiveClindaDose(next)
  }

  return (
    <section className="card medCard betaAltCard">
      <div className="sectionTitle"><span>💊</span><h3>{db.title}</h3></div>
      <div className="alert ok">Mordedura + alergia a betalactámicos: alternativa sugerida TMS-SMZ + clindamicina. Validar gravedad, edad, función renal y protocolo local.</div>
      <div className="adultScheme"><b>Paciente que toma comprimidos</b><span>{db.adult}</span></div>
      {noSolids === 'Sí' && <div className="alert warn">Paciente marcado como “no deglute sólidos”: mostrar equivalentes en suspensión.</div>}

      <div className="comboGrid">
        <div className="comboDrug">
          <h4>{tmp.label}</h4>
          <DoseEditor label="Dosis diaria TMP" unit="mg/kg/día" value={tmpDoseInput} setValue={setTmpDoseInput} dirty={tmpDirty} onApply={applyTmp} />
          <div className="doseLine">
            <b>{fmt(tmpMl)} ml VO cada 12 h</b>
            <small>{fmt(tmpDoseMg)} mg TMP + {fmt(smxDoseMg)} mg SMX por toma · {tmp.suspension.label}</small>
          </div>
          <div className="doseLine subtle">
            <b>{fmt(tmpTabs, 1)} comp. DS cada 12 h</b>
            <small>Sólo si deglute comprimidos y el fraccionamiento es práctico. Tope: TMP {tmp.maxTmpMgDay} mg/día.</small>
          </div>
          <Brands brands={tmp.brands} compact />
        </div>

        <div className="comboDrug">
          <h4>{clinda.label}</h4>
          <DoseEditor label="Dosis diaria clindamicina" unit="mg/kg/día" value={clindaDoseInput} setValue={setClindaDoseInput} dirty={clindaDirty} onApply={applyClinda} />
          <label className="compactSelect smallSelect">Intervalo <select value={clindaInterval} onChange={e => setClindaInterval(e.target.value)}><option value="8">cada 8 h</option><option value="6">cada 6 h</option></select></label>
          <div className="doseLine">
            <b>{fmt(clindaMl)} ml VO cada {clindaIntervalNumber} h</b>
            <small>{fmt(clindaDoseMg)} mg por toma · {clinda.suspension.label}</small>
          </div>
          <div className="doseLine subtle">
            <b>{clinda.adultTablet.mg} mg VO cada 6–8 h</b>
            <small>Esquema adulto si toma comprimidos. Tope configurado app: {clinda.maxMgDay} mg/día.</small>
          </div>
          <Brands brands={clinda.brands} compact />
        </div>
      </div>

      <button className="accordionHeader" onClick={() => setOpen(!open)}><span>Ver cálculos y notas</span><b>{open ? '⌃' : '⌄'}</b></button>
      {open && <ol className="calcList">
        <li>TMS-SMZ: {fmt(weight)} kg × {activeTmpDose} mg/kg/día TMP = {fmt(tmpDailyRaw)} mg TMP/día; por cada 1 mg TMP corresponden 5 mg SMX.</li>
        <li>TMS-SMZ por toma: {fmt(tmpDaily)} mg TMP/día ÷ 2 = {fmt(tmpDoseMg)} mg TMP; {fmt(tmpDoseMg)} mg ÷ {tmp.suspension.tmpMgMl} mg/ml = <b>{fmt(tmpMl)} ml</b>.</li>
        <li>Clindamicina: {fmt(weight)} kg × {activeClindaDose} mg/kg/día = {fmt(clindaDailyRaw)} mg/día; ÷ {dosesPerDayClinda} tomas/día = {fmt(clindaDoseMg)} mg/toma.</li>
        <li>Clindamicina suspensión: {fmt(clindaDoseMg)} mg ÷ {clinda.suspension.mgMl} mg/ml = <b>{fmt(clindaMl)} ml por toma</b>.</li>
        <li>Evitar en menores de 2 meses para TMS-SMZ. Ajustar o evitar según función renal, G6PD/hemoglobinopatías, reacciones cutáneas severas previas o criterio infectológico.</li>
      </ol>}
    </section>
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
      {allergy === 'Betalactámicos' ? (
        scenario === 'mordedura'
          ? <BiteBetaAllergyRegimen weight={weight} noSolids={noSolids} />
          : <div className="alert danger">Alergia a betalactámicos: no sugerir amoxicilina/clavulánico. Usar alternativa según protocolo local/infectología.</div>
      ) : (
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
      <section className="card"><div className="sectionTitle"><span>🧼</span><h3>Manejo inicial según SAP</h3></div><ul className="checks"><li>Lavar lo antes posible con abundante agua corriente y jabón; luego irrigar con solución fisiológica.</li><li>Revisar colgajos y anfractuosidades sin agravar la herida. No cepillar.</li><li>Explorar profundidad, tendones, articulación, sensibilidad y perfusión.</li><li>La decisión de cerrar depende del animal, tamaño, ubicación, tiempo de evolución y estado general. Priorizar evitar infección sobre cosmética.</li><li>Verificar tétanos y evaluar profilaxis antirrábica. Contactar zoonosis si corresponde.</li></ul></section>
      <section className="card"><div className="sectionTitle"><span>🚩</span><h3>Clasificación rábica rápida</h3></div><ul className="checks"><li>Leve: lamedura de piel con herida superficial o herida superficial única fuera de cabeza/cara/cuello/manos/pies/genitales.</li><li>Grave: cabeza, cara, cuello, manos, pies, genitales; herida profunda, puntiforme, múltiple, extensa; mucosas; mamíferos silvestres o murciélago.</li><li>Registrar animal agresor, disponibilidad para observación, vacunación y antecedentes epidemiológicos.</li></ul></section>
      <DischargeText type="mordedura" />
    </section>
  )
}


const SUTURE_GUIDE = {
  'Cara / frente': {
    material: 'Nylon/Prolene 5-0 o 6-0',
    technique: 'Puntos simples interrumpidos. Priorizar eversión suave y mínima tensión.',
    removal: '3–5 días; en frente suele ser práctico 5 días + tiras adhesivas.',
    consult: 'Derivar si herida profunda, pérdida de tejido, rama facial, parótida, conducto lagrimal o mala alineación estética.',
    antibiotic: 'No sistémico si limpia y simple.',
    care: 'Puede quedar descubierta o con apósito fino. Higiene suave desde 24–48 h.'
  },
  'Párpado / periocular': {
    material: 'Nylon 6-0 / 7-0 o absorbible fino según disponibilidad',
    technique: 'No cerrar a ciegas si compromete borde palpebral.',
    removal: '3–5 días.',
    consult: 'Oftalmología/plástica si borde palpebral, canalículo lagrimal, canto medial, grasa orbitaria visible, ptosis o lesión penetrante.',
    antibiotic: 'Según oftalmología si periocular compleja.',
    care: 'Evitar presión directa sobre globo ocular. Control precoz.'
  },
  'Labio': {
    material: 'Piel: nylon 6-0. Mucosa: absorbible 4-0/5-0. Músculo: absorbible 4-0 si transfixiante.',
    technique: 'Primer punto en borde bermellón. Error >1 mm deja defecto cosmético visible.',
    removal: 'Piel 3–5 días; mucosa absorbible.',
    consult: 'Derivar si transfixiante extensa, pérdida de tejido, comisura, avulsión o duda para alinear bermellón.',
    antibiotic: 'Considerar si transfixiante intraoral, mordedura o contaminación.',
    care: 'Dieta blanda si mucosa, higiene oral, evitar tracción.'
  },
  'Cuero cabelludo': {
    material: 'Nylon 4-0, grapas o cabello anudado si herida lineal simple.',
    technique: 'Puntos simples o grapas. No rasurar salvo necesidad puntual.',
    removal: '7–10 días.',
    consult: 'Derivar si hundimiento óseo, galea amplia, sangrado persistente, mordedura, cuerpo extraño o trauma craneal asociado.',
    antibiotic: 'No sistémico si limpia y simple.',
    care: 'Puede lavarse con ducha breve luego de 24 h si no sangra; secar sin frotar.'
  },
  'Oreja': {
    material: 'Piel 5-0/6-0. Cartílago/pericondrio: valorar absorbible profundo.',
    technique: 'Cubrir cartílago expuesto. Vendaje compresivo si riesgo de hematoma.',
    removal: '5–7 días.',
    consult: 'Derivar si cartílago expuesto amplio, avulsión, hematoma auricular, pérdida de tejido o mordedura.',
    antibiotic: 'Considerar si cartílago expuesto, mordedura o contaminación.',
    care: 'Control 24–48 h por hematoma/infección.'
  },
  'Tronco': {
    material: 'Nylon 4-0 o 5-0. Si profunda: subcutáneo absorbible 3-0/4-0.',
    technique: 'Puntos simples. Cerrar por planos si hay espacio muerto.',
    removal: '10–14 días según tensión.',
    consult: 'Derivar si penetrante, tórax/abdomen profundo, sangrado, cuerpo extraño o lesión muscular amplia.',
    antibiotic: 'No sistémico si limpia y simple.',
    care: 'Apósito seco/no adherente. Curación diaria si roza con ropa.'
  },
  'Extremidad superior': {
    material: 'Nylon 4-0 o 5-0. Profundo: absorbible 4-0 si precisa.',
    technique: 'Puntos simples. Inmovilizar si cruza articulación.',
    removal: '7–10 días; sobre articulación 10–14 días.',
    consult: 'Derivar si mano, tendón, nervio, vaso, articulación, fractura, déficit sensitivo/motor o perfusión dudosa.',
    antibiotic: 'No sistémico si limpia; considerar si aplastamiento/contaminación.',
    care: 'Elevar 24–48 h. Apósito seco. Control si edema/dolor.'
  },
  'Extremidad inferior': {
    material: 'Nylon 3-0/4-0. Pretibial: evitar cierre bajo tensión.',
    technique: 'Puntos simples; valorar colchonero vertical si tensión y operador entrenado.',
    removal: '10–14 días; más si alta tensión.',
    consult: 'Derivar si tensión excesiva, tejido desvitalizado, exposición ósea/tendinosa, lesión vascular o herida compleja.',
    antibiotic: 'Considerar si contaminación masiva, aplastamiento o inmunocompromiso.',
    care: 'Reposo relativo, elevación, apósito no adherente. Control 24–48 h si riesgo.'
  },
  'Mano / dedos': {
    material: 'Nylon 5-0. Evitar cerrar sin explorar función.',
    technique: 'Antes de anestesia documentar flexión/extensión, sensibilidad y perfusión.',
    removal: '10–14 días.',
    consult: 'Derivar si lesión tendinosa, nerviosa, vascular, articular, lecho ungueal complejo, mordedura o cuerpo extraño.',
    antibiotic: 'Considerar si mordedura, punción, aplastamiento o contaminación.',
    care: 'Apósito robusto, elevación, inmovilización si cruza articulación.'
  },
  'Pie / planta': {
    material: 'Nylon 3-0/4-0 según tensión.',
    technique: 'Puntos simples. La planta requiere alta resistencia y descarga.',
    removal: '14–21 días.',
    consult: 'Derivar si punción profunda, cuerpo extraño, lesión tendinosa, articulación, infección o paciente no puede descargar.',
    antibiotic: 'Considerar si punción por calzado, contaminación o inmunocompromiso.',
    care: 'Descarga, calzado abierto si posible, control 24–48 h si profunda.'
  },
  'Genital / periné': {
    material: 'Preferir absorbible 4-0/5-0 según zona.',
    technique: 'No cerrar sin descartar lesión uretral, anal, vaginal o abuso.',
    removal: 'Absorbible; si piel con nylon, 7–10 días.',
    consult: 'Derivar de entrada si genital, perineal, anal, sangrado importante o sospecha de abuso.',
    antibiotic: 'Según mecanismo, contaminación y especialista.',
    care: 'Higiene suave, control precoz.'
  }
}

const SUTURE_CHECKLIST = [
  'Hemostasia y exploración completa antes de cerrar.',
  'Documentar función distal antes de anestesiar: movilidad, sensibilidad, perfusión.',
  'Irrigar con abundante solución fisiológica o agua potable segura; retirar cuerpos extraños visibles.',
  'Cerrar sólo si bordes aproximables, tejido viable y contaminación controlada.',
  'No cerrar bajo tensión excesiva. Si hay espacio muerto, valorar plano profundo o derivar.',
  'Elegir absorbible si el niño probablemente requerirá sedación también para retirar puntos.'
]

const CONSULT_FLAGS = [
  'Compromiso tendinoso, nervioso, vascular, articular, óseo o déficit funcional.',
  'Herida en párpado, labio complejo, oreja con cartílago, mano, genital/periné o cara con alto impacto estético.',
  'Mordedura profunda, humana, gato, mano/pie/cara compleja o herida infectada.',
  'Pérdida de tejido, avulsión, aplastamiento, tejido desvitalizado o cierre con tensión.',
  'Cuerpo extraño no removible, vidrio/madera sospechado, herida penetrante en tórax/abdomen/cuello.',
  'Sangrado que no cede, necesidad de sedación, niño no colaborador o falta de experiencia del operador.',
  'Sospecha de maltrato, lesión autoinfligida o mecanismo no consistente.'
]

function SutureDiagram() {
  return (
    <div className="sutureDiagram" aria-label="Diagrama esquemático de punto simple">
      <div className="skinPlane left">Piel A</div>
      <div className="woundGap">Herida</div>
      <div className="skinPlane right">Piel B</div>
      <div className="thread arc1" />
      <div className="thread arc2" />
      <div className="knot">nudo lateral</div>
      <div className="diagramCaption">Punto simple: entrada a 90°, misma distancia a ambos lados, bordes evertidos, nudo al costado.</div>
    </div>
  )
}

function SutureQuick({ zone = 'Cara / frente', expanded = false }) {
  const [z, setZ] = useState(SUTURE_GUIDE[zone] ? zone : 'Cara / frente')
  const [open, setOpen] = useState(expanded)
  const item = SUTURE_GUIDE[z]
  return (
    <section className="card sutureCard">
      <div className="sectionTitle"><span>🪡</span><h3>Suturas por zona</h3></div>
      <label className="compactSelect">Zona <select value={z} onChange={e => setZ(e.target.value)}>{Object.keys(SUTURE_GUIDE).map(k => <option key={k}>{k}</option>)}</select></label>
      <div className="sutureResultGrid">
        <div><small>Material</small><b>{item.material}</b></div>
        <div><small>Técnica</small><b>{item.technique}</b></div>
        <div><small>Retiro</small><b>{item.removal}</b></div>
      </div>
      <div className="alert warn"><b>Interconsulta:</b> {item.consult}</div>
      <button className="accordionHeader" onClick={() => setOpen(!open)}><span>Ver antibiótico, curaciones y alta</span><b>{open ? '⌃' : '⌄'}</b></button>
      {open && <div className="sutureDetails">
        <div className="miniBlock"><b>Antibiótico</b><span>{item.antibiotic}</span></div>
        <div className="miniBlock"><b>Curación</b><span>{item.care}</span></div>
        <div className="miniBlock"><b>Alta</b><span>Pautas de alarma, fecha de control/retiro, estado antitetánico y analgesia según peso.</span></div>
      </div>}
    </section>
  )
}

function SutureBasics() {
  const [open, setOpen] = useState(true)
  return (
    <section className="card">
      <div className="sectionTitle"><span>📚</span><h3>Básicos antes de suturar</h3></div>
      <SutureDiagram />
      <button className="accordionHeader" onClick={() => setOpen(!open)}><span>Checklist rápido</span><b>{open ? '⌃' : '⌄'}</b></button>
      {open && <ul className="checks roomy">{SUTURE_CHECKLIST.map(x => <li key={x}>{x}</li>)}</ul>}
    </section>
  )
}

function ConsultationCard() {
  return (
    <section className="card dangerSoft">
      <div className="sectionTitle"><span>🚩</span><h3>Derivar / avisar cirugía</h3></div>
      <ul className="checks roomy">{CONSULT_FLAGS.map(x => <li key={x}>{x}</li>)}</ul>
    </section>
  )
}

function ClosureSelectionCard() {
  return (
    <section className="card">
      <div className="sectionTitle"><span>🧭</span><h3>Elegir tipo de cierre</h3></div>
      <div className="decisionGrid">
        <div><b>Punto simple</b><span>Default para la mayoría de laceraciones simples. Fácil de colocar y retirar.</span></div>
        <div><b>Tiras adhesivas</b><span>Heridas pequeñas, lineales, baja tensión, bordes muy aproximables.</span></div>
        <div><b>Adhesivo tisular</b><span>Cara/cuero cabelludo, baja tensión, sin sangrado. No usar si bordes mal alineados.</span></div>
        <div><b>Grapas</b><span>Cuero cabelludo o tronco lineal. Rápidas, no ideales en cara.</span></div>
        <div><b>Plano profundo</b><span>Espacio muerto o tensión. Si no tenés práctica, interconsulta.</span></div>
        <div><b>No cerrar / diferido</b><span>Mordedura infectada, contaminación no controlada, tejido desvitalizado o alto riesgo.</span></div>
      </div>
    </section>
  )
}

function DressingPlanCard() {
  return (
    <section className="card">
      <div className="sectionTitle"><span>🧼</span><h3>Curaciones y control</h3></div>
      <div className="careGrid">
        <div className="careItem"><b>Domiciliaria</b><span>Herida simple, limpia, cuidador confiable. Mantener seca 24–48 h; luego lavar con agua y jabón, secar, cubrir si roza.</span></div>
        <div className="careItem"><b>Centro de salud</b><span>Riesgo moderado, familia con dudas, mano/pie, extremidad inferior, niño pequeño, cambio de apósito o control 24–48 h.</span></div>
        <div className="careItem"><b>Guardia/cirugía</b><span>Dolor progresivo, secreción, fiebre, dehiscencia, déficit funcional, sangrado, mordedura compleja o mala evolución.</span></div>
      </div>
      <div className="kitBox"><b>Elementos:</b> guantes limpios, agua y jabón o solución fisiológica, gasas, apósito no adherente, cinta/film, vaselina o ungüento tópico si protocolo local. Evitar alcohol/agua oxigenada dentro de la herida.</div>
    </section>
  )
}

function AntibioticAftercareCard({ setActive }) {
  return (
    <section className="card">
      <div className="sectionTitle"><span>💊</span><h3>Antibióticos al alta</h3></div>
      <div className="alert ok">Herida cortante limpia y simple: no usar antibiótico sistémico de rutina.</div>
      <ul className="checks roomy">
        <li>Indicar o valorar si mordedura, contaminación masiva, aplastamiento, tejido desvitalizado, exposición de cartílago/hueso/tendón, inmunocompromiso o infección establecida.</li>
        <li>En mordedura, usar módulo específico para amoxicilina/clavulánico o alternativa en alergia a betalactámicos.</li>
        <li>El desbridamiento, irrigación y control precoz son más importantes que el antibiótico en heridas contaminadas.</li>
      </ul>
      <button className="primary ghost" onClick={() => setActive?.('mordeduras')}>Abrir módulo Mordeduras</button>
    </section>
  )
}

function TetanusCard() {
  return (
    <section className="card">
      <div className="sectionTitle"><span>💉</span><h3>Tétanos</h3></div>
      <div className="tetanusGrid">
        <div><b>Herida limpia menor</b><span>Refuerzo si esquema completo pero última dosis ≥10 años. Sin TIG.</span></div>
        <div><b>Herida sucia/mayor</b><span>Refuerzo si última dosis ≥5 años. TIG si esquema desconocido/incompleto o inmunodeficiencia relevante.</span></div>
      </div>
      <p className="tinyNote">Registrar fecha de última dosis y esquema. Adaptar a calendario argentino y disponibilidad local.</p>
    </section>
  )
}

function AlarmCard() {
  return (
    <section className="card">
      <div className="sectionTitle"><span>⚠️</span><h3>Pautas de alarma</h3></div>
      <div className="chips"><span>Fiebre</span><span>Dolor progresivo</span><span>Eritema que avanza</span><span>Calor/edema</span><span>Pus/mal olor</span><span>Líneas rojas</span><span>Apertura</span><span>Sangrado</span><span>Adormecimiento</span><span>Déficit motor</span></div>
    </section>
  )
}

function LearningResourcesCard() {
  return (
    <section className="card">
      <div className="sectionTitle"><span>🎥</span><h3>Recursos visuales</h3></div>
      <div className="videoList">
        <a href="https://www.msdmanuals.com/professional/multimedia/video/how-to-do-simple-interrupted-sutures" target="_blank" rel="noreferrer">MSD Manual · Punto simple interrumpido</a>
        <a href="https://www.nejm.org/doi/full/10.1056/NEJMvcm064238" target="_blank" rel="noreferrer">NEJM · Basic Laceration Repair</a>
        <a href="https://www.youtube.com/watch?v=z8oWv-nVO6g" target="_blank" rel="noreferrer">Geeky Medics · Simple interrupted suture</a>
        <a href="https://www.youtube.com/playlist?list=PLUv9oht3hC6SGfT8BogmOAaXE8Uez9TNY" target="_blank" rel="noreferrer">CHOP · Basic Suture Techniques</a>
      </div>
      <p className="tinyNote">Usar los videos como entrenamiento visual; no reemplazan supervisión local ni práctica en simulador.</p>
    </section>
  )
}

function SutureDischargeText() {
  const text = 'Herida suturada: mantener limpia y seca 24–48 h. Luego lavar suavemente con agua y jabón, secar sin frotar y cubrir si roza o drena. No sumergir. Analgesia según peso. Control/retiro de puntos según zona. Consultar si fiebre, dolor progresivo, enrojecimiento que avanza, calor, edema, pus, mal olor, apertura de la herida, sangrado, adormecimiento o dificultad para mover la zona. Verificar vacunación antitetánica.'
  const copy = async () => { try { await navigator.clipboard.writeText(text) } catch {} }
  return <section className="card"><div className="sectionTitle"><span>📄</span><h3>Indicación al alta para copiar</h3></div><p className="copyText">{text}</p><button className="primary ghost" onClick={copy}>Copiar indicación</button></section>
}

function Suturas({ formPatient, setFormPatient, calculatedPatient, onCalculate, setActive }) {
  const weight = parseNumber(calculatedPatient?.weight) || 0
  return (
    <section className="screen stack">
      <div className="topBar"><span>🪡</span><div><h2>Suturas</h2><p>Guía rápida para operadores con experiencia limitada: zona, material, técnica, alta e interconsulta.</p></div></div>
      {formPatient && <PatientPanel formPatient={formPatient} setFormPatient={setFormPatient} calculatedPatient={calculatedPatient} onCalculate={onCalculate} />}
      <SutureQuick expanded />
      {weight > 0 ? <LidocaineCalc weight={weight} /> : <EmptyWeight />}
      <SutureBasics />
      <ClosureSelectionCard />
      <ConsultationCard />
      <AntibioticAftercareCard setActive={setActive} />
      <DressingPlanCard />
      <TetanusCard />
      <AlarmCard />
      <LearningResourcesCard />
      <SutureDischargeText />
    </section>
  )
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
  const screen = active === 'heridas' ? <Heridas {...sharedProps} /> : active === 'mordeduras' ? <Mordeduras {...sharedProps} /> : active === 'suturas' ? <Suturas {...sharedProps} setActive={setActive} /> : active === 'abdomen' ? <Abdomen {...sharedProps} /> : <Analgesia {...sharedProps} />
  return <div className="phoneShell"><div className="app"><Header /><Home active={active} setActive={setActive} />{screen}<div className="legal">Herramienta de apoyo para profesionales. Verificar guías locales. Versión 0.4.</div><BottomNav active={active} setActive={setActive} /></div></div>
}

createRoot(document.getElementById('root')).render(<App />)
