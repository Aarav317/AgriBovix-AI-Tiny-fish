import { useEffect, useState, type ReactNode } from "react";
import "./startup-splash.css";

const SPLASH_EXIT_START_MS = 6250;
const SPLASH_DURATION_MS = 7000;

export function StartupSplash({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(
      () => setExiting(true),
      SPLASH_EXIT_START_MS,
    );
    const finishTimer = window.setTimeout(
      () => setVisible(false),
      SPLASH_DURATION_MS,
    );

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(finishTimer);
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (visible) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  return (
    <>
      <div className="startup-app" aria-hidden={visible} inert={visible}>
        {children}
      </div>
      {visible && (
        <div
          className={`startup-splash${exiting ? " is-exiting" : ""}`}
          role="status"
          aria-label="AgriBovix startup"
        >
          <div className="startup-splash__composition">
            <img
              className="startup-splash__logo"
              src="/logo/agribovix-original.png"
              alt=""
              draggable="false"
            />
            <h1 className="startup-splash__brand">AgriBovix</h1>
            <div className="startup-splash__powered">
              <span>POWERED BY</span>
              <strong>ARANICA LAB</strong>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
