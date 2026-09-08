const axios = require('axios');

// Curated high quality GIF library with extensive keywords for rich local search when GIPHY_API_KEY is not configured
const fallbackGifs = [
  // Greetings / Hello / Hi / Wave
  {
    id: 'fb-hello-1',
    title: 'Hello Forest Gump Wave',
    url: 'https://media.giphy.com/media/keTwQbbQwlNM2RNJsW/giphy.gif',
    preview: 'https://media.giphy.com/media/keTwQbbQwlNM2RNJsW/200w.gif',
    keywords: ['hello', 'hi', 'hey', 'wave', 'waving', 'greetings', 'sup', 'yo', 'welcome'],
  },
  {
    id: 'fb-hello-2',
    title: 'Minion Hello Wave',
    url: 'https://media.giphy.com/media/mP8CssDPWMqgE/giphy.gif',
    preview: 'https://media.giphy.com/media/mP8CssDPWMqgE/200w.gif',
    keywords: ['hello', 'hi', 'hey', 'minion', 'wave', 'cute', 'friendly'],
  },
  {
    id: 'fb-hello-3',
    title: 'Cat Wave Greeting',
    url: 'https://media.giphy.com/media/VbAmVUETR8cA6dXB63/giphy.gif',
    preview: 'https://media.giphy.com/media/VbAmVUETR8cA6dXB63/200w.gif',
    keywords: ['hello', 'hi', 'cat', 'wave', 'kitty', 'greetings', 'paw'],
  },

  // Yes / Thumbs Up / Agree / Good
  {
    id: 'fb-yes-1',
    title: 'Thumbs Up Approval',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
    preview: 'https://media.giphy.com/media/111ebonMs90YLu/200w.gif',
    keywords: ['thumbs up', 'approve', 'yes', 'good', 'nice', 'great', 'agree', 'nod', 'ok', 'correct'],
  },
  {
    id: 'fb-yes-2',
    title: 'Nodding Yes Agree',
    url: 'https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif',
    preview: 'https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/200w.gif',
    keywords: ['yes', 'agree', 'nod', 'great', 'cheers', 'gatsby', 'toast', 'sure', 'approved'],
  },
  {
    id: 'fb-yes-3',
    title: 'Awesome Thumbs Up Kid',
    url: 'https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif',
    preview: 'https://media.giphy.com/media/XreQmk7ETCak0/200w.gif',
    keywords: ['thumbs up', 'kid', 'yes', 'awesome', 'cool', 'nice', 'win', 'good'],
  },

  // Celebration / Party / Congrats
  {
    id: 'fb-party-1',
    title: 'Celebrate Confetti',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    preview: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif',
    keywords: ['celebrate', 'party', 'congrats', 'congratulations', 'success', 'yay', 'win', 'confetti'],
  },
  {
    id: 'fb-party-2',
    title: 'The Office Celebration',
    url: 'https://media.giphy.com/media/IwAZ6dvvvaNN6/giphy.gif',
    preview: 'https://media.giphy.com/media/IwAZ6dvvvaNN6/200w.gif',
    keywords: ['celebrate', 'yay', 'party', 'office', 'steve carell', 'win', 'excited', 'happy'],
  },
  {
    id: 'fb-party-3',
    title: 'Leonardo DiCaprio Cheers',
    url: 'https://media.giphy.com/media/GCLlQnV7dXY2KGmpRh/giphy.gif',
    preview: 'https://media.giphy.com/media/GCLlQnV7dXY2KGmpRh/200w.gif',
    keywords: ['cheers', 'drink', 'party', 'celebrate', 'toast', 'congrats', 'bravo', 'win'],
  },

  // Laugh / LOL / Haha / Funny
  {
    id: 'fb-laugh-1',
    title: 'Laughing Out Loud',
    url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif',
    preview: 'https://media.giphy.com/media/10JhviFuU2gWD6/200w.gif',
    keywords: ['laugh', 'lol', 'funny', 'haha', 'rofl', 'hilarious', 'laughing', 'lmao', 'joke', 'smile'],
  },
  {
    id: 'fb-laugh-2',
    title: 'Ryan Gosling Giggle Laugh',
    url: 'https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/giphy.gif',
    preview: 'https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/200w.gif',
    keywords: ['laugh', 'lol', 'funny', 'haha', 'chuckle', 'giggle', 'cute', 'ryan gosling'],
  },
  {
    id: 'fb-laugh-3',
    title: 'Jonah Hill Excited Screaming',
    url: 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif',
    preview: 'https://media.giphy.com/media/5GoVLqeAOo6PK/200w.gif',
    keywords: ['excited', 'omg', 'yay', 'funny', 'screaming', 'pumped', 'hype', 'happy'],
  },

  // Applause / Clapping / Bravo
  {
    id: 'fb-clap-1',
    title: 'Applause Clapping',
    url: 'https://media.giphy.com/media/7rj2ZgttvgomY/giphy.gif',
    preview: 'https://media.giphy.com/media/7rj2ZgttvgomY/200w.gif',
    keywords: ['applause', 'clap', 'clapping', 'bravo', 'good job', 'well done', 'congrats', 'cheer'],
  },
  {
    id: 'fb-clap-2',
    title: 'Standing Ovation Applause',
    url: 'https://media.giphy.com/media/nbvFVPiEiJH6JOGIok/giphy.gif',
    preview: 'https://media.giphy.com/media/nbvFVPiEiJH6JOGIok/200w.gif',
    keywords: ['clap', 'applause', 'standing ovation', 'bravo', 'proud', 'respect', 'great'],
  },

  // Love / Heart / Thanks / Hug
  {
    id: 'fb-love-1',
    title: 'Love Heart Cute',
    url: 'https://media.giphy.com/media/M90mJvfWfd5mbUuULX/giphy.gif',
    preview: 'https://media.giphy.com/media/M90mJvfWfd5mbUuULX/200w.gif',
    keywords: ['love', 'heart', 'hug', 'sweet', 'cute', 'kiss', 'crush', 'adorable', 'thanks'],
  },
  {
    id: 'fb-love-2',
    title: 'Warm Hug Embrace',
    url: 'https://media.giphy.com/media/l8ooOenhqOHCXifKU1/giphy.gif',
    preview: 'https://media.giphy.com/media/l8ooOenhqOHCXifKU1/200w.gif',
    keywords: ['hug', 'love', 'care', 'friends', 'cuddle', 'support', 'warm', 'thanks'],
  },
  {
    id: 'fb-love-3',
    title: 'Thank You Grateful Bow',
    url: 'https://media.giphy.com/media/3oEdva9BUHPIs2SkGk/giphy.gif',
    preview: 'https://media.giphy.com/media/3oEdva9BUHPIs2SkGk/200w.gif',
    keywords: ['thanks', 'thank you', 'ty', 'grateful', 'appreciate', 'bow', 'kind', 'merci'],
  },

  // Mind Blown / Shock / Wow / OMG
  {
    id: 'fb-shock-1',
    title: 'Mind Blown Galaxy',
    url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
    preview: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/200w.gif',
    keywords: ['mind blown', 'wow', 'crazy', 'shocked', 'amazing', 'omg', 'insane', 'whoa'],
  },
  {
    id: 'fb-shock-2',
    title: 'Shocked Surprised Face',
    url: 'https://media.giphy.com/media/Lcn0yF1RcLANG/giphy.gif',
    preview: 'https://media.giphy.com/media/Lcn0yF1RcLANG/200w.gif',
    keywords: ['shocked', 'surprised', 'omg', 'what', 'gasp', 'unbelievable', 'wow'],
  },

  // Work / Typing / Coding / Busy
  {
    id: 'fb-work-1',
    title: 'Fast Typing Cat',
    url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
    preview: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/200w.gif',
    keywords: ['typing', 'working', 'coding', 'cat', 'busy', 'fast', 'developer', 'work', 'laptop'],
  },
  {
    id: 'fb-work-2',
    title: 'Kermit Typing Fast',
    url: 'https://media.giphy.com/media/XIqCQx02E1U9W/giphy.gif',
    preview: 'https://media.giphy.com/media/XIqCQx02E1U9W/200w.gif',
    keywords: ['work', 'typing', 'busy', 'kermit', 'deadline', 'rush', 'grind', 'working'],
  },
  {
    id: 'fb-work-3',
    title: 'Coffee Cheers Morning',
    url: 'https://media.giphy.com/media/hPTZgtzfRIB5Nfb5rL/giphy.gif',
    preview: 'https://media.giphy.com/media/hPTZgtzfRIB5Nfb5rL/200w.gif',
    keywords: ['coffee', 'morning', 'cheers', 'work', 'energy', 'tea', 'caffeine', 'wake up'],
  },

  // Thinking / Confused / What / Hmm
  {
    id: 'fb-think-1',
    title: 'Thinking Smart Head Tap',
    url: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif',
    preview: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/200w.gif',
    keywords: ['thinking', 'smart', 'brain', 'ponder', 'idea', 'roll safe', 'genius', 'plan', 'hmm'],
  },
  {
    id: 'fb-think-2',
    title: 'Confused Math Lady',
    url: 'https://media.giphy.com/media/WRQBXSCnEFJIuxktnw/giphy.gif',
    preview: 'https://media.giphy.com/media/WRQBXSCnEFJIuxktnw/200w.gif',
    keywords: ['confused', 'math', 'calculating', 'what', 'puzzled', 'lost', 'question', 'hmm'],
  },
  {
    id: 'fb-think-3',
    title: 'John Travolta Confused Shrug',
    url: 'https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.gif',
    preview: 'https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/200w.gif',
    keywords: ['confused', 'where', 'what', 'shrug', 'lost', 'idk', 'travolta', 'pulp fiction'],
  },

  // Sad / Crying / Upset
  {
    id: 'fb-sad-1',
    title: 'Crying Tears Sadness',
    url: 'https://media.giphy.com/media/L95W4wvtsEQn057560/giphy.gif',
    preview: 'https://media.giphy.com/media/L95W4wvtsEQn057560/200w.gif',
    keywords: ['sad', 'cry', 'crying', 'tears', 'upset', 'heartbroken', 'sob', 'depressed', 'nooo'],
  },
  {
    id: 'fb-sad-2',
    title: 'Dawson Crying Drama',
    url: 'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif',
    preview: 'https://media.giphy.com/media/d2lcHJTG5Tscg/200w.gif',
    keywords: ['cry', 'crying', 'sad', 'tears', 'dawson', 'drama', 'grief', 'tragic', 'pain'],
  },

  // No / Disagree / Facepalm / Smh
  {
    id: 'fb-no-1',
    title: 'Facepalm Picard Sigh',
    url: 'https://media.giphy.com/media/3og0INyCmHlNylks9O/giphy.gif',
    preview: 'https://media.giphy.com/media/3og0INyCmHlNylks9O/200w.gif',
    keywords: ['facepalm', 'oops', 'smh', 'sigh', 'really', 'picard', 'no', 'disaster', 'disappointed'],
  },
  {
    id: 'fb-no-2',
    title: 'Michael Scott No God Please No',
    url: 'https://media.giphy.com/media/12XMGIWtrHBl5e/giphy.gif',
    preview: 'https://media.giphy.com/media/12XMGIWtrHBl5e/200w.gif',
    keywords: ['no', 'nope', 'never', 'refuse', 'stop', 'michael scott', 'office', 'screaming', 'hate'],
  },
  {
    id: 'fb-no-3',
    title: 'Head Shake Disagree',
    url: 'https://media.giphy.com/media/vyTnNTrs3wqQ0UIvwE/giphy.gif',
    preview: 'https://media.giphy.com/media/vyTnNTrs3wqQ0UIvwE/200w.gif',
    keywords: ['no', 'disagree', 'shake head', 'nope', 'negative', 'refuse', 'denied'],
  },

  // Dance / Vibes / Party Groove
  {
    id: 'fb-dance-1',
    title: 'Dance Happy Carlton',
    url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif',
    preview: 'https://media.giphy.com/media/blSTtZehjAZ8I/200w.gif',
    keywords: ['dance', 'happy', 'excited', 'party', 'groove', 'carlton', 'vibing', 'moves', 'music'],
  },
  {
    id: 'fb-dance-2',
    title: 'Snoopy Happy Dance',
    url: 'https://media.giphy.com/media/oBKCOgkYzg64ALA3Bi/giphy.gif',
    preview: 'https://media.giphy.com/media/oBKCOgkYzg64ALA3Bi/200w.gif',
    keywords: ['dance', 'snoopy', 'happy', 'cute', 'joy', 'peanuts', 'weekend', 'vibe'],
  },

  // Team / High Five / Popcorn / Chill
  {
    id: 'fb-misc-1',
    title: 'High Five Teamwork',
    url: 'https://media.giphy.com/media/pHb82xtBPfqEg/giphy.gif',
    preview: 'https://media.giphy.com/media/pHb82xtBPfqEg/200w.gif',
    keywords: ['high five', 'team', 'agree', 'awesome', 'bro', 'partnership', 'deal', 'success'],
  },
  {
    id: 'fb-misc-2',
    title: 'Popcorn Eating Watching',
    url: 'https://media.giphy.com/media/GLbiGvv9qrpny/giphy.gif',
    preview: 'https://media.giphy.com/media/GLbiGvv9qrpny/200w.gif',
    keywords: ['popcorn', 'waiting', 'drama', 'watching', 'interesting', 'movie', 'tea', 'entertaining'],
  },

  // Bye / Goodbye / Later
  {
    id: 'fb-bye-1',
    title: 'Bye Wave Homer Bush',
    url: 'https://media.giphy.com/media/a93jwI0wkWTQs/giphy.gif',
    preview: 'https://media.giphy.com/media/a93jwI0wkWTQs/200w.gif',
    keywords: ['bye', 'goodbye', 'disappear', 'bush', 'homer', 'simpsons', 'leaving', 'peace out', 'later'],
  },
  {
    id: 'fb-bye-2',
    title: 'Baby Yoda Wave Goodbye',
    url: 'https://media.giphy.com/media/87xihBthJ1OsHFsNVg/giphy.gif',
    preview: 'https://media.giphy.com/media/87xihBthJ1OsHFsNVg/200w.gif',
    keywords: ['bye', 'goodbye', 'wave', 'baby yoda', 'grogu', 'cute', 'see ya', 'farewell'],
  },

  // Sleep / Tired / Night
  {
    id: 'fb-sleep-1',
    title: 'Sleepy Tired Cat Nap',
    url: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif',
    preview: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/200w.gif',
    keywords: ['sleep', 'tired', 'nap', 'bed', 'cat', 'goodnight', 'exhausted', 'yawn', 'rest'],
  },
];

