import { useEffect, useState, useRef } from "react";

/**
 * useSSEProgress - React hook for streaming progress via SSE
 * @param {string} sseUrl - The SSE endpoint URL
 * @param {function} onComplete - Callback when streaming completes (optional)
 * @returns {object} { progress, error, start, stop }
 */
export function useSSEProgress(sseUrl, onComplete) {
  const [progress, setProgress] = useState({
    stage: "",
    percent: 0,
    data: null,
  });
  const [error, setError] = useState(null);
  const [active, setActive] = useState(false);
  const eventSourceRef = useRef(null);

  const start = () => {
    if (!sseUrl || eventSourceRef.current) return;
    setActive(true);
    const evtSource = new window.EventSource(sseUrl);
    eventSourceRef.current = evtSource;

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setProgress({ stage: data.stage, percent: data.percent, data });
        if (data.stage === "Complete" && onComplete) {
          onComplete(data);
          evtSource.close();
          eventSourceRef.current = null;
          setActive(false);
        }
        if (data.stage === "Error") {
          setError(data.error || "AI streaming error");
          evtSource.close();
          eventSourceRef.current = null;
          setActive(false);
        }
      } catch (err) {
        setError("Failed to parse AI progress event.");
        evtSource.close();
        eventSourceRef.current = null;
        setActive(false);
      }
    };
    evtSource.onerror = () => {
      setError("AI streaming connection error.");
      evtSource.close();
      eventSourceRef.current = null;
      setActive(false);
    };
  };

  const stop = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setActive(false);
    }
  };

  useEffect(() => {
    return () => stop();
  }, []);

  return { progress, error, active, start, stop };
}
