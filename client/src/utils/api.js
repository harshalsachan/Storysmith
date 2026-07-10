/**
 * API utility — handles all HTTP communication with the backend.
 */

const API_BASE = import.meta.env.BACKEND_URL || '/api';


/**
 * Get or create an anonymous user ID (persisted in localStorage).
 */
export function getUserId() {
  let userId = localStorage.getItem('storyteller_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('storyteller_user_id', userId);
  }
  return userId;
}

/**
 * Standard headers for all API requests.
 */
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-user-id': getUserId(),
  };
}

/**
 * Fetch with error handling.
 */
async function apiFetch(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/* ─── Stories ─── */

export async function fetchGenres() {
  const data = await apiFetch('/stories/genres');
  return data.genres;
}

export async function fetchStories() {
  const data = await apiFetch('/stories');
  return data.stories;
}

export async function fetchStory(id) {
  const data = await apiFetch(`/stories/${id}`);
  return data.story;
}

export async function createStory(genre, setting) {
  const data = await apiFetch('/stories', {
    method: 'POST',
    body: JSON.stringify({ genre, setting }),
  });
  return data.story;
}

export async function deleteStory(id) {
  return apiFetch(`/stories/${id}`, { method: 'DELETE' });
}

/* ─── Turns (SSE Streaming) ─── */

/**
 * Submit a turn and stream the response.
 *
 * @param {string} storyId
 * @param {string} playerInput
 * @param {object} callbacks
 * @param {function} callbacks.onNarrativeChunk - Called with each text chunk
 * @param {function} callbacks.onTurnComplete - Called with full turn data
 * @param {function} callbacks.onError - Called with error message
 * @returns {function} abort - Call to cancel the stream
 */
export function submitTurn(storyId, playerInput, { onNarrativeChunk, onTurnComplete, onError }) {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/stories/${storyId}/turns`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ playerInput }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Request failed' }));
        onError?.(error.error || `HTTP ${res.status}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'narrative_chunk':
                  onNarrativeChunk?.(data.content);
                  break;
                case 'turn_complete':
                  onTurnComplete?.(data);
                  break;
                case 'error':
                  onError?.(data.message);
                  break;
              }
            } catch {
              // Ignore malformed JSON lines
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        onError?.(err.message || 'Connection failed');
      }
    }
  })();

  return () => controller.abort();
}
