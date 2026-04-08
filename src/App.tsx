import './App.css';
import { CrystalClock } from './CrystalClock';
import { TimeOverlay } from './TimeOverlay';

export function App() {
  return (
    <div className="clock-container">
      <CrystalClock />
      <TimeOverlay />
    </div>
  );
}
