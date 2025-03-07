import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {Navigate, useSearchParams} from 'react-router-dom';

import Button from '../../components/Button';
import BaseForm from '../../components/Forms';
import InputText from '../../components/Forms/InputText';
import ResetOnSuccess from '../../components/Forms/ResetOnSuccess';
import {resetPasswordRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {clearAuthFlow} from '../../store/reducers/auth-slice';
import {NavigateUrls} from '../../utils/navigate-urls';
import {resetFields, resetInitial, resetSchema, type IResetValues} from '../../validations/auth';

import {AuthShell, FormActions} from './styles';

const ResetPasswordPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();
  const [params] = useSearchParams();

  const status = useStoreSelector((state) => state.auth.resetStatus);

  // Leaving this behind would bounce the next visitor out of the form before
  // they could type in it.
  useEffect(() => () => void dispatch(clearAuthFlow()), [dispatch]);

  const token = params.get('token');

  // The token arrives in the emailed link; without it there is nothing to reset.
  if (!token) {
    return <Navigate to={NavigateUrls.auth.forgotPassword} replace />;
  }

  // The password is changed and every session is revoked, so the only thing left
  // to do is sign in with it. Send them there rather than leaving them on a form
  // whose job is done.
  if (status === 'success') {
    return <Navigate to={NavigateUrls.auth.login} replace />;
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
          <InputText key={field.name} {...field} disabled={status === 'pending'} />
        ))}

        {/* A rejected link leaves the typed passwords sitting on screen. */}
        <ResetOnSuccess when={status === 'error'} />

        <FormActions $justify="flex-end">
          <Button type="submit" loading={status === 'pending'}>
            {t('auth.resetPassword')}
          </Button>
        </FormActions>
      </BaseForm>
    </AuthShell>
  );
};

export default ResetPasswordPage;
