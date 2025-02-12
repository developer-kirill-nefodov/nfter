import {useTranslation} from 'react-i18next';

import Button from '../../components/Button';
import BaseForm from '../../components/Forms';
import InputText from '../../components/Forms/InputText';
import {registerRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {NavLink} from '../../styles';
import {NavigateUrls} from '../../utils/navigate-urls';
import {
  registerFields,
  registerInitial,
  registerSchema,
  type IRegisterValues,
} from '../../validations/auth';

import {AuthShell, FormActions} from './styles';

/**
 * The sign-up screen the app always advertised in its header but never had —
 * the old Create.tsx was an empty div, and the backend had no register route.
 */
const RegisterPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const loading = useStoreSelector((state) => state.user.loading);

  return (
    <AuthShell>
      <BaseForm<IRegisterValues>
        title={t('auth.register')}
        subtitle={t('auth.registerSubtitle')}
        initialValues={registerInitial}
        validationSchema={registerSchema}
        onSubmit={({email, password}) => dispatch(registerRequest({email, password}))}
      >
        {registerFields.map((field) => (
          <InputText key={field.name} {...field} />
        ))}

        <FormActions>
          <NavLink to={NavigateUrls.auth.login}>{t('auth.haveAccount')}</NavLink>
          <Button type="submit" loading={loading}>
            {t('auth.register')}
          </Button>
        </FormActions>
      </BaseForm>
    </AuthShell>
  );
};

export default RegisterPage;
