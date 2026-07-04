/**
 * Router - Handles navigation between tools and pages
 */

const Router = (function() {
    'use strict';

    const routes = {
        'home': { title: 'Home', render: renderHome },
        
        // Core Tools
        'pdf-to-image': { title: 'PDF → Images', render: renderPdfToImage },
        'image-to-pdf': { title: 'Images → PDF', render: renderImageToPdf },
        'crop': { title: 'Crop Image', render: renderCropTool },
        'resize': { title: 'Resize Image', render: renderResizeTool },
        'photo-resizer': { title: 'Photo Resizer', render: renderPhotoResizer },
        
        // PDF Manipulation
        'merge': { title: 'Merge PDF', render: renderMergeTool },
        'split': { title: 'Split PDF', render: renderSplitTool },
        'rotate': { title: 'Rotate PDF', render: renderRotateTool },
        'extract': { title: 'Extract Images', render: renderExtractTool },
        
        // Compression & Security
        'compress': { title: 'Compress', render: renderCompressTool },
        'lock': { title: 'Lock PDF', render: renderLockTool },
        'remove-pages': { title: 'Remove Pages', render: renderRemovePagesTool },
        
        // Conversion
        'pdf-to-jpg': { title: 'PDF to JPG', render: renderPdfToJpgTool }
    };

    // ============================================
    // FOOTER PAGES - Direct navigation to separate pages
    // ============================================
    const pageRoutes = {
        'privacy': '/privacy.html',
        'open-source': '/open-source.html',
        'github': '/github.html',
        'license': '/license.html',
        'support': '/support.html'
    };

    let currentRoute = 'home';

    /**
     * Initialize Router
     */
    function init() {
        console.log('Router initializing...');
        
        // Handle nav link clicks
        document.querySelectorAll('.nav-link[data-tool]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const tool = this.dataset.tool;
                if (tool) {
                    navigate(tool);
                }
            });
        });

        // Handle footer link clicks - Navigate to separate pages
        document.querySelectorAll('.footer-link[data-page]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.dataset.page;
                if (page && pageRoutes[page]) {
                    // Open as separate page (full navigation)
                    window.location.href = pageRoutes[page];
                }
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', function(e) {
            const state = e.state || {};
            const tool = state.tool || 'home';
            navigate(tool, true);
        });

        // Check URL params on load
        const params = new URLSearchParams(window.location.search);
        const initialTool = params.get('tool') || 'home';
        navigate(initialTool, true);
        
        console.log('Router initialized');
    }

    /**
     * Navigate to a tool
     */
    function navigate(tool, replaceState = false) {
        if (!routes[tool]) {
            console.warn('Route "' + tool + '" not found, redirecting to home');
            tool = 'home';
        }

        currentRoute = tool;

        // Update URL
        const url = tool === 'home' ? '/' : '/?tool=' + tool;
        try {
            if (replaceState) {
                history.replaceState({ tool }, '', url);
            } else {
                history.pushState({ tool }, '', url);
            }
        } catch (e) {
            console.warn('History API error:', e);
        }

        // Update active nav links
        document.querySelectorAll('.nav-link[data-tool]').forEach(link => {
            link.classList.toggle('active', link.dataset.tool === tool);
        });

        // Render the page
        const route = routes[tool];
        if (route) {
            document.title = route.title + ' | iZeroPDF';
            try {
                route.render();
            } catch (e) {
                console.error('Error rendering ' + tool + ':', e);
                showError('Failed to load ' + route.title + ': ' + e.message);
            }
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Close mobile nav
        const menu = document.querySelector('.nav-menu');
        if (menu) menu.classList.remove('open');

        console.log('Navigated to: ' + tool);
    }

    /**
     * Get current route
     */
    function getCurrentRoute() {
        return currentRoute;
    }

    /**
     * Check if current page is a footer page
     */
    function isFooterPage() {
        const path = window.location.pathname;
        return path.includes('privacy') || 
               path.includes('open-source') || 
               path.includes('github') || 
               path.includes('license') || 
               path.includes('support');
    }

    // ==================== RENDER FUNCTIONS ====================

    function renderHome() {
        showPage('home');
    }

    function renderPdfToImage() {
        showPage('tool');
        if (typeof PdfToImageController !== 'undefined' && PdfToImageController.render) {
            PdfToImageController.render();
        } else {
            showError('PDF to Images tool not loaded');
        }
    }

    function renderImageToPdf() {
        showPage('tool');
        if (typeof ImageToPdfController !== 'undefined' && ImageToPdfController.render) {
            ImageToPdfController.render();
        } else {
            showError('Images to PDF tool not loaded');
        }
    }

    function renderCropTool() {
        showPage('tool');
        if (typeof CropToolController !== 'undefined' && CropToolController.render) {
            CropToolController.render();
        } else {
            showError('Crop tool not loaded');
        }
    }

    function renderResizeTool() {
        showPage('tool');
        if (typeof ResizeToolController !== 'undefined' && ResizeToolController.render) {
            ResizeToolController.render();
        } else {
            showError('Resize tool not loaded');
        }
    }

    function renderPhotoResizer() {
        showPage('tool');
        if (typeof PhotoResizerToolController !== 'undefined' && PhotoResizerToolController.render) {
            PhotoResizerToolController.render();
        } else {
            showError('Photo Resizer tool not loaded');
        }
    }

    function renderMergeTool() {
        showPage('tool');
        if (typeof MergeToolController !== 'undefined' && MergeToolController.render) {
            MergeToolController.render();
        } else {
            showError('Merge tool not loaded');
        }
    }

    function renderSplitTool() {
        showPage('tool');
        if (typeof SplitToolController !== 'undefined' && SplitToolController.render) {
            SplitToolController.render();
        } else {
            showError('Split tool not loaded');
        }
    }

    function renderRotateTool() {
        showPage('tool');
        if (typeof RotateToolController !== 'undefined' && RotateToolController.render) {
            RotateToolController.render();
        } else {
            showError('Rotate tool not loaded');
        }
    }

    function renderExtractTool() {
        showPage('tool');
        if (typeof ExtractToolController !== 'undefined' && ExtractToolController.render) {
            ExtractToolController.render();
        } else {
            showError('Extract Images tool not loaded');
        }
    }

    function renderCompressTool() {
        showPage('tool');
        if (typeof CompressToolController !== 'undefined' && CompressToolController.render) {
            CompressToolController.render();
        } else {
            showError('Compress tool not loaded');
        }
    }

    function renderLockTool() {
        showPage('tool');
        if (typeof LockToolController !== 'undefined' && LockToolController.render) {
            LockToolController.render();
        } else {
            showError('Lock tool not loaded');
        }
    }

    function renderRemovePagesTool() {
        showPage('tool');
        if (typeof RemovePagesToolController !== 'undefined' && RemovePagesToolController.render) {
            RemovePagesToolController.render();
        } else {
            showError('Remove Pages tool not loaded');
        }
    }

    function renderPdfToJpgTool() {
        showPage('tool');
        if (typeof PdfToJpgController !== 'undefined' && PdfToJpgController.render) {
            PdfToJpgController.render();
        } else {
            showError('PDF to JPG tool not loaded');
        }
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        const target = document.getElementById('page-' + pageId);
        if (target) {
            target.classList.add('active');
            target.style.display = '';
        } else if (pageId === 'tool') {
            const container = document.getElementById('toolContent');
            if (container) {
                let page = document.getElementById('page-tool');
                if (!page) {
                    page = document.createElement('section');
                    page.id = 'page-tool';
                    page.className = 'page active';
                    container.parentNode.insertBefore(page, container);
                }
                page.classList.add('active');
                page.style.display = '';
                // Hide other pages
                document.querySelectorAll('.page').forEach(p => {
                    if (p.id !== 'page-tool') {
                        p.style.display = 'none';
                    }
                });
            }
        }
    }

    function showError(message) {
        const container = document.getElementById('toolContent');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--md-error);">
                    <div style="font-size: 64px; margin-bottom: 16px;">⚠️</div>
                    <h3 style="font-weight: 700; margin-bottom: 8px; color: var(--md-on-background);">${message}</h3>
                    <p style="color: var(--md-on-surface-variant); margin-bottom: 16px;">Please check that all scripts are loaded correctly.</p>
                    <button onclick="Router.navigate('home')" class="btn btn-primary">
                        🏠 Go to Home
                    </button>
                </div>
            `;
            const toolPage = document.getElementById('page-tool');
            if (toolPage) {
                toolPage.classList.add('active');
                document.querySelectorAll('.page').forEach(p => {
                    if (p.id !== 'page-tool') p.classList.remove('active');
                });
            }
        }
        console.error('Router Error:', message);
    }

    // Public API
    return {
        init,
        navigate,
        getCurrentRoute,
        routes,
        pageRoutes,
        isFooterPage
    };

})();

// Make Router globally available
window.Router = Router;