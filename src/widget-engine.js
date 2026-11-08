/**
 * Widget Engine - Core Cordis-based widget lifecycle manager
 * 
 * Each widget instance = one Cordis fiber
 * Spawning registers a Hermes pane via ctx.register
 * Dissolving calls the returned disposer
 */

import { Context } from '../vendor/cordis/lib/index.js'

export class WidgetEngine {
  constructor(hermesCtx, storage) {
    this.hermesCtx = hermesCtx
    this.storage = storage
    
    // Create root Cordis context
    this.cordisRoot = new Context()
    
    // Widget registry: widgetId -> { fiber, hermesDisposer, spec }
    this.widgets = new Map()
    
    // Widget type registry: type -> { create, render }
    this.widgetTypes = new Map()
    
    // Track next widget ID
    this.nextId = 1
    
    // Load persisted state
    this._loadState()
    
    // Setup cleanup on Hermes plugin dispose
    hermesCtx.onDispose(() => {
      this.shutdown()
    })
  }
  
  /**
   * Register a widget type
   */
  registerWidgetType(type, definition) {
    this.widgetTypes.set(type, definition)
  }
  
  /**
   * Spawn a new widget instance
   * @param {string} type - Widget type
   * @param {object} config - Widget configuration
   * @returns {string} widgetId
   */
  spawn(type, config = {}) {
    const typeDef = this.widgetTypes.get(type)
    if (!typeDef) {
      throw new Error(`Unknown widget type: ${type}`)
    }
    
    const widgetId = `widget-${this.nextId++}`
    const spec = {
      id: widgetId,
      type,
      config,
      createdAt: Date.now()
    }
    
    console.log(`[WidgetEngine] Spawning widget ${widgetId} of type ${type}`)
    
    // Create Cordis fiber for this widget
    const fiber = this.cordisRoot.plugin((ctx) => {
      // The widget's lifecycle is bound to this fiber
      // When the fiber disposes, the widget cleans up
      
      let hermesDisposer = null
      
      ctx.effect(() => {
        console.log(`[WidgetEngine] Widget ${widgetId} effect active`)
        
        // Register the pane with Hermes
        // This is the late registration pattern that we proved works
        const paneContribution = {
          type: 'pane',
          id: `hermes-widget-${widgetId}`,
          title: spec.config.title || `Widget ${widgetId}`,
          area: 'right',
          render: (paneCtx) => typeDef.render(spec, paneCtx, this)
        }
        
        hermesDisposer = this.hermesCtx.register(paneContribution)
        console.log(`[WidgetEngine] Widget ${widgetId} pane registered`)
        
        // Return cleanup function (Cordis effect undo pattern)
        return () => {
          console.log(`[WidgetEngine] Widget ${widgetId} effect cleanup`)
          if (hermesDisposer) {
            hermesDisposer()
            hermesDisposer = null
          }
        }
      })
    })
    
    // Track the widget
    this.widgets.set(widgetId, { fiber, spec })
    
    // Persist state
    this._saveState()
    
    return widgetId
  }
  
  /**
   * Dissolve a widget instance
   * @param {string} widgetId
   */
  async dissolve(widgetId) {
    const widget = this.widgets.get(widgetId)
    if (!widget) {
      console.warn(`[WidgetEngine] Widget ${widgetId} not found`)
      return
    }
    
    console.log(`[WidgetEngine] Dissolving widget ${widgetId}`)
    
    // Dispose the Cordis fiber - this triggers effect cleanup
    await widget.fiber.dispose()
    
    // Remove from registry
    this.widgets.delete(widgetId)
    
    // Persist state
    this._saveState()
  }
  
  /**
   * List all active widgets
   */
  list() {
    return Array.from(this.widgets.entries()).map(([id, { spec }]) => ({
      id,
      type: spec.type,
      config: spec.config,
      createdAt: spec.createdAt
    }))
  }
  
  /**
   * Get widget by ID
   */
  get(widgetId) {
    const widget = this.widgets.get(widgetId)
    return widget ? {
      id: widgetId,
      type: widget.spec.type,
      config: widget.spec.config,
      createdAt: widget.spec.createdAt
    } : null
  }
  
  /**
   * Shutdown engine - dispose all widgets
   */
  async shutdown() {
    console.log('[WidgetEngine] Shutting down')
    
    // Dispose all widgets
    const disposePromises = Array.from(this.widgets.entries()).map(
      async ([id, { fiber }]) => {
        try {
          await fiber.dispose()
        } catch (err) {
          console.error(`[WidgetEngine] Error disposing widget ${id}:`, err)
        }
      }
    )
    
    await Promise.all(disposePromises)
    this.widgets.clear()
  }
  
  /**
   * Load persisted state from storage
   */
  _loadState() {
    try {
      const saved = this.storage.get('widgets')
      if (saved && Array.isArray(saved)) {
        console.log(`[WidgetEngine] Restoring ${saved.length} widgets from storage`)
        
        // Restore each widget
        for (const spec of saved) {
          try {
            this.spawn(spec.type, spec.config)
          } catch (err) {
            console.error(`[WidgetEngine] Failed to restore widget:`, err)
          }
        }
      }
    } catch (err) {
      console.error('[WidgetEngine] Failed to load state:', err)
    }
  }
  
  /**
   * Save current state to storage
   */
  _saveState() {
    try {
      const specs = Array.from(this.widgets.values()).map(w => w.spec)
      this.storage.set('widgets', specs)
    } catch (err) {
      console.error('[WidgetEngine] Failed to save state:', err)
    }
  }
}
