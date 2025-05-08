import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ThemeProvider} from 'styled-components';
import {describe, expect, it, vi} from 'vitest';

import BaseForm from '../components/Forms';
import InputText from '../components/Forms/InputText';
import {theme} from '../theme';
import {registerInitial, registerSchema, type IRegisterValues} from '../validations/auth';

const renderForm = () =>
  render(
    <ThemeProvider theme={theme}>
      <BaseForm<IRegisterValues>
        title="Sign up"
        initialValues={registerInitial}
        validationSchema={registerSchema}
        onSubmit={vi.fn()}
      >
        <InputText name="email" label="Email" type="email" />
      </BaseForm>
    </ThemeProvider>,
  );

describe('field validation timing', () => {
  it('says nothing until the user has actually left the field', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Email'), 'not-an-email');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'false');
  });

  it('reports the problem once the user moves on', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.tab();

    expect(await screen.findByRole('alert')).toHaveTextContent(/valid email/i);
  });

  it('clears the error the moment they start fixing it, rather than nagging per keystroke', async () => {
    const user = userEvent.setup();
    renderForm();

    const email = screen.getByLabelText('Email');

    await user.type(email, 'not-an-email');
    await user.tab();
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.type(email, '@');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('stays quiet once the value is genuinely valid', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Email'), 'kirill@example.dev');
    await user.tab();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
