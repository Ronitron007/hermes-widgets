/**
 * Countdown Widget
 * 
 * Displays time remaining until a deadline
 */

import React, { useState, useEffect } from 'react'

function CountdownWidget({ spec, ctx }) {
  const [timeRemaining, setTimeRemaining] = useState('')
  const [isExpired, setIsExpired] = useState(false)
  
  const deadline = spec.config.deadline // ISO timestamp
  const label = spec.config.label || 'Deadline'
  
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now()
      const target = new Date(deadline).getTime()
      const diff = target - now
      
      if (diff <= 0) {
        setTimeRemaining('Expired')
        setIsExpired(true)
        return
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      let parts = []
      if (days > 0) parts.push(`${days}d`)
      if (hours > 0) parts.push(`${hours}h`)
      if (minutes > 0) parts.push(`${minutes}m`)
      if (seconds >= 0 && days === 0) parts.push(`${seconds}s`)
      
      setTimeRemaining(parts.join(' '))
    }
    
    updateCountdown()
    
    // Use ctx.setInterval for scoped timer
    const disposer = ctx.setInterval(updateCountdown, 1000)
    
    return disposer
  }, [deadline, ctx])
  
  return React.createElement('div', {
    style: {
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  },
    React.createElement('div', {
      style: {
        fontSize: '14px',
        color: '#666',
        fontWeight: '500'
      }
    }, label),
    React.createElement('div', {
      style: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: isExpired ? '#e74c3c' : '#2c3e50'
      }
    }, timeRemaining),
    React.createElement('div', {
      style: {
        fontSize: '12px',
        color: '#999',
        marginTop: '8px'
      }
    }, `Target: ${new Date(deadline).toLocaleString()}`)
  )
}

export const countdownWidget = {
  type: 'countdown',
  
  create: (config) => {
    if (!config.deadline) {
      throw new Error('Countdown widget requires deadline')
    }
    return {
      deadline: config.deadline,
      label: config.label || 'Countdown'
    }
  },
  
  render: (spec, ctx, engine) => {
    return React.createElement(CountdownWidget, { spec, ctx })
  }
}
