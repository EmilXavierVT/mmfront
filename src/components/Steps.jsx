export function Steps() {
  const steps = [
    {n:'01', t:'Tell us', d:'Date, headcount, address. Allergies if catering. Done in 90 seconds.'},
    {n:'02', t:'We quote', d:'Real human reply within 24h. Transparent pricing — no surprise fees, ever.'},
    {n:'03', t:'You confirm', d:'Tweak the menu, swap ingredients, lock it in. Pay 30% to hold the date.'},
    {n:'04', t:'We deliver', d:'On-site, on time, in compostable packaging. You enjoy. We clean up.'},
  ];

  return (
    <section className="section">
      <div className="section-eyebrow">How it works</div>
      <h2 className="section-title">Booked in <span className="pink">four</span> moves.</h2>
      <div className="steps">
        {steps.map(s => (
          <div className="step" key={s.n}>
            <div className="num">{s.n}</div>
            <h4>{s.t}</h4>
            <p>{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
