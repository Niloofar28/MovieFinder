import { formatRating, getGenreNames, formatYear } from './utils.js'; 

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const DEFAULT_POSTER = './imges/placeholder.jpg';
const DEFAULT_ACTOR_PROFILE = './imges/placeholder-actor.jpg'; 

export function showLoading(containerId) {
    const container = document.getElementById(containerId);
    const loadingEl = document.getElementById('loading-indicator');
    const errorEl = document.getElementById('error-message');
    const emptyEl = document.getElementById('empty-state-message'); 

    if (loadingEl) loadingEl.style.display = 'flex';
    if (errorEl) errorEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'none';
    if (container) container.style.display = 'none';
}
export function hideLoading() {
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) loadingEl.style.display = 'none';
}

export function showError(message, containerId) {
    const errorEl = document.getElementById('error-message');
    const container = document.getElementById(containerId);
    
    if (container) container.style.display = 'none'; 
    hideLoading(); 

    if (errorEl) {
        errorEl.querySelector('p').textContent = message;
        errorEl.style.display = 'block'; 
    } else {
        console.error("❌ UI Error:", message);
        if (container && container.parentNode) {
             container.parentNode.innerHTML = `<div class="status-message error-state"><p>${message}</p></div>`;
        } else if (container) {
             container.innerHTML = `<p class="error-message-inline">${message}</p>`;
        }
    }
}

function createMovieCard(movie, getGenreNameById) {
    const genreNamesArray = getGenreNames(movie.genre_ids, getGenreNameById);
    const genresText = genreNamesArray.length > 0
        ? genreNamesArray.join('، ')
        : 'نامشخص';

    const card = document.createElement('div');
    card.classList.add('movie-card');
    card.setAttribute('data-movie-id', movie.id);

    const posterPath = movie.poster_path ? `${IMAGE_BASE_URL}w342${movie.poster_path}` : DEFAULT_POSTER;

    card.innerHTML = `
        <a href="details.html?id=${movie.id}">
            <img src="${posterPath}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <span class="movie-year">${formatYear(movie.release_date)}</span>
                <div class="movie-rating-container">
                    <span class="movie-rating">${formatRating(movie.vote_average)}</span>
                    <i class="fas fa-star rating-star"></i>
                </div>
                <p class="movie-genres">${genresText}</p>
            </div>
        </a>
    `;
    return card;
}


function renderMovieCard(movie, getGenreNameById) {
    const card = document.createElement('div');
    card.classList.add('movie-card');

    const posterPath = movie.poster_path 
        ? `${IMAGE_BASE_URL}w342${movie.poster_path}` 
        : DEFAULT_POSTER;

    const title = movie.title || 'عنوان نامشخص';
    const releaseDate = movie.release_date || '';
    const year = formatYear(releaseDate);
    const rating = formatRating(movie.vote_average);

    const genreNames = getGenreNames(movie.genre_ids, getGenreNameById);

    card.innerHTML = `
        <a href="details.html?id=${movie.id}">
            <img src="${posterPath}" alt="${title}" class="movie-poster">
        </a>
        
        <div class="movie-details-bottom">
            <a href="details.html?id=${movie.id}" class="movie-title-link">
                <h3 class="movie-title">${title}</h3>
            </a>
            
            <span class="movie-genre">${genreNames}</span>
            
            <span class="movie-year">${year}</span>
            
            <div class="movie-meta-bar-footer">
                <span class="movie-rating">⭐️ ${rating}</span>
                
                <a href="details.html?id=${movie.id}" class="view-info-btn">
                    View Info
                </a>
            </div>
        </div>
    `;

    return card;
}

export function renderMovieList(movies, containerEl, getGenreNameById) {
    if (!containerEl) return;
    containerEl.innerHTML = '';
    
    if (!movies || movies.length === 0) {
        return; 
    }

    movies.forEach(movie => {
        const card = renderMovieCard(movie, getGenreNameById);
        containerEl.appendChild(card);
    });

    containerEl.style.display = 'grid'; 
}

export function renderGenresForDropdown(genres, containerId) {
    const containerEl = document.getElementById(containerId);
    if (!containerEl) return;

    containerEl.classList.add('dropdown-menu-scrollable'); 
    containerEl.innerHTML = '';

    genres.forEach(genre => {
        const link = document.createElement('a');
        link.href = `genre-results.html?genreId=${genre.id}&genreName=${encodeURIComponent(genre.name)}`;
        link.textContent = genre.name;
        link.classList.add('dropdown-item'); 

        containerEl.appendChild(link);
    });
    
    containerEl.style.display = 'flex'; 
}

export function renderGenreList(genres, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    container.style.display = 'grid'; 

    genres.forEach(genre => {
        if (!genre || !genre.id || !genre.name) return;
        
        const genreCard = document.createElement('a');
        genreCard.classList.add('genre-card');
        genreCard.href = `genre-results.html?genreId=${genre.id}&genreName=${encodeURIComponent(genre.name)}`; 

        const title = document.createElement('h3');
        title.classList.add('genre-title');
        title.textContent = genre.name;

        genreCard.appendChild(title);

        container.appendChild(genreCard);
    });
}

