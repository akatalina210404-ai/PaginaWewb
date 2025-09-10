 // ------------------------
// Animaciones (Intersection Observer)
// ------------------------
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// ------------------------
// Fallback: datos de ejemplo si falla el CSV
// ------------------------
const municipiosEjemplo = {
  "Pereira": { cantidad: 23, detalles: "Pereira, la capital del departamento, cuenta con 23 zonas WiFi distribuidas en parques, bibliotecas, centros culturales y estaciones de transporte." },
  "Dosquebradas": { cantidad: 18, detalles: "Dosquebradas ofrece 18 zonas WiFi en lugares estratégicos como el Parque de la Vida, el Estadio Municipal y centros educativos." },
  "Santa Rosa de Cabal": { cantidad: 12, detalles: "Santa Rosa de Cabal tiene 12 zonas WiFi disponibles, principalmente en termales, áreas turísticas y el parque principal." },
  "La Virginia": { cantidad: 9, detalles: "La Virginia cuenta con 9 zonas WiFi a lo largo del malecón, en espacios públicos y centros comunitarios." },
  "Marsella": { cantidad: 7, detalles: "Marsella ofrece 7 zonas WiFi en su parque principal, centros educativos y la casa de la cultura." },
  "Quinchía": { cantidad: 6, detalles: "Quinchía tiene 6 zonas WiFi disponibles en el casco urbano y veredas cercanas." },
  "Santuario": { cantidad: 6, detalles: "Santuario cuenta con 6 zonas WiFi en áreas públicas y centros de salud." },
  "Belén de Umbría": { cantidad: 5, detalles: "Belén de Umbría ofrece 5 zonas WiFi en el parque principal, biblioteca y polideportivo." },
  "Pueblo Rico": { cantidad: 4, detalles: "Pueblo Rico tiene 4 zonas WiFi disponibles en el centro administrativo y colegios." },
  "Mistrató": { cantidad: 4, detalles: "Mistrató cuenta con 4 zonas WiFi en el área urbana y puestos de salud." },
  "Guática": { cantidad: 4, detalles: "Guática ofrece 4 zonas WiFi en espacios públicos y la alcaldía municipal." },
  "Apía": { cantidad: 4, detalles: "Apía tiene 4 zonas WiFi disponibles en el parque principal y biblioteca." },
  "Balboa": { cantidad: 3, detalles: "Balboa cuenta con 3 zonas WiFi en el parque principal y casa de la cultura." }
};

// ------------------------
// Utilidad: separar columnas respetando comillas en CSV
// ------------------------
function splitCSVRow(row) {
  const matches = row.match(/("([^"]|"")*"|[^,]+)/g);
  if (!matches) return [];
  return matches.map(v => {
    let val = v.trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1).replace(/""/g, '"');
    }
    return val;
  });
}

// ------------------------
// Construir tarjeta
// ------------------------
function createMunicipioCard(container, nombre, cantidad) {
  const card = document.createElement("div");
  card.classList.add("municipio-card", "fade-in");
  card.innerHTML = `
    <div class="municipio-icon"><i class="fas fa-wifi"></i></div>
    <h4 class="mb-1">${nombre}</h4>
    <p class="mb-2"><strong>${cantidad}</strong> zonas WiFi registradas</p>
    <div>
      <button class="btn btn-primary btn-sm ver-detalles" data-municipio="${nombre}">
        <i class="fas fa-info-circle"></i> Ver detalles
      </button>
    </div>
  `;
  container.appendChild(card);

  const btn = card.querySelector(".ver-detalles");
  btn.addEventListener("click", () => showMunicipioDetails(nombre));

  observer.observe(card);
}

