async function loadComponent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load component: ${url} (Status: ${response.status})`);
        }
        return response.text();
    } catch (error) {
        console.error("❌ خطای بارگذاری کامپوننت:", error);
        return null;
    }
}

export function debounce(func, delay = 500) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

export function formatRating(vote_average) {
    return (vote_average / 2).toFixed(1);
}

export function formatRuntime(runtime) {
    if (!runtime || runtime <= 0) return 'نامشخص';
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    
    let timeStr = '';
    if (hours > 0) {
        timeStr += `${hours.toLocaleString('fa-IR')} ساعت `;
    }
    if (minutes > 0) {
        timeStr += `${minutes.toLocaleString('fa-IR')} دقیقه`;
    }
    return timeStr.trim();
}

export function formatReleaseDate(dateString) {
    if (!dateString) return 'نامشخص';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        return dateString;
    }
}

export function formatYear(dateString) {
    if (!dateString) return 'نامشخص';
    try {
        const date = new Date(dateString);
        return date.getFullYear().toLocaleString('fa-IR');
    } catch (e) {
        return 'نامشخص';
    }
}


let genreMap = new Map(); // نقشه ژانرها

export async function setGenreMap() {
    try {
        const { fetchGenres } = await import('./api.js'); 
        const response = await fetchGenres();
        const genres = response?.genres || [];
        
        genreMap.clear();
        genres.forEach(genre => {
            if (genre && genre.id && genre.name) {
                genreMap.set(Number(genre.id), genre.name);
            }
        });
    } catch (error) {
        console.error("❌ خطای بارگذاری نقشه ژانر:", error);
    }
}

export function getGenreNameById(id) {
    if (typeof id === 'string') id = Number(id);
    if (typeof id !== 'number') return null;
    return genreMap.get(id) || null;
}

export function getGenreNames(genreIds, getNameFn = getGenreNameById) {
 
    if (!Array.isArray(genreIds) || genreIds.length === 0 || typeof getNameFn !== 'function') {
        return []; 
    }

    const genreNames = genreIds
        .map(id => getNameFn(id))
        .filter(name => name);

    return genreNames; 
}

export async function loadCommonComponents() {
    const headerEl = document.querySelector('header.main-header');
    const footerEl = document.querySelector('footer.main-footer');

    if (headerEl) {
        const headerHtml = await loadComponent('components/header.html');
        if (headerHtml) {
            headerEl.innerHTML = headerHtml;
            try {
                const headerModule = await import('./header.js');
                if (headerModule.initHeaderLogic) {
                    headerModule.initHeaderLogic();
                } else {
                     console.error("❌ initHeaderLogic در header.js تعریف نشده است.");
                }
            } catch (error) {
                console.error("❌ خطای بارگذاری و اجرای header.js:", error);
            }
        }
    }
    
    if (footerEl) {
        const footerHtml = await loadComponent('components/footer.html');
        if (footerHtml) {
            footerEl.innerHTML = footerHtml;
        }
    }
}

export function extractCredits(credits) {
    if (!credits || !credits.crew || !credits.cast) {
        return { director: 'N/A', writers: 'N/A', stars: 'N/A' }; 
    }

    const director = credits.crew.find(c => c.job === 'Director');
    
    const writers = credits.crew
        .filter(c => c.job === 'Writer' || c.job === 'Screenplay' || c.department === 'Writing')
        .map(c => c.name)
        .slice(0, 3) 
        .join(', ');

    const stars = credits.cast
        .slice(0, 3) 
        .map(c => c.name)
        .join(', ');

    return { 
        director: director ? director.name : 'نامشخص', 
        writers: writers || 'نامشخص', 
        stars: stars || 'نامشخص'
    };
}