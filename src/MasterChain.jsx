const stages = [
  ['Corrective EQ', 'Pro-Q 4', 'Pro-Q 4'],
  ['Color EQ', 'Michelangelo / Pultec EQP-1A / Maag EQ4', 'Michelangelo'],
  ['Compressor', 'BSA Mix Bus / AMEK Mastering Compressor / Pro-C 3 / Unisum', 'AMEK или BSA'],
  ['Saturation', 'Kelvin / Black Box HG-2 / Monarch Tape Machine / J-37', 'Kelvin'],
  ['Stereo', 'Ozone Imager / STEREOVAULT / MSED', 'Ozone Imager'],
  ['Filters', 'Pro-Q 4 (HP/LP)', 'Pro-Q 4, если необходимо'],
  ['Limiter', 'Pro-L 2 / UNI-L', 'Pro-L 2'],
  ['Metering', 'LEVELS / MetricAB', 'LEVELS + MetricAB'],
];

const signalFlow = [
  {
    plugins: ['Pro-Q 4', 'Ozone 12 Equalizer', 'Ozone 12 Dynamic EQ'],
    purpose: 'Корректирующий EQ',
  },
  {
    plugins: [
      'Soothe3', 'Soothe2', 'RESO', 'Smooth Operator Pro', 'Pro-Q 4 Dynamic',
      'Ozone Spectral Shaper', 'Fixate Midrange',
    ],
    purpose: 'Контроль резонансов',
    condition: 'опционально',
  },
  {
    plugins: [
      'BSA Mix Bus', 'AMEK Mastering Compressor', 'Unisum', 'Pro-C 3',
      'elysia alpha master', 'Comp DIODE-609', 'True Dynamics', 'smart:comp 3',
    ],
    purpose: 'Glue compression',
  },
  {
    plugins: [
      'Bloom', 'Michelangelo', 'AMEK EQ 200', 'Black Box HG-Q', 'Pultec EQP-1A',
      'Maag EQ4', 'Ozone Vintage EQ', 'EQ SITRAL-295',
    ],
    purpose: 'Адаптивный тональный баланс / Color EQ',
  },
  {
    plugins: [
      'Kelvin', 'Black Box HG-2', 'HG-2MS', 'Saturn 2', 'Ozone Exciter',
      'Monarch Tape Machine', 'Tape J-37', 'Ozone Vintage Tape', 'Plasma',
    ],
    purpose: 'Сатурация и гармоники',
    condition: 'опционально',
  },
  {
    plugins: ['Ozone Imager', 'STEREOVAULT', 'MSED', 'Basslane Pro', 'Pro-Q 4 M/S'],
    purpose: 'Стереополе и моносовместимость',
    condition: 'по необходимости',
  },
  {
    plugins: ['Gold Clip', 'Bus PEAK', 'Xrack Max'],
    purpose: 'Клиппинг и контроль пиков',
  },
  {
    plugins: ['Pro-L 2', 'UNI-L', 'Ozone Maximizer', 'bx_limiter True Peak', 'Ozone Vintage Limiter'],
    purpose: 'Финальный лимитер',
  },
  {
    plugins: ['LEVELS', 'ADPTR MetricAB', 'SPAN', 'REFERENCE 3', 'Tonal Balance Control 3'],
    purpose: 'Метринг и контроль результата',
  },
];

export default function MasterChain({ hidden }) {
  return (
    <section id="masterChain" role="tabpanel" aria-labelledby="masterChainTab" tabIndex={0} hidden={hidden}>
      <h2>Мастер-цепочка</h2>
      <ol className="chain-flow" role="list" aria-label="Порядок обработки">
        {signalFlow.map(({ plugins, purpose, condition }, index) => (
          <li key={purpose}>
            {index > 0 && <span className="chain-flow__arrow" aria-hidden="true">↓</span>}
            <div className="chain-flow__card" data-optional={condition ? true : undefined}>
              <strong>{plugins.join(' / ')}</strong>
              <span>{purpose}{condition && ` · ${condition}`}</span>
            </div>
          </li>
        ))}
      </ol>
      <table className="chain-table">
        <thead>
          <tr>
            <th scope="col">Этап</th>
            <th scope="col">Плагины для A/B из твоего набора</th>
            <th scope="col">Мой первый выбор</th>
          </tr>
        </thead>
        <tbody>
          {stages.map(([stage, options, firstChoice], index) => (
            <tr key={stage}>
              <th scope="row">{index + 1}. {stage}</th>
              <td>{options}</td>
              <td>{firstChoice}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
