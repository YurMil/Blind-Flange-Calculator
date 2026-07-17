import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import En1092StandardsDialog from '../components/En1092StandardsDialog';

afterEach(() => {
  cleanup();
});

describe('En1092StandardsDialog', () => {
  it('shows PN tabs and applies a DN/PN row to the calculator on click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <En1092StandardsDialog
        open
        onClose={onClose}
        currentDn={100}
        currentPn={16}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole('dialog', {name: /Blind flange dimensions/i})).toBeInTheDocument();
    expect(screen.getByRole('tab', {name: 'PN 16'})).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Select DN 100 PN 16')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', {name: 'PN 40'}));
    expect(screen.getByRole('tab', {name: 'PN 40'})).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByLabelText('Select DN 100 PN 40'));
    expect(onSelect).toHaveBeenCalledWith({dn: 100, pn: 40});
    expect(onClose).toHaveBeenCalled();
  });
});
