import React from "react";
import { FONT } from "../../config/theme";

export const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="phone-frame">
    <div className="phone-content">
      {children}
    </div>

    <style>{`
      .phone-frame {
        width: 100%;
        height: 100%;
        background: #060a10;
        overflow: hidden;
        position: relative;
        display: flex;
        flex-direction: column;
        font-family: ${FONT};
        /* Safe area: dark bar behind status bar */
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
        }
      }
    `}</style>
  </div>
);
