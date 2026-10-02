/**
 * Image Text Customizer - Undo / Redo History Manager
 */

class HistoryManager {
  constructor(maxStates = 40) {
    this.maxStates = maxStates;
    this.undoStack = [];
    this.redoStack = [];
    this.onChangeCallback = null;
  }

  setChangeCallback(callback) {
    this.onChangeCallback = callback;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  /**
   * Push a snapshot of text objects and relevant state.
   */
  pushState(state, actionName = 'Action') {
    // Deep clone the state
    const snapshot = JSON.parse(JSON.stringify(state));
    this.undoStack.push({ snapshot, actionName, timestamp: Date.now() });

    if (this.undoStack.length > this.maxStates) {
      this.undoStack.shift();
    }

    // New action clears redo stack
    this.redoStack = [];
    this.notify();
  }

  undo(currentState) {
    if (!this.canUndo()) return null;

    // Save current to redo stack
    const currentSnapshot = JSON.parse(JSON.stringify(currentState));
    this.redoStack.push({ snapshot: currentSnapshot, actionName: 'Before Undo', timestamp: Date.now() });

    const prev = this.undoStack.pop();
    this.notify();
    return JSON.parse(JSON.stringify(prev.snapshot));
  }

  redo(currentState) {
    if (!this.canRedo()) return null;

    // Save current to undo stack
    const currentSnapshot = JSON.parse(JSON.stringify(currentState));
    this.undoStack.push({ snapshot: currentSnapshot, actionName: 'Before Redo', timestamp: Date.now() });

    const next = this.redoStack.pop();
    this.notify();
    return JSON.parse(JSON.stringify(next.snapshot));
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  notify() {
    if (this.onChangeCallback) {
      this.onChangeCallback({
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
        undoCount: this.undoStack.length,
        redoCount: this.redoStack.length
      });
    }
  }
}

window.HistoryManager = HistoryManager;
