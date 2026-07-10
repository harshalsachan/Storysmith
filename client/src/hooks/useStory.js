/**
 * useStory hook — manages story state, turn submission, and streaming.
 */

import { useState, useCallback, useRef } from 'react';
import { fetchStory, submitTurn } from '../utils/api';

export default function useStory(storyId) {
  const [story, setStory] = useState(null);
  const [character, setCharacter] = useState(null);
  const [turns, setTurns] = useState([]);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [streamingText, setStreamingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  /**
   * Load a story from the server.
   */
  const loadStory = useCallback(async () => {
    if (!storyId) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchStory(storyId);
      setStory(data);
      setCharacter(data.character);
      setTurns(data.turns || []);

      // If there are turns, set suggested actions from the last AI response
      // (We'll store them in turn state after each submission)
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [storyId]);

  /**
   * Submit a player turn and stream the AI response.
   */
  const submitPlayerTurn = useCallback(
    (playerInput) => {
      if (!storyId || isStreaming) return;

      setIsStreaming(true);
      setStreamingText('');
      setError(null);
      setSuggestedActions([]);

      abortRef.current = submitTurn(storyId, playerInput, {
        onNarrativeChunk: (chunk) => {
          setStreamingText((prev) => prev + chunk);
        },
        onTurnComplete: (data) => {
          // Add the completed turn to the list
          setTurns((prev) => [
            ...prev,
            {
              id: data.turn.id,
              sequence: data.turn.sequence,
              playerInput: data.turn.playerInput,
              aiNarrative: data.turn.aiNarrative,
            },
          ]);

          // Update character state
          if (data.character) {
            setCharacter(data.character);
          }

          // Update title
          if (data.title) {
            setStory((prev) => (prev ? { ...prev, title: data.title } : prev));
          }

          // Set suggested actions
          setSuggestedActions(data.suggestedActions || []);
          setStreamingText('');
          setIsStreaming(false);
        },
        onError: (message) => {
          setError(message);
          setStreamingText('');
          setIsStreaming(false);
        },
      });
    },
    [storyId, isStreaming]
  );

  /**
   * Cancel the current stream.
   */
  const cancelStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
      setIsStreaming(false);
      setStreamingText('');
    }
  }, []);

  /**
   * Clear the error.
   */
  const clearError = useCallback(() => setError(null), []);

  return {
    story,
    character,
    turns,
    suggestedActions,
    streamingText,
    isLoading,
    isStreaming,
    error,
    loadStory,
    submitPlayerTurn,
    cancelStream,
    clearError,
  };
}
