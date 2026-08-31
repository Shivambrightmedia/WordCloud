---
description: Word Cloud Generator - Project Architecture and Workflow Guide
---

# Word Cloud Generator - Architecture & Workflow Guide

*For Java developers: This guide uses familiar OOP and design pattern terminology*

---

## 📁 Project Structure

```
Word Cloud/
├── index.html              # Main HTML (like a JSP/View template)
├── src/
│   ├── main.js             # Application entry point (like Main.java)
│   ├── style.css           # Global styles
│   │
│   ├── core/               # Core framework (like Spring Core)
│   │   ├── App.js          # Application orchestrator (ApplicationContext)
│   │   ├── StateManager.js # Centralized state (like a Singleton Repository)
│   │   ├── EventBus.js     # Event system (like ApplicationEventPublisher)
│   │   └── ErrorHandler.js # Global error handling
│   │
│   ├── components/         # UI Components (like @Controller classes)
│   │   ├── BaseComponent.js    # Abstract base class
│   │   ├── ImageUploader.js    # Handles image upload
│   │   ├── ImageCustomizer.js  # Image position/scale controls
│   │   ├── WordSettings.js     # Word table management
│   │   ├── ColorSettings.js    # Color mode selection
│   │   ├── FontSettings.js     # Font family selection
│   │   ├── ResolutionSettings.js # Layout controls
│   │   ├── CanvasRenderer.js   # Main rendering engine
│   │   ├── PresetPanel.js      # Preset save/load UI
│   │   └── Accordion.js        # Sidebar accordion behavior
│   │
│   ├── services/           # Business Logic (like @Service classes)
│   │   ├── ImageProcessor.js   # Image manipulation algorithms
│   │   ├── WordPlacer.js       # Word placement algorithm
│   │   ├── ExportService.js    # File export functionality
│   │   └── PresetService.js    # Preset persistence
│   │
│   └── utils/              # Utility classes (like common utils)
│       ├── colorUtils.js   # Color manipulation functions
│       ├── debounce.js     # Rate limiting utility
│       └── domUtils.js     # DOM helper functions
```

---

## 🎯 Design Patterns Used

### 1. **Singleton Pattern** (like Java Singletons)

All services and core managers are singletons:

```javascript
// StateManager.js - Similar to a @Singleton Repository
class StateManager {
    constructor() {
        this._state = { ...defaultState };
    }
}

// Singleton instance export (like Spring @Bean)
export const stateManager = new StateManager();
```

**Java Equivalent:**
```java
@Singleton
public class StateManager {
    private static StateManager instance = new StateManager();
    public static StateManager getInstance() { return instance; }
}
```

---

### 2. **Observer Pattern** (like Java EventListeners)

The EventBus implements publish-subscribe:

```javascript
// EventBus.js
class EventBus {
    on(event, callback) {
        // Subscribe to events (like addListener in Java)
        this._listeners[event].push(callback);
    }
    
    emit(event, data) {
        // Publish events (like fireEvent in Java)
        this._listeners[event].forEach(cb => cb(data));
    }
}
```

**Java Equivalent:**
```java
public interface EventListener<T> {
    void onEvent(T data);
}

public class EventBus {
    public void addEventListener(String event, EventListener listener);
    public void dispatchEvent(String event, Object data);
}
```

---

### 3. **Template Method Pattern** (like Java Abstract Classes)

BaseComponent defines the lifecycle:

```javascript
// BaseComponent.js
class BaseComponent {
    init() {
        this.cacheElements();  // Step 1: Cache DOM references
        this.bindEvents();     // Step 2: Bind event handlers
        this.render();         // Step 3: Initial render
    }
    
    // Abstract methods - must be overridden
    cacheElements() { /* Override in subclass */ }
    bindEvents() { /* Override in subclass */ }
    render() { /* Override in subclass */ }
}
```

**Java Equivalent:**
```java
public abstract class BaseComponent {
    public final void init() {
        cacheElements();
        bindEvents();
        render();
    }
    
    protected abstract void cacheElements();
    protected abstract void bindEvents();
    protected abstract void render();
}
```

