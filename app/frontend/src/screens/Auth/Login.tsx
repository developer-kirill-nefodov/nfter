import {useTranslation} from 'react-i18next';

import Button from '../../components/Button';
import BaseForm from '../../components/Forms';
import InputText from '../../components/Forms/InputText';
import ConnectButton from '../../components/Wallet/ConnectButton';
import {loginRequest} from '../../store/actions';
import {useStoreDispatch, useStoreSelector} from '../../store/hooks';
import {NavLink, Stack} from '../../styles';
import {NavigateUrls} from '../../utils/navigate-urls';
import {loginFields, loginInitial, loginSchema, type ILoginValues} from '../../validations/auth';

import {AuthShell, Divider, FormActions} from './styles';

const LoginPage = () => {
  const {t} = useTranslation();
  const dispatch = useStoreDispatch();

  const loading = useStoreSelector((state) => state.user.loading);

  return (
    <AuthShell>
      <BaseForm<ILoginValues>
        title={t('auth.login')}
        subtitle={t('auth.loginSubtitle')}
        initialValues={loginInitial}
        validationSchema={loginSchema}
        onSubmit={(values) => dispatch(loginRequest(values))}
      >
        {loginFields.map((field) => (
          <InputText key={field.name} {...field} />
        ))}

        <FormActions>
          <NavLink to={NavigateUrls.auth.forgotPassword}>{t('auth.forgotPassword')}</NavLink>
          <Button type="submit" loading={loading}>
            {t('auth.login')}
          </Button>
        </FormActions>

        <Stack $gap="16px">
          <Divider>{t('auth.or')}</Divider>
          {/* SIWE: no password ever leaves the browser. */}
          <ConnectButton />
          <NavLink to={NavigateUrls.auth.register}>{t('auth.noAccount')}</NavLink>
        </Stack>
      </BaseForm>
    </AuthShell>
  );
};

export default LoginPage;
