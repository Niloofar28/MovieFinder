import { fetchMoviesByGenre, fetchGenres } from './api.js'; 
import { renderMovieList, showLoading, hideLoading, showError, renderPagination } from './ui.js'; 
import { getGenreNameById, loadCommonComponents, setGenreMap } from './utils.js';

const genreListContainerEl = document.getElementById('genre-list-container');
const movieListContainerEl = document.getElementById('movie-list-container');
const currentGenreTitleEl = document.getElementById('current-genre-title');
const totalTitlesEl = document.getElementById('total-titles');
const paginationContainerId = 'pagination-controls-genre';

let currentGenreId = null;
let currentGenreName = '';
let currentPage = 1;
let totalPages = 1;

function renderGenreSidebar(genres, activeGenreId) {
    if (!genreListContainerEl || !genres) return;
    genreListContainerEl.innerHTML = '';

    genres.forEach(genre => {
        if (!genre || !genre.id || !genre.name) return; 

        const link = document.createElement('a');
        link.href = `genre-results.html?genreId=${genre.id}&genreName=${encodeURIComponent(genre.name)}`; 
        link.classList.add('genre-item');
        
        if (String(genre.id) === String(activeGenreId)) { 
            link.classList.add('active');
        }
        link.textContent = genre.name;
        genreListContainerEl.appendChild(link);
    });
}

async function fetchAndRenderGenreResults(page = 1) {
    window.scrollTo(0, 0); 
    currentPage = page;
    showLoading(movieListContainerEl.id); 
    
    try {
        const { results, total_results, total_pages } = await fetchMoviesByGenre(currentGenreId, currentPage); 
        totalPages = total_pages; 

        if (results && results.length > 0) {
            renderMovieList(results, movieListContainerEl, getGenreNameById); 
            if (totalTitlesEl) {
                totalTitlesEl.textContent = `${total_results.toLocaleString('fa-IR')} عنوان`;
            }
        } else {
            showError('هیچ فیلمی برای این ژانر پیدا نشد.', movieListContainerEl.id);
            if (totalTitlesEl) totalTitlesEl.textContent = '0 عنوان';
        }

        renderPagination(currentPage, totalPages, paginationContainerId, fetchAndRenderGenreResults);

        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('page', currentPage);
        if (currentGenreName && !urlParams.get('genreName')) {
             urlParams.set('genreName', encodeURIComponent(currentGenreName));
        }
        window.history.pushState(null, '', `?${urlParams.toString()}`);

    } catch (error) {
    } finally {
        hideLoading(movieListContainerEl.id);
    }
}

async function loadGenreResultsPage() {

    await loadCommonComponents(); 
    await setGenreMap(); 

    showLoading(movieListContainerEl.id); 

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const genreId = urlParams.get('genreId');
        const genreNameFromUrl = urlParams.get('genreName'); 
        const initialPage = parseInt(urlParams.get('page')) || 1; 

        if (!genreId) {
            showError('شناسه ژانر نامعتبر است. به صفحه خانه بازگردید.', movieListContainerEl.id);
            return;
        }

        currentGenreId = genreId;
        currentGenreName = genreNameFromUrl 
            ? decodeURIComponent(genreNameFromUrl) 
            : getGenreNameById(genreId) || 'ژانر ناشناس'; 
            
        const response = await fetchGenres();
        const genres = response?.genres || []; 
        
        renderGenreSidebar(genres, currentGenreId);
        
        if (currentGenreTitleEl) {
            currentGenreTitleEl.textContent = `نتایج ژانر: ${currentGenreName}`;
        }

        fetchAndRenderGenreResults(initialPage);

    } catch (error) {
        console.error("❌ خطای بارگذاری اولیه نتایج ژانر:", error);
        showError('در بارگذاری اولیه نتایج ژانر خطایی رخ داد.', movieListContainerEl.id);
        hideLoading(movieListContainerEl.id);
    }
}

document.addEventListener('DOMContentLoaded', loadGenreResultsPage);