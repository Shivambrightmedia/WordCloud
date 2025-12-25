# 🎨 Word Portrait Generator

Transform your photos into stunning typography art! Upload any image and watch it come alive with custom words, colors, and effects.

![Word Portrait Generator](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)

## ✨ Features

- **📷 Image Upload** - Drag & drop or select any image
- **🎚️ Image Customization** - Threshold, edge detection, negative effects
- **💬 Custom Words** - Use your own word dictionary
- **⭐ Hero Words** - Highlight important words with larger sizes
- **🎨 Color Modes** - Source colors, single color, random, or custom palette
- **📐 Multiple Resolutions** - From photo size to poster quality
- **💾 Presets** - Save and load your favorite configurations
- **📥 High-Res Export** - Download as PNG

## 🚀 Live Demo

[Try it now!](https://wordportrait.app) *(Update with your deployed URL)*

## 📸 Screenshots

| Upload | Customize | Result |
|--------|-----------|--------|
| *Screenshot 1* | *Screenshot 2* | *Screenshot 3* |

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **Architecture**: OOP with SOLID principles
- **Styling**: CSS3 with custom properties
- **Fonts**: Google Fonts (Outfit)

## 📁 Project Structure

```
src/
├── main.js                    # Entry point
├── style.css                  # Global styles
├── core/                      # Application core
│   ├── App.js                 # Main orchestrator
│   ├── EventBus.js            # Pub/Sub communication
│   ├── StateManager.js        # Centralized state
│   └── ErrorHandler.js        # Global error handling
├── services/                  # Business logic
│   ├── ImageProcessor.js      # Image processing algorithms
│   ├── WordPlacer.js          # Word placement engine
│   ├── PresetService.js       # Preset management
│   └── ExportService.js       # Export functionality
├── components/                # UI components
│   ├── BaseComponent.js       # Abstract base class
│   ├── ImageUploader.js       # File upload handling
│   ├── ImageCustomizer.js     # Threshold/edges controls
│   └── ...                    # Other UI components
└── utils/                     # Utility functions
    ├── debounce.js            # Timing utilities
    ├── colorUtils.js          # Color manipulation
    └── domUtils.js            # DOM helpers
```

## 🏗️ Architecture

This project follows **SOLID principles** and uses several design patterns:

| Pattern | Usage |
|---------|-------|
| **Observer** | EventBus for decoupled communication |
| **Singleton** | Services (ImageProcessor, StateManager) |
| **Template Method** | BaseComponent lifecycle |
| **Facade** | App class for subsystem access |
| **Factory** | Component creation functions |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/word-portrait-generator.git

# Navigate to project
cd word-portrait-generator

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## 🌐 Deployment

### Vercel (Recommended)

```bash
npx vercel --prod
```

### Netlify

```bash
npm run build
npx netlify deploy --prod --dir=dist
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for more options.

## 📋 Configuration

### vite.config.js

- Change `base` for subdirectory deployments
- Configure `esbuildOptions.drop` to keep/remove console logs

### Environment

No environment variables required for basic usage.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Fonts](https://fonts.google.com/) for the Outfit font
- [Vite](https://vitejs.dev/) for the amazing build tool
- Inspired by [WordArt.com](https://wordart.com/)

---

Made with ❤️ by [Your Name]
