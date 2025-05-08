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

  useEffect(() => setEditing(false), [submitCount]);

  const invalid = Boolean(meta.touched && meta.error) && !editing;
  const errorId = `${name}-error`;

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
