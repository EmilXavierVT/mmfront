export function Testimonials() {
  const testimonials = [
    {q:"Fed 80 people at our wedding. Three vegans, one celiac, one toddler. Every single plate was perfect.", who:'Maja Lindqvist', what:'Wedding · 80 guests', initials:'ML'},
    {q:"They cleaned a flat we'd given up on after a 3-year tenant. We got the deposit back in full. Witchcraft.", who:'Anders Holm', what:'Move-out clean', initials:'AH'},
    {q:"Our quarterly investor lunch. Five years running. Nobody else even comes close.", who:'Sofie Berg', what:'Corporate, recurring', initials:'SB'},
  ];

  return (
    <section className="section">
      <div className="section-eyebrow">What people say</div>
      <h2 className="section-title">Loved by people<br/>with <span className="pink">strong opinions</span>.</h2>
      <div className="testimonials">
        {testimonials.map((t, i) => (
          <div className="testimonial" key={i}>
            <div className="stars">★★★★★</div>
            <blockquote>"{t.q}"</blockquote>
            <div className="author">
              <div className="avatar">{t.initials}</div>
              <div>
                {t.who}
                <small>{t.what}</small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
