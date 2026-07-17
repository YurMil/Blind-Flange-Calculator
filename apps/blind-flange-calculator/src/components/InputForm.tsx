import type {ReactNode} from 'react';
import {Droplet, Gauge, Sliders, Thermometer} from 'lucide-react';
import type {
  FastenerGradeId,
  FastenerStandard,
  FastenerType,
  FrictionPreset,
  GasketFacing,
  GasketMaterial,
  GeometryMode,
  InputFormProps,
  MaterialId,
  TighteningMethod,
} from '../domain/types/bfTypes';
import {GASKET_OPTIONS, getFastenerCatalogEntry, getFastenerOptionsFor, isFastenerPlaceholder} from '../domain/standards/data';
import CommittedNumberInput from './CommittedNumberInput';
import Field from './Field';

const inputClassName =
  'w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-400';

const Section = ({title, children}: {title: string; children: ReactNode}) => (
  <div className="space-y-3 border-t border-slate-800/80 pt-4 first:border-t-0 first:pt-0">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
    {children}
  </div>
);

const ModeToggle = ({value, onChange}: {value: GeometryMode; onChange: (value: GeometryMode) => void}) => (
  <div
    className="inline-flex rounded-full border border-slate-800 bg-slate-950/60 p-1 text-xs"
    role="radiogroup"
    aria-labelledby="geometry-mode-label"
  >
    {(['standard', 'custom'] as GeometryMode[]).map((mode) => (
      <button
        key={mode}
        type="button"
        role="radio"
        aria-checked={value === mode}
        onClick={() => onChange(mode)}
        className={`rounded-full px-3 py-1 font-semibold transition ${
          value === mode ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-400 hover:text-cyan-100'
        }`}
      >
        {mode === 'standard' ? 'Standard (DN)' : 'Custom geometry'}
      </button>
    ))}
  </div>
);

