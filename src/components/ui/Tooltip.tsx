"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

// Renders the tooltip bubble through a portal, positioned via a live
// bounding-rect read on hover, rather than as an absolutely positioned
// child. The bars this is used in (MapAmenityBar, MapFilterChips) need
// overflow-x-auto to horizontally scroll when they don't fully fit -- per
// the CSS overflow spec, setting overflow-x without overflow-y forces
// overflow-y's computed value to auto too, so any tooltip trying to poke
// above/below the row from inside that container would get silently
// clipped instead of floating over the map.
//
// The portal target is picked at show-time rather than hardcoded to
// document.body: when the map is in native fullscreen (HomeClient calls
// rootRef.current.requestFullscreen()), the browser only paints the
// fullscreened element's own subtree plus its top layer -- anything
// portaled to document.body lives outside that subtree and simply never
// renders while fullscreen is active. Portaling into
// document.fullscreenElement instead keeps the tooltip inside the tree
// that's actually on screen.
export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ top: number; left: number; container: Element } | null>(
    null
  );

  function show() {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setState({
      top: rect.top,
      left: rect.left + rect.width / 2,
      container: document.fullscreenElement ?? document.body,
    });
  }

  function hide() {
    setState(null);
  }

  return (
    <div
      ref={anchorRef}
      className="relative flex shrink-0"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {state &&
        createPortal(
          <span
            role="tooltip"
            className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap rounded-md border border-navy-600 bg-navy-800 px-2 py-1 text-[11px] font-medium text-ink-100 shadow-lg"
            style={{ top: state.top, left: state.left }}
          >
            {label}
          </span>,
          state.container
        )}
    </div>
  );
}
