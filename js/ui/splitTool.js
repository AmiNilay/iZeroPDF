/**
 * Split PDF - UI Controller
 */

const SplitToolController = (function() {
    'use strict';

    let currentFile = null;
    let totalPages = 0;

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
                        <h2>✂️ Split PDF</h2>
                        <p>Split a PDF into multiple documents</p>
                    </div>

                    <div class="upload-area" id="splitUploadArea">
                        <input type="file" id="splitFileInput" accept=".pdf,application/pdf">
                        <div class="upload-icon">📤</div>
                        <div class="upload-text">Drop a PDF here or click to browse</div>
                    </div>

                    <div id="splitInfo" style="margin: 10px 0; display: none;">
                        <span id="splitFileInfo"></span>
                    </div>

                    <div class="settings-group">
                        <label>
                            Split Method:
                            <select id="splitMethod">
                                <option value="ranges">By Page Ranges</option>
                                <option value="count">Every N Pages</option>
                                <option value="pages">Extract Specific Pages</option>
                                <option value="at">Split at Pages</option>
                            </select>
                        </label>
                    </div>

                    <div id="splitSettings">
                        <div id="rangesSettings">
                            <label>
                                Page Ranges (e.g., "1-3,5,7-9"):
                                <input type="text" id="pageRanges" placeholder="1-3,5,7-9" style="width:300px;">
                            </label>
                            <p style="font-size:12px;color:#999;">Separate ranges with commas. Use hyphens for ranges.</p>
                        </div>
                        <div id="countSettings" style="display:none;">
                            <label>
                                Pages per file:
                                <input type="number" id="pagesPerFile" value="5" min="1" style="width:80px;">
                            </label>
                        </div>
                        <div id="pagesSettings" style="display:none;">
                            <label>
                                Page numbers to extract (e.g., "1,3,5"):
                                <input type="text" id="extractPages" placeholder="1,3,5" style="width:300px;">
                            </label>
                        </div>
                        <div id="atSettings" style="display:none;">
                            <label>
                                Split at page numbers (e.g., "3,7,10"):
                                <input type="text" id="splitAtPages" placeholder="3,7,10" style="width:300px;">
                            </label>
                            <p style="font-size:12px;color:#999;">Split will occur before each specified page number</p>
                        </div>
                    </div>

                    <button class="btn btn-primary" id="splitPdfBtn" disabled>
                        ✂️ Split PDF
                    </button>

                    <div class="progress-container">
                        <div class="progress-bar"></div>
                        <div class="progress-text"></div>
                    </div>

                    <div id="splitResult" style="display: none; margin-top: 20px;">
                        <button class="btn btn-success" id="downloadSplitBtn">📥 Download All</button>
                        <button class="btn btn-secondary" id="downloadSplitZipBtn">📦 Download as ZIP</button>
                        <span id="splitInfo" style="margin-left: 10px;"></span>
                    </div>

                    <div id="splitPreview" class="preview-area" style="margin-top: 10px; display: none;"></div>
                </div>
            </section>
        `;

        attachEvents();
    }

    /**
     * Attach event listeners
     */
    function attachEvents() {
        const fileInput = document.getElementById('splitFileInput');
        const uploadArea = document.getElementById('splitUploadArea');
        const splitBtn = document.getElementById('splitPdfBtn');
        const methodSelect = document.getElementById('splitMethod');

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

        // Split method change
        if (methodSelect) {
            methodSelect.addEventListener('change', function() {
                const method = this.value;
                document.getElementById('rangesSettings').style.display = method === 'ranges' ? 'block' : 'none';
                document.getElementById('countSettings').style.display = method === 'count' ? 'block' : 'none';
                document.getElementById('pagesSettings').style.display = method === 'pages' ? 'block' : 'none';
                document.getElementById('atSettings').style.display = method === 'at' ? 'block' : 'none';
            });
        }

        // Split
        if (splitBtn) {
            splitBtn.addEventListener('click', splitPDF);
        }

        // Download buttons
        document.getElementById('downloadSplitBtn').addEventListener('click', downloadAll);
        document.getElementById('downloadSplitZipBtn').addEventListener('click', downloadZip);
    }

    /**
     * Handle file upload
     */
    async function handleFile(file) {
        currentFile = file;
        
        // Get page count
        try {
            totalPages = await PDFProcessor.getPDFPageCount(file);
            
            const infoDiv = document.getElementById('splitInfo');
            const infoSpan = document.getElementById('splitFileInfo');
            if (infoDiv && infoSpan) {
                infoDiv.style.display = 'block';
                infoSpan.textContent = `📄 ${file.name} (${totalPages} pages, ${FileHelpers.formatFileSize(file.size)})`;
            }

            document.getElementById('splitPdfBtn').disabled = false;
            document.getElementById('splitResult').style.display = 'none';
            
            showToast('success', `Loaded PDF with ${totalPages} pages`);

        } catch (error) {
            console.error('Error reading PDF:', error);
            showToast('error', `Failed to read PDF: ${error.message}`);
        }
    }

    /**
     * Split PDF
     */
    async function splitPDF() {
        if (!currentFile) {
            showToast('warning', 'Please upload a PDF first');
            return;
        }

        const splitBtn = document.getElementById('splitPdfBtn');
        splitBtn.disabled = true;
        splitBtn.textContent = '⏳ Splitting...';

        try {
            const method = document.getElementById('splitMethod').value;
            let results = [];

            switch (method) {
                case 'ranges':
                    const rangesStr = document.getElementById('pageRanges').value;
                    if (!rangesStr) {
                        throw new Error('Please specify page ranges');
                    }
                    const ranges = rangesStr.split(',').map(s => s.trim());
                    results = await SplitEngine.splitByRanges(currentFile, ranges);
                    break;

                case 'count':
                    const perFile = parseInt(document.getElementById('pagesPerFile').value);
                    if (perFile < 1) throw new Error('Invalid pages per file');
                    results = await SplitEngine.splitByPageCount(currentFile, perFile);
                    break;

                case 'pages':
                    const pagesStr = document.getElementById('extractPages').value;
                    if (!pagesStr) throw new Error('Please specify pages to extract');
                    const pages = pagesStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                    results = await SplitEngine.extractPages(currentFile, pages);
                    break;

                case 'at':
                    const atStr = document.getElementById('splitAtPages').value;
                    if (!atStr) throw new Error('Please specify split points');
                    const atPages = atStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                    results = await SplitEngine.splitAtPages(currentFile, atPages);
                    break;

                default:
                    throw new Error('Unknown split method');
            }

            if (results.length === 0) {
                throw new Error('No parts created');
            }

            // Store results
            window._splitResults = results;

            // Show result
            const resultDiv = document.getElementById('splitResult');
            if (resultDiv) {
                resultDiv.style.display = 'block';
            }

            const infoSpan = document.getElementById('splitInfo');
            if (infoSpan) {
                infoSpan.textContent = `${results.length} parts created`;
            }

            // Show preview
            const preview = document.getElementById('splitPreview');
            if (preview) {
                preview.style.display = 'block';
                let html = '<div class="preview-grid">';
                for (let i = 0; i < Math.min(results.length, 12); i++) {
                    const result = results[i];
                    html += `
                        <div class="preview-item" style="padding:10px;text-align:center;">
                            <div style="font-size:32px;">📄</div>
                            <div style="font-size:12px;">${result.filename}</div>
                            <div style="font-size:11px;color:#999;">${result.pageCount || result.pages?.length || 0} pages</div>
                        </div>
                    `;
                }
                if (results.length > 12) {
                    html += `<div class="preview-item">+${results.length - 12} more</div>`;
                }
                html += '</div>';
                preview.innerHTML = html;
            }

            showToast('success', `Split into ${results.length} parts`);

        } catch (error) {
            console.error('Split error:', error);
            showToast('error', `Split failed: ${error.message}`);
        } finally {
            splitBtn.disabled = false;
            splitBtn.textContent = '✂️ Split PDF';
        }
    }

    /**
     * Download all parts
     */
    function downloadAll() {
        const results = window._splitResults;
        if (!results || results.length === 0) {
            showToast('warning', 'No parts to download');
            return;
        }

        for (const result of results) {
            DownloadHelpers.downloadBlob(result.blob, result.filename);
        }

        showToast('success', `Downloaded ${results.length} parts`);
    }

    /**
     * Download as ZIP
     */
    async function downloadZip() {
        const results = window._splitResults;
        if (!results || results.length === 0) {
            showToast('warning', 'No parts to download');
            return;
        }

        try {
            showToast('info', 'Creating ZIP...');
            
            const files = results.map(r => ({
                filename: r.filename,
                data: r.blob
            }));
            
            const zip = await ZipHelpers.createZip(files);
            DownloadHelpers.downloadBlob(zip, 'split_parts.zip');
            
            showToast('success', 'ZIP file downloaded');
        } catch (error) {
            console.error('ZIP creation error:', error);
            showToast('error', `Failed to create ZIP: ${error.message}`);
        }
    }

    // Public API
    return {
        render
    };

})();

// Make SplitToolController globally available
window.SplitToolController = SplitToolController;