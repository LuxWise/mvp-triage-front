import { useState } from "react";
import "./App.css";
import TriageForm from "./components/TriageForm";
import ResultCard from "./components/ResultCard";
import { predictTriage } from "./services/api";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");

  async function handlePredict(formData) {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data = await predictTriage(formData);
      setResult(data);
    } catch (err) {
      setError(
        err.message ||
          "No fue posible analizar el caso. Verifica que el backend esté encendido."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleAudioRecorded(blob) {
    setAudioBlob(blob);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
  }

  return (
    <div className="app-container">
      <h1>Asistente Inteligente de Apoyo al Triage</h1>
      <p className="subtitle">
        Sistema híbrido de priorización clínica con modelo de apoyo y reglas de
        seguridad.
      </p>

      <TriageForm
        onSubmit={handlePredict}
        loading={loading}
        onAudioRecorded={handleAudioRecorded}
      />

      {audioUrl && (
        <div className="audio-preview-box">
          <strong>Audio capturado:</strong>
          <audio controls src={audioUrl} className="audio-player" />
          <p className="audio-helper">
            El audio fue capturado correctamente y queda listo para enviarse al
            backend en la siguiente fase.
          </p>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      <ResultCard result={result} />
    </div>
  );
}

export default App;