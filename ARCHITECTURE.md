# Word Portrait Generator - Architecture Documentation

## 🏗️ Project Structure

```
src/
├── main.js                          # Entry point - bootstraps the app
├── style.css                        # Global styles
│
├── core/                            # Application Core
│   ├── App.js                       # Main orchestrator (Facade pattern)
│   ├── EventBus.js                  # Pub/Sub communication (Observer pattern)
│   └── StateManager.js              # Centralized state (Single Source of Truth)
│
├── services/                        # Business Logic Services
│   ├── ImageProcessor.js            # Image processing algorithms
│   ├── WordPlacer.js                # Word placement algorithm
│   ├── PresetService.js             # Preset persistence
│   └── ExportService.js             # Export/download functionality
│
├── components/                      # UI Components
│   ├── BaseComponent.js             # Abstract base class (Template Method pattern)
│   ├── ImageUploader.js             # File upload & drag-drop
│   ├── ImageCustomizer.js           # Threshold, edges, negative, margin
│   ├── WordSettings.js              # Word dictionary input
│   ├── ColorSettings.js             # Color mode & palette
│   ├── ResolutionSettings.js        # Resolution & transform controls
│   ├── CanvasRenderer.js            # Main canvas rendering
│   └── PresetPanel.js               # Preset management UI
│
└── utils/                           # Utility Functions
    ├── debounce.js                  # Timing utilities
    ├── colorUtils.js                # Color parsing/manipulation
    └── domUtils.js                  # DOM helpers
```

---

## 📐 SOLID Principles Applied

### 1. **Single Responsibility Principle (SRP)**
Each class has exactly one reason to change:

| Class | Responsibility |
|-------|----------------|
| `ImageProcessor` | Image manipulation algorithms |
| `WordPlacer` | Word placement and collision detection |
| `PresetService` | Preset persistence to localStorage |
| `ImageUploader` | File upload handling |
| `ColorSettings` | Color mode UI |

### 2. **Open/Closed Principle (OCP)**
Classes are open for extension, closed for modification:

```javascript
// Add new filter without modifying ImageProcessor
class ImageProcessor {
  applyEdgeDetection(imageData, strength) { ... }
  applyThreshold(imageData, threshold) { ... }
  // Easy to add: applyBlur(), applySharpen(), etc.
}
```

### 3. **Liskov Substitution Principle (LSP)**
All components extend `BaseComponent` and can be used interchangeably:

```javascript
// Any component can be substituted where BaseComponent is expected
const components = [
  createImageUploader(),     // BaseComponent
  createImageCustomizer(),   // BaseComponent
  createWordSettings(),      // BaseComponent
];
```

### 4. **Interface Segregation Principle (ISP)**
Components only depend on interfaces they need:
- Components use `stateManager.getState()` - not the entire state
- Components emit events - not direct method calls

### 5. **Dependency Inversion Principle (DIP)**
High-level modules depend on abstractions:

```javascript
// Components depend on EventBus (abstraction), not each other
class ImageUploader {
  loadFile(file) {
    this.emit(Events.IMAGE_LOADED, { image });  // Abstraction
  }
}

class CanvasRenderer {
  init() {
    this.on(Events.IMAGE_LOADED, () => ...);    // Abstraction
  }
}
```

---

## 🎨 Design Patterns Used

### 1. **Observer Pattern** (EventBus)
Decouples components through pub/sub messaging:
```javascript
eventBus.on('image:loaded', callback);
eventBus.emit('image:loaded', data);
```

### 2. **Singleton Pattern** (Services)
Single instances for global services:
```javascript
export const imageProcessor = new ImageProcessor();
export const stateManager = new StateManager();
```

### 3. **Template Method Pattern** (BaseComponent)
Defines component lifecycle skeleton:
```javascript
class BaseComponent {
  init() {
    this.cacheElements();  // Subclass overrides
    this.bindEvents();     // Subclass overrides
    this.render();         // Subclass overrides
  }
}
```

### 4. **Facade Pattern** (App)
Simplifies subsystem initialization:
```javascript
class App {
  init() {
    this.components = [
      createImageUploader(),
      createImageCustomizer(),
      // ...
    ];
  }
}
```

### 5. **Factory Function Pattern**
Creates initialized components:
```javascript
export function createImageUploader() {
  const component = new ImageUploader();
  component.init();
  return component;
}
```

---

## 📊 Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   UI Event  │ ──▶ │ StateManager │ ──▶ │  EventBus   │
│  (click)    │     │  (update)    │     │   (emit)    │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Component  │ ◀── │   Service    │ ◀── │ Components  │
│   (render)  │     │  (process)   │     │ (subscribe) │
└─────────────┘     └──────────────┘     └─────────────┘
```

---

## 🔧 Adding New Features

### Adding a New Filter
1. Add method to `ImageProcessor.js`:
```javascript
applyNewFilter(imageData, options) { ... }
```

### Adding a New Component
1. Create `src/components/NewComponent.js`
2. Extend `BaseComponent`
3. Import and add to `App.js` components array

### Adding a New Event
1. Add event name to `Events` in `EventBus.js`:
```javascript
export const Events = {
  // ...
  NEW_EVENT: 'new:event',
};
```

---

## 🧪 Testing Strategy

Each module can be tested in isolation:

```javascript
// Test ImageProcessor independently
import { imageProcessor } from './services/ImageProcessor';

test('applyThreshold makes bright pixels white', () => {
  const imageData = createTestImageData();
  imageProcessor.applyThreshold(imageData, 50);
  // Assert...
});
```

---

## 📦 Build & Production

The modular structure enables:
- **Tree shaking** - Unused code is removed
- **Code splitting** - Components can be lazy loaded
- **Testing** - Each module is independently testable
- **Maintenance** - Changes are isolated to specific files

---

## 🚀 Future Scalability

This architecture supports:
1. **Web Workers** - Move `ImageProcessor` and `WordPlacer` to workers
2. **Backend API** - Replace `PresetService` with API calls
3. **Multiple Canvases** - Create multiple `CanvasRenderer` instances
4. **Plugin System** - Add new filters/features via OCP

