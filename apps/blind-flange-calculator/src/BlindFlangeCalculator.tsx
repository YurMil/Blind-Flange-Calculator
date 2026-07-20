import {useEffect} from 'react';
import {Layers} from 'lucide-react';
import CalculationHelpDialog from './components/CalculationHelpDialog';
import En1092StandardsDialog from './components/En1092StandardsDialog';
import InputForm from './components/InputForm';
import ResultsPanel from './components/ResultsPanel';
import ExportActions from './components/ExportActions';
import HeaderToolbar from './components/HeaderToolbar';
import ConfigurationHistoryPanel from './components/ConfigurationHistoryPanel';
import PnSelectionSummary from './components/PnSelectionSummary';
import MobileResultsBar from './components/MobileResultsBar';
import {AVAILABLE_DNS, MATERIALS} from './domain/standards/data';
import {MAX_STANDARD_PN, useBlindFlangeCalculatorState} from './state/useBlindFlangeCalculatorState';
import {initShareLink, reportShareState} from './shareLink';

export default function BlindFlangeCalculator() {
  const state = useBlindFlangeCalculatorState();

  // Share-link protocol: restore a shared configuration through the regular
  // import path (validated by migrateConfig) and stream the current
  // configuration for the shell's "Copy link" button.
  const {handleImportConfiguration, configurationFile} = state;
  useEffect(() => {
    initShareLink(handleImportConfiguration);
  }, [handleImportConfiguration]);

  useEffect(() => {
    reportShareState(configurationFile);
  }, [configurationFile]);
  const exportResult = state.exportResult;
  const boltPass =
    exportResult?.boltingSummary === undefined ? null : Boolean(exportResult.boltingSummary.pass);

  return (
    <div className="min-h-full bg-slate-950 font-sans text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-10 lg:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-100">
              <Layers size={14} />
              EN 13445-3 / EN 1092-1
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Blind Flange Calculator</h1>
              <p className="mt-1 text-sm text-bf-caption">
                Automatic PN selection and thickness sizing with a quick weight estimate.
              </p>
            </div>
          </div>
          <div className="flex w-full max-w-md flex-col items-stretch gap-3 lg:items-end">
            <label className="w-full space-y-1" htmlFor="bf-flange-tag">
              <span className="text-xs font-medium uppercase tracking-wide text-bf-caption">Flange tag</span>
              <input
                id="bf-flange-tag"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 font-numeric text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                value={state.flangeTag}
                onChange={(event) => state.handleFlangeTagChange(event.target.value)}
                onBlur={state.handleFlangeTagBlur}
              />
            </label>
            <HeaderToolbar
              config={state.configurationFile}
              fileName={`${state.flangeTag}.json`}
              onImport={state.handleImportConfiguration}
              onOpenHelp={state.openHelp}
              onOpenHistory={state.openHistory}
              onOpenStandards={state.openStandards}
            />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-6 lg:col-span-4">
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
              onOpenHelp={state.openHelp}
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
          </div>

          <div className="space-y-6 lg:col-span-8 lg:sticky lg:top-6 lg:self-start">
            <PnSelectionSummary
              pressureOp={state.pressureOp}
              calculatedPn={state.calculatedPn}
              selectedPn={state.selectedPn}
              forceCustom={state.forceCustom}
              maxStandardPn={MAX_STANDARD_PN}
              maxAvailablePn={state.maxAvailablePn}
              dn={state.dn}
            />
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
        <En1092StandardsDialog
          open={state.isStandardsOpen}
          onClose={state.closeStandards}
          currentDn={state.dn}
          currentPn={state.selectedPn}
          onSelect={({dn, pn}) => state.applyStandardFlange(dn, pn)}
        />
      </div>

      <MobileResultsBar
        selectedPn={exportResult?.selectedPN ?? state.selectedPn}
        thicknessMm={exportResult?.recommendedThickness}
        boltPass={boltPass}
        canExport={Boolean(exportResult || state.manualCheckResult)}
      />
    </div>
  );
}
