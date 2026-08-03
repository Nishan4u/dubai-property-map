"use client";

import { useEffect, useRef, useState } from "react";

export interface SignatureValue {
  signatureType: "typed" | "drawn";
  signatureData: string;
}

// Hand-rolled canvas signature -- no signature_pad or similar dependency.
// "Type" is the simple, accessible default; "Draw" covers the
// touch/mouse freehand case most e-signature tools also offer.
export function SignatureCapture({
  signedByName,
  onChange,
}: {
  signedByName: string;
  onChange: (value: SignatureValue | null) => void;
}) {
  const [mode, setMode] = useState<"typed" | "drawn">("typed");
  const [typedText, setTypedText] = useState(signedByName);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (mode === "typed") {
      onChange(typedText.trim() ? { signatureType: "typed", signatureData: typedText.trim() } : null);
    } else {
      onChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, typedText]);

  function getCanvasPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = true;
    lastPointRef.current = getCanvasPoint(e);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = getCanvasPoint(e);
    if (!canvas || !ctx || !point || !lastPointRef.current) return;

    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPointRef.current = point;
    hasDrawnRef.current = true;
  }

  function handlePointerUp() {
    drawingRef.current = false;
    lastPointRef.current = null;
    if (hasDrawnRef.current && canvasRef.current) {
      onChange({ signatureType: "drawn", signatureData: canvasRef.current.toDataURL("image/png") });
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    onChange(null);
  }

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("typed")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
            mode === "typed" ? "bg-gold-500 text-navy-950" : "bg-navy-800 text-ink-400 hover:text-ink-100"
          }`}
        >
          Type
        </button>
        <button
          type="button"
          onClick={() => setMode("drawn")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
            mode === "drawn" ? "bg-gold-500 text-navy-950" : "bg-navy-800 text-ink-400 hover:text-ink-100"
          }`}
        >
          Draw
        </button>
      </div>

      {mode === "typed" ? (
        <input
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          placeholder="Type your full name"
          className="w-full rounded-lg border border-navy-600 bg-white px-4 py-3 text-2xl italic text-navy-950 placeholder:text-ink-400 focus:outline-none"
          style={{ fontFamily: "cursive" }}
        />
      ) : (
        <div>
          <canvas
            ref={canvasRef}
            width={480}
            height={160}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full touch-none rounded-lg border border-navy-600 bg-white"
          />
          <button
            type="button"
            onClick={handleClear}
            className="mt-2 text-xs font-medium text-ink-400 hover:text-ink-100"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
