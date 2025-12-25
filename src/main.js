/**
 * Word Portrait Generator
 * 
 * Entry point - bootstraps the application
 * 
 * Architecture: OOP + SOLID Principles
 * 
 * Structure:
 * ├── core/           - Application core (App, EventBus, StateManager)
 * ├── services/       - Business logic services (ImageProcessor, WordPlacer, etc.)
 * ├── components/     - UI components (each follows SRP)
 * └── utils/          - Utility functions
 * 
 * SOLID Principles Applied:
 * - SRP: Each class has one responsibility
 * - OCP: Classes are open for extension, closed for modification
 * - LSP: All components can be substituted via BaseComponent
 * - ISP: Components only depend on interfaces they use
 * - DIP: High-level modules depend on abstractions (EventBus, StateManager)
 */

import './style.css';
import { app } from './core/App.js';

// Initialize the application
app.init();

// Expose app instance for debugging (optional, remove in production)
if (import.meta.env.DEV) {
  window.__app = app;
  console.log('💡 Tip: Access app state with window.__app.getState()');
}
