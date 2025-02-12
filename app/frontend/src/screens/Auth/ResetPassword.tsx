import {useTranslation} from 'react-i18next';
import {Navigate, useSearchParams} from 'react-router-dom';

import Button from '../../components/Button';
import BaseForm from '../../components/Forms';
import InputText from '../../components/Forms/InputText';
import {resetPasswordRequest} from '../../store/actions';
import {useStoreDispatch} from '../../store/hooks';
import {NavigateUrls} from '../../utils/navigate-urls';
import {resetFields, resetInitial, resetSchema, type IResetValues} from '../../validations/auth';

import {AuthShell, FormActions} from './styles';

const ResetPasswordPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();
  const [params] = useSearchParams();

  const token = params.get('token');

  // The token arrives in the emailed link; without it there is nothing to reset.
  if (!token) {
    return <Navigate to={NavigateUrls.auth.forgotPassword} replace />;
  }

  return (
    <AuthShell>
      <BaseForm<IResetValues>
        title={t('auth.resetPassword')}
        subtitle={t('auth.resetSubtitle')}
        initialValues={resetInitial}
        validationSchema={resetSchema}
        onSubmit={({password}) => dispatch(resetPasswordRequest({token, password}))}
      >
        {resetFields.map((field) => (
          <InputText key={field.name} {...field} />
        ))}

        <FormActions $justify="flex-end">
          <Button type="submit">{t('auth.resetPassword')}</Button>
        </FormActions>
      </BaseForm>
    </AuthShell>
  );
};

export default ResetPasswordPage;