// ------------------------
// Mostrar detalles
// ------------------------
function showMunicipioDetails(municipioName) {
  const detallesSection = document.getElementById("municipio-details");
  const detailTitle = document.getElementById("detail-title");
  const detailContent = document.getElementById("detail-content");

  if (!detallesSection || !detailTitle || !detailContent) return;

  detailTitle.textContent = `Detalles de ${municipioName}`;
  const detalles = municipiosEjemplo[municipioName]?.detalles ||
    `Información detallada sobre las zonas WiFi en ${municipioName}. Estas zonas están distribuidas en parques, bibliotecas y centros culturales.`;

  detailContent.innerHTML = `
    <p>${detalles}</p>
    <div class="mt-3">
      <h5><i class="fas fa-map-marked-alt"></i> Zonas WiFi principales:</h5>
      <ul>
        <li>Parque principal</li>
        <li>Biblioteca municipal</li>
        <li>Centro cultural</li>
        <li>Plaza de mercado</li>
        <li>Coliseo / Estadio</li>
      </ul>
    </div>
    <div class="mt-3">
      <h5><i class="fas fa-clock"></i> Horarios de disponibilidad:</h5>
      <p>Lunes a domingo de 6:00 AM a 10:00 PM</p>
    </div>
    <div class="mt-3">
      <h5><i class="fas fa-tachometer-alt"></i> Velocidad de conexión:</h5>
      <p>10–20 Mbps dependiendo de la cantidad de usuarios conectados.</p>
    </div>
  `;

  detallesSection.style.display = "block";
  detallesSection.scrollIntoView({ behavior: "smooth" });
}

// ------------------------
// Cargar CSV desde GitHub (con spinner + errores + búsqueda + toggle vista)
// ------------------------
async function loadMunicipiosData() {
  if (!window.location.pathname.includes('municipios') &&
      !window.location.href.includes('municipios')) return;

  const container = document.getElementById("municipios-container");
  const spinner = document.getElementById("loading-spinner");
  const errorMsg = document.getElementById("error-message");
  const searchInput = document.getElementById("search-input");
  const toggleView = document.getElementById("toggle-view");

  if (!container) return;

  // Estado UI: inicio
  if (spinner) spinner.style.display = 'block';
  if (errorMsg) errorMsg.style.display = 'none';
  container.innerHTML = '';

  try {
    const response = await fetch("https://raw.githubusercontent.com/JosePerdomo16/Pagina_web/main/Zonas_WiFi_Gratuitas_del_Departamento_de_Risaralda_20250903.csv");
    if (!response.ok) throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);

    const text = await response.text();
    if (!text || text.trim().length === 0) throw new Error("El archivo CSV está vacío.");

    const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
    if (rows.length <= 1) throw new Error("El CSV no contiene datos suficientes.");

    const headers = splitCSVRow(rows[0]).map(h => h.trim().toLowerCase());
    const municipioIndex = headers.findIndex(h =>
      h.includes('municipio') || h.includes('municipality') || h.includes('city')
    );
    if (municipioIndex === -1) throw new Error("No se encontró la columna 'Municipio' en el CSV.");

    // Contar por municipio
    const municipios = {};
    for (let i = 1; i < rows.length; i++) {
      const cols = splitCSVRow(rows[i]);
      const municipio = (cols[municipioIndex] || '').trim();
      if (municipio) municipios[municipio] = (municipios[municipio] || 0) + 1;
    }

    // Orden alfabético
    const lista = Object.entries(municipios).sort((a, b) => a[0].localeCompare(b[0], 'es'));

    // Render
    lista.forEach(([nombre, cantidad]) => createMunicipioCard(container, nombre, cantidad));

  } catch (error) {
    console.error("Error al cargar datos. Mostrando datos de ejemplo:", error);

    // Fallback con ejemplo
    const listaEjemplo = Object.entries(municipiosEjemplo)
      .sort((a, b) => a[0].localeCompare(b[0], 'es'));
    listaEjemplo.forEach(([nombre, data]) => createMunicipioCard(container, nombre, data.cantidad));

    // Mensaje de error
    if (errorMsg) {
      errorMsg.innerHTML = `
        <div class="d-flex align-items-start gap-3">
          <i class="fas fa-exclamation-triangle text-danger mt-1"></i>
          <div>
            <h5 class="mb-1">No se pudieron cargar los datos del CSV</h5>
            <p class="mb-1"><strong>Detalle:</strong> ${error.message}</p>
            <p class="mb-0 small">Se muestran datos de ejemplo temporalmente.</p>
          </div>
        </div>
      `;
      errorMsg.style.display = 'block';
    }
  } finally {
    if (spinner) spinner.style.display = 'none';
  }

  // ------------------------
  // Búsqueda
  // ------------------------
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const term = this.value.toLowerCase();
      const cards = container.querySelectorAll('.municipio-card');
      cards.forEach(card => {
        const name = card.querySelector('h4')?.textContent.toLowerCase() || '';
        card.style.display = name.includes(term) ? 'block' : 'none';
      });
    });
  }

  // ------------------------
  // Toggle Vista (grid/lista)
  // ------------------------
  if (toggleView) {
    const applyView = () => {
      if (toggleView.checked) {
        container.classList.add('municipios-grid');
        container.classList.remove('list-view');
      } else {
        container.classList.remove('municipios-grid');
        container.classList.add('list-view');
      }
    };
    toggleView.addEventListener('change', applyView);
    applyView(); // estado inicial
  }
}

