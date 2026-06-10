const API_URL = "https://back-mvp-triage.quarnova.com";

export async function predictTriage(payload) {
  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || "Error al consultar la API");
  }

  return data;
}

export async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("language", "es");
  formData.append("task", "transcribe");

  const response = await fetch(`${API_URL}/transcribe-audio`, {
    method: "POST",
    body: formData,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || "Error al transcribir el audio");
  }

  return data;
}

export async function extractCase(transcription) {
  const response = await fetch(`${API_URL}/extract-case`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transcription }),
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || "Error al extraer la información del caso");
  }

  return data;
}