---

### 4. **Facade Pattern** (like a Service Layer)

App.js provides a simple interface to the complex subsystem:

```javascript
// App.js - Orchestrates all components
class App {
    _bootstrap() {
        this.components = [
            createAccordion(),
            createImageUploader(),
            createWordSettings(),
            createColorSettings(),
            createFontSettings(),
            createResolutionSettings(),
            createCanvasRenderer(),
            createPresetPanel(),
        ];
    }
}
```

---

### 5. **Factory Pattern** (like Factory Methods)

Each component has a factory function:

```javascript
// Factory function - creates and initializes component
export function createWordSettings() {
    const component = new WordSettings();
    component.init();
    return component;
}
```

**Java Equivalent:**
```java
public class WordSettingsFactory {
    public static WordSettings create() {
        WordSettings component = new WordSettings();
        component.init();
        return component;
    }
}
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ACTIONS                              │
│   (Upload Image, Change Settings, Click Generate, etc.)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     UI COMPONENTS                                │
│   ImageUploader, WordSettings, ColorSettings, FontSettings...   │
│                                                                  │
│   • Handle user input                                           │
│   • Call setState() to update state                             │
│   • Emit events for cross-component communication               │
└─────────────────────────────────────────────────────────────────┘
                              │
                    setState({ key: value })
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     STATE MANAGER                                │
│                                                                  │
│   Central state store (like Redux or a global DTO)              │
│                                                                  │
│   State Object:                                                 │
│   {                                                             │
│     image: HTMLImageElement,                                    │
│     words: ['Love', 'Hope', ...],                              │
│     wordItems: [{text, color, repeat}, ...],                   │
│     fontFamily: 'Outfit',                                       │
│     fontWeight: 700,                                            │
│     colorMode: 'source',                                        │
│     density: 120,                                               │
│     fontSize: 60,                                               │
│     ...                                                         │
│   }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
            emit(Events.STATE_CHANGED, { changed: [...] })
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EVENT BUS                                   │
│                                                                  │
│   Broadcasts events to all subscribers                          │
│   Events: STATE_CHANGED, GENERATION_START, GENERATION_COMPLETE  │
│           PRESET_LOADED, PRESET_SAVED, etc.                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICES (Business Logic)                     │
│                                                                  │
│   ┌─────────────────┐   ┌─────────────────┐                     │
│   │ ImageProcessor  │   │   WordPlacer    │                     │
│   │                 │   │                 │                     │
│   │ • Threshold     │   │ • Size tiers    │                     │
│   │ • Edge detect   │   │ • Collision     │                     │
│   │ • Mask creation │   │ • Color mapping │                     │
│   └─────────────────┘   └─────────────────┘                     │
│                                                                  │
│   ┌─────────────────┐   ┌─────────────────┐                     │
│   │  PresetService  │   │  ExportService  │                     │
│   │                 │   │                 │                     │
│   │ • Load/Save     │   │ • PNG export    │                     │
│   │ • localStorage  │   │ • Download      │                     │
│   └─────────────────┘   └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CANVAS OUTPUT                                │
│                                                                  │
│   Final rendered word cloud image on HTML5 Canvas               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Functions Explained

### 1. **Image Processing Pipeline** (`ImageProcessor.js`)

```javascript
processImage(ctx, sourceImage, options) {
    // Step 1: Draw source image scaled to canvas
    ctx.drawImage(sourceImage, ...);
    
    // Step 2: Get pixel data
    const imageData = ctx.getImageData(0, 0, width, height);
    
    // Step 3: Apply threshold (convert to binary mask)
    // Like: if (brightness < threshold) { mask = true; }
    
    // Step 4: Apply edge detection (Sobel operator)
    // Finds boundaries between light and dark areas
    
    // Step 5: Return processed pixel data
    return imageData;
}
```

**Algorithm Analogy (Java):**
```java
public BufferedImage processImage(BufferedImage source) {
    // Iterate each pixel, check brightness, create mask
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            int brightness = getBrightness(source.getRGB(x, y));
            mask[y][x] = brightness < threshold;
        }
    }
    return mask;
}
```

---

### 2. **Word Placement Algorithm** (`WordPlacer.js`)

```javascript
placeWords(ctx, imageData, options) {
    // Create collision grid (like a 2D boolean array)
    const grid = new Uint8Array(width * height);
    
    // Process different size tiers (largest words first)
    for (const tier of sizeTiers) {
        // tier = { scale: 4.0, attempts: 200 }  // Hero words
        // tier = { scale: 1.0, attempts: 15000 }  // Regular words
        
        for (let i = 0; i < tier.attempts; i++) {
            // Pick random position
            const rx = Math.random() * width;
            const ry = Math.random() * height;
            
            // Check if position is in mask (dark area of image)
            if (!isInMask(rx, ry)) continue;
            
            // Pick random word
            const word = words[randomIndex];
            
            // Measure word dimensions
            const { width, height } = measureText(word);
            
            // Check for collision with existing words
            if (hasCollision(grid, rx, ry, width, height)) continue;
            
            // Get color for this word
            const color = getWordColor(colorMode, word);
            
            // Draw the word!
            ctx.fillStyle = color;
            ctx.fillText(word, rx, ry);
            
            // Mark grid cells as occupied
            markGrid(grid, rx, ry, width, height);
        }
    }
}
```

**Algorithm Analogy (Java):**
```java
public void placeWords(Graphics2D g2d, boolean[][] mask, List<String> words) {
    boolean[][] occupied = new boolean[height][width];
    
    for (SizeTier tier : sizeTiers) {
        for (int i = 0; i < tier.attempts; i++) {
            Point point = randomPoint();
            if (!mask[point.y][point.x]) continue;
            
            String word = words.get(random.nextInt(words.size()));
            Rectangle bounds = measureText(word, tier.fontSize);
            
            if (hasCollision(occupied, bounds)) continue;
            
            g2d.drawString(word, point.x, point.y);
            markOccupied(occupied, bounds);
        }
    }
}
```

---

### 3. **State Management** (`StateManager.js`)

```javascript
class StateManager {
    setState(updates) {
        const prevState = { ...this._state };
        const changedKeys = [];
        
        // Apply updates
        Object.entries(updates).forEach(([key, value]) => {
            if (this._state[key] !== value) {
                this._state[key] = value;
                changedKeys.push(key);
            }
        });
        
        // Notify all subscribers (Observer pattern)
        if (changedKeys.length > 0) {
            this._subscribers.forEach(callback => {
                callback(this._state, prevState, changedKeys);
            });
            
            // Emit global event
            eventBus.emit(Events.STATE_CHANGED, {
                current: this._state,
                previous: prevState,
                changed: changedKeys
            });
        }
    }
}
```

**Java Equivalent:**
```java
public class StateManager {
    private State state;
    private List<StateChangeListener> listeners;
    
