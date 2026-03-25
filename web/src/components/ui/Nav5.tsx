import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { C, glassNav } from "../../config/theme";
import { Ic } from "./Icons";
import type { CSSProperties } from "react";

interface Nav5Props {
  cartCount?: number;
}

export const Nav5: React.FC<Nav5Props> = ({ cartCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: "/home", label: "Home", Icon: Ic.Home },
    { path: "/agenda", label: "Agenda", Icon: Ic.Discover },
    { path: "/cart", label: "Cart", Icon: Ic.Cart, center: true },
    { path: "/vote", label: "Vote", Icon: Ic.Vote },
    { path: "/profile", label: "Profile", Icon: Ic.User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      minHeight: 88,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      display: "flex", alignItems: "flex-start", justifyContent: "space-around",
      ...glassNav, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      boxShadow: "0 -4px 20px rgba(0,0,0,0.15)", zIndex: 100,
    } as CSSProperties}>
      {tabs.map(({ path, label, Icon, center }) => {
        const active = isActive(path);
        if (center) {
          return (
            <div key={path} style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -22 }}>
              <button onClick={() => navigate(path)} style={{
                width: 56, height: 56, borderRadius: 18, background: C.flat,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", cursor: "pointer",
                boxShadow: "0 8px 24px rgba(255,198,176,0.35)", position: "relative",
              } as CSSProperties}>
                <Icon c="#0a0a0a" />
                {cartCount > 0 && (
                  <div style={{
                    position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
                    background: C.error, color: C.white, fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `2px solid ${C.surface}`,
                  }}>{cartCount}</div>
                )}
              </button>
              <span style={{ fontSize: 11, fontWeight: 500, color: C.flat, marginTop: 4 }}>{label}</span>
            </div>
          );
        }
        return (
          <button key={path} onClick={() => navigate(path)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            background: "none", border: "none", cursor: "pointer", padding: "14px 12px 0",
            color: active ? C.flat : C.textTertiary,
          }}>
            <Icon c={active ? C.flat : C.textTertiary} />
            <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
};
