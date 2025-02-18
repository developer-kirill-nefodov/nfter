import type {ReactNode} from 'react';

import {useRipple} from '../../hooks/useRipple';
import Spinner from '../Spinner';

import {ButtonContent, RippleSpan, StyledButton, type IButtonVariant} from './styles';

interface IButton {
  children: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Explicit and defaulted to "button". Omitting it makes the browser default to
   * "submit", which silently submits any form the button happens to sit in.
   */
  type?: 'button' | 'submit';
  variant?: IButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
}

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  ariaLabel,
}: IButton) => {
  const {coords, isRippling, onRipple} = useRipple();

  const isDisabled = disabled || loading;

  return (
    <StyledButton
      type={type}
      $variant={variant}
      $fullWidth={fullWidth}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading}
      onClick={(event) => {
        onRipple(event);
        onClick?.(event);
      }}
    >
      {isRippling && <RippleSpan aria-hidden="true" $left={coords.x} $top={coords.y} />}
      <ButtonContent>
        {loading && <Spinner size={16} />}
        {children}
      </ButtonContent>
    </StyledButton>
  );
};

export default Button;
