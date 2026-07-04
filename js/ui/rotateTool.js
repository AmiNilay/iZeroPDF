/**
 * Rotate PDF - UI Controller
 */

const RotateToolController = (function() {
    'use strict';

    let currentFile = null;
    let totalPages = 0;
    let pageRotations = {};

    /**
     * Render the tool UI
     */
    function render() {
        const container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <section class="page active">
                <div class="tool-page">
                    <div class="tool-header">
                        <h2>🔄 Rotate PDF</h2>
                        <p>Rotate individual pages or the entire PDF</p>
                    </div>

                    <div class="upload-area" id="rotateUploadArea">
                        <input type="file" id="rotateFileInput" accept=".pdf,application/pdf">
                        <div class="upload-icon">📤</div>
                        <div class="upload-text">Drop a PDF here or click to browse</div>
                    </div>

                    <div id="rotateInfo" style="margin: 10px 0; display: none;">
                        <span id="rotateFileInfo"></span>
                    </div>

                    <div class="settings-group">
                        <label>
                            Rotation Angle:
                            <select id="rotationAngle">
                                <option value="90">90° Clockwise</option>
                                <option value="180">180°</option>
                                <option value="270">270° Clockwise (90° Counter)</option>
                            </select>
                        </label>
                        <label>
                            Apply to:
                            <select id="rotationScope">
                                <option value="all">All Pages</option>
                                <option value="specific">Specific Pages</option>
                            </select>
                        </label>
                    </div>

                    <div id="specificPagesDiv" style="display: none; margin: 10px 0;">
                        <label>
                            Page numbers to rotate (e.g., "1,3,5-8"):
                            <input type="text" id="rotatePages" placeholder="1,3,5-8" style="width:300px;">
                        </label>
                    </div>

                    <button class="btn btn-primary" id="rotatePdfBtn" disabled>
                        🔄 Rotate PDF
                    </button>

                    <div class="progress-container">
                        <div class="progress-bar"></div>
                        <div class="progress-text"></div>
                    </div>

                    <div id="rotateResult" style="display: none; margin-top: 20px;">
                        <button class="btn btn-success" id="downloadRotateBtn">📥 Download Rotated PDF</button>
                        <span id="rotateInfoText" style="margin-left: 10px;"></span>
                    </div>

                    <div id="pageList" style="margin-top: 15px; max-height: 300px; overflow-y: auto;"></div>
                </div>
            </section>
        `;

        attachEvents();
    }

    /**
     * Attach event listeners
     */
    function attachEvents() {
        const fileInput = document.getElementById('rotateFileInput');
        const uploadArea = document.getElementById('rotateUploadArea');
        const rotateBtn = document.getElementById('rotatePdfBtn');
        const scopeSelect = document.getElementById('rotationScope');
        const downloadBtn = document.getElementById('downloadRotateBtn');

        // File input
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const file = this.files[0];
                if (file && Validators.isPDF(file)) {
                    handleFile(file);
                } else {
                    showToast('error', 'Please upload a valid PDF');
                }
            });
        }

        // Drag and drop
        if (uploadArea) {
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && Validators.isPDF(file)) {
                    handleFile(file);
                }
            });
        }

        // Scope change
        if (scopeSelect) {
            scopeSelect.addEventListener('change', function() {
                document.getElementById('specificPagesDiv').style.display = 
                    this.value === 'specific' ? 'block' : 'none';
            });
        }

        // Rotate
        if (rotateBtn) {
            rotateBtn.addEventListener('click', rotatePDF);
        }

        // Download
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadRotated);
        }
    }

    /**
     * Handle file upload
     */
    async function handleFile(file) {
        currentFile = file;
        
        try {
            totalPages = await PDFProcessor.getPDFPageCount(file);
            
            const infoDiv = document.getElementById('rotateInfo');
            const infoSpan = document.getElementById('rotateFileInfo');
            if (infoDiv && infoSpan) {
                infoDiv.style.display = 'block';
                infoSpan.textContent = `📄 ${file.name} (${totalPages} pages, ${FileHelpers.formatFileSize(file.size)})`;
            }

            document.getElementById('rotatePdfBtn').disabled = false;
            document.getElementById('rotateResult').style.display = 'none';
            
            // Initialize page rotations
            pageRotations = {};
            for (let i = 1; i <= totalPages; i++) {
                pageRotations[i] = 0;
            }
            
            // Show page list
            renderPageList();
            
            showToast('success', `Loaded PDF with ${totalPages} pages`);

        } catch (error) {
            console.error('Error reading PDF:', error);
            showToast('error', `Failed to read PDF: ${error.message}`);
        }
    }

    /**
     * Render page list with rotation controls
     */
    function renderPageList() {
        const list = document.getElementById('pageList');
        if (!list) return;

        let html = '<h4>Pages</h4><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">';
        
        for (let i = 1; i <= totalPages; i++) {
            const rotation = pageRotations[i] || 0;
            const rotationLabel = rotation === 0 ? '0°' : rotation + '°';
            html += `
                <div style="background:#f5f5f5;padding:8px;border-radius:6px;text-align:center;">
                    <div style="font-weight:bold;">Page ${i}</div>
                    <div style="font-size:13px;color:#666;">${rotationLabel}</div>
                    <div style="display:flex;gap:4px;justify-content:center;margin-top:4px;">
                        <button class="rotate-page-btn" data-page="${i}" data-angle="90" style="padding:2px 8px;font-size:11px;border:1px solid #ddd;border-radius:4px;cursor:pointer;">↻</button>
                        <button class="rotate-page-btn" data-page="${i}" data-angle="-90" style="padding:2px 8px;font-size:11px;border:1px solid #ddd;border-radius:4px;cursor:pointer;">↺</button>
                        <button class="reset-page-btn" data-page="${i}" style="padding:2px 8px;font-size:11px;border:1px solid #ddd;border-radius:4px;cursor:pointer;">✕</button>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        list.innerHTML = html;

        // Add rotation handlers
        list.querySelectorAll('.rotate-page-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const page = parseInt(this.dataset.page);
                const angle = parseInt(this.dataset.angle);
                const current = pageRotations[page] || 0;
                pageRotations[page] = (current + angle) % 360;
                if (pageRotations[page] < 0) pageRotations[page] += 360;
                renderPageList();
            });
        });

        list.querySelectorAll('.reset-page-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const page = parseInt(this.dataset.page);
                pageRotations[page] = 0;
                renderPageList();
            });
        });
    }

    /**
     * Rotate PDF
     */
    async function rotatePDF() {
        if (!currentFile) {
            showToast('warning', 'Please upload a PDF first');
            return;
        }

        const rotateBtn = document.getElementById('rotatePdfBtn');
        rotateBtn.disabled = true;
        rotateBtn.textContent = '⏳ Rotating...';

        try {
            const angle = parseInt(document.getElementById('rotationAngle').value);
            const scope = document.getElementById('rotationScope').value;
            
            let pagesToRotate = [];
            
            if (scope === 'all') {
                pagesToRotate = Object.keys(pageRotations).map(Number);
            } else {
                const pagesStr = document.getElementById('rotatePages').value;
                if (!pagesStr) {
                    throw new Error('Please specify pages to rotate');
                }
                const result = Validators.validatePageRange(pagesStr, totalPages);
                if (!result.valid) {
                    throw new Error(result.error);
                }
                pagesToRotate = result.pages;
            }

            // Apply rotation to selected pages
            for (const page of pagesToRotate) {
                const current = pageRotations[page] || 0;
                pageRotations[page] = (current + angle) % 360;
            }

            // Perform rotation using pdf-lib
            const { PDFDocument } = window.PDFLib;
            const arrayBuffer = await FileHelpers.readAsArrayBuffer(currentFile);
            const pdf = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();
            
            const total = pdf.getPageCount();
            
            for (let i = 0; i < total; i++) {
                const [page] = await newPdf.copyPages(pdf, [i]);
                const rotation = pageRotations[i + 1] || 0;
                if (rotation > 0) {
                    page.setRotation(rotation);
                }
                newPdf.addPage(page);
                
                const progress = (i + 1) / total * 100;
                window.showProgress(true, progress, `Processing page ${i + 1}/${total}`);
            }

            window.showProgress(false);
            
            const pdfBytes = await newPdf.save();
            window._rotatedPdfBytes = pdfBytes;

            // Show result
            const resultDiv = document.getElementById('rotateResult');
            if (resultDiv) {
                resultDiv.style.display = 'block';
            }

            const infoSpan = document.getElementById('rotateInfoText');
            if (infoSpan) {
                infoSpan.textContent = `Size: ${FileHelpers.formatFileSize(pdfBytes.byteLength)}`;
            }

            showToast('success', `PDF rotated successfully`);

        } catch (error) {
            console.error('Rotation error:', error);
            showToast('error', `Rotation failed: ${error.message}`);
        } finally {
            rotateBtn.disabled = false;
            rotateBtn.textContent = '🔄 Rotate PDF';
        }
    }

    /**
     * Download rotated PDF
     */
    function downloadRotated() {
        if (!window._rotatedPdfBytes) {
            showToast('warning', 'Please rotate the PDF first');
            return;
        }

        const blob = new Blob([window._rotatedPdfBytes], { type: 'application/pdf' });
        DownloadHelpers.downloadBlob(blob, 'rotated.pdf');
        showToast('success', 'Rotated PDF downloaded');
    }

    // Public API
    return {
        render
    };

})();

// Make RotateToolController globally available
window.RotateToolController = RotateToolController;