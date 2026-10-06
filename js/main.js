import { fetchTrendingMovies, searchMovies } from './api.js';
import { renderMovieList, showLoading, hideLoading, showError, renderSearchDropdown, renderPagination } from './ui.js'; 
import { debounce, loadCommonComponents, setGenreMap, getGenreNameById } from './utils.js';

const containerId = 'movies-container'; 
const paginationContainerId = 'pagination-controls-index'; 
const moviesType = 'popular'; 
let currentPage = 1;
let totalPages = 1; 

let searchInput;
let searchForm;
let dropdownContainer;
const trendingContainerId = 'trending-movies-container';

async function fetchAndRenderMovies(page = 1) {
    window.scrollTo(0, 0); 
    currentPage = page;
    showLoading(trendingContainerId); 
    
    try {
        const data = await fetchTrendingMovies(page);
        const { results, total_pages } = data;
        totalPages = total_pages; 

        if (results && results.length > 0) {
            renderMovieList(results, document.getElementById(trendingContainerId), getGenreNameById); 
            renderPagination(currentPage, totalPages, paginationContainerId, fetchAndRenderMovies); 
        } else {
            document.getElementById('empty-state-message').style.display = 'block';
            document.getElementById(trendingContainerId).innerHTML = ''; 
        }

    } catch (error) {
        console.error("❌ خطای بارگذاری فیلم‌های پرطرفدار:", error);
        showError('خطا در بارگذاری فیلم‌ها.', trendingContainerId);
    } finally {
        hideLoading(trendingContainerId);
    }
}

async function handleSearch(query) {
    if (query.length < 3) {
        if (dropdownContainer) dropdownContainer.style.display = 'none';
        return;
    }
    
    if (dropdownContainer) dropdownContainer.innerHTML = '<p class="loading-message">در حال جستجو...</p>';

    try {
        const data = await searchMovies(query, 1);
        if (dropdownContainer) {
            renderSearchDropdown(data.results, dropdownContainer.id);
        }
        
    } catch (error) {
        console.error("❌ خطای جستجوی زنده:", error);
        if (dropdownContainer) {
            dropdownContainer.innerHTML = '<p class="error-message">خطا در جستجو.</p>';
        }
    }
}

function initListeners() {
    searchInput = document.getElementById('search-input');
    searchForm = document.getElementById('search-form');
    dropdownContainer = document.getElementById('search-results-dropdown'); 
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            handleSearch(e.target.value.trim());
        }, 300)); 

        document.addEventListener('click', (e) => {
            if (dropdownContainer && !dropdownContainer.contains(e.target) && e.target !== searchInput) {
                dropdownContainer.style.display = 'none';
            }
        });
        
        searchInput.addEventListener('focus', (e) => {
             if (e.target.value.trim().length >= 3 && dropdownContainer.innerHTML !== '') {
                 dropdownContainer.style.display = 'block';
             }
        });
    }

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `search-results.html?query=${encodeURIComponent(query)}`;
            }
        });
    }
}

async function init() {
    await loadCommonComponents(); 
    await setGenreMap(); 
    // شروع بارگذاری فیلم‌های پرطرفدار (با قابلیت صفحه‌بندی)
    fetchAndRenderMovies(1); 
    initListeners();
}

document.addEventListener('DOMContentLoaded', init);