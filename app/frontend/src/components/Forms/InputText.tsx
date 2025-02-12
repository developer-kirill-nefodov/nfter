import {useField} from 'formik';

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

  const invalid = Boolean(meta.touched && meta.error);
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
      />
      <FieldError id={errorId} role={invalid ? 'alert' : undefined}>
        {invalid ? meta.error : ''}
      </FieldError>
    </Field>
  );
};

export default InputText;
