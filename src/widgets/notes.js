/**
 * Notes Widget
 * 
 * Simple note-taking widget with editable text
 */

import React, { useState, useCallback } from 'react'

function NotesWidget({ spec, ctx, engine }) {
  const [content, setContent] = useState(spec.config.content || '')
  const [isSaving, setIsSaving] = useState(false)
  
  const handleChange = useCallback((e) => {
    const newContent = e.target.value
    setContent(newContent)
    
    // Auto-save after typing stops for 1 second
    setIsSaving(true)
    
    // Use ctx.setTimeout for scoped timer
    const timeoutDisposer = ctx.setTimeout(() => {
      // Update the widget's config in storage
      spec.config.content = newContent
      engine._saveState()
      setIsSaving(false)
    }, 1000)
    
    // Store disposer for cleanup (optional, as the fiber will handle it)
    return () => timeoutDisposer()
  }, [spec, ctx, engine])
  
  return React.createElement('div', {
    style: {
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      height: '100%',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  },
    React.createElement('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }
    },
      React.createElement('div', {
        style: {
          fontSize: '14px',
          color: '#666',
          fontWeight: '500'
        }
      }, spec.config.title || 'Notes'),
      isSaving && React.createElement('div', {
        style: {
          fontSize: '12px',
          color: '#3498db'
        }
      }, 'Saving...')
    ),
    React.createElement('textarea', {
      value: content,
      onChange: handleChange,
      placeholder: 'Type your notes here...',
      style: {
        flex: 1,
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, monospace',
        resize: 'vertical',
        minHeight: '200px',
        outline: 'none'
      },
      onFocus: (e) => {
        e.target.style.borderColor = '#3498db'
      },
      onBlur: (e) => {
        e.target.style.borderColor = '#ddd'
      }
    })
  )
}

export const notesWidget = {
  type: 'notes',
  
  create: (config) => {
    return {
      title: config.title || 'Notes',
      content: config.content || ''
    }
  },
  
  render: (spec, ctx, engine) => {
    return React.createElement(NotesWidget, { spec, ctx, engine })
  }
}
