import { searchMovies, fetchMoviesByGenre } from './api.js';
import { renderMovieList, renderPagination, showLoading, hideLoading, showError } from './ui.js';

const resultsContainerId = 'search-results-container';
const paginationContainerId = 'pagination-container';
const resultsTitleEl = document.getElementById('results-title');

let currentQuery = '';
let currentGenreId = '';

async function fetchAndRenderResults(page = 1) {
    showLoading(resultsContainerId);
    
    try {
        let data;
        if (currentQuery) {
            data = await searchMovies(currentQuery, page);
            resultsTitleEl.textContent = `نتایج جستجو برای: "${currentQuery}"`;
        } else if (currentGenreId) {
            data = await fetchMoviesByGenre(currentGenreId, page);
            resultsTitleEl.textContent = `فیلم‌های ژانر با شناسه: ${currentGenreId}`; 
        } else {
            showError('لطفا یک عبارت جستجو یا ژانر را مشخص کنید.', resultsContainerId);
            return;
        }

        renderMovieList(data.results, resultsContainerId, true);
        renderPagination(data.page, data.total_pages, paginationContainerId);

    } catch (error) {
        showError('در دریافت نتایج جستجو خطایی رخ داد. لطفا دوباره تلاش کنید.', resultsContainerId);
    } finally {
        hideLoading(resultsContainerId);
    }
}

function setupPaginationListener() {
    const paginationContainer = document.getElementById(paginationContainerId);
    paginationContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.page-btn');
        if (btn) {
            const newPage = parseInt(btn.dataset.page);
            if (newPage) {
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('page', newPage);
                window.history.pushState(null, '', `?${urlParams.toString()}`);
                fetchAndRenderResults(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentQuery = urlParams.get('query') || '';
    currentGenreId = urlParams.get('genreId') || '';
    const initialPage = parseInt(urlParams.get('page')) || 1;
    
    setupPaginationListener();
    fetchAndRenderResults(initialPage);
});