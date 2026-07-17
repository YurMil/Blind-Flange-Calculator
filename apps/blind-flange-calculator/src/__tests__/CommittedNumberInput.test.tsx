import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommittedNumberInput from '../components/CommittedNumberInput';

afterEach(() => {
  cleanup();
});

describe('CommittedNumberInput', () => {
  it('commits a numeric value on blur', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();

    render(<CommittedNumberInput aria-label="Operating pressure" value={10} onCommit={onCommit} />);

    const input = screen.getByLabelText('Operating pressure');
    await user.clear(input);
    await user.type(input, '16.5');
    await user.tab();

    expect(onCommit).toHaveBeenCalledWith(16.5);
  });

  it('reverts invalid input on blur without committing', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();

    render(<CommittedNumberInput aria-label="Temperature" value={20} onCommit={onCommit} />);

    const input = screen.getByLabelText('Temperature');
    await user.clear(input);
    await user.type(input, 'abc');
    await user.tab();

    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue('20');
  });
});
