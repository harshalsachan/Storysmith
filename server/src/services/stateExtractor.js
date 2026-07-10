/**
 * State extractor — applies structured state updates from AI responses
 * to the current character state.
 */

/**
 * Apply a state update from the AI to the current character state.
 *
 * @param {object} currentState - { stats: {}, inventory: [], flags: {} }
 * @param {object} stateUpdate - The state_update from AI tool use
 * @returns {object} - Updated state
 */
export function applyStateUpdate(currentState, stateUpdate) {
  if (!stateUpdate) return currentState;

  const newState = {
    stats: { ...currentState.stats },
    inventory: [...currentState.inventory],
    flags: { ...currentState.flags },
  };

  // Apply health change
  if (typeof stateUpdate.health_change === 'number') {
    const healthKey = Object.keys(newState.stats).find(
      (k) => k.toLowerCase() === 'health'
    );
    if (healthKey) {
      newState.stats[healthKey] = Math.max(
        0,
        Math.min(100, newState.stats[healthKey] + stateUpdate.health_change)
      );
    }
  }

  // Apply stat changes (deltas)
  if (stateUpdate.stat_changes) {
    for (const [key, delta] of Object.entries(stateUpdate.stat_changes)) {
      const statKey = Object.keys(newState.stats).find(
        (k) => k.toLowerCase() === key.toLowerCase()
      );
      if (statKey) {
        newState.stats[statKey] = Math.max(0, newState.stats[statKey] + delta);
      } else {
        // New stat — add it
        newState.stats[key] = Math.max(0, delta);
      }
    }
  }

  // Apply inventory changes
  if (stateUpdate.inventory_add && Array.isArray(stateUpdate.inventory_add)) {
    for (const item of stateUpdate.inventory_add) {
      if (!newState.inventory.includes(item)) {
        newState.inventory.push(item);
      }
    }
  }

  if (stateUpdate.inventory_remove && Array.isArray(stateUpdate.inventory_remove)) {
    for (const item of stateUpdate.inventory_remove) {
      const idx = newState.inventory.findIndex(
        (i) => i.toLowerCase() === item.toLowerCase()
      );
      if (idx !== -1) {
        newState.inventory.splice(idx, 1);
      }
    }
  }

  // Apply flag changes
  if (stateUpdate.flags) {
    Object.assign(newState.flags, stateUpdate.flags);
  }

  return newState;
}
