/**
 * Vite configuration for production builds
 */

import { defineConfig } from 'vite';

export default defineConfig({
    // Base public path
    base: '/',

    // Build configuration
    build: {
        // Output directory
        outDir: 'dist',

        // Generate source maps for debugging (disable in production if needed)
        sourcemap: false,

        // Use esbuild for minification (faster, built-in)
        minify: 'esbuild',

        // esbuild options for production
        esbuildOptions: {
            drop: ['console', 'debugger']  // Remove console.log and debugger in production
        },

        // Chunk splitting
        rollupOptions: {
            output: {
                // Manual chunk splitting for better caching
                manualChunks: {
                    // Vendor chunk for external dependencies (if any)
                    // 'vendor': ['lodash', 'axios'],
                },

                // Asset file naming
                assetFileNames: (assetInfo) => {
                    const extType = assetInfo.name.split('.').pop();
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
                        return 'assets/images/[name]-[hash][extname]';
                    }
                    if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
                        return 'assets/fonts/[name]-[hash][extname]';
                    }
                    return 'assets/[name]-[hash][extname]';
                },

                // Chunk file naming
                chunkFileNames: 'assets/js/[name]-[hash].js',

                // Entry file naming
                entryFileNames: 'assets/js/[name]-[hash].js'
            }
        },

        // CSS code splitting
        cssCodeSplit: true,

        // Target browsers
        target: 'es2020'
    },

    // Development server
    server: {
        port: 5173,
        open: true,
        cors: true
    },

    // Preview server (for testing production build)
    preview: {
        port: 4173
    },

    // Optimization
    optimizeDeps: {
        include: []  // Add dependencies to pre-bundle
    },

    // Define global constants
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
    }
});
