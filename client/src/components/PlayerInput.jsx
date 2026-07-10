import { useState, useRef, useEffect } from 'react';

/**
 * PlayerInput — free-text input with send button.
 */
export default function PlayerInput({ onSubmit, disabled, placeholder }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  // Focus on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      id="player-input"
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-end',
        padding: '16px 0',
      }}
    >
      <textarea
        ref={textareaRef}
        className="input-field"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder || 'What do you do?'}
        rows={1}
        style={{
          flex: 1,
          minHeight: 48,
          maxHeight: 120,
          lineHeight: 1.5,
        }}
      />
      <button
        id="send-action-btn"
        className="btn-primary"
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
        style={{
          padding: '12px 20px',
          minHeight: 48,
          flexShrink: 0,
          borderRadius: 'var(--radius-md)',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}
