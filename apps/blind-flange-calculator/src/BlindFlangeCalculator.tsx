import {Gauge, HelpCircle, History, Layers} from 'lucide-react';
import CalculationHelpDialog from './components/CalculationHelpDialog';
import InputForm from './components/InputForm';
import ResultsPanel from './components/ResultsPanel';
import ExportActions from './components/ExportActions';
import ConfigJsonActions from './components/ConfigJsonActions';
import ConfigurationHistoryPanel from './components/ConfigurationHistoryPanel';
import {AVAILABLE_DNS, MATERIALS} from './domain/standards/data';
import {MAX_STANDARD_PN, useBlindFlangeCalculatorState} from './state/useBlindFlangeCalculatorState';

export default function BlindFlangeCalculator() {
  const state = useBlindFlangeCalculatorState();

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200">
              <Layers size={14} />
              EN 13445-3 / EN 1092-1
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-100">Blind Flange Calculator</h1>
              <p className="text-sm text-slate-400">
                Automatic PN selection and thickness sizing with a quick weight estimate.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <label className="w-full max-w-sm space-y-1" htmlFor="bf-flange-tag">
              <span className="text-xs uppercase tracking-wide text-slate-400">Flange tag</span>
              <input
                id="bf-flange-tag"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                value={state.flangeTag}
                onChange={(event) => state.handleFlangeTagChange(event.target.value)}
                onBlur={state.handleFlangeTagBlur}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={state.openHelp}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-800"
                aria-label="Open calculation help"
              >
                <HelpCircle size={17} />
              </button>
              <button
                type="button"
                onClick={state.openHistory}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-800"
              >
                <History size={16} />
                <span>History</span>
              </button>
              <ConfigJsonActions
                config={state.configurationFile}
                fileName={`${state.flangeTag}.json`}
                onImport={state.handleImportConfiguration}
              />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-6">
            <InputForm
              geometryMode={state.geometryMode}
              dn={state.dn}
              customOuterDiameter={state.customOuterDiameter}
              customNozzleId={state.customNozzleId}
              pressureOp={state.pressureOp}
              pressureTest={state.pressureTest}
              temperature={state.temperature}
              material={state.material}
              corrosionAllowance={state.corrosionAllowance}
              gasketMaterial={state.gasketMaterial}
              gasketThickness={state.gasketThickness}
              gasketFacing={state.gasketFacing}
              frictionPreset={state.frictionPreset}
              tighteningMethod={state.tighteningMethod}
              fastenerStandard={state.fastenerStandard}
              fastenerType={state.fastenerType}
              fastenerGradeId={state.fastenerGradeId}
              autoTestPressure={state.hydroAutoRounded}
              autoTestBasis={state.hydroAuto.basis}
              autoTestRatio={state.hydroAuto.ratioUsed}
              autoTestClampedToOp={state.hydroAuto.clampedToOp}
              showTestPressureWarning={state.isTestBelowAuto}
              availableDns={AVAILABLE_DNS}
              materials={MATERIALS}
              geometryMatchNote={state.geometryMatchNote}
              onGeometryModeChange={state.handleGeometryModeChange}
              onDnChange={state.setDn}
              onCustomOuterDiameterChange={state.setCustomOuterDiameter}
              onCustomNozzleIdChange={state.setCustomNozzleId}
              onPressureOpChange={state.handlePressureOpChange}
              onPressureTestChange={state.handlePressureTestChange}
              onTemperatureChange={state.setTemperature}
              onMaterialChange={state.setMaterial}
              onCorrosionAllowanceChange={state.setCorrosionAllowance}
              onGasketMaterialChange={state.setGasketMaterial}
              onGasketThicknessChange={state.setGasketThickness}
              onGasketFacingChange={state.setGasketFacing}
              onFrictionPresetChange={state.setFrictionPreset}
              onTighteningMethodChange={state.setTighteningMethod}
              onFastenerStandardChange={state.setFastenerStandard}
              onFastenerTypeChange={state.setFastenerType}
              onFastenerGradeChange={state.setFastenerGradeId}
            />

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-cyan-300">
                  <Gauge size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">PN selection</p>
                  {!state.forceCustom ? (
                    <p className="mt-1">
                      Operating pressure {state.pressureOp} bar maps to PN {state.calculatedPn}. Selected class:
                      <span className="ml-1 font-semibold text-slate-100">
                        {state.selectedPn ? `PN ${state.selectedPn}` : 'No match'}
                      </span>
                      .
                    </p>
                  ) : (
                    <p className="mt-1 text-amber-200">
                      Operating pressure {state.pressureOp} bar exceeds standard PN {MAX_STANDARD_PN}. Switching to custom sizing.
                    </p>
                  )}
                  {state.maxAvailablePn && state.maxAvailablePn < state.calculatedPn ? (
                    <p className="mt-2 text-xs text-amber-200">
                      This build only includes EN 1092-1 bolt patterns up to PN {state.maxAvailablePn} for DN {state.dn}. Add PN{' '}
                      {state.calculatedPn} data to enable high-pressure sizing.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <ResultsPanel
              result={state.forceCustom ? null : state.result}
              customResult={state.customResult}
              manualCheckResult={state.manualCheckResult}
              designConfig={state.designConfig}
              isUserDefined={state.isUserDefined}
              dn={state.dn}
              pressureOp={state.pressureOp}
              targetPN={state.calculatedPn}
              maxAvailablePN={state.maxAvailablePn}
              input={state.input}
              onCustomResultChange={state.handleCustomResultChange}
              onManualResultChange={state.handleManualResultChange}
              onDesignConfigChange={state.handleDesignConfigChange}
            />
          </div>
        </div>
        <ExportActions
          input={state.input}
          result={state.exportResult}
          stepBaseResult={state.result}
          stepCustomResult={state.customResult?.result ?? null}
          designConfig={state.designConfig}
          gasketFacing={state.gasketFacing}
          manualCheckResult={state.manualCheckResult}
          targetPN={state.calculatedPn}
          customDebug={state.customResult?.debug}
        />
        <ConfigurationHistoryPanel
          open={state.isHistoryOpen}
          currentTag={state.flangeTag}
          currentConfig={state.configurationFile}
          currentSummary={state.currentSummary}
          onClose={state.closeHistory}
          onOpenConfig={state.handleImportConfiguration}
        />
        <CalculationHelpDialog open={state.isHelpOpen} onClose={state.closeHelp} />
      </div>
    </div>
  );
}
