import {useField, useFormikContext} from 'formik';
import {useEffect, useState} from 'react';

import {Field, FieldError, Input, Label} from './styles';

export interface IInputText {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password';
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
}

const InputText = ({name, label, type, placeholder, autoComplete, disabled}: IInputText) => {
  const [field, meta] = useField(name);
  const {submitCount} = useFormikContext();
  const [editing, setEditing] = useState(false);

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

  return (
    <Field>
      <Label htmlFor={name}>{label}</Label>
      <Input
        {...field}
        id={name}
        type={type}
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
      <FieldError id={errorId} role={invalid ? 'alert' : undefined}>
        {invalid ? meta.error : ''}
      </FieldError>
    </Field>
  );
};

export default InputText;
