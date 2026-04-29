import { useMemo, useState } from 'react';
import { Icon } from './Icon.jsx';

const sameDay = (a, b) => (
  a && b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()
);

export function Calendar({ start, end, onRangeChange }) {
  const today = useMemo(() => { const t = new Date(); t.setHours(0,0,0,0); return t; }, []);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const monthName = view.toLocaleString('en', { month: 'long' });
  const year = view.getFullYear();
  const firstDow = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.getFullYear(), view.getMonth()+1, 0).getDate();
  const cells = [];
  for (let i=0;i<firstDow;i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(d);

  const startSel = start ? new Date(start) : null;
  const endSel = end ? new Date(end) : null;
  const isPast = (d) => {
    const dt = new Date(view.getFullYear(), view.getMonth(), d);
    return dt < today;
  };
  const isToday = (d) => view.getFullYear()===today.getFullYear() && view.getMonth()===today.getMonth() && d===today.getDate();
  const getDate = (d) => new Date(view.getFullYear(), view.getMonth(), d);
  const isStart = (d) => sameDay(getDate(d), startSel);
  const isEnd = (d) => sameDay(getDate(d), endSel);
  const isInRange = (d) => {
    if (!startSel || !endSel) return false;
    const dt = getDate(d);
    return dt > startSel && dt < endSel;
  };
  const selectDate = (d) => {
    const next = getDate(d);
    if (!startSel || endSel || next < startSel) {
      onRangeChange(next, null);
      return;
    }
    onRangeChange(startSel, next);
  };

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="cal-nav" onClick={()=>setView(new Date(view.getFullYear(), view.getMonth()-1, 1))}><Icon name="chevL" size={14}/></button>
        <div className="month">{monthName} {year}</div>
        <button className="cal-nav" onClick={()=>setView(new Date(view.getFullYear(), view.getMonth()+1, 1))}><Icon name="chev" size={14}/></button>
      </div>
      <div className="cal-grid">
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => <div className="cal-dow" key={d}>{d}</div>)}
        {cells.map((d, i) => d===null ? <div key={'e'+i}/> : (
          <div key={d}
            className={`cal-day ${isPast(d)?'muted':''} ${isToday(d)?'today':''} ${isStart(d)?'selected start':''} ${isEnd(d)?'selected end':''} ${isInRange(d)?'in-range':''}`}
            onClick={()=>!isPast(d) && selectDate(d)}>
            {d}
          </div>
        ))}
      </div>
      <div className="cal-hint">{endSel ? 'Date range selected' : startSel ? 'Choose an end date' : 'Choose a start date'}</div>
    </div>
  );
}
