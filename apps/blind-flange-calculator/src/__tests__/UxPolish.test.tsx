import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeaderToolbar from '../components/HeaderToolbar';
import MobileResultsBar from '../components/MobileResultsBar';
import {panelMotion} from '../motion';

afterEach(() => {
  cleanup();
});

describe('panelMotion', () => {
  it('disables travel animation when reduced motion is preferred', () => {
    expect(panelMotion(true).transition).toEqual({duration: 0});
    expect(panelMotion(true).initial).toBe(false);
    expect(panelMotion(false).transition).toEqual({duration: 0.3});
  });
});

describe('HeaderToolbar', () => {
  it('exposes a mobile Actions menu with help and history entries', async () => {
    const user = userEvent.setup();
    const onOpenHelp = vi.fn();
    const onOpenHistory = vi.fn();
    const onOpenStandards = vi.fn();

    render(
      <HeaderToolbar
        config={{version: 1}}
        fileName="demo.json"
        onImport={vi.fn()}
        onOpenHelp={onOpenHelp}
        onOpenHistory={onOpenHistory}
        onOpenStandards={onOpenStandards}
      />,
    );

    expect(screen.getByRole('button', {name: 'Actions'})).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Actions'}));
    await user.click(screen.getByRole('menuitem', {name: /Calculation help/i}));
    expect(onOpenHelp).toHaveBeenCalled();
  });
});

describe('MobileResultsBar', () => {
  it('links to the file export section', () => {
    render(<MobileResultsBar selectedPn={16} thicknessMm={8} boltPass={true} canExport />);

    expect(screen.getByRole('link', {name: /Export/i})).toHaveAttribute('href', '#file-export');
    expect(screen.getByText(/PN 16/i)).toBeInTheDocument();
    expect(screen.getByText(/8 mm/i)).toBeInTheDocument();
    expect(screen.getByText(/Pass/i)).toBeInTheDocument();
  });
});