// ------------------------
// Inicialización
// ------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Animaciones
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Cargar datos
  loadMunicipiosData();

  // Logs de errores
  window.addEventListener('error', (e) => console.error('Error capturado:', e.error));
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Promesa rechazada no capturada:', e.reason);
    e.preventDefault();
  });
});

//graficas


// ------------------------
// Configuración inicial
// ------------------------
let chartInstances = {};

// Datos de ejemplo (en caso de que falle la carga del CSV)
const datosEjemplo = {
  municipios: {
    "Pereira": 23,
    "Dosquebradas": 18,
    "Santa Rosa de Cabal": 12,
    "La Virginia": 9,
    "Marsella": 7,
    "Quinchía": 6,
    "Santuario": 6,
    "Belén de Umbría": 5,
    "Pueblo Rico": 4,
    "Mistrató": 4,
    "Guática": 4,
    "Apía": 4,
    "Balboa": 3
  },
  tiposZona: {
    "URBANA": 65,
    "RURAL": 35
  },
  tecnologias: {
    "Radio enlace": 80,
    "Fibra": 15,
    "Satelital": 5
  },
  total: 100
};

// ------------------------
// Inicializar gráficos con datos de ejemplo
// ------------------------
function initCharts(data) {
  // Destruir gráficos existentes
  Object.values(chartInstances).forEach(chart => {
    if (chart) chart.destroy();
  });
  
  // Crear gráficos
  createMunicipioChart(data.municipios);
  createZonaChart(data.tiposZona);
  createTecnologiaChart(data.tecnologias);
  createGeografiaChart(data.municipios);
  
  // Actualizar estadísticas
  updateStats(data);
  
  // Llenar selector de filtros
  populateFilterDropdown(data.municipios);
}

// ------------------------
// Gráfico de municipios (barras)
// ------------------------
function createMunicipioChart(municipiosData) {
  const ctx = document.getElementById('municipio-chart');
  if (!ctx) return;
  
  const sortedData = Object.entries(municipiosData)
    .sort((a, b) => b[1] - a[1]);
  
  const labels = sortedData.map(item => item[0]);
  const data = sortedData.map(item => item[1]);
  
  chartInstances.municipio = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Zonas WiFi',
        data: data,
        backgroundColor: 'rgba(52, 152, 219, 0.7)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Zonas WiFi por Municipio'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Cantidad de zonas'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Municipios'
          }
        }
      },
      animation: {
        duration: document.getElementById('toggle-animation')?.checked ? 1000 : 0
      }
    }
  });
}

// ------------------------
// Gráfico de tipos de zona (dona)
// ------------------------
function createZonaChart(zonasData) {
  const ctx = document.getElementById('zona-chart');
  if (!ctx) return;
  
  chartInstances.zona = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(zonasData),
      datasets: [{
        data: Object.values(zonasData),
        backgroundColor: [
          'rgba(52, 152, 219, 0.7)',
          'rgba(46, 204, 113, 0.7)',
          'rgba(241, 196, 15, 0.7)'
        ],
        borderColor: [
          'rgba(52, 152, 219, 1)',
          'rgba(46, 204, 113, 1)',
          'rgba(241, 196, 15, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      animation: {
        duration: document.getElementById('toggle-animation')?.checked ? 1000 : 0
      }
    }
  });
}

