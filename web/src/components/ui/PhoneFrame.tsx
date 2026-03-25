import React from "react";
import { FONT } from "../../config/theme";

export const PhoneFrame: React.FC<{ children: React.ReactNode; nav?: React.ReactNode }> = ({ children, nav }) => (
  <div className="phone-frame">
    <div className="phone-content">
      {children}
    </div>
    {nav}

    <style>{`
      .phone-frame {
        width: 100%;
        height: 100dvh;
        background: #0a0a0a;
        overflow: hidden;
        position: relative;
        display: flex;
        flex-direction: column;
        font-family: ${FONT};
        padding-top: env(safe-area-inset-top, 0px);
        box-sizing: border-box;
      }
      .phone-content {
        position: relative;
        z-index: 1;
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
      }
      @media (min-width: 500px) {
        .phone-frame {
          width: 390px;
          height: 844px;
          max-width: 430px;
          border-radius: 44px;
          padding-top: 0;
          padding-bottom: 0;
          box-shadow: 0 32px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
          transform: translateZ(0);
        }
      }
    `}</style>
  </div>
);
