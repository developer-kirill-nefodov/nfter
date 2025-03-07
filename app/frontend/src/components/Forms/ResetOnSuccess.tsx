import {useFormikContext} from 'formik';
import {useEffect} from 'react';

/**
 * Clears the form once the request it submitted has actually succeeded.
 *
 * The result arrives asynchronously through the store, long after Formik's
 * onSubmit has returned — so the reset cannot live in the submit handler, and a
 * form left full of a submitted email (or, worse, a submitted password) is both
 * confusing and a small leak to anyone who walks past the screen.
 */
const ResetOnSuccess = ({when}: {when: boolean}) => {
  const {resetForm} = useFormikContext();

  useEffect(() => {
    if (when) {
      resetForm();
    }
  }, [when, resetForm]);

  return null;
};

export default ResetOnSuccess;
