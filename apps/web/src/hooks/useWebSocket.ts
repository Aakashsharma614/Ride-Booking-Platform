"use client";
import { useEffect, useRef, useCallback } from "react";

type WsHandler = (event: { eventType: string; payload: Record<string, unknown> }) => void;

export function useWebSocket(token: string | null | undefined, onMessage: WsHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  const connect = useCallback(() => {
    if (!token) return;
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080"}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try { handlerRef.current(JSON.parse(e.data)); } catch {}
    };
    ws.onclose = () => {
      setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();
  }, [token]);

  useEffect(() => {
    connect();
    return () => { wsRef.current?.close(); };
  }, [connect]);

  return wsRef;
}
