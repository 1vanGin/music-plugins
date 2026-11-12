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

export default function MasterChain({ hidden }) {
  return (
    <section id="masterChain" role="tabpanel" aria-labelledby="masterChainTab" tabIndex={0} hidden={hidden}>
      <h2>Мастер-цепочка</h2>
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
