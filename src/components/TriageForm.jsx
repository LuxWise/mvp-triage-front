import { useRef, useState } from "react";
import { transcribeAudio, extractCase } from "../services/api";

export default function TriageForm({ onSubmit, loading, onAudioRecorded }) {
  const [formData, setFormData] = useState({
    motivo_consulta: "",
    edad: "",
    sexo: "",
    observaciones: "",

    tiempo_evolucion: "",
    localizacion: "",
    intensidad_dolor: "",
    sintomas_asociados: "",

    frecuencia_cardiaca: "",
    frecuencia_respiratoria: "",
    presion_sistolica: "",
    presion_diastolica: "",
    temperatura: "",
    saturacion_oxigeno: "",

    dificultad_respiratoria: false,
    dolor_toracico: false,
    perdida_conciencia: false,
    convulsiones: false,
    sangrado_abundante: false,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [transcriptionText, setTranscriptionText] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    onSubmit({
      ...formData,
      edad: Number(formData.edad),
      intensidad_dolor: Number(formData.intensidad_dolor),
      frecuencia_cardiaca: Number(formData.frecuencia_cardiaca),
      frecuencia_respiratoria: Number(formData.frecuencia_respiratoria),
      presion_sistolica: Number(formData.presion_sistolica),
      presion_diastolica: Number(formData.presion_diastolica),
      temperatura: Number(formData.temperatura),
      saturacion_oxigeno: Number(formData.saturacion_oxigeno),
    });
  }

  async function startRecording() {
    try {
      setRecordingError("");
      setVoiceError("");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setRecordingError(
          "Este navegador no soporta captura de audio desde micrófono."
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        setAudioBlob(blob);

        if (onAudioRecorded) {
          onAudioRecorded(blob);
        }

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      setRecordingError(
        "No fue posible acceder al micrófono. Verifica permisos del navegador."
      );
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  async function handleProcessAudio() {
    if (!audioBlob) {
      setVoiceError("Primero debes grabar un audio.");
      return;
    }

    try {
      setVoiceLoading(true);
      setVoiceError("");

      const transcriptionResult = await transcribeAudio(audioBlob);
      const transcription = transcriptionResult.transcription || "";

      setTranscriptionText(transcription);

      const extractResult = await extractCase(transcription);
      const extracted = extractResult.extracted_form || {};

      setFormData((prev) => ({
        ...prev,
        motivo_consulta: extracted.motivo_consulta ?? "",
        edad: extracted.edad ?? "",
        sexo: extracted.sexo ?? "",
        observaciones: extracted.observaciones ?? "",
        tiempo_evolucion: extracted.tiempo_evolucion ?? "",
        localizacion: extracted.localizacion ?? "",
        intensidad_dolor: extracted.intensidad_dolor ?? "",
        sintomas_asociados: extracted.sintomas_asociados ?? "",
        frecuencia_cardiaca: extracted.frecuencia_cardiaca ?? "",
        frecuencia_respiratoria: extracted.frecuencia_respiratoria ?? "",
        presion_sistolica: extracted.presion_sistolica ?? "",
        presion_diastolica: extracted.presion_diastolica ?? "",
        temperatura: extracted.temperatura ?? "",
        saturacion_oxigeno: extracted.saturacion_oxigeno ?? "",
        dificultad_respiratoria: extracted.dificultad_respiratoria ?? false,
        dolor_toracico: extracted.dolor_toracico ?? false,
        perdida_conciencia: extracted.perdida_conciencia ?? false,
        convulsiones: extracted.convulsiones ?? false,
        sangrado_abundante: extracted.sangrado_abundante ?? false,
      }));
    } catch (error) {
      console.error(error);
      setVoiceError(error.message || "No fue posible procesar el audio.");
    } finally {
      setVoiceLoading(false);
    }
  }

  return (
    <form className="triage-form" onSubmit={handleSubmit}>
      <h2>Registro del caso clínico</h2>
      <p className="section-helper">
        Ingrese la información básica, hallazgos clínicos y signos vitales para
        generar una sugerencia de priorización.
      </p>

      <div className="voice-box">
        <h3>Captura por voz</h3>
        <p className="section-helper">
          Puede grabar la conversación clínica y luego procesarla para
          autocompletar el formulario. La enfermera debe revisar la información
          antes de enviarla.
        </p>

        <div className="voice-actions">
          <button
            type="button"
            className="voice-btn start-btn"
            onClick={startRecording}
            disabled={isRecording || voiceLoading}
          >
            Iniciar grabación
          </button>

          <button
            type="button"
            className="voice-btn stop-btn"
            onClick={stopRecording}
            disabled={!isRecording || voiceLoading}
          >
            Detener grabación
          </button>

          <button
            type="button"
            className="voice-btn process-btn"
            onClick={handleProcessAudio}
            disabled={!audioBlob || isRecording || voiceLoading}
          >
            {voiceLoading ? "Procesando..." : "Procesar audio"}
          </button>
        </div>

        <div className={`recording-status ${isRecording ? "recording" : ""}`}>
          {isRecording ? "Grabando..." : "Grabación detenida"}
        </div>

        {recordingError && <div className="recording-error">{recordingError}</div>}
        {voiceError && <div className="recording-error">{voiceError}</div>}

      </div>

      <div className="form-section">
        <h3>Datos básicos</h3>
        <div className="grid-2">
          <label>
            Edad
            <input
              type="number"
              name="edad"
              value={formData.edad}
              onChange={handleChange}
              min="0"
              max="120"
              required
            />
          </label>

          <label>
            Sexo
            <select
              name="sexo"
              value={formData.sexo}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
              <option value="OTRO">Otro</option>
            </select>
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>Motivo de consulta y contexto clínico</h3>

        <label>
          Motivo de consulta
          <textarea
            name="motivo_consulta"
            value={formData.motivo_consulta}
            onChange={handleChange}
            placeholder="Ej: dolor en el pecho y dificultad para respirar"
            required
          />
        </label>

        <div className="grid-3">
          <label>
            Tiempo de evolución
            <input
              type="text"
              name="tiempo_evolucion"
              value={formData.tiempo_evolucion}
              onChange={handleChange}
              placeholder="Ej: 2 horas"
              required
            />
          </label>

          <label>
            Localización
            <select
              name="localizacion"
              value={formData.localizacion}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione</option>
              <option value="cabeza">Cabeza</option>
              <option value="cuello">Cuello</option>
              <option value="torax">Tórax</option>
              <option value="abdomen">Abdomen</option>
              <option value="espalda">Espalda</option>
              <option value="extremidades">Extremidades</option>
              <option value="generalizado">Generalizado</option>
              <option value="otro">Otro</option>
            </select>
          </label>

          <label>
            Intensidad del dolor (0-10)
            <input
              type="number"
              name="intensidad_dolor"
              value={formData.intensidad_dolor}
              onChange={handleChange}
              min="0"
              max="10"
              required
            />
          </label>
        </div>

        <label>
          Síntomas asociados
          <textarea
            name="sintomas_asociados"
            value={formData.sintomas_asociados}
            onChange={handleChange}
            placeholder="Ej: disnea, náuseas, sudoración, vómito"
          />
        </label>

        <label>
          Observaciones
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            placeholder="Información complementaria opcional"
          />
        </label>
      </div>

      <div className="form-section">
        <h3>Signos vitales</h3>
        <div className="grid-3">
          <label>
            Frecuencia cardíaca
            <input
              type="number"
              name="frecuencia_cardiaca"
              value={formData.frecuencia_cardiaca}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Frecuencia respiratoria
            <input
              type="number"
              name="frecuencia_respiratoria"
              value={formData.frecuencia_respiratoria}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Temperatura
            <input
              type="number"
              step="0.1"
              name="temperatura"
              value={formData.temperatura}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Presión sistólica
            <input
              type="number"
              name="presion_sistolica"
              value={formData.presion_sistolica}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Presión diastólica
            <input
              type="number"
              name="presion_diastolica"
              value={formData.presion_diastolica}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Saturación de oxígeno
            <input
              type="number"
              name="saturacion_oxigeno"
              value={formData.saturacion_oxigeno}
              onChange={handleChange}
              required
            />
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>Signos de alarma</h3>
        <p className="section-helper">
          Marque los signos de alarma presentes en el paciente.
        </p>

        <div className="checkbox-group">
          <label className="checkbox-item critical-option">
            <input
              type="checkbox"
              name="dificultad_respiratoria"
              checked={formData.dificultad_respiratoria}
              onChange={handleChange}
            />
            Dificultad respiratoria
          </label>

          <label className="checkbox-item critical-option">
            <input
              type="checkbox"
              name="dolor_toracico"
              checked={formData.dolor_toracico}
              onChange={handleChange}
            />
            Dolor torácico
          </label>

          <label className="checkbox-item critical-option">
            <input
              type="checkbox"
              name="perdida_conciencia"
              checked={formData.perdida_conciencia}
              onChange={handleChange}
            />
            Pérdida de conciencia
          </label>

          <label className="checkbox-item critical-option">
            <input
              type="checkbox"
              name="convulsiones"
              checked={formData.convulsiones}
              onChange={handleChange}
            />
            Convulsiones
          </label>

          <label className="checkbox-item critical-option">
            <input
              type="checkbox"
              name="sangrado_abundante"
              checked={formData.sangrado_abundante}
              onChange={handleChange}
            />
            Sangrado abundante
          </label>
        </div>
      </div>

      <button type="submit" disabled={loading || voiceLoading}>
        {loading ? "Analizando..." : "Analizar caso"}
      </button>
    </form>
  );
}