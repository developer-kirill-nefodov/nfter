import * as Yup from 'yup';

import type {IInputText} from '../components/Forms/InputText';

const email = Yup.string()
  .email('Enter a valid email address')
  .max(255, 'Too long')
  .required('Required');

const strongPassword = Yup.string()
  .min(12, 'At least 12 characters')
  .max(128, 'Too long')
  .matches(/[a-z]/, 'Add a lowercase letter')
  .matches(/[A-Z]/, 'Add an uppercase letter')
  .matches(/\d/, 'Add a digit')
  .required('Required');

export interface ILoginValues {
  email: string;
  password: string;
}

export const loginInitial: ILoginValues = {email: '', password: ''};

export const loginSchema: Yup.ObjectSchema<ILoginValues> = Yup.object({
  email,
  password: Yup.string().required('Required'),
});

export const loginFields: IInputText[] = [
  {name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autoComplete: 'email'},
  {name: 'password', label: 'Password', type: 'password', placeholder: '••••••••', autoComplete: 'current-password'},
];

export interface IRegisterValues extends ILoginValues {
  confirmPassword: string;
  inviteCode: string;
}

export const registerInitial: IRegisterValues = {
  email: '',
  password: '',
  confirmPassword: '',
  inviteCode: '',
};

export const registerSchema: Yup.ObjectSchema<IRegisterValues> = Yup.object({
  email,
  password: strongPassword,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Required'),
  inviteCode: Yup.string().max(16, 'Too long').default(''),
});

export const registerFields: IInputText[] = [
  {name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autoComplete: 'email'},
  {name: 'password', label: 'Password', type: 'password', placeholder: 'At least 12 characters', autoComplete: 'new-password'},
  {name: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Repeat your password', autoComplete: 'new-password'},
  {name: 'inviteCode', label: 'Invite code (optional)', type: 'text', placeholder: 'EW3-XXXXXX'},
];

export interface IForgotValues {
  email: string;
}

export const forgotInitial: IForgotValues = {email: ''};

export const forgotSchema: Yup.ObjectSchema<IForgotValues> = Yup.object({email});

export const forgotFields: IInputText[] = [
  {name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autoComplete: 'email'},
];

export interface IResetValues {
  password: string;
  confirmPassword: string;
}

export const resetInitial: IResetValues = {password: '', confirmPassword: ''};

export const resetSchema: Yup.ObjectSchema<IResetValues> = Yup.object({
  password: strongPassword,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Required'),
});

export const resetFields: IInputText[] = [
  {name: 'password', label: 'New password', type: 'password', placeholder: 'At least 12 characters', autoComplete: 'new-password'},
  {name: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Repeat your password', autoComplete: 'new-password'},
];
