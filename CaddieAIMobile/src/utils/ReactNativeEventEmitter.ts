/**
 * React Native compatible EventEmitter implementation
 * Replacement for Node.js 'events' module which is not available in React Native
 */

export type EventListener = (...args: any[]) => void;

export class ReactNativeEventEmitter {
  private events: Map<string, EventListener[]> = new Map();

  /**
   * Add a listener for a specific event
   */
  on(eventName: string, listener: EventListener): this {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.push(listener);
    return this;
  }

  /**
   * Add a one-time listener for a specific event
   */
  once(eventName: string, listener: EventListener): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(eventName, onceWrapper);
    };
    this.on(eventName, onceWrapper);
    return this;
  }

  /**
   * Remove a specific listener for an event
   */
  off(eventName: string, listener: EventListener): this {
    const listeners = this.events.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length === 0) {
        this.events.delete(eventName);
      }
    }
    return this;
  }

  /**
   * Remove all listeners for a specific event, or all events if no event specified
   */
  removeAllListeners(eventName?: string): this {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
    return this;
  }

  /**
   * Emit an event to all listeners
   */
  emit(eventName: string, ...args: any[]): boolean {
    const listeners = this.events.get(eventName);
    if (listeners && listeners.length > 0) {
      // Create a copy of listeners to avoid issues if listeners are modified during emission
      const listenersCopy = [...listeners];
      listenersCopy.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for '${eventName}':`, error);
        }
      });
      return true;
    }
    return false;
  }

  /**
   * Get the number of listeners for a specific event
   */
  listenerCount(eventName: string): number {
    const listeners = this.events.get(eventName);
    return listeners ? listeners.length : 0;
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Get listeners for a specific event
   */
  listeners(eventName: string): EventListener[] {
    const listeners = this.events.get(eventName);
    return listeners ? [...listeners] : [];
  }

  /**
   * Prepend a listener to the beginning of the listeners array
   */
  prependListener(eventName: string, listener: EventListener): this {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.unshift(listener);
    return this;
  }

  /**
   * Prepend a one-time listener to the beginning of the listeners array
   */
  prependOnceListener(eventName: string, listener: EventListener): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(eventName, onceWrapper);
    };
    this.prependListener(eventName, onceWrapper);
    return this;
  }
}

// Export a default instance for global use if needed
export const eventEmitter = new ReactNativeEventEmitter();
export default ReactNativeEventEmitter;