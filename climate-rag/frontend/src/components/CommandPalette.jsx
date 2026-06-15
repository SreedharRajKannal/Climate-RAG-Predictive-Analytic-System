import React, { useState, useEffect, useRef } from "react"
import { searchCities } from "../api"

export default function CommandPalette({ onSelectCity }) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef(null)

  const RECENT_CITIES = [
    { name: "Trivandrum", country: "India", latitude: 8.5241, longitude: 76.9366 },
    { name: "Kochi", country: "India", latitude: 9.9312, longitude: 76.2673 },
  ]

  const POPULAR_CITIES = [
    { name: "Mumbai", country: "India", latitude: 19.076, longitude: 72.8777 },
    { name: "London", country: "United Kingdom", latitude: 51.5074, longitude: -0.1278 },
  ]

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setSelectedIndex(0)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchCities(query)
        setSuggestions(res.data || [])
        setSelectedIndex(0)
      } catch (err) {
        console.error("Search failed", err)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (city) => {
    onSelectCity(city)
    setIsOpen(false)
    setQuery("")
  }

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter") setIsOpen(true)
      return
    }

    const totalItems = getDisplayItems().length
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % totalItems)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems)
    } else if (e.key === "Enter") {
      e.preventDefault()
      const items = getDisplayItems()
      if (items[selectedIndex]) {
        handleSelect(items[selectedIndex].city)
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  const getDisplayItems = () => {
    const items = []
    
    if (query.length < 2) {
      RECENT_CITIES.forEach(c => items.push({ type: 'recent', city: c }))
      POPULAR_CITIES.forEach(c => items.push({ type: 'popular', city: c }))
    } else {
      suggestions.forEach(c => items.push({ type: 'suggestion', city: c }))
    }
    return items
  }

  const displayItems = getDisplayItems()

  return (
    <div className="command-search-wrap" ref={containerRef}>
      <input
        type="text"
        className="command-input"
        placeholder="⌘ Search city..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {isOpen && (
        <div className="command-dropdown">
          {displayItems.length === 0 && loading ? (
            <div className="cmd-item" style={{color: "var(--c-text-muted)"}}>Searching...</div>
          ) : (
            <>
              {displayItems.map((item, index) => {
                // Determine if we need a section header
                let showHeader = false
                let headerText = ""
                if (index === 0 && query.length < 2) {
                  showHeader = true; headerText = "Recent"
                } else if (query.length < 2 && item.type === 'popular' && (index === 0 || displayItems[index-1].type !== 'popular')) {
                  showHeader = true; headerText = "Popular"
                } else if (index === 0 && query.length >= 2) {
                  showHeader = true; headerText = "Suggestions"
                }

                return (
                  <React.Fragment key={index}>
                    {showHeader && <div className="cmd-section-title">{headerText}</div>}
                    <div 
                      className={`cmd-item ${selectedIndex === index ? "active" : ""}`}
                      onClick={() => handleSelect(item.city)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <span className="cmd-icon">
                        {item.type === 'recent' ? '🕒' : item.type === 'popular' ? '🔥' : '→'}
                      </span>
                      <span>
                        {item.city.name} 
                        {item.city.country && <span style={{opacity: 0.5, fontSize: "12px", marginLeft: "8px"}}>{item.city.country}</span>}
                      </span>
                    </div>
                  </React.Fragment>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