export default function InputForm({
  geometryMode,
  dn,
  customOuterDiameter,
  customNozzleId,
  geometryMatchNote,
  pressureOp,
  pressureTest,
  temperature,
  material,
  corrosionAllowance,
  gasketMaterial,
  gasketThickness,
  gasketFacing,
  frictionPreset,
  tighteningMethod,
  fastenerStandard,
  fastenerType,
  fastenerGradeId,
  autoTestPressure,
  showTestPressureWarning,
  availableDns,
  materials,
  onOpenHelp,
  onGeometryModeChange,
  onDnChange,
  onCustomOuterDiameterChange,
  onCustomNozzleIdChange,
  onPressureOpChange,
  onPressureTestChange,
  onTemperatureChange,
  onMaterialChange,
  onCorrosionAllowanceChange,
  onGasketMaterialChange,
  onGasketThicknessChange,
  onGasketFacingChange,
  onFrictionPresetChange,
  onTighteningMethodChange,
  onFastenerStandardChange,
  onFastenerTypeChange,
  onFastenerGradeChange,
}: InputFormProps) {
  const fastenerOptionsBase = getFastenerOptionsFor(fastenerStandard, fastenerType);
  const selectedFastener = getFastenerCatalogEntry(fastenerGradeId);
  // Placeholder grades are hidden from the default catalog (B-09), but if an
  // older saved configuration still references one, keep it selectable so the
  // dropdown doesn't silently show a mismatched/blank selection.
  const fastenerOptions = fastenerOptionsBase.some((entry) => entry.id === selectedFastener.id)
    ? fastenerOptionsBase
    : [...fastenerOptionsBase, selectedFastener];
  const fastenerNote = selectedFastener.notes ?? '';
  const fastenerIsPlaceholder = isFastenerPlaceholder(selectedFastener);
  const fastenerStrength =
    !fastenerIsPlaceholder && selectedFastener.proofStressMPa > 1
      ? `${selectedFastener.proofStressMPa} / ${selectedFastener.yieldStressMPa} MPa`
      : 'n/a';

  return (
    <section
      className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40"
      aria-labelledby="parameters-heading"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300" aria-hidden="true">
          <Sliders size={18} />
        </div>
        <div>
          <h2 id="parameters-heading" className="text-lg font-semibold text-slate-100">
            Parameters
          </h2>
          <p className="text-xs text-slate-400">EN 13445-3 sizing inputs</p>
        </div>
      </div>

      <div className="space-y-1">
        <Section title="Geometry">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400" id="geometry-mode-label">
              Geometry mode
            </div>
            <ModeToggle value={geometryMode} onChange={onGeometryModeChange} />
          </div>
          {geometryMatchNote ? <p className="text-xs text-amber-200">{geometryMatchNote}</p> : null}

          {geometryMode === 'standard' ? (
            <Field id="bf-dn" label="Diameter (DN)">
              <select
                id="bf-dn"
                className={`${inputClassName} appearance-none`}
                value={dn}
                onChange={(event) => onDnChange(Number(event.target.value))}
              >
                {availableDns.map((value) => (
                  <option key={value} value={value}>
                    DN {value}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="bf-custom-outer-diameter" label="Flange outer diameter D" hint="mm">
                <CommittedNumberInput
                  id="bf-custom-outer-diameter"
                  className={inputClassName}
                  inputMode="decimal"
                  min={1}
                  value={customOuterDiameter}
                  onCommit={onCustomOuterDiameterChange}
                />
              </Field>
              <Field id="bf-custom-nozzle-id" label="Nozzle / pipe inner diameter ID" hint="mm">
                <CommittedNumberInput
                  id="bf-custom-nozzle-id"
                  className={inputClassName}
                  inputMode="decimal"
                  min={1}
                  value={customNozzleId}
                  onCommit={onCustomNozzleIdChange}
                />
              </Field>
            </div>
          )}
        </Section>

        <Section title="Loads & material">
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="bf-pressure-op" label="Operating pressure (bar)">
              <div className="relative">
                <Gauge size={16} className="absolute left-3 top-2.5 text-slate-500" aria-hidden="true" />
                <CommittedNumberInput
                  id="bf-pressure-op"
                  className={`${inputClassName} pl-9`}
                  inputMode="decimal"
                  min={0}
                  step={0.1}
                  value={pressureOp}
                  onCommit={onPressureOpChange}
                />
              </div>
            </Field>
            <Field id="bf-pressure-test" label="Test pressure (bar)" hint="Auto until edited">
              <div className="relative">
                <Gauge size={16} className="absolute left-3 top-2.5 text-slate-500" aria-hidden="true" />
                <CommittedNumberInput
                  id="bf-pressure-test"
                  className={`${inputClassName} pl-9`}
                  inputMode="decimal"
                  min={pressureOp}
                  step={0.1}
                  value={pressureTest}
                  onCommit={onPressureTestChange}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-bf-hint">
                <span>
                  Auto: {Number.isFinite(autoTestPressure) ? `${autoTestPressure?.toFixed(1)} bar` : 'n/a'}
                </span>
                {onOpenHelp ? (
                  <button
                    type="button"
                    onClick={onOpenHelp}
                    className="font-semibold text-cyan-300/90 underline-offset-2 hover:text-cyan-200 hover:underline"
                  >
                    Learn more
                  </button>
                ) : null}
              </div>
              {showTestPressureWarning ? (
                <p className="mt-1 text-xs text-amber-200">
                  Test pressure is below the code auto value. Consider resetting to the auto value.
                </p>
              ) : null}
            </Field>
          </div>

          <Field id="bf-temperature" label="Temperature (deg C)">
            <div className="relative">
              <Thermometer size={16} className="absolute left-3 top-2.5 text-slate-500" aria-hidden="true" />
              <CommittedNumberInput
                id="bf-temperature"
                className={`${inputClassName} pl-9`}
                inputMode="decimal"
                step={1}
                value={temperature}
                onCommit={onTemperatureChange}
              />
            </div>
          </Field>

          <Field id="bf-material" label="Material">
            <select
              id="bf-material"
              className={`${inputClassName} appearance-none`}
              value={material}
              onChange={(event) => onMaterialChange(event.target.value as MaterialId)}
            >
              {Object.entries(materials).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="bf-corrosion-allowance" label="Corrosion allowance (mm)">
            <div className="relative">
              <Droplet size={16} className="absolute left-3 top-2.5 text-slate-500" aria-hidden="true" />
              <CommittedNumberInput
                id="bf-corrosion-allowance"
                className={`${inputClassName} pl-9`}
                inputMode="decimal"
                min={0}
                step={0.5}
                value={corrosionAllowance}
                onCommit={onCorrosionAllowanceChange}
              />
            </div>
          </Field>
        </Section>

        <Section title="Gasket (EN 1514-1)">
          <Field id="bf-gasket-facing" label="Facing">
            <select
              id="bf-gasket-facing"
              className={`${inputClassName} appearance-none`}
              value={gasketFacing}
              onChange={(event) => onGasketFacingChange(event.target.value as GasketFacing)}
            >
              {GASKET_OPTIONS.facings.map((facing) => (
                <option key={facing.value} value={facing.value}>
                  {facing.label}
                </option>
              ))}
            </select>
          </Field>

          <Field id="bf-gasket-material" label="Gasket material">
            <select
              id="bf-gasket-material"
              className={`${inputClassName} appearance-none`}
              value={gasketMaterial}
              onChange={(event) => onGasketMaterialChange(event.target.value as GasketMaterial)}
            >
              {Object.entries(GASKET_OPTIONS.materials).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </Field>

          <Field id="bf-gasket-thickness" label="Gasket thickness (mm)">
            <select
              id="bf-gasket-thickness"
              className={`${inputClassName} appearance-none`}
              value={gasketThickness}
              onChange={(event) => onGasketThicknessChange(Number(event.target.value))}
            >
              {GASKET_OPTIONS.thicknesses.map((t) => (
                <option key={t} value={t}>
                  {t} mm
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Bolting">
          <Field id="bf-fastener-standard" label="Fastener standard">
            <select
              id="bf-fastener-standard"
              className={`${inputClassName} appearance-none`}
              value={fastenerStandard}
              onChange={(event) => onFastenerStandardChange(event.target.value as FastenerStandard)}
            >
              <option value="EN">EN</option>
              <option value="ASME">ASME</option>
            </select>
          </Field>
          <Field id="bf-fastener-type" label="Fastener type">
            <select
              id="bf-fastener-type"
              className={`${inputClassName} appearance-none`}
              value={fastenerType}
              onChange={(event) => onFastenerTypeChange(event.target.value as FastenerType)}
            >
              <option value="BOLT">Bolt</option>
              <option value="STUD">Stud</option>
            </select>
          </Field>
          <Field id="bf-fastener-grade" label="Grade / Material">
            <select
              id="bf-fastener-grade"
              className={`${inputClassName} appearance-none`}
              value={fastenerGradeId}
              onChange={(event) => onFastenerGradeChange(event.target.value as FastenerGradeId)}
            >
              {fastenerOptions.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </Field>

          <details className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
            <summary className="cursor-pointer select-none text-sm font-semibold text-slate-200">
              Tightening & torque
              <span className="ml-2 text-xs font-normal text-bf-hint">
                {frictionPreset === 'dry' ? 'Dry' : 'Lubricated'} · Proof/Yield {fastenerStrength}
              </span>
            </summary>
            <div className="mt-3 space-y-4">
              <Field id="bf-friction-preset" label="Tightening condition">
                <select
                  id="bf-friction-preset"
                  className={`${inputClassName} appearance-none`}
                  value={frictionPreset}
                  onChange={(event) => onFrictionPresetChange(event.target.value as FrictionPreset)}
                >
                  <option value="dry">Dry</option>
                  <option value="lubricated">Lubricated</option>
                </select>
              </Field>
              <Field id="bf-tightening-method" label="Method">
                <select
                  id="bf-tightening-method"
                  className={`${inputClassName} appearance-none`}
                  value={tighteningMethod}
                  onChange={(event) => onTighteningMethodChange(event.target.value as TighteningMethod)}
                >
                  <option value="k_factor">K-factor (torque = K·F·d)</option>
                </select>
              </Field>
              <p className="text-xs text-bf-hint">
                Proof/Yield: {fastenerStrength}
                {fastenerIsPlaceholder ? ' · Placeholder values' : ''}
                {fastenerNote ? ` · ${fastenerNote}` : ''}
                {onOpenHelp ? (
                  <>
                    {' · '}
                    <button
                      type="button"
                      onClick={onOpenHelp}
                      className="font-semibold text-cyan-300/90 underline-offset-2 hover:text-cyan-200 hover:underline"
                    >
                      Learn more
                    </button>
                  </>
                ) : null}
              </p>
            </div>
          </details>
        </Section>
      </div>
    </section>
  );
}