// Helper: Smart search matching within fallback collection
const matchFallbackGifs = (queryStr) => {
  const cleanStr = queryStr.toLowerCase().trim();
  const terms = cleanStr.split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    return fallbackGifs;
  }

  // Score each GIF based on term matches in title and keywords
  const scored = fallbackGifs.map((gif) => {
    let score = 0;
    const title = gif.title.toLowerCase();
    const titleWords = title.split(/\s+/);
    const keywords = gif.keywords.map((k) => k.toLowerCase());

    for (const term of terms) {
      // Direct exact keyword match (highest priority)
      if (keywords.includes(term)) {
        score += 20;
      }

      // Title word exact match
      if (titleWords.includes(term)) {
        score += 15;
      }

      // Keyword begins with term (e.g. "wav" for "wave")
      for (const kw of keywords) {
        if (kw.startsWith(term) && term.length >= 2) {
          score += 10;
        } else if (kw.includes(term) && term.length >= 3) {
          score += 4;
        }
      }

      // Substring in full title
      if (title.includes(term) && term.length >= 3) {
        score += 5;
      }
    }

    return { gif, score };
  });

  const matching = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.gif);

  return matching;
};

// @desc    Get trending GIFs
// @route   GET /api/gifs/trending
// @access  Private
const getTrendingGifs = async (req, res) => {
  try {
    const apiKey = process.env.GIPHY_API_KEY;
    const { limit = 24 } = req.query;

    if (apiKey && apiKey.trim().length > 0) {
      const response = await axios.get('https://api.giphy.com/v1/gifs/trending', {
        params: {
          api_key: apiKey.trim(),
          limit: parseInt(limit, 10),
          rating: 'g',
        },
      });

      const gifs = response.data.data.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.images.original.url,
        preview: item.images.fixed_height_small?.url || item.images.fixed_width_downsampled?.url || item.images.original.url,
      }));

      return res.status(200).json({ success: true, gifs });
    }

    // Return curated fallback GIFs
    return res.status(200).json({
      success: true,
      gifs: fallbackGifs.slice(0, parseInt(limit, 10)),
    });
  } catch (error) {
    console.warn('Giphy API unavailable or rate-limited; returning fallback GIFs.', error.message);
    return res.status(200).json({
      success: true,
      gifs: fallbackGifs.slice(0, 24),
    });
  }
};

