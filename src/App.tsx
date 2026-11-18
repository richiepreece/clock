import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './App.css';
import { CrystalClock } from './CrystalClock';
import { TimeOverlay } from './TimeOverlay';

type PictureInPicture = {
  requestWindow(options: { width: number; height: number }): Promise<Window>;
};

export function App() {
  const pictureInPicture = (window as Window & { documentPictureInPicture?: PictureInPicture }).documentPictureInPicture;
  const [floatingWindow, setFloatingWindow] = useState<Window | null>(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const windowRef = useRef<Window | null>(null);

  useEffect(() => () => {
    windowRef.current?.close();
  }, []);

  async function popOut() {
    if (!pictureInPicture || opening) return;
    setOpening(true);
    setError('');
    let popup: Window | undefined;
    try {
      popup = await pictureInPicture.requestWindow({ width: 420, height: 420 });
      popup.document.title = 'Crystal Clock';
      for (const style of document.querySelectorAll('link[rel="stylesheet"], style')) {
        const copy = style.cloneNode(true) as HTMLElement;
        if (style instanceof HTMLLinkElement) copy.setAttribute('href', style.href);
        popup.document.head.append(copy);
      }
      popup.addEventListener('pagehide', () => {
        windowRef.current = null;
        setFloatingWindow(null);
      }, { once: true });
      windowRef.current = popup;
      setFloatingWindow(popup);
    } catch (error) {
      popup?.close();
      console.error('Unable to pop out the clock', error);
      setError('Unable to open the floating clock. Please try again.');
    } finally {
      setOpening(false);
    }
  }

  const clock = (
    <div className="clock-container">
      <CrystalClock />
      <TimeOverlay />
      {pictureInPicture && (
        <button
          className="pop-out-button"
          type="button"
          disabled={opening}
          onClick={() => floatingWindow ? floatingWindow.close() : void popOut()}
        >
          {floatingWindow ? 'Return to tab' : opening ? 'Opening...' : 'Pop out clock'}
        </button>
      )}
      {error && <p className="pop-out-error" role="alert">{error}</p>}
    </div>
  );

  if (!floatingWindow) return clock;

  return (
    <>
      <div className="pop-out-placeholder">
        <p>The clock is open in a floating window.</p>
        <button type="button" onClick={() => floatingWindow.close()}>Return clock to tab</button>
      </div>
      {createPortal(clock, floatingWindow.document.body)}
    </>
  );
}
