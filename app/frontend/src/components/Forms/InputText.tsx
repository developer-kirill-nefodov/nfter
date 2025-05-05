import {useField, useFormikContext} from 'formik';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {Field, FieldError, Input, InputWrap, Label, Reveal} from './styles';

export interface IInputText {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password';
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
}

const InputText = ({name, label, type, placeholder, autoComplete, disabled}: IInputText) => {
  const {t} = useTranslation();
  const [field, meta] = useField(name);
  const {submitCount} = useFormikContext();
  const [editing, setEditing] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Submitting with Enter never blurs the field, so without this the error would
  // stay hidden on the exact keystroke the user asked for a verdict.
  useEffect(() => setEditing(false), [submitCount]);

  /**
   * A half-typed email is not a mistake — it is an email in progress. Shouting
   * at the user on every keystroke ("Enter a valid email address" while they are
   * still on the third character) is what made this form feel hostile.
   *
   * So the error hides the moment they start typing and comes back when they
   * leave the field, or when they submit — which is when the answer is final.
   */
  const invalid = Boolean(meta.touched && meta.error) && !editing;
  const errorId = `${name}-error`;

  // A password you cannot read is a password you retype three times. The toggle
  // is a real button, so it is reachable by keyboard and announced as one.
  const isPassword = type === 'password';

  return (
    <Field>
      <Label htmlFor={name}>{label}</Label>
      <InputWrap>
        <Input
          {...field}
          id={name}
          type={isPassword && revealed ? 'text' : type}
          $padded={isPassword}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          $invalid={invalid}
          // Screen readers announce the message only if the input points at it.
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          onChange={(event) => {
            setEditing(true);
            field.onChange(event);
          }}
          onBlur={(event) => {
            setEditing(false);
            field.onBlur(event);
          }}
        />

        {isPassword && (
          <Reveal
            type="button"
            tabIndex={-1}
            aria-label={revealed ? t('auth.hidePassword') : t('auth.showPassword')}
            onClick={() => setRevealed((shown) => !shown)}
          >
            {revealed ? t('auth.hide') : t('auth.show')}
          </Reveal>
        )}
      </InputWrap>
      <FieldError id={errorId} role={invalid ? 'alert' : undefined}>
        {invalid ? meta.error : ''}
      </FieldError>
    </Field>
  );
};

export default InputText;