// @desc    Search GIFs
// @route   GET /api/gifs/search
// @access  Private
const searchGifs = async (req, res) => {
  try {
    const apiKey = process.env.GIPHY_API_KEY;
    const { q = '', limit = 24 } = req.query;

    if (!q.trim()) {
      return getTrendingGifs(req, res);
    }

    const trimmedQuery = q.trim();

    if (apiKey && apiKey.trim().length > 0) {
      try {
        const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
          params: {
            api_key: apiKey.trim(),
            q: trimmedQuery,
            limit: parseInt(limit, 10),
            rating: 'g',
          },
        });

        const gifs = response.data.data.map((item) => ({
          id: item.id,
          title: item.title,
          url: item.images.original.url,
          preview: item.images.fixed_height_small?.url || item.images.fixed_width_downsampled?.url || item.images.original.url,
        }));

        if (gifs.length > 0) {
          return res.status(200).json({ success: true, gifs });
        }
      } catch (giphyErr) {
        console.warn('Giphy search API error, falling back to built-in catalog:', giphyErr.message);
      }
    }

    // Filter fallback GIFs with smart keyword matching
    const matchingGifs = matchFallbackGifs(trimmedQuery);

    return res.status(200).json({
      success: true,
      gifs: matchingGifs.slice(0, parseInt(limit, 10)),
    });
  } catch (error) {
    console.warn('GIF search failed; returning fallback GIFs.', error.message);
    return res.status(200).json({
      success: true,
      gifs: fallbackGifs.slice(0, 12),
    });
  }
};

module.exports = {
  getTrendingGifs,
  searchGifs,
};
