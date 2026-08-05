// seriesData.js
// A small curated dataset of well-known series tagged with genre/tone.
// Recommendation = highest genre overlap with the chosen title (excluding itself).

const series = [
  { title: 'Breaking Bad', genres: ['crime', 'drama', 'thriller'] },
  { title: 'Better Call Saul', genres: ['crime', 'drama', 'legal'] },
  { title: 'The Wire', genres: ['crime', 'drama', 'urban'] },
  { title: 'Ozark', genres: ['crime', 'drama', 'thriller'] },
  { title: 'Fargo', genres: ['crime', 'drama', 'dark-comedy'] },
  { title: 'Narcos', genres: ['crime', 'drama', 'biography'] },
  { title: 'Money Heist', genres: ['crime', 'thriller', 'drama'] },
  { title: 'Peaky Blinders', genres: ['crime', 'drama', 'historical'] },
  { title: 'Mindhunter', genres: ['crime', 'thriller', 'psychological'] },
  { title: 'True Detective', genres: ['crime', 'mystery', 'thriller'] },
  { title: 'Sherlock', genres: ['mystery', 'crime', 'drama'] },
  { title: 'Dark', genres: ['sci-fi', 'mystery', 'thriller'] },
  { title: 'Stranger Things', genres: ['sci-fi', 'horror', 'drama'] },
  { title: 'The Expanse', genres: ['sci-fi', 'drama', 'space'] },
  { title: 'Black Mirror', genres: ['sci-fi', 'anthology', 'thriller'] },
  { title: 'The Mandalorian', genres: ['sci-fi', 'action', 'adventure'] },
  { title: 'Loki', genres: ['sci-fi', 'fantasy', 'superhero'] },
  { title: 'The Boys', genres: ['superhero', 'action', 'dark-comedy'] },
  { title: 'WandaVision', genres: ['superhero', 'drama', 'mystery'] },
  { title: 'Game of Thrones', genres: ['fantasy', 'drama', 'action'] },
  { title: 'House of the Dragon', genres: ['fantasy', 'drama', 'action'] },
  { title: 'The Witcher', genres: ['fantasy', 'action', 'adventure'] },
  { title: 'The Crown', genres: ['drama', 'historical', 'biography'] },
  { title: 'Friends', genres: ['comedy', 'sitcom'] },
  { title: 'The Office', genres: ['comedy', 'sitcom'] },
  { title: 'Brooklyn Nine-Nine', genres: ['comedy', 'sitcom', 'crime'] },
  { title: 'Parks and Recreation', genres: ['comedy', 'sitcom'] },
  { title: 'Rick and Morty', genres: ['animation', 'sci-fi', 'comedy'] },
  { title: 'Attack on Titan', genres: ['animation', 'action', 'fantasy'] },
  { title: 'Death Note', genres: ['animation', 'thriller', 'mystery', 'psychological'] },
];

/**
 * Recommend a series similar to `title`, based on genre overlap.
 * Returns { match, sharedGenres, score } or null if not found.
 */
function recommend(title) {
  const base = series.find((s) => s.title === title);
  if (!base) return null;

  let best = null;
  let bestScore = -1;

  for (const candidate of series) {
    if (candidate.title === base.title) continue;

    const shared = candidate.genres.filter((g) => base.genres.includes(g));
    const score = shared.length;

    if (score > bestScore) {
      bestScore = score;
      best = { match: candidate.title, sharedGenres: shared, score };
    }
  }

  return best;
}

function allTitles() {
  return series.map((s) => s.title).sort();
}

module.exports = { series, recommend, allTitles };
