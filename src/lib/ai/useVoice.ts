import { useEffect, useRef, useState } from "react";

// SpeechRecognition (speech-to-text) is still non-standard and missing
// from TypeScript's DOM lib, unlike SpeechSynthesis (text-to-speech,
// already fully typed) -- these are the minimal ambient types needed to
// use it without `any`. Chrome/Edge/Safari ship it prefixed as
// webkitSpeechRecognition; Firefox has no support at all, hence the
// feature-detection this hook exposes via `supported`.
declare global {
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
  }

  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

// Speech-to-text. Not continuous -- one utterance per activation, ending
// naturally on a pause, matching how a voice assistant turn normally
// works (speak, then wait for a reply) rather than an always-on mic.
export function useSpeechRecognition(onFinalResult: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalResultRef = useRef(onFinalResult);

  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    const hasSupport = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    queueMicrotask(() => setSupported(hasSupport));
  }, []);

  function start() {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalText = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += transcript;
        else interim += transcript;
      }
      setInterimText(interim);
      if (finalText.trim()) {
        onFinalResultRef.current(finalText.trim());
      }
    };
    recognition.onend = () => {
      setListening(false);
      setInterimText("");
    };
    recognition.onerror = () => {
      setListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    setInterimText("");
    setListening(true);
    recognition.start();
  }

  function stop() {
    recognitionRef.current?.stop();
  }

  return { supported, listening, interimText, start, stop };
}

// Text-to-speech. SpeechSynthesisUtterance/window.speechSynthesis are
// standard and already typed -- no ambient declarations needed here.
export function useSpeechSynthesis() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const hasSupport = typeof window !== "undefined" && "speechSynthesis" in window;
    queueMicrotask(() => setSupported(hasSupport));
  }, []);

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  function stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  return { supported, speak, stop };
}
