import { useState, useEffect } from 'react';

export default function TimePicker({ value, onChange }) {
  // value is expected in "HH:MM" 24h format, e.g. "14:30"
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState('AM');

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      let hours = parseInt(h, 10);
      const isPm = hours >= 12;
      hours = hours % 12 || 12; // Convert 0 to 12
      setHour(hours.toString().padStart(2, '0'));
      setMinute(m);
      setAmpm(isPm ? 'PM' : 'AM');
    } else {
      setHour('12');
      setMinute('00');
      setAmpm('AM');
    }
  }, [value]);

  const handleChange = (h, m, ap) => {
    let hours24 = parseInt(h, 10);
    if (ap === 'PM' && hours24 < 12) hours24 += 12;
    if (ap === 'AM' && hours24 === 12) hours24 = 0;
    
    const time24 = `${hours24.toString().padStart(2, '0')}:${m}`;
    onChange(time24);
  };

  const handleHourChange = (e) => {
    const h = e.target.value;
    setHour(h);
    handleChange(h, minute, ampm);
  };

  const handleMinuteChange = (e) => {
    const m = e.target.value;
    setMinute(m);
    handleChange(hour, m, ampm);
  };

  const handleAmpmChange = (e) => {
    const ap = e.target.value;
    setAmpm(ap);
    handleChange(hour, minute, ap);
  };

  return (
    <div className="flex gap-2 w-full">
      <select 
        value={hour} 
        onChange={handleHourChange}
        className="flex-1 bg-surface-container-high/50 border border-on-surface/10 rounded-lg px-2 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm appearance-none cursor-pointer"
      >
        {Array.from({ length: 12 }, (_, i) => {
          const val = (i + 1).toString().padStart(2, '0');
          return <option key={val} value={val}>{val}</option>;
        })}
      </select>
      <span className="self-center font-bold text-on-surface-variant">:</span>
      <select 
        value={minute} 
        onChange={handleMinuteChange}
        className="flex-1 bg-surface-container-high/50 border border-on-surface/10 rounded-lg px-2 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm appearance-none cursor-pointer"
      >
        {['00', '15', '30', '45'].map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select 
        value={ampm} 
        onChange={handleAmpmChange}
        className="flex-1 bg-surface-container-high/50 border border-on-surface/10 rounded-lg px-2 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm appearance-none cursor-pointer"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
