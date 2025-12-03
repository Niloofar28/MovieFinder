import { fetchMovieDetails } from './api.js';
import { showLoading, hideLoading, showError } from './ui.js'; 
import { loadCommonComponents, formatRating, formatRuntime, extractCredits, formatReleaseDate, getGenreNameById, setGenreMap } from './utils.js'; 

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const DEFAULT_POSTER = './assets/images/placeholder.jpg';
const DEFAULT_ACTOR_PROFILE = '../imges/placeholder-actor.jpg'; 

function renderCast(castList, castContainerEl) {
    if (!castContainerEl || !castList || castList.length === 0) return;

    const topCast = castList.slice(0, 10); 
    castContainerEl.innerHTML = ''; 

    topCast.forEach(actor => {

        const profilePath = actor.profile_path ? `${IMAGE_BASE_URL}w185${actor.profile_path}` : DEFAULT_ACTOR_PROFILE;
        
        const actorCard = document.createElement('div');
        actorCard.classList.add('cast-card');
        actorCard.innerHTML = `
            <img src="${profilePath}" alt="${actor.name}" class="cast-profile-img">
            <div class="cast-info">
                <p class="cast-name">${actor.name || 'N/A'}</p>
                <p class="cast-character">${actor.character || 'N/A'}</p>
            </div>
        `;
        castContainerEl.appendChild(actorCard);
    });
}

function renderDetails(movieData, detailsContainerEl, castContainerEl) {
    if (!movieData || !detailsContainerEl) return;

    const rating = formatRating(movieData.vote_average);
    const runtime = formatRuntime(movieData.runtime);
    const releaseDateFa = formatReleaseDate(movieData.release_date);
    const { director, writers, stars } = extractCredits(movieData.credits);
    const genresList = movieData.genres?.map(genre => getGenreNameById(genre.id)).join(' / ') || 'N/A';
    const posterPath = movieData.poster_path ? `${IMAGE_BASE_URL}w500${movieData.poster_path}` : DEFAULT_POSTER;
    const backdropPath = movieData.backdrop_path ? `${IMAGE_BASE_URL}original${movieData.backdrop_path}` : '';

    renderCast(movieData.credits?.cast, castContainerEl);
    
    detailsContainerEl.innerHTML = `
        <div class="backdrop-image" style="background-image: url('${backdropPath}');"></div>

        <div class="movie-details-grid container">
            
            <div class="poster-column">
                <img src="${posterPath}" alt="${movieData.title}" class="details-poster">
                
                <div class="rating-box">
                    <p class="rating-score">⭐️ ${rating} / 5</p>
                    <p class="rating-votes">(${movieData.vote_count?.toLocaleString('en-US')} Vote)</p>
                </div>
                
                <a href="${movieData.homepage || '#'}" target="_blank" class="watch-trailer-btn">Trailer</a>
            </div>

            <div class="info-column">
                <h1 class="movie-title-details">${movieData.title || 'N/A'}</h1>
                <p class="movie-tagline">${movieData.tagline || ''}</p>
                
                <div class="details-meta-row">
                    <span class="gennre-1">ژانر: ${genresList}</span>
                    <span>زمان: ${runtime}</span>
                    
                    <span>تاریخ انتشار: ${releaseDateFa}</span>
                </div>
                
                <h2 class="subtitle">Plot:</h2>
                <p class="movie-overview">${movieData.overview || 'خلاصه‌ای موجود نیست.'}</p>
                
                <div class="details-crew-table">
                    <div class="crew-item">
                        <span class="crew-role">Director: </span>
                        <span class="crew-name">${director}</span>
                    </div>
                    <div class="crew-item">
                        <span class="crew-role">Writers:</span>
                        <span class="crew-name">${writers}</span>
                    </div>
                    <div class="crew-item">
                        <span class="crew-role">Stars: </span>
                        <span class="crew-name">${stars}</span>
                    </div>
                </div>

                <div class="details-financial">
                    <div class="financial-item">
                        <span class="financial-role">Budget: </span>
                        <span class="financial-value">${movieData.budget?.toLocaleString('en-US') || 'N/A'}$ </span>
                    </div>
                    <div class="financial-item">
                        <span class="financial-role">Income: </span>
                        <span class="financial-value">${movieData.revenue?.toLocaleString('en-US') || 'N/A'}$ </span>
                    </div>
                </div>

            </div>
        </div>
    `;
}

async function loadMovieDetails() {
    
    const detailsContainerEl = document.getElementById('details-container'); 
    const castContainerEl = document.getElementById('cast-container');
    const loadingIndicatorEl = document.getElementById('loading-indicator');

    if (!detailsContainerEl) {
        console.error("❌ Main movie details container element not found. ID: 'details-container'");
        return;
    }
    
    await loadCommonComponents(); 
    await setGenreMap();

    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (!movieId) {
        showError('شناسه فیلم نامعتبر است. به صفحه خانه بازگردید.', detailsContainerEl.id);
        return;
    }

    if (loadingIndicatorEl) {
        loadingIndicatorEl.style.display = 'flex';
    } else {
        showLoading(detailsContainerEl.id);
    }
    
    try {
        const movieData = await fetchMovieDetails(movieId);
        renderDetails(movieData, detailsContainerEl, castContainerEl);
        
    } catch (error) {
        console.error("❌ خطای دریافت داده‌های جزئیات فیلم:", error);
        showError('در بارگذاری جزئیات فیلم خطایی رخ داد. (اتصال API یا ID فیلم)', detailsContainerEl.id);
    } finally {
        if (loadingIndicatorEl) {
            loadingIndicatorEl.style.display = 'none';
        } else {
            hideLoading(detailsContainerEl.id);
        }
    }
}

document.addEventListener('DOMContentLoaded', loadMovieDetails);