    public void setState(Map<String, Object> updates) {
        State prevState = state.clone();
        List<String> changedKeys = new ArrayList<>();
        
        for (Map.Entry<String, Object> entry : updates.entrySet()) {
            if (!Objects.equals(state.get(entry.getKey()), entry.getValue())) {
                state.set(entry.getKey(), entry.getValue());
                changedKeys.add(entry.getKey());
            }
        }
        
        if (!changedKeys.isEmpty()) {
            for (StateChangeListener listener : listeners) {
                listener.onStateChange(state, prevState, changedKeys);
            }
        }
    }
}
```

---

## 🏗️ SOLID Principles Applied

| Principle | How It's Applied |
|-----------|------------------|
| **S**ingle Responsibility | Each component/service has ONE job. `ImageProcessor` only processes images. `WordPlacer` only places words. |
| **O**pen/Closed | New components can be added without modifying existing code. Just create new component and register in App.js. |
| **L**iskov Substitution | All components extend `BaseComponent` and can be used interchangeably where `BaseComponent` is expected. |
| **I**nterface Segregation | Components only depend on what they need (e.g., `this.state` getter, `this.setState()` method). |
| **D**ependency Inversion | Components depend on abstractions (`eventBus`, `stateManager`) not concrete implementations. |

---

## 🔄 Component Lifecycle (like Spring Bean Lifecycle)

```
1. Constructor()     → Initialize instance variables
                        (like @PostConstruct setup)

