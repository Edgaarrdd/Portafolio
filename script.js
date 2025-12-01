
const GITHUB_USERNAME = 'Edgaarrdd';
const CACHE_KEY = 'github_projects_cache';
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hora en milisegundos

// Funciones de caché, para evitar sobrecargar la API de GitHub
function getCachedData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY); // Obtiene datos del localStorage
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY); // Elimina datos del localStorage
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}
// Función para guardar datos en caché
function setCachedData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ //stringify convierte el objeto a string
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('No se pudo guardar en caché:', e);
  }
}
// Función para obtener los repositorios de GitHub
async function fetchGitHubProjects(username) {
  const endpoint = `https://api.github.com/users/${username}/repos?per_page=24&sort=updated`;
  try {
    const response = await fetch(endpoint, { // Realiza la solicitud a la API de GitHub
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });
    if (!response.ok) { // Si la respuesta no es exitosa
      let errorMessage = 'No se pudieron cargar los repositorios';
      if (response.status === 404) { // Si el usuario no existe
        errorMessage = `Usuario "${username}" no encontrado en GitHub. Verifica que el nombre de usuario sea correcto.`;
      } else if (response.status === 403) { // Si se excede el límite de solicitudes
        // Si hay datos en caché, los devolvemos en lugar de lanzar error
        const cached = getCachedData();
        if (cached) {
          console.warn('Límite de API alcanzado, usando datos del caché');
          return cached;
        }
        errorMessage = 'Límite de solicitudes a la API de GitHub alcanzado. Los datos se actualizarán cuando el límite se resetee (en aproximadamente 1 hora).';
      } else {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    // Guardar en caché se hace después de enriquecer con lenguajes
    return data;
  } catch (error) {
    if (error.message) {
      throw error;
    }
    throw new Error(`Error de red: ${error.message || 'No se pudo conectar con GitHub'}`);
  }
}
// Función para obtener los lenguajes de un repositorio
async function fetchRepoLanguages(fullName) {
  const endpoint = `https://api.github.com/repos/${fullName}/languages`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Object.keys(data); // object.keys() devuelve un array con las claves del objeto
}

// Lista de repos destacados.
const FEATURED_REPOS = [

];

function pickRepos(repos) {
  const nonForks = repos.filter((r) => !r.fork);
  if (FEATURED_REPOS.length > 0) {
    const byName = new Map(nonForks.map((r) => [r.name.toLowerCase(), r]));
    const selected = FEATURED_REPOS
      .map((name) => byName.get(String(name).toLowerCase()))
      .filter(Boolean);
    return selected.slice(0, 5);
  }
  return nonForks.slice(0, 6);
}
// Renderiza los proyectos en el grid.
function renderProjects(repos) {
  const grid = document.getElementById('projects-grid');
  if (!grid) {
    console.error('No se encontró el elemento projects-grid');
    return;
  }
  if (!repos || repos.length === 0) {
    grid.innerHTML = '<p class="text-white/70">No hay proyectos para mostrar.</p>';
    return;
  }
  grid.innerHTML = '';
  repos.forEach((repo) => {
    // Recorre los repositorios y crea el HTML para cada uno.
    const description = repo.description || 'Sin descripción';
    const homepage = repo.homepage && repo.homepage.trim() !== '' ? repo.homepage : null;
    const topics = Array.isArray(repo.topics) ? repo.topics : [];
    const languages = Array.isArray(repo.languages) ? repo.languages : (repo.language ? [repo.language] : []);

    const card = document.createElement('div');
    card.className = 'glass-effect rounded-xl border border-white/10 p-5 hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full';

    // Crear elementos de forma segura usando métodos del DOM en lugar de innerHTML para contenido de usuario
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'flex flex-col gap-3 h-full';

    const title = document.createElement('h3');
    title.className = 'text-white text-xl font-bold tracking-tight break-words';
    title.textContent = repo.name;

    const desc = document.createElement('p');
    desc.className = 'text-white/70 text-sm';
    desc.textContent = description;

    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'flex flex-wrap gap-2 mt-1';

    [...languages, ...topics].slice(0, 8).forEach(t => {
      const tag = document.createElement('span');
      tag.className = 'px-2 py-1 rounded-full text-xs bg-white/10 text-white/80 border border-white/10';
      tag.textContent = `#${t}`;
      tagsContainer.appendChild(tag);
    });

    const linksContainer = document.createElement('div');
    linksContainer.className = 'flex items-center gap-3 mt-auto';

    const repoLink = document.createElement('a');
    repoLink.className = 'text-primary text-sm font-medium transition-transform duration-300 hover:text-white hover:scale-110 ';
    repoLink.href = repo.html_url;
    repoLink.target = '_blank';
    repoLink.rel = 'noreferrer';
    repoLink.textContent = 'Repositorio';
    linksContainer.appendChild(repoLink);


    contentWrapper.appendChild(title);
    contentWrapper.appendChild(desc);
    contentWrapper.appendChild(tagsContainer);
    contentWrapper.appendChild(linksContainer);
    card.appendChild(contentWrapper);

    grid.appendChild(card);
  });
}
// Inicializa los proyectos.
async function initProjects() {
  try {
    console.log('Iniciando carga de proyectos para:', GITHUB_USERNAME);

    // Primero intentar obtener del caché
    let enrichedRepos = getCachedData();

    if (enrichedRepos) {
      console.log('Usando datos del caché local');
      renderProjects(enrichedRepos);
      return;
    }

    console.log('No hay datos en caché, solicitando a la API');
    const repos = await fetchGitHubProjects(GITHUB_USERNAME);

    console.log('Repositorios obtenidos:', repos.length);
    const selected = pickRepos(repos);
    console.log('Repositorios seleccionados:', selected.length);
    // Si no hay repositorios seleccionados, mostrar mensaje
    if (selected.length === 0) {
      const grid = document.getElementById('projects-grid');
      if (grid) {
        grid.innerHTML = '<p class="text-white/70">No se encontraron proyectos destacados. Verifica que los nombres en FEATURED_REPOS coincidan con tus repositorios.</p>';
      }
      return;
    }

    const languagesByRepo = await Promise.all(selected.map((r) => fetchRepoLanguages(r.full_name)));
    enrichedRepos = selected.map((r, i) => ({ ...r, languages: languagesByRepo[i] }));
    console.log('Proyectos enriquecidos:', enrichedRepos.length);

    // Guardar en caché los datos YA ENRIQUECIDOS con lenguajes
    setCachedData(enrichedRepos);

    renderProjects(enrichedRepos);
  } catch (e) {
    console.error('Error al cargar proyectos:', e);
    const grid = document.getElementById('projects-grid');
    if (grid) {
      grid.innerHTML = `<p class="text-white/70">Error al cargar los proyectos: ${e.message}</p>`;
    }
  }
}
// Función para manejar el scroll del nav 
function handleNavScroll() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  // Selecciona el método 'add' si window.scrollY <= 50, o 'remove' si no
  const action = window.scrollY <= 50 ? 'add' : 'remove';

  // Aplica el método seleccionado (add o remove) a la lista de clases
  nav.classList[action]('opacity-0', '-translate-y-full', 'pointer-events-none');
}
// Evento para cargar proyectos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  initProjects();
  handleNavScroll();
  window.addEventListener('scroll', handleNavScroll);
});