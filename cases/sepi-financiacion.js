// NOTA: Recomiendo renombrar el id a 'cerdan-psoe' o 'financiacion-psoe' — el id actual ('sepi-financiacion') es engañoso porque mezcla SEPI (que está en plusultra y koldo-aireuropa) con financiación irregular del PSOE (esto). He dejado el id antiguo por compatibilidad.
CASES.push({
  id: 'sepi-financiacion',
  name: 'Caso Cerdán · Financiación PSOE',
  party: 'psoe',
  phase: 'instruccion',
  year: 2025,
  importe: 's.d.',
  importeNota: 'Presuntos pagos en efectivo y descuadres contables en la sede del PSOE',
  imputados: ['Santos Cerdán', 'ex tesoreros del partido', 'Mariano Moreno (Servinabar)'],
  ultima: '2026-05',
  ultimaTexto: 'Cerdán fuera de prisión desde 19-N-2025 pero sigue imputado. La causa progresa lentamente en la AN; previsiones de 3-5 años hasta juicio.',
  resumen: 'Pieza derivada del caso Koldo en la Audiencia Nacional (juez Ismael Moreno). Investiga presuntos pagos en efectivo dentro de la estructura del PSOE, descuadres entre los ingresos a Ábalos y Koldo y lo justificado por Ferraz, y la red de empresas (Servinabar, Acciona) que habría adjudicado obra pública a cambio de comisiones. Cerdán dimitió como secretario de Organización el 12-J-2025 e ingresó en prisión preventiva el 30-J-2025; salió el 19-N-2025.',
  noticias: [
    { fuente: 'La Bandera',  titulo: 'El caso Cerdán amenaza con pudrirse años en la Audiencia Nacional mientras el PSOE espera el golpe más duro', fecha: '2026-05-08', url: 'https://labandera.es/caso-cerdan-financiacion-psoe-audiencia-nacional/' },
    { fuente: 'Euronews',    titulo: 'Santos Cerdán, en libertad tras 5 meses en prisión preventiva',                                                fecha: '2025-11-19', url: 'https://es.euronews.com/perfiles/3224' },
    { fuente: 'Euronews',    titulo: 'Santos Cerdán reconoce ante el juez dos reuniones con Leire Díez',                                             fecha: '2026-02-02', url: 'https://es.euronews.com/perfiles/3224' },
  ],
});