2. init()            → Called by factory function
   ├── cacheElements() → Get DOM references (like @Autowired)
   ├── bindEvents()    → Setup event listeners
   └── render()        → Initial UI update

3. User Interaction  → Events trigger state changes
   └── setState({...}) → Update global state

4. State Change      → Components re-render automatically
   └── render()       → UI reflects new state

5. destroy()         → Cleanup listeners (like @PreDestroy)
```

---

## 📊 Generation Workflow

```
User clicks "Generate Portrait"
         │
         ▼
┌─────────────────────────────────────┐
│ 1. CanvasRenderer.generate()        │
│    • Validate image exists          │
│    • Emit GENERATION_START event    │
│    • Wait for fonts to load         │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 2. processGeneration()              │
│    • Setup canvas dimensions        │
│    • Call ImageProcessor            │
│    • Call WordPlacer                │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 3. ImageProcessor.processImage()    │
│    • Draw scaled source image       │
│    • Apply threshold filter         │
│    • Apply edge detection           │
│    • Return mask data               │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 4. WordPlacer.placeWords()          │
│    • Create collision grid          │
│    • For each size tier:            │
│      • Random position attempts     │
│      • Check mask & collision       │
│      • Draw word with color         │
│      • Mark grid as occupied        │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 5. Complete                         │
│    • Emit GENERATION_COMPLETE       │
│    • Enable download button         │
│    • Scroll to canvas               │
└─────────────────────────────────────┘
```

---

## 🎨 Color Modes Explained

| Mode | Description | Code |
|------|-------------|------|
| `source` | Uses original image pixel colors | `return { r: pixelColor.r, g: pixelColor.g, b: pixelColor.b }` |
| `single` | All words same color | `return hexToRgb(singleColor)` |
| `random` | Each word random color | `return { r: random(), g: random(), b: random() }` |
| `palette` | Random from custom palette | `return palette[randomIndex]` |
| `perWord` | Each word has its own assigned color | `return wordColors[wordText]` |

---

## 💾 Preset System (Persistence Layer)

```javascript
// Save preset
savePreset(name) {
    const serializable = stateManager.getSerializableState();
    // Excludes: image (can't serialize HTMLImageElement)
    // Includes: words, colors, fonts, resolution, etc.
    
    localStorage.setItem('presets', JSON.stringify(presets));
}

// Load preset
loadPreset(name) {
    const preset = presets[name];
    stateManager.loadSerializedState(preset);
    eventBus.emit(Events.PRESET_LOADED);
    // All components re-render with new state
}
```

**Java Equivalent:**
```java
@Service
public class PresetService {
    @Autowired
    private StateManager stateManager;
    
    public void savePreset(String name) {
        Preset preset = stateManager.getSerializableState();
        repository.save(name, preset);
    }
    
    public void loadPreset(String name) {
        Preset preset = repository.load(name);
        stateManager.loadState(preset);
        eventBus.publish(new PresetLoadedEvent());
    }
}
```

---

## 🚀 Quick Reference

**To add a new feature:**
1. Create component in `src/components/`
2. Extend `BaseComponent`
3. Implement `cacheElements()`, `bindEvents()`, `render()`
4. Add state fields to `StateManager.defaultState`
5. Register in `App.js` components array
6. Add HTML elements to `index.html`
7. Add CSS to `style.css`

**To modify word placement:**
- Edit `src/services/WordPlacer.js`
- Key method: `placeWords()`
- Adjust `sizeTiers` for word size distribution

**To add a new color mode:**
- Add radio option in `index.html` (COLORS section)
- Add case in `WordPlacer.getWordColor()`

---

*This architecture follows modern JavaScript patterns that map well to Java enterprise patterns. Think of it as a simplified Spring MVC with vanilla JavaScript!*
