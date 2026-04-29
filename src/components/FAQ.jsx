import { useState } from 'react';

export function FAQ() {
  const [open, setOpen] = useState(0);
  const items = [
    {q:'How far in advance should I book?', a:'Catering: 7+ days for parties under 30, 3+ weeks for larger events. Cleaning: most weeks we have same-week availability for one-offs.'},
    {q:'Do you handle allergies and dietary restrictions?', a:'Yes — that is the whole point. Tell us in the form, we build the menu around it. We are nut-free certified and run a separate gluten-free station.'},
    {q:'What is your cancellation policy?', a:'Full refund up to 7 days before. 50% within 7 days. Within 48 hours we keep the deposit but can rebook you within 90 days at no charge.'},
    {q:'Do you bring your own equipment?', a:'For catering, yes — plates, glasses, cutlery, serving staff if requested. For cleaning, all eco-certified products and tools come with the crew.'},
    {q:'Where do you operate?', a:'Greater Copenhagen and out to Roskilde. Travel is included for the first 25km from CPH city centre.'},
  ];

  return (
    <section className="section">
      <div className="section-eyebrow">Questions</div>
      <h2 className="section-title">The <span className="pink">honest</span> answers.</h2>
      <div className="faq">
        {items.map((it, i) => (
          <div className={`faq-item ${open===i?'open':''}`} key={i}>
            <div className="faq-q" onClick={()=>setOpen(open===i?-1:i)}>
              <span>{it.q}</span>
              <span className="plus">+</span>
            </div>
            <div className="faq-a">{it.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
