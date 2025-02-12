import {Form, Formik, type FormikHelpers} from 'formik';
import type {ReactNode} from 'react';
import type {ObjectSchema} from 'yup';

import {Card, Stack, Subtitle, Title} from '../../styles';

import {FormCard} from './styles';

interface IBaseForm<TValues extends object> {
  title: string;
  subtitle?: string;
  initialValues: TValues;
  validationSchema: ObjectSchema<TValues>;
  onSubmit: (values: TValues, helpers: FormikHelpers<TValues>) => void;
  children: ReactNode;
}

/**
 * Generic over the form's own value type, so `values`, `errors` and `onSubmit`
 * all stay checked. The previous version typed every prop as `any`, which meant
 * a typo in a field name failed silently at runtime.
 */
const BaseForm = <TValues extends object>({
  title,
  subtitle,
  initialValues,
  validationSchema,
  onSubmit,
  children,
}: IBaseForm<TValues>) => (
  <FormCard as={Card}>
    <Stack $gap="24px">
      <Stack $gap="4px">
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </Stack>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        <Form noValidate>
          <Stack>{children}</Stack>
        </Form>
      </Formik>
    </Stack>
  </FormCard>
);

export default BaseForm;
