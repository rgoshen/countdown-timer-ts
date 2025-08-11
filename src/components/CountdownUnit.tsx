import { usePrevious } from '../hooks/usePrevious';

type Props = { readonly label: string; readonly value: number | string };

export default function CountdownUnit({ label, value }: Props) {
  const prev = usePrevious(value);
  const changed = prev !== undefined && prev !== value;

  return (
    <div className='unit'>
      <div className={`value ${changed ? 'flip' : ''}`} key={String(value)}>
        {value}
      </div>
      <div className='label'>{label}</div>
    </div>
  );
}
