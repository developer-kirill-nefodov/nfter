import styled, {keyframes} from 'styled-components';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Circle = styled.span<{$size: number}>`
  display: inline-block;
  width: ${({$size}) => $size}px;
  height: ${({$size}) => $size}px;
  border: 2px solid ${({theme}) => theme.colors.border};
  border-top-color: ${({theme}) => theme.colors.primary};
  border-radius: 50%;
  animation: 700ms linear infinite ${spin};
`;

interface ISpinner {
  size?: number;
  label?: string;
}

const Spinner = ({size = 24, label = 'Loading'}: ISpinner) => (
  <Circle role="status" aria-label={label} $size={size} />
);

export default Spinner;