// ------------------------
// Gráfico de tecnologías (polar area)
// ------------------------
function createTecnologiaChart(tecnologiasData) {
  const ctx = document.getElementById('tecnologia-chart');
  if (!ctx) return;
  
  chartInstances.tecnologia = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: Object.keys(tecnologiasData),
      datasets: [{
        data: Object.values(tecnologiasData),
        backgroundColor: [
          'rgba(52, 152, 219, 0.7)',
          'rgba(46, 204, 113, 0.7)',
          'rgba(241, 196, 15, 0.7)',
          'rgba(231, 76, 60, 0.7)',
          'rgba(155, 89, 182, 0.7)'
        ],
        borderColor: [
          'rgba(52, 152, 219, 1)',
          'rgba(46, 204, 113, 1)',
          'rgba(241, 196, 15, 1)',
          'rgba(231, 76, 60, 1)',
          'rgba(155, 89, 182, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      animation: {
        duration: document.getElementById('toggle-animation')?.checked ? 1000 : 0
      }
    }
  });
}

// ------------------------
// Gráfico de distribución geográfica (radar)
// ------------------------
function createGeografiaChart(municipiosData) {
  const ctx = document.getElementById('geografia-chart');
  if (!ctx) return;
  
  const labels = Object.keys(municipiosData);
  const data = Object.values(municipiosData);
  
  chartInstances.geografia = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Zonas WiFi',
        data: data,
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(52, 152, 219, 1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: {
            stepSize: 5
          }
        }
      },
      animation: {
        duration: document.getElementById('toggle-animation')?.checked ? 1000 : 0
      }
    }
  });
}

// ------------------------
// Actualizar estadísticas
// ------------------------
function updateStats(data) {
  const statsContainer = document.getElementById('stats-container');
  if (!statsContainer) return;
  
  const totalZonas = data.total;
  const totalMunicipios = Object.keys(data.municipios).length;
  const maxZonas = Math.max(...Object.values(data.municipios));
  const municipioMax = Object.entries(data.municipios)
    .find(([key, value]) => value === maxZonas)[0];
  
  const porcentajeUrbano = ((data.tiposZona.URBANA / totalZonas) * 100).toFixed(1);
  const tecnologiaPrincipal = Object.entries(data.tecnologias)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  statsContainer.innerHTML = `
    <div class="col-md-4">
      <div class="stat-card">
        <p class="stat-value">${totalZonas}</p>
        <p class="stat-label">Total de zonas WiFi</p>
      </div>
    </div>
    <div class="col-md-4">
      <div class="stat-card">
        <p class="stat-value">${totalMunicipios}</p>
        <p class="stat-label">Municipios con cobertura</p>
      </div>
    </div>
    <div class="col-md-4">
      <div class="stat-card">
        <p class="stat-value">${municipioMax}</p>
        <p class="stat-label">Municipio con más zonas (${maxZonas})</p>
      </div>
    </div>
    <div class="col-md-4">
      <div class="stat-card">
        <p class="stat-value">${porcentajeUrbano}%</p>
        <p class="stat-label">Zonas en áreas urbanas</p>
      </div>
    </div>
    <div class="col-md-4">
      <div class="stat-card">
        <p class="stat-value">${tecnologiaPrincipal}</p>
        <p class="stat-label">Tecnología principal</p>
      </div>
    </div>
    <div class="col-md-4">
      <div class="stat-card">
        <p class="stat-value">20 MG</p>
        <p class="stat-label">Velocidad promedio</p>
      </div>
    </div>
  `;
}

// ------------------------
// Llenar selector de filtros
// ------------------------
function populateFilterDropdown(municipiosData) {
  const filterSelect = document.getElementById('chart-filter');
  if (!filterSelect) return;
  
  // Limpiar opciones existentes
  filterSelect.innerHTML = '<option value="all">Todos los municipios</option>';
  
  // Agregar opciones para cada municipio
  Object.keys(municipiosData).sort().forEach(municipio => {
    const option = document.createElement('option');
    option.value = municipio;
    option.textContent = municipio;
    filterSelect.appendChild(option);
  });
}

// ------------------------
// Inicializar la página
// ------------------------
function initPage() {
  // Inicializar gráficos con datos de ejemplo
  initCharts(datosEjemplo);
  
  // Configurar evento para toggle de animaciones
  const animationToggle = document.getElementById('toggle-animation');
  if (animationToggle) {
    animationToggle.addEventListener('change', function() {
      // Recargar gráficos con la nueva configuración de animación
      initCharts(datosEjemplo);
    });
  }
  
  // Animaciones de entrada
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ------------------------
// Iniciar cuando el DOM esté listo
// ------------------------
document.addEventListener('DOMContentLoaded', initPage);