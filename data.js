const TRACKER_DATE = new Date('2026-06-15');

const PHASES = [
  { id: 'indicios',    short: 'Indicios',    label: 'Primeros\nIndicios' },
  { id: 'denuncia',    short: 'Denuncia',    label: 'Denuncia\n/ Querella' },
  { id: 'diligencias', short: 'Dilig.',      label: 'Diligencias\nPrevias' },
  { id: 'operacion',   short: 'Op. Pol.',    label: 'Operación\nPolicial' },
  { id: 'instruccion', short: 'Instrucción', label: 'Instrucción\nJudicial' },
  { id: 'intermedia',  short: 'F. Inter.',   label: 'Fase\nIntermedia' },
  { id: 'juicio',      short: 'Juicio',      label: 'Juicio\nOral' },
  { id: 'sentencia',   short: 'Sentencia',   label: 'Sentencia' },
  { id: 'recursos',    short: 'Recursos',    label: 'Recursos\nApel. / Cas.' },
  { id: 'firme',       short: 'Firme',       label: 'Sentencia\nFirme' },
  { id: 'prision',     short: 'Prisión',     label: 'Ingreso en\nPrisión' },
];

const PARTIES = [
  { id: 'psoe',  name: 'PSOE',        color: '#E30613' },
  { id: 'pp',    name: 'PP',          color: '#1A75CF' },
  { id: 'otros', name: 'Otros',       color: '#7D5BA6' },
  { id: 'trans', name: 'Transversal', color: '#3A3A3A' },
];

const CASES = [];

window.TRACKER_DATE = TRACKER_DATE;
window.PHASES = PHASES;
window.PARTIES = PARTIES;
window.CASES = CASES;
