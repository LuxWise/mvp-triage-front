function getTriageInfo(level) {
  const triageMap = {
    1: {
      label: "Triage I - Atención inmediata",
      className: "triage-badge triage-1",
    },
    2: {
      label: "Triage II - Muy urgente",
      className: "triage-badge triage-2",
    },
    3: {
      label: "Triage III - Urgente",
      className: "triage-badge triage-3",
    },
    4: {
      label: "Triage IV - Menor urgencia",
      className: "triage-badge triage-4",
    },
    5: {
      label: "Triage V - No urgente",
      className: "triage-badge triage-5",
    },
  };

  return (
    triageMap[level] || {
      label: `Triage ${level}`,
      className: "triage-badge",
    }
  );
}

function getDecisionLabel(source) {
  const labels = {
    modelo: "Definido por el modelo de apoyo",
    reglas_clinicas: "Definido por reglas clínicas de seguridad",
    modelo_validado_por_reglas: "Modelo validado por reglas clínicas",
  };

  return labels[source] || source;
}

export default function ResultCard({ result }) {
  if (!result) return null;

  const modelInfo = getTriageInfo(result.triage_modelo);
  const finalInfo = getTriageInfo(result.triage_final);

  return (
    <div className="result-card">
      <h2>Resultado del análisis</h2>

      <div className="triage-grid">
        <div className="triage-box">
          <p className="triage-label">Sugerencia del modelo</p>
          <span className={modelInfo.className}>{modelInfo.label}</span>
        </div>

        <div className="triage-box">
          <p className="triage-label">Clasificación final</p>
          <span className={finalInfo.className}>{finalInfo.label}</span>
        </div>
      </div>

      <div className="decision-box">
        <p><strong>Fuente principal:</strong> {getDecisionLabel(result.fuente_decision)}</p>
        <p><strong>Resumen de decisión:</strong> {result.motivo_ajuste}</p>
      </div>

      {result.ajuste_aplicado ? (
        <div className="adjustment-box">
          La prioridad final fue ajustada con base en hallazgos clínicos estructurados.
        </div>
      ) : (
        <div className="validation-box">
          La prioridad final coincide con la sugerencia del modelo o fue clínicamente validada.
        </div>
      )}

      {result.alertas?.length > 0 && (
        <div className="alerts">
          <strong>Alertas detectadas:</strong>
          <ul>
            {result.alertas.map((alerta, index) => (
              <li key={index}>{alerta}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="explanation-box">
        <strong>Explicación clínica:</strong>
        <p>{result.explicacion}</p>
      </div>

      <div className="disclaimer-box">
        Esta herramienta es de apoyo y no reemplaza el juicio clínico profesional.
      </div>
    </div>
  );
}