export function toggleDropdown(menuId, show) {
    const menu = document.getElementById(menuId);
    if (menu) {
        menu.style.display = show ? 'block' : 'none';
    }
}

export function renderSearchDropdown(results, containerId) {
    const containerEl = document.getElementById(containerId);
    if (!containerEl) return;

    containerEl.innerHTML = '';
    containerEl.style.display = 'block'; 

    if (!results || results.length === 0) {
        containerEl.innerHTML = '<p class="no-results-message">نتیجه‌ای یافت نشد.</p>';
        return;
    }

    const topResults = results.slice(0, 5); 

    topResults.forEach(movie => {
        const item = document.createElement('a');
        item.href = `details.html?id=${movie.id}`; 
        item.classList.add('search-dropdown-item');
        
        const title = movie.title || 'عنوان نامشخص';
        const year = movie.release_date ? `(${formatYear(movie.release_date)})` : '';
        const posterPath = movie.poster_path 
            ? `${IMAGE_BASE_URL}w92${movie.poster_path}` 
            : DEFAULT_POSTER;
        
        item.innerHTML = `
            <img src="${posterPath}" alt="${title}" class="search-item-image"> 
            <div class="search-item-info">
                <span>${title} ${year}</span>
                <span class="search-rating">⭐️ ${formatRating(movie.vote_average)}</span>
            </div>
        `;
        
        containerEl.appendChild(item);
    });
    
    if (results.length > topResults.length) {
        const query = document.getElementById('search-input').value.trim();
        if (query) {
            const allResultsLink = document.createElement('a');
            allResultsLink.href = `search-results.html?query=${encodeURIComponent(query)}`;
            allResultsLink.classList.add('search-dropdown-item', 'all-results-link');
            allResultsLink.textContent = `مشاهده تمام ${results.length} نتیجه...`;
            containerEl.appendChild(allResultsLink);
        }
    }
}

const MAX_VISIBLE_PAGES = 5; 

function createPaginationItem(page, currentPage, onPageChange) {
    const item = document.createElement('li');

    if (page === 'dots') {
        item.classList.add('pagination-dots');
        item.textContent = '...';
        return item;
    }

    const button = document.createElement('button');
    button.textContent = page;
    button.classList.add('page-btn');
    button.dataset.page = page;

    if (page === currentPage) {
        button.classList.add('active-page', 'active-custom'); 
    }

    button.addEventListener('click', () => {
        onPageChange(page); 
    });

    item.appendChild(button);
    return item;
}
export function renderPagination(currentPage, totalPages, containerId, onPageChange) {
    const containerEl = document.getElementById(containerId);
    if (!containerEl) {
        console.error(`❌ کانتینر صفحه‌بندی با ID: ${containerId} یافت نشد.`);
        return;
    }

    if (totalPages <= 1) {
        containerEl.style.display = 'none';
        containerEl.innerHTML = '';
        return;
    }

    containerEl.style.display = 'flex';
    containerEl.innerHTML = ''; 
    
    const paginationList = document.createElement('ul');
    paginationList.classList.add('pagination-list');
    const prevButton = document.createElement('button');
    prevButton.classList.add('nav-btn', 'prev-btn');
    prevButton.innerHTML = '«';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    });
    containerEl.appendChild(prevButton);
    paginationList.appendChild(createPaginationItem(1, currentPage, onPageChange));

    let pages = [];
    const maxPagesToShow = 7; 
    const boundary = 2; 
    
    if (totalPages > maxPagesToShow) {
        let start = Math.max(2, currentPage - boundary);
        let end = Math.min(totalPages - 1, currentPage + boundary);
        if (currentPage - 1 < boundary + 1) { 
            end = Math.min(totalPages - 1, maxPagesToShow - 2);
        } else if (totalPages - currentPage < boundary + 1) { 
            start = Math.max(2, totalPages - (maxPagesToShow - 2));
        }

        if (start > 2) pages.push('dots');
        for (let i = start; i <= end; i++) {
            if (i > 1 && i < totalPages) pages.push(i);
        }
        if (end < totalPages - 1) pages.push('dots');

    } else {
        for (let i = 2; i < totalPages; i++) pages.push(i);
    }
    
    if (totalPages > 1 && !pages.includes(totalPages)) {
        pages.push(totalPages);
    }
    
    pages.forEach(page => {
        paginationList.appendChild(createPaginationItem(page, currentPage, onPageChange));
    });
    containerEl.appendChild(paginationList);
    const nextButton = document.createElement('button');
    nextButton.classList.add('nav-btn', 'next-btn');
    nextButton.innerHTML = '»';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    });
    containerEl.appendChild(nextButton);
}