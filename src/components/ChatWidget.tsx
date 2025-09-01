\
        import React, { useEffect, useMemo, useRef, useState } from "react";
        import ProductChatWindow from "./ProductChatWindow";

        const ENV = {
          MODE: (import.meta.env.VITE_CHAT_MODE || "LOCAL").toUpperCase() as
            | "LOCAL"
            | "REST"
            | "WS"
            | "OPENROUTER",
          REST_URL: import.meta.env.VITE_REST_URL || "http://localhost:8000/messages",
          WS_URL: import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/chat",
          OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_KEY || "",
          OPENROUTER_MODEL: import.meta.env.VITE_OPENROUTER_MODEL || "qwen/qwen3-coder:free",
          OPENROUTER_URL: import.meta.env.VITE_OPENROUTER_URL || "https://openrouter.ai/api/v1/chat/completions",
          ALLOW_MODE_SWITCH: (import.meta.env.VITE_CHAT_ALLOW_MODE_SWITCH || "false").toLowerCase() === "true",
          SESSION_KEY: import.meta.env.VITE_CHAT_SESSION_KEY || "chat_widget_session_v1",
          SHORTCUT_ENABLED: (import.meta.env.VITE_CHAT_SHORTCUT || "true").toLowerCase() === "true",
        };

        const MASK = (k: string) => {
          if (!k) return "(empty)";
          if (k.length <= 8) return `${k.slice(0, 2)}...`;
          return `${k.slice(0, 4)}...${k.slice(-4)}`;
        };

        const STORAGE_OPEN_KEY = "chat_widget_open_v1";
        const POLL_INTERVAL = 1200; // ms - check localStorage for unread when widget closed

        const readUsernameFromLocal = (): string => {
          try {
            const raw = localStorage.getItem("user");
            if (!raw) return "guster";
            // stored as JSON.stringify(username) according to your note
            const parsed = JSON.parse(raw);
            if (!parsed) return "guster";
            // if user stored object {name:...} adjust accordingly; assuming string username
            return String(parsed);
          } catch {
            return "guster";
          }
        };

        const ChatWidget: React.FC = () => {
          const [open, setOpen] = useState<boolean>(() => {
            try {
              const s = sessionStorage.getItem(STORAGE_OPEN_KEY);
              return s === "1";
            } catch {
              return false;
            }
          });

          const [mode, setMode] = useState<typeof ENV.MODE>(ENV.MODE);
          const [unread, setUnread] = useState<number>(0);
          const lastMessagesLenRef = useRef<number | null>(null);
          const pollRef = useRef<number | null>(null);

          // env values
          const REST_URL = ENV.REST_URL;
          const WS_URL = ENV.WS_URL;
          const OPENROUTER_API_KEY = ENV.OPENROUTER_API_KEY;
          const OPENROUTER_MODEL = ENV.OPENROUTER_MODEL;
          const OPENROUTER_URL = ENV.OPENROUTER_URL;
          const sessionKey = ENV.SESSION_KEY;

          // compute username once per mount; if you need to react to login changes,
          // you can replace with a state + storage event listener.
          const username = useMemo(() => readUsernameFromLocal(), []);

          // masked key for logs/UI
          const maskedKey = useMemo(() => MASK(OPENROUTER_API_KEY), [OPENROUTER_API_KEY]);

          useEffect(() => {
            try {
              sessionStorage.setItem(STORAGE_OPEN_KEY, open ? "1" : "0");
            } catch {}
            if (open) {
              setUnread(0);
              try {
                const raw = localStorage.getItem(sessionKey);
                if (raw) {
                  const arr = JSON.parse(raw);
                  lastMessagesLenRef.current = Array.isArray(arr) ? arr.length : null;
                } else {
                  lastMessagesLenRef.current = null;
                }
              } catch {
                lastMessagesLenRef.current = null;
              }
            }
          }, [open, sessionKey]);

          useEffect(() => {
            const poll = () => {
              try {
                const raw = localStorage.getItem(sessionKey);
                if (!raw) return;
                const arr = JSON.parse(raw);
                if (!Array.isArray(arr)) return;
                const len = arr.length;
                const prev = lastMessagesLenRef.current;
                if (prev == null) {
                  lastMessagesLenRef.current = len;
                  return;
                }
                if (len > prev) {
                  if (!open) {
                    setUnread((u) => u + (len - prev));
                  }
                  lastMessagesLenRef.current = len;
                } else {
                  lastMessagesLenRef.current = len;
                }
              } catch {
                // ignore parse errors
              }
            };

            if (!open) {
              pollRef.current = window.setInterval(poll, POLL_INTERVAL);
              poll();
            } else {
              if (pollRef.current) {
                window.clearInterval(pollRef.current);
                pollRef.current = null;
              }
            }

            return () => {
              if (pollRef.current) {
                window.clearInterval(pollRef.current);
                pollRef.current = null;
              }
            };
          }, [open, sessionKey]);

          useEffect(() => {
            if (!ENV.SHORTCUT_ENABLED) return;
            const handler = (e: KeyboardEvent) => {
              const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
              const metaOk = isMac ? e.metaKey : e.ctrlKey;
              if (metaOk && e.shiftKey && (e.key === "C" || e.key === "c")) {
                e.preventDefault();
                setOpen((v) => !v);
              }
            };
            window.addEventListener("keydown", handler);
            return () => window.removeEventListener("keydown", handler);
          }, []);

          useEffect(() => {
            console.info("[ChatWidget] mount env:", {
              mode: ENV.MODE,
              restUrl: REST_URL,
              wsUrl: WS_URL,
              openrouterModel: OPENROUTER_MODEL,
              openrouterKeyPresent: !!OPENROUTER_API_KEY,
              openrouterMask: maskedKey,
              allowModeSwitch: ENV.ALLOW_MODE_SWITCH,
              sessionKey,
              username,
            });
          }, [REST_URL, WS_URL, OPENROUTER_MODEL, OPENROUTER_API_KEY, maskedKey, sessionKey, username]);

          const toggleOpen = (val?: boolean) => {
            setOpen((prev) => (typeof val === "boolean" ? val : !prev));
          };

          const handleCloseFromChild = () => {
            console.info("[ChatWidget] ProductChatWindow onClose invoked");
            toggleOpen(false);
          };

          const handleOpenClick = () => {
            toggleOpen();
          };

          const resetUnread = () => setUnread(0);

          const maskedTooltip = OPENROUTER_API_KEY ? `API key present: ${maskedKey}` : "No API key configured";

          return (
            <>
              <button
                onClick={handleOpenClick}
                aria-label={open ? "关闭聊天" : "打开聊天"}
                title={open ? `关闭聊天（快捷: Ctrl/Cmd+Shift+C）` : `打开聊天（快捷: Ctrl/Cmd+Shift+C） — ${maskedTooltip}`}
                style={{
                  position: "fixed",
                  bottom: 20,
                  right: 20,
                  borderRadius: "50%",
                  width: 64,
                  height: 64,
                  backgroundColor: "#4e8cff",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  zIndex: 10001,
                  fontSize: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                }}
              >
                <span aria-hidden>{open ? "✕" : "💬"}</span>
                {!open && unread > 0 && (
                  <span
                    aria-label={`${unread} 未读消息`}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      minWidth: 20,
                      height: 20,
                      lineHeight: "20px",
                      borderRadius: 10,
                      background: "#ff4d4f",
                      color: "#fff",
                      fontSize: 12,
                      textAlign: "center",
                      padding: "0 6px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>

              {open && (
                <div role="dialog" aria-label="聊天窗口" aria-modal="false" style={{ position: 'fixed', bottom: 20, right: 100, zIndex:10002 }}>
                  <ProductChatWindow
                    onClose={() => {
                      handleCloseFromChild();
                      resetUnread();
                    }}
                    mode={mode}
                    restUrl={REST_URL}
                    wsUrl={WS_URL}
                    openrouterApiKey={OPENROUTER_API_KEY}
                    openrouterModel={OPENROUTER_MODEL}
                    rightOffset={90}
                    // @ts-ignore
                    sessionKey={sessionKey}
                    // @ts-ignore
                    username={username}
                  />
                </div>
              )}
            </>
          );
        };

        export default ChatWidget;
