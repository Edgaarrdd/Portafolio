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
        const topics = Array.isArray(repo.topics) ? repo.topics : [];
        const tags = [...languages, ...topics].slice(0, 8);

        const card = document.createElement('div');
        card.className = 'glass-effect rounded-xl border border-white/10 p-5 hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full';

        const tagsHtml = tags.map(t =>
            `<span class="px-2 py-1 rounded-full text-xs bg-white/10 text-white/80 border border-white/10">#${t}</span>`
        ).join('');

        const safeUrl = repo.html_url && /^https?:\/\//i.test(repo.html_url) ? repo.html_url : '#';

        card.innerHTML = `
            <div class="flex flex-col gap-3 h-full">
                <h3 class="text-white text-xl font-bold tracking-tight break-all">${repo.name}</h3>
                <p class="text-white/70 text-sm">${repo.description || 'No description'}</p>
                <div class="flex flex-wrap gap-2 mt-1">${tagsHtml}</div>
                <div class="flex items-center gap-3 mt-auto">
                    <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" 
                       class="text-primary text-sm font-medium transition-transform duration-300 hover:text-white hover:scale-110">
                       Repositorio
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
