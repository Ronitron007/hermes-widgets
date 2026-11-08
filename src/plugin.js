/**
 * Hermes Widgets Desktop Plugin
 * 
 * A Cordis-based widget system for Hermes Desktop that enables
 * spatiotemporal widget composition: widgets spawn and dissolve
 * with their context.
 */

import React from 'react'
import { WidgetEngine } from './widget-engine.js'
import { countdownWidget } from './widgets/countdown.js'
import { notesWidget } from './widgets/notes.js'

// Plugin metadata
const PLUGIN_ID = 'hermes-widgets'
const PLUGIN_NAME = 'Hermes Widgets'
const VERSION = '0.1.0'

/**
 * Control panel UI for managing widgets
 */
function ControlPanel({ ctx, engine }) {
  const [widgets, setWidgets] = React.useState([])
  const [selectedType, setSelectedType] = React.useState('countdown')
  
  // Refresh widget list
  const refreshWidgets = React.useCallback(() => {
    setWidgets(engine.list())
  }, [engine])
  
  React.useEffect(() => {
    refreshWidgets()
    
    // Refresh periodically
    const disposer = ctx.setInterval(refreshWidgets, 2000)
    return disposer
  }, [ctx, refreshWidgets])
  
  // Spawn countdown widget
  const spawnCountdown = React.useCallback(() => {
    const deadline = new Date()
    deadline.setHours(deadline.getHours() + 1) // 1 hour from now
    
    engine.spawn('countdown', {
      title: 'Countdown Timer',
      label: 'Time Remaining',
      deadline: deadline.toISOString()
    })
    
    refreshWidgets()
  }, [engine, refreshWidgets])
  
  // Spawn notes widget
  const spawnNotes = React.useCallback(() => {
    engine.spawn('notes', {
      title: `Notes ${new Date().toLocaleTimeString()}`
    })
    
    refreshWidgets()
  }, [engine, refreshWidgets])
  
  // Dissolve widget
  const handleDissolve = React.useCallback(async (widgetId) => {
    await engine.dissolve(widgetId)
    refreshWidgets()
  }, [engine, refreshWidgets])
  
  return React.createElement('div', {
    style: {
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  },
    // Header
    React.createElement('div', {
      style: {
        marginBottom: '16px'
      }
    },
      React.createElement('h3', {
        style: {
          margin: '0 0 4px 0',
          fontSize: '16px',
          fontWeight: '600'
        }
      }, PLUGIN_NAME),
      React.createElement('div', {
        style: {
          fontSize: '12px',
          color: '#666'
        }
      }, `v${VERSION} • Powered by Cordis 4.0.0-rc.12`)
    ),
    
    // Spawn controls
    React.createElement('div', {
      style: {
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px'
      }
    },
      React.createElement('div', {
        style: {
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '8px'
        }
      }, 'Spawn Widget'),
      React.createElement('div', {
        style: {
          display: 'flex',
          gap: '8px'
        }
      },
        React.createElement('button', {
          onClick: spawnCountdown,
          style: {
            padding: '8px 16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px'
          }
        }, '⏱️ Countdown'),
        React.createElement('button', {
          onClick: spawnNotes,
          style: {
            padding: '8px 16px',
            backgroundColor: '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px'
          }
        }, '📝 Notes')
      )
    ),
    
    // Active widgets list
    React.createElement('div', null,
      React.createElement('div', {
        style: {
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '8px'
        }
      }, `Active Widgets (${widgets.length})`),
      widgets.length === 0 
        ? React.createElement('div', {
            style: {
              padding: '16px',
              textAlign: 'center',
              color: '#999',
              fontSize: '13px'
            }
          }, 'No widgets spawned. Click a button above to create one.')
        : React.createElement('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }
          },
            ...widgets.map(widget => 
              React.createElement('div', {
                key: widget.id,
                style: {
                  padding: '12px',
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }
              },
                React.createElement('div', null,
                  React.createElement('div', {
                    style: {
                      fontSize: '13px',
                      fontWeight: '500'
                    }
                  }, widget.config.title || widget.type),
                  React.createElement('div', {
                    style: {
                      fontSize: '11px',
                      color: '#666',
                      marginTop: '2px'
                    }
                  }, `${widget.type} • Created ${new Date(widget.createdAt).toLocaleTimeString()}`)
                ),
                React.createElement('button', {
                  onClick: () => handleDissolve(widget.id),
                  style: {
                    padding: '4px 12px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }
                }, 'Dissolve')
              )
            )
          )
    )
  )
}

/**
 * Main plugin export
 */
export default {
  id: PLUGIN_ID,
  name: PLUGIN_NAME,
  defaultEnabled: true,
  
  register(ctx) {
    console.log(`[${PLUGIN_ID}] Registering v${VERSION}`)
    
    // Initialize widget engine
    const engine = new WidgetEngine(ctx, ctx.storage)
    
    // Register widget types
    engine.registerWidgetType('countdown', countdownWidget)
    engine.registerWidgetType('notes', notesWidget)
    
    // Register control panel pane
    const controlPanelDisposer = ctx.register({
      type: 'pane',
      id: `${PLUGIN_ID}-control`,
      title: '🎛️ Widget Control',
      area: 'right',
      render: () => React.createElement(ControlPanel, { ctx, engine })
    })
    
    console.log(`[${PLUGIN_ID}] Control panel registered`)
    
    // Setup cleanup
    ctx.onDispose(() => {
      console.log(`[${PLUGIN_ID}] Plugin disposing`)
      controlPanelDisposer()
    })
    
    console.log(`[${PLUGIN_ID}] Registration complete`)
  }
}
