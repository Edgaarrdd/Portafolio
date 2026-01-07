const GITHUB_USERNAME = 'Edgaarrdd';
const CACHE_KEY = 'github_projects_cache';
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour

// --- Cache Management ---
const Cache = {
    get() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > CACHE_EXPIRY) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    },
    set(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data,
                timestamp: Date.now(),
            }));
        } catch (e) {
            console.warn('Cache storage failed:', e);
        }
    }
};

// --- API Interaction ---
async function fetchGitHubProjects(username) {
    const endpoint = `https://api.github.com/users/${username}/repos?per_page=24&sort=updated`;
    const response = await fetch(endpoint, {
        headers: { Accept: 'application/vnd.github+json' },
    });

    if (!response.ok) {
        if (response.status === 404) throw new Error(`User "${username}" not found.`);
        if (response.status === 403) {
            const cached = Cache.get();
            if (cached) {
                console.warn('API limit reached, using cached data.');
                return cached;
            }
            throw new Error('API rate limit reached.');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

async function fetchRepoLanguages(fullName) {
    try {
        const response = await fetch(`https://api.github.com/repos/${fullName}/languages`, {
            headers: { Accept: 'application/vnd.github+json' },
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Object.keys(data);
    } catch {
        return [];
    }
}

// --- Logic ---
function pickRepos(repos) {
    // Simply pick the first 6 non-fork repositories
    return repos.filter((r) => !r.fork).slice(0, 6);
}

function renderProjects(repos) {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    if (!repos || repos.length === 0) {
        grid.innerHTML = '<p class="text-white/70">No projects to display.</p>';
        return;
    }

    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    repos.forEach((repo) => {
        const languages = Array.isArray(repo.languages) ? repo.languages : (repo.language ? [repo.language] : []);
        const lastUpdated = new Date(repo.updated_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

        // Card wrapper
        const card = document.createElement('article');
        card.className = 'group relative w-full h-[350px] rounded-xl shadow-lg overflow-hidden border border-white/10 bg-[#0D1117]';

        const safeUrl = repo.html_url && /^https?:\/\//i.test(repo.html_url) ? repo.html_url : '#';

        card.innerHTML = `
            <!-- Cover Image / Gradient Area (Height 260px) -->
            <div class="h-[260px] w-full bg-linear-to-br from-primary/30 via-background-dark to-background-dark flex items-center justify-center">
                 <!-- Optional: Icon or Abstract Pattern in background -->
                 <div class="opacity-30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                    </svg>
                 </div>
            </div>
            
            <!-- Sliding Content (Height 350px) -->
            <div class="bg-background-dark/95 backdrop-blur-md w-full h-[350px] p-6 absolute top-[260px] left-0 transition-transform duration-500 ease-[cubic-bezier(0.17,0.67,0.5,1.03)] group-hover:-translate-y-[260px]">
              
              <!-- Title (Always Visible) -->
              <h2 class="relative mb-1 text-white text-lg font-bold tracking-tight truncate">
                ${repo.name}
                <!-- Language Flag/Indicator -->
                <span class="absolute top-1/2 right-0 -translate-y-1/2 text-xs font-normal text-primary/80 bg-primary/10 px-2 py-0.5 rounded">
                    ${languages[0] || 'Code'}
                </span>
              </h2>
              
              <!-- Subtitle (Always Visible) -->
              <h3 class="mb-4 text-white/60 text-xs font-medium">
                Updated: ${lastUpdated}
              </h3>
              
              <!-- Hidden Content (Reveals on Hover) -->
              <div class="opacity-0 transition-opacity duration-500 delay-200 group-hover:opacity-100 flex flex-col h-[230px]">
                  
                  <!-- Stats Row -->
                  <h3 class="mb-4 pb-4 border-b border-white/10 text-white/50 text-xs flex items-center justify-between">
                    <span>Stars: ${repo.stargazers_count}</span>
                    <span>Forks: ${repo.forks_count}</span>
                  </h3>
                  
                  <!-- Description -->
                  <p class="text-white/80 text-sm leading-relaxed mb-4 line-clamp-4">
                    ${repo.description || 'Sin descripción disponible.'}
                  </p>
                  
                  <!-- Link Button -->
                  <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" 
                     class="mt-auto inline-block text-primary text-sm font-bold hover:text-white transition-colors">
                    Ver Repositorio &rarr;
                  </a>
              </div>
              
            </div>
        `;
        fragment.appendChild(card);
    });
    grid.appendChild(fragment);
}

async function initProjects() {
    try {
        let enrichedRepos = Cache.get();
        if (enrichedRepos) {
            renderProjects(enrichedRepos);
            return;
        }

        const repos = await fetchGitHubProjects(GITHUB_USERNAME);
        const selected = pickRepos(repos);

        if (selected.length === 0) {
            const grid = document.getElementById('projects-grid');
            if (grid) grid.innerHTML = '<p class="text-white/70">No matching projects found.</p>';
            return;
        }

        // Parallel language fetching
        const languagesByRepo = await Promise.all(selected.map(r => fetchRepoLanguages(r.full_name)));
        enrichedRepos = selected.map((r, i) => ({ ...r, languages: languagesByRepo[i] }));

        Cache.set(enrichedRepos);
        renderProjects(enrichedRepos);
    } catch (e) {
        console.error('Project load failed:', e);
        const grid = document.getElementById('projects-grid');
        if (grid) grid.innerHTML = `<p class="text-white/70">Error loading projects: ${e.message}</p>`;
    }
}

// --- Nav Animation ---
const MAX_SCROLL = 600;
let navElement = null;

function handleNavScroll() {
    if (!navElement) {
        navElement = document.getElementById('main-nav');
        if (!navElement) return;
    }

    const currentScroll = Math.min(window.scrollY, MAX_SCROLL);
    const progress = currentScroll / MAX_SCROLL; // 0 to 1

    // Initialize dimensions on first run or after reset
    if (!navElement.dataset.initialWidth) {
        navElement.dataset.initialWidth = String(navElement.offsetWidth);

        // Temporarily apply fit-content to measure min width
        const originalWidth = navElement.style.width;
        navElement.style.width = 'fit-content';
        navElement.dataset.minWidth = String(navElement.offsetWidth);
        navElement.style.width = originalWidth; // Restore
    }

    const maxW = parseFloat(navElement.dataset.initialWidth);
    const minW = parseFloat(navElement.dataset.minWidth);

    // 1. Width
    const newWidth = maxW - (progress * (maxW - minW));
    navElement.style.width = `${newWidth}px`;

    // 2. Background Opacity (0.05 -> 0.9)
    const bgOpacity = 0.05 + (progress * 0.85);
    navElement.style.backgroundColor = `rgba(255, 255, 255, ${bgOpacity})`;

    // 3. Backdrop Blur
    navElement.style.backdropFilter = `blur(${12 + (progress * 4)}px)`;

    // 4. Border Color (White/10 -> Black/10)
    const shade = Math.round(255 * (1 - progress));
    navElement.style.borderColor = `rgba(${shade}, ${shade}, ${shade}, 0.1)`;

    // 5. Text Color (White -> Black)
    navElement.style.setProperty('--nav-text-color', `rgb(${shade}, ${shade}, ${shade})`);
}

// Optimization: use requestAnimationFrame for scroll events
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            handleNavScroll();
            ticking = false;
        });
        ticking = true;
    }
});

window.addEventListener('resize', () => {
    if (navElement) {
        delete navElement.dataset.initialWidth;
        delete navElement.dataset.minWidth;
        navElement.style.width = '';
        handleNavScroll();
    }
});

// Start
initProjects();
handleNavScroll